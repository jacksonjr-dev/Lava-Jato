-- Endurecimento de segurança (ver SEGURANÇA.md).
-- O navegador conhece a chave publicável e o JWT do usuário, então tudo que a
-- policy RLS permite pode ser feito direto pela API REST, sem passar pelas
-- regras das server functions. Aqui o banco passa a impor essas regras.

-- 1. Pagamentos: somente leitura para usuários. A gravação acontece apenas
--    via register_order_payment_atomic (SECURITY DEFINER).
DROP POLICY IF EXISTS payments_all ON public.payments;
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments FOR SELECT TO authenticated
  USING (tenant_id = app.current_tenant());
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM authenticated, anon;

-- 2. Itens da OS: somente leitura. Criados apenas pelas RPCs atômicas.
DROP POLICY IF EXISTS items_all ON public.service_order_items;
DROP POLICY IF EXISTS items_select ON public.service_order_items;
CREATE POLICY items_select ON public.service_order_items FOR SELECT TO authenticated
  USING (tenant_id = app.current_tenant());
REVOKE INSERT, UPDATE, DELETE ON public.service_order_items FROM authenticated, anon;

-- 3. Ordens de serviço: leitura e mudança de status/observações. Valores
--    (subtotal, total, desconto, acréscimo) só mudam pelas RPCs; criação só
--    pelas RPCs; exclusão não é permitida (use o cancelamento).
DROP POLICY IF EXISTS orders_all ON public.service_orders;
DROP POLICY IF EXISTS orders_select ON public.service_orders;
DROP POLICY IF EXISTS orders_update ON public.service_orders;
CREATE POLICY orders_select ON public.service_orders FOR SELECT TO authenticated
  USING (tenant_id = app.current_tenant());
CREATE POLICY orders_update ON public.service_orders FOR UPDATE TO authenticated
  USING (tenant_id = app.current_tenant())
  WITH CHECK (tenant_id = app.current_tenant());
REVOKE INSERT, UPDATE, DELETE ON public.service_orders FROM authenticated, anon;
GRANT UPDATE (status, finished_at, observacoes) ON public.service_orders TO authenticated;

-- 4. PAGO exige pagamento registrado; ENTREGUE continua exigindo PAGO.
CREATE OR REPLACE FUNCTION public.enforce_order_status_transition()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, app AS $$
DECLARE transition_allowed BOOLEAN := FALSE;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  transition_allowed := CASE
    WHEN OLD.status = 'AGUARDANDO' AND NEW.status IN ('EM_LAVAGEM', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'EM_LAVAGEM' AND NEW.status IN ('AGUARDANDO_PAGAMENTO', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'EM_FINALIZACAO' AND NEW.status IN ('AGUARDANDO_PAGAMENTO', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'FINALIZADO' AND NEW.status IN ('AGUARDANDO_PAGAMENTO', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'AGUARDANDO_PAGAMENTO' AND NEW.status IN ('PAGO', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'PAGO' AND NEW.status = 'ENTREGUE' THEN TRUE
    ELSE FALSE
  END;
  IF NOT transition_allowed THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'CANCELADO' AND app.current_role_in_tenant() = 'EMPLOYEE' THEN
    RAISE EXCEPTION 'Apenas proprietário ou gerente podem cancelar.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NEW.status = 'PAGO' AND NOT EXISTS (
    SELECT 1 FROM public.payments
    WHERE tenant_id = NEW.tenant_id AND order_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Registre o pagamento antes de marcar a ordem como paga.'
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'AGUARDANDO_PAGAMENTO' AND NEW.finished_at IS NULL THEN
    NEW.finished_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Empresas: criação apenas via create_tenant_atomic (gera slug único).
--    Gerentes alteram só os campos de perfil, nunca id/slug.
DROP POLICY IF EXISTS tenant_insert ON public.tenants;
REVOKE INSERT, DELETE ON public.tenants FROM authenticated, anon;
REVOKE UPDATE ON public.tenants FROM authenticated, anon;
GRANT UPDATE (nome, telefone, endereco, horario, business_hours, logo_url, cor_tema,
              public_listing, pix_key, pix_receiver_name, pix_city)
  ON public.tenants TO authenticated;

-- 6. Vínculos: ninguém se autoinsere em uma empresa; o primeiro OWNER é
--    criado por create_tenant_atomic.
DROP POLICY IF EXISTS members_insert_self ON public.tenant_members;
REVOKE INSERT ON public.tenant_members FROM authenticated, anon;

-- 7. Funções SECURITY DEFINER: o Supabase concede EXECUTE a anon por padrão,
--    e REVOKE ... FROM PUBLIC não remove essa concessão explícita.
REVOKE ALL ON FUNCTION public.quick_register_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_order_atomic(UUID, UUID[], TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_order_payment_atomic(UUID, public.payment_method) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_tenant_atomic(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_intake_atomic(TEXT, TEXT, TEXT, UUID[], TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.tenant_is_empty(UUID) FROM PUBLIC, anon, authenticated;

-- 8. Storage: o bucket de fotos é privado (acesso só pelas policies por tenant).
INSERT INTO storage.buckets (id, name, public)
VALUES ('lavajato', 'lavajato', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

-- 9. Limite de tentativas do portal do cliente, compartilhado entre todas as
--    instâncias do servidor (o limite em memória não funciona em serverless).
CREATE TABLE IF NOT EXISTS public.portal_login_attempts (
  key TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ
);
ALTER TABLE public.portal_login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.portal_login_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.portal_login_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.portal_locked_until(p_keys TEXT[])
RETURNS TIMESTAMPTZ LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT max(locked_until) FROM public.portal_login_attempts
  WHERE key = ANY(p_keys) AND locked_until > now();
$$;

CREATE OR REPLACE FUNCTION public.portal_record_failure(
  p_key TEXT, p_max_failures INTEGER, p_window_seconds INTEGER
) RETURNS VOID LANGUAGE plpgsql SET search_path = public AS $$
DECLARE window_length INTERVAL := make_interval(secs => p_window_seconds);
BEGIN
  INSERT INTO public.portal_login_attempts AS attempt (key, failures, window_started_at)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE SET
    failures = CASE WHEN attempt.window_started_at <= now() - window_length
                    THEN 1 ELSE attempt.failures + 1 END,
    window_started_at = CASE WHEN attempt.window_started_at <= now() - window_length
                             THEN now() ELSE attempt.window_started_at END;

  UPDATE public.portal_login_attempts
  SET locked_until = now() + window_length
  WHERE key = p_key AND failures >= p_max_failures;

  DELETE FROM public.portal_login_attempts
  WHERE window_started_at < now() - interval '1 day'
    AND (locked_until IS NULL OR locked_until < now());
END;
$$;

REVOKE ALL ON FUNCTION public.portal_locked_until(TEXT[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.portal_record_failure(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_locked_until(TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.portal_record_failure(TEXT, INTEGER, INTEGER) TO service_role;
