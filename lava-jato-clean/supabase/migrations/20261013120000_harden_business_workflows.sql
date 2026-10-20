-- Regras de integridade e operações atômicas do fluxo principal.

-- Corrige eventuais números duplicados antes de criar a restrição.
WITH duplicate_orders AS (
  SELECT id, tenant_id,
         row_number() OVER (PARTITION BY tenant_id, numero ORDER BY created_at, id) AS duplicate_position
  FROM public.service_orders
), tenant_max AS (
  SELECT tenant_id, COALESCE(MAX(numero), 1000) AS max_numero
  FROM public.service_orders GROUP BY tenant_id
), rows_to_fix AS (
  SELECT d.id,
         m.max_numero + row_number() OVER (PARTITION BY d.tenant_id ORDER BY d.id) AS new_numero
  FROM duplicate_orders d JOIN tenant_max m USING (tenant_id)
  WHERE d.duplicate_position > 1
)
UPDATE public.service_orders orders
SET numero = rows_to_fix.new_numero
FROM rows_to_fix WHERE orders.id = rows_to_fix.id;

CREATE UNIQUE INDEX IF NOT EXISTS service_orders_tenant_numero_unique
  ON public.service_orders (tenant_id, numero);

CREATE OR REPLACE FUNCTION public.orders_set_numero()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.tenant_id::text, 0));
    SELECT COALESCE(MAX(numero), 1000) + 1 INTO NEW.numero
    FROM public.service_orders WHERE tenant_id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_order_status_transition()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE transition_allowed BOOLEAN := FALSE;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  transition_allowed := CASE
    WHEN OLD.status = 'AGUARDANDO' AND NEW.status IN ('EM_LAVAGEM', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'EM_LAVAGEM' AND NEW.status IN ('EM_FINALIZACAO', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'EM_FINALIZACAO' AND NEW.status IN ('FINALIZADO', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'FINALIZADO' AND NEW.status IN ('AGUARDANDO_PAGAMENTO', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'AGUARDANDO_PAGAMENTO' AND NEW.status IN ('PAGO', 'CANCELADO') THEN TRUE
    WHEN OLD.status = 'PAGO' AND NEW.status = 'ENTREGUE' THEN TRUE
    ELSE FALSE
  END;

  IF NOT transition_allowed THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'CANCELADO' AND public.current_role() = 'EMPLOYEE' THEN
    RAISE EXCEPTION 'Apenas proprietário ou gerente podem cancelar.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NEW.status = 'FINALIZADO' AND NEW.finished_at IS NULL THEN NEW.finished_at := now(); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_status_transition ON public.service_orders;
CREATE TRIGGER trg_orders_status_transition
BEFORE UPDATE OF status ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_status_transition();

CREATE OR REPLACE FUNCTION public.quick_register_atomic(
  p_placa TEXT, p_cliente_nome TEXT, p_cliente_telefone TEXT,
  p_marca TEXT DEFAULT NULL, p_modelo TEXT DEFAULT NULL, p_cor TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  tenant UUID := public.current_tenant();
  customer_id UUID;
  vehicle_row public.vehicles%ROWTYPE;
  normalized_plate TEXT := public.normalize_plate(p_placa);
  phone_digits TEXT := regexp_replace(COALESCE(p_cliente_telefone, ''), '\D', '', 'g');
BEGIN
  IF tenant IS NULL THEN RAISE EXCEPTION 'Usuário sem lava-jato vinculado.'; END IF;
  IF length(normalized_plate) <> 7 THEN RAISE EXCEPTION 'Placa inválida.'; END IF;
  IF length(trim(COALESCE(p_cliente_nome, ''))) < 2 THEN RAISE EXCEPTION 'Informe o nome do cliente.'; END IF;
  IF length(phone_digits) NOT BETWEEN 10 AND 11 THEN RAISE EXCEPTION 'Informe um telefone válido com DDD.'; END IF;

  INSERT INTO public.customers (tenant_id, nome, telefone)
  VALUES (tenant, trim(p_cliente_nome), phone_digits) RETURNING id INTO customer_id;
  INSERT INTO public.vehicles (tenant_id, customer_id, placa, placa_normalizada, marca, modelo, cor)
  VALUES (tenant, customer_id, normalized_plate, normalized_plate, nullif(trim(p_marca), ''),
          nullif(trim(p_modelo), ''), nullif(trim(p_cor), ''))
  RETURNING * INTO vehicle_row;
  RETURN jsonb_build_object('customerId', customer_id, 'vehicle', to_jsonb(vehicle_row));
END;
$$;

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_vehicle_id UUID, p_service_ids UUID[], p_observacoes TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  tenant UUID := public.current_tenant();
  vehicle_customer UUID;
  order_id UUID;
  expected_count INTEGER;
  found_count INTEGER;
  order_total NUMERIC(10,2);
BEGIN
  IF tenant IS NULL THEN RAISE EXCEPTION 'Usuário sem lava-jato vinculado.'; END IF;
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

CREATE OR REPLACE FUNCTION public.register_order_payment_atomic(
  p_order_id UUID, p_metodo public.payment_method
) RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  tenant UUID := public.current_tenant();
  order_row public.service_orders%ROWTYPE;
  calculated_subtotal NUMERIC(10,2);
  calculated_total NUMERIC(10,2);
BEGIN
  IF tenant IS NULL THEN RAISE EXCEPTION 'Usuário sem lava-jato vinculado.'; END IF;
  SELECT * INTO order_row FROM public.service_orders
  WHERE id = p_order_id AND tenant_id = tenant FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atendimento não encontrado.'; END IF;
  IF order_row.status <> 'AGUARDANDO_PAGAMENTO' THEN
    RAISE EXCEPTION 'O atendimento precisa estar aguardando pagamento.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.payments WHERE order_id = p_order_id) THEN
    RAISE EXCEPTION 'Esta ordem de serviço já possui pagamento registrado.';
  END IF;

  SELECT COALESCE(sum(preco * quantidade), 0) INTO calculated_subtotal
  FROM public.service_order_items WHERE order_id = p_order_id AND tenant_id = tenant;
  calculated_total := greatest(0, calculated_subtotal - order_row.desconto + order_row.acrescimo);
  UPDATE public.service_orders SET subtotal = calculated_subtotal, total = calculated_total
  WHERE id = p_order_id;
  INSERT INTO public.payments (tenant_id, order_id, valor, metodo, user_id)
  VALUES (tenant, p_order_id, calculated_total, p_metodo, auth.uid());
  UPDATE public.service_orders SET status = 'PAGO' WHERE id = p_order_id;
  RETURN calculated_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_tenant_atomic(
  p_tenant_id UUID, p_nome TEXT, p_telefone TEXT DEFAULT NULL,
  p_endereco TEXT DEFAULT NULL, p_logo_url TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Autenticação necessária.'; END IF;
  IF EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = current_user_id) THEN
    RAISE EXCEPTION 'Você já possui um lava-jato vinculado.';
  END IF;
  IF length(trim(COALESCE(p_nome, ''))) < 2 THEN RAISE EXCEPTION 'Informe o nome do lava-jato.'; END IF;

  INSERT INTO public.tenants (id, nome, telefone, endereco, logo_url)
  VALUES (p_tenant_id, trim(p_nome), nullif(trim(p_telefone), ''),
          nullif(trim(p_endereco), ''), nullif(trim(p_logo_url), ''));
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (p_tenant_id, current_user_id, 'OWNER');
  INSERT INTO public.services (tenant_id, nome, preco, duracao_min) VALUES
    (p_tenant_id, 'Lavagem simples', 35, 30),
    (p_tenant_id, 'Lavagem completa', 60, 60),
    (p_tenant_id, 'Lavagem premium', 90, 90),
    (p_tenant_id, 'Higienização interna', 120, 120),
    (p_tenant_id, 'Polimento', 150, 180),
    (p_tenant_id, 'Enceramento', 80, 60);
  RETURN p_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.quick_register_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order_atomic(UUID, UUID[], TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_order_payment_atomic(UUID, public.payment_method) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_tenant_atomic(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.quick_register_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(UUID, UUID[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_order_payment_atomic(UUID, public.payment_method) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_atomic(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
