-- Planos e assinatura (etapa 1: liberação manual pelo administrador).
-- Regras espelhadas de src/lib/plans.ts: teste de 7 dias com o plano Max,
-- 3 dias de tolerância após o vencimento e limite de 30 atendimentos/mês no
-- plano Grátis. Mantenha os dois arquivos em sincronia (plans.test.ts confere).

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'GRATIS',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_plan_check;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_plan_check CHECK (plan IN ('GRATIS', 'BASICO', 'MAX'));

-- Os campos de assinatura não entram no GRANT UPDATE por coluna de
-- 20261015120000_security_hardening.sql: só o service_role (painel admin e,
-- futuramente, o webhook do gateway) consegue alterá-los.

CREATE OR REPLACE FUNCTION app.tenant_effective_plan(p_tenant UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN t.trial_ends_at > now() THEN 'MAX'
    WHEN t.plan <> 'GRATIS' AND t.plan_expires_at + interval '3 days' > now() THEN t.plan
    ELSE 'GRATIS'
  END
  FROM public.tenants t
  WHERE t.id = p_tenant;
$$;

CREATE OR REPLACE FUNCTION app.assert_order_quota(p_tenant UUID)
RETURNS VOID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  month_start TIMESTAMPTZ :=
    date_trunc('month', now() AT TIME ZONE 'America/Fortaleza') AT TIME ZONE 'America/Fortaleza';
  used INTEGER;
BEGIN
  IF app.tenant_effective_plan(p_tenant) <> 'GRATIS' THEN RETURN; END IF;
  SELECT count(*) INTO used FROM public.service_orders
  WHERE tenant_id = p_tenant AND created_at >= month_start;
  IF used >= 30 THEN
    RAISE EXCEPTION 'O plano Grátis permite 30 atendimentos por mês. Assine um plano para continuar.'
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION app.tenant_effective_plan(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.assert_order_quota(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app.tenant_effective_plan(UUID) TO authenticated, service_role;

-- Mesmo corpo de 20261013155000, com a checagem de cota do plano.
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_vehicle_id UUID, p_service_ids UUID[], p_observacoes TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app AS $$
DECLARE
  tenant UUID := app.current_tenant();
  vehicle_customer UUID;
  order_id UUID;
  expected_count INTEGER;
  found_count INTEGER;
  order_total NUMERIC(10,2);
BEGIN
  IF tenant IS NULL THEN RAISE EXCEPTION 'Usuário sem lava-jato vinculado.'; END IF;
  PERFORM app.assert_order_quota(tenant);
  SELECT customer_id INTO vehicle_customer FROM public.vehicles
  WHERE id = p_vehicle_id AND tenant_id = tenant;
  IF NOT FOUND THEN RAISE EXCEPTION 'Veículo não encontrado.'; END IF;
  SELECT count(*) INTO expected_count FROM (SELECT DISTINCT unnest(p_service_ids)) ids;
  IF expected_count = 0 THEN RAISE EXCEPTION 'Selecione ao menos um serviço.'; END IF;
  SELECT count(*), COALESCE(sum(preco), 0) INTO found_count, order_total
  FROM public.services WHERE tenant_id = tenant AND ativo = TRUE AND id = ANY(p_service_ids);
  IF found_count <> expected_count THEN RAISE EXCEPTION 'Serviços inválidos.'; END IF;
  INSERT INTO public.service_orders
    (tenant_id, vehicle_id, customer_id, employee_id, status, subtotal, total, observacoes)
  VALUES (tenant, p_vehicle_id, vehicle_customer, auth.uid(), 'AGUARDANDO', order_total, order_total,
          nullif(trim(p_observacoes), '')) RETURNING id INTO order_id;
  INSERT INTO public.service_order_items (tenant_id, order_id, service_id, nome, preco, quantidade)
  SELECT tenant, order_id, id, nome, preco, 1 FROM public.services
  WHERE tenant_id = tenant AND ativo = TRUE AND id = ANY(p_service_ids);
  RETURN order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_intake_atomic(
  p_placa TEXT, p_cliente_nome TEXT, p_cliente_telefone TEXT, p_service_ids UUID[],
  p_marca TEXT DEFAULT NULL, p_modelo TEXT DEFAULT NULL, p_cor TEXT DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app AS $$
DECLARE
  tenant UUID := app.current_tenant();
  customer_id UUID;
  vehicle_id UUID;
  order_id UUID;
  normalized_plate TEXT := public.normalize_plate(p_placa);
  phone_digits TEXT := regexp_replace(COALESCE(p_cliente_telefone, ''), '\D', '', 'g');
  expected_count INTEGER;
  found_count INTEGER;
  order_total NUMERIC(10,2);
BEGIN
  IF tenant IS NULL THEN RAISE EXCEPTION 'Usuário sem lava-jato vinculado.'; END IF;
  PERFORM app.assert_order_quota(tenant);
  IF length(normalized_plate) <> 7 THEN RAISE EXCEPTION 'Placa inválida.'; END IF;
  IF length(trim(COALESCE(p_cliente_nome, ''))) < 2 THEN RAISE EXCEPTION 'Informe o nome do cliente.'; END IF;
  IF length(phone_digits) NOT BETWEEN 10 AND 11 THEN RAISE EXCEPTION 'Informe um telefone válido com DDD.'; END IF;
  SELECT count(*) INTO expected_count FROM (SELECT DISTINCT unnest(p_service_ids)) ids;
  IF expected_count = 0 THEN RAISE EXCEPTION 'Selecione ao menos um serviço.'; END IF;
  SELECT count(*), COALESCE(sum(preco), 0) INTO found_count, order_total
  FROM public.services WHERE tenant_id = tenant AND ativo = TRUE AND id = ANY(p_service_ids);
  IF found_count <> expected_count THEN RAISE EXCEPTION 'Serviços inválidos.'; END IF;

  INSERT INTO public.customers (tenant_id, nome, telefone)
  VALUES (tenant, trim(p_cliente_nome), phone_digits) RETURNING id INTO customer_id;
  INSERT INTO public.vehicles (tenant_id, customer_id, placa, placa_normalizada, marca, modelo, cor)
  VALUES (tenant, customer_id, normalized_plate, normalized_plate, nullif(trim(p_marca), ''),
          nullif(trim(p_modelo), ''), nullif(trim(p_cor), '')) RETURNING id INTO vehicle_id;
  INSERT INTO public.service_orders
    (tenant_id, vehicle_id, customer_id, employee_id, status, subtotal, total, observacoes)
  VALUES (tenant, vehicle_id, customer_id, auth.uid(), 'AGUARDANDO', order_total, order_total,
          nullif(trim(p_observacoes), '')) RETURNING id INTO order_id;
  INSERT INTO public.service_order_items (tenant_id, order_id, service_id, nome, preco, quantidade)
  SELECT tenant, order_id, id, nome, preco, 1 FROM public.services
  WHERE tenant_id = tenant AND ativo = TRUE AND id = ANY(p_service_ids);
  RETURN jsonb_build_object('orderId', order_id, 'customerId', customer_id, 'vehicleId', vehicle_id);
END;
$$;

-- Administradores da plataforma (você), que liberam planos manualmente.
-- Para se cadastrar, rode uma vez no SQL Editor do Supabase:
--   INSERT INTO public.platform_admins (user_id)
--   SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com';
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_admins FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.platform_admins TO service_role;
