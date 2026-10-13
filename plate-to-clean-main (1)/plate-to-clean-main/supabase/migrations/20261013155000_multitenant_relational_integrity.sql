-- Integridade multiempresa e criação atômica do primeiro atendimento.

CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_id_id_unique
  ON public.customers (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_tenant_id_id_unique
  ON public.vehicles (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS services_tenant_id_id_unique
  ON public.services (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS service_orders_tenant_id_id_unique
  ON public.service_orders (tenant_id, id);

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_customer_id_fkey;
ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_customer_same_tenant_fkey
  FOREIGN KEY (tenant_id, customer_id) REFERENCES public.customers (tenant_id, id);

ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_customer_id_fkey;
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_vehicle_id_fkey;
ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_customer_same_tenant_fkey
  FOREIGN KEY (tenant_id, customer_id) REFERENCES public.customers (tenant_id, id);
ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_vehicle_same_tenant_fkey
  FOREIGN KEY (tenant_id, vehicle_id) REFERENCES public.vehicles (tenant_id, id);

ALTER TABLE public.service_order_items DROP CONSTRAINT IF EXISTS service_order_items_order_id_fkey;
ALTER TABLE public.service_order_items DROP CONSTRAINT IF EXISTS service_order_items_service_id_fkey;
ALTER TABLE public.service_order_items
  ADD CONSTRAINT service_order_items_order_same_tenant_fkey
  FOREIGN KEY (tenant_id, order_id)
  REFERENCES public.service_orders (tenant_id, id) ON DELETE CASCADE;
ALTER TABLE public.service_order_items
  ADD CONSTRAINT service_order_items_service_same_tenant_fkey
  FOREIGN KEY (tenant_id, service_id) REFERENCES public.services (tenant_id, id);

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_order_id_fkey;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_order_same_tenant_fkey
  FOREIGN KEY (tenant_id, order_id)
  REFERENCES public.service_orders (tenant_id, id) ON DELETE CASCADE;

ALTER TABLE public.order_photos DROP CONSTRAINT IF EXISTS order_photos_order_id_fkey;
ALTER TABLE public.order_photos DROP CONSTRAINT IF EXISTS order_photos_vehicle_id_fkey;
ALTER TABLE public.order_photos
  ADD CONSTRAINT order_photos_order_same_tenant_fkey
  FOREIGN KEY (tenant_id, order_id)
  REFERENCES public.service_orders (tenant_id, id) ON DELETE CASCADE;
ALTER TABLE public.order_photos
  ADD CONSTRAINT order_photos_vehicle_same_tenant_fkey
  FOREIGN KEY (tenant_id, vehicle_id) REFERENCES public.vehicles (tenant_id, id);

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
  IF NEW.status = 'AGUARDANDO_PAGAMENTO' AND NEW.finished_at IS NULL THEN
    NEW.finished_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.quick_register_atomic(
  p_placa TEXT, p_cliente_nome TEXT, p_cliente_telefone TEXT,
  p_marca TEXT DEFAULT NULL, p_modelo TEXT DEFAULT NULL, p_cor TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app AS $$
DECLARE
  tenant UUID := app.current_tenant();
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

CREATE OR REPLACE FUNCTION public.register_order_payment_atomic(
  p_order_id UUID, p_metodo public.payment_method
) RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app AS $$
DECLARE
  tenant UUID := app.current_tenant();
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
  IF EXISTS (SELECT 1 FROM public.payments WHERE tenant_id = tenant AND order_id = p_order_id) THEN
    RAISE EXCEPTION 'Esta ordem de serviço já possui pagamento registrado.';
  END IF;
  SELECT COALESCE(sum(preco * quantidade), 0) INTO calculated_subtotal
  FROM public.service_order_items WHERE order_id = p_order_id AND tenant_id = tenant;
  calculated_total := greatest(0, calculated_subtotal - order_row.desconto + order_row.acrescimo);
  UPDATE public.service_orders SET subtotal = calculated_subtotal, total = calculated_total
  WHERE id = p_order_id AND tenant_id = tenant;
  INSERT INTO public.payments (tenant_id, order_id, valor, metodo, user_id)
  VALUES (tenant, p_order_id, calculated_total, p_metodo, auth.uid());
  UPDATE public.service_orders SET status = 'PAGO'
  WHERE id = p_order_id AND tenant_id = tenant;
  RETURN calculated_total;
END;
$$;

REVOKE ALL ON FUNCTION public.create_intake_atomic(TEXT, TEXT, TEXT, UUID[], TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_intake_atomic(TEXT, TEXT, TEXT, UUID[], TEXT, TEXT, TEXT, TEXT)
  TO authenticated;
