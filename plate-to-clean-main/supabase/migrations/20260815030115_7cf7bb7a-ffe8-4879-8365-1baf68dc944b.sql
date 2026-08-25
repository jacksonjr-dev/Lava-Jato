CREATE TYPE public.app_role AS ENUM ('OWNER','MANAGER','EMPLOYEE');
CREATE TYPE public.order_status AS ENUM ('AGUARDANDO','EM_LAVAGEM','EM_FINALIZACAO','FINALIZADO','AGUARDANDO_PAGAMENTO','PAGO','ENTREGUE','CANCELADO');
CREATE TYPE public.payment_method AS ENUM ('DINHEIRO','PIX','DEBITO','CREDITO','OUTRO');
CREATE TYPE public.photo_kind AS ENUM ('PLACA','FRENTE','TRASEIRA','LATERAL','DANO','OUTRO');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.normalize_plate(p TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT upper(regexp_replace(coalesce(p,''), '[^a-zA-Z0-9]', '', 'g'));
$$;

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  logo_url TEXT,
  telefone TEXT,
  endereco TEXT,
  horario TEXT,
  cor_tema TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'EMPLOYEE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  nome TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.current_tenant()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_role_in_tenant()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.tenant_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('OWNER','MANAGER'));
$$;

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cpf TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_tenant ON public.customers(tenant_id);

CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  placa TEXT NOT NULL,
  placa_normalizada TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  versao TEXT,
  ano INT,
  cor TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, placa_normalizada)
);
CREATE INDEX idx_vehicles_plate ON public.vehicles(placa_normalizada);

CREATE OR REPLACE FUNCTION public.vehicles_normalize()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.placa_normalizada := public.normalize_plate(NEW.placa);
  NEW.placa := NEW.placa_normalizada;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_vehicles_normalize BEFORE INSERT OR UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.vehicles_normalize();

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  duracao_min INT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_services_tenant ON public.services(tenant_id);

CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero INT NOT NULL DEFAULT 0,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  employee_id UUID,
  status public.order_status NOT NULL DEFAULT 'AGUARDANDO',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(10,2) NOT NULL DEFAULT 0,
  acrescimo NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_tenant_status ON public.service_orders(tenant_id, status);
CREATE INDEX idx_orders_vehicle ON public.service_orders(vehicle_id);

CREATE OR REPLACE FUNCTION public.orders_set_numero()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero), 1000) + 1 INTO NEW.numero
    FROM public.service_orders WHERE tenant_id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_orders_numero BEFORE INSERT ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.orders_set_numero();

CREATE TABLE public.service_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_items_order ON public.service_order_items(order_id);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  metodo public.payment_method NOT NULL,
  user_id UUID,
  pago_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_tenant ON public.payments(tenant_id, pago_em);

CREATE TABLE public.order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  tipo public.photo_kind NOT NULL DEFAULT 'OUTRO',
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_photos_order ON public.order_photos(order_id);

CREATE TRIGGER trg_tenants_upd BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_customers_upd BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_vehicles_upd BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_services_upd BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_upd BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_photos TO authenticated;
GRANT ALL ON public.tenants, public.tenant_members, public.profiles, public.customers, public.vehicles, public.services, public.service_orders, public.service_order_items, public.payments, public.order_photos TO service_role;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON public.tenants FOR SELECT TO authenticated USING (id = public.current_tenant());
CREATE POLICY "tenant_insert" ON public.tenants FOR INSERT TO authenticated WITH CHECK (public.current_tenant() IS NULL);
CREATE POLICY "tenant_update" ON public.tenants FOR UPDATE TO authenticated USING (id = public.current_tenant() AND public.is_manager()) WITH CHECK (id = public.current_tenant() AND public.is_manager());

CREATE POLICY "members_select" ON public.tenant_members FOR SELECT TO authenticated USING (tenant_id = public.current_tenant() OR user_id = auth.uid());
CREATE POLICY "members_insert_self" ON public.tenant_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.current_tenant() IS NULL);
CREATE POLICY "members_update" ON public.tenant_members FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant() AND public.is_manager()) WITH CHECK (tenant_id = public.current_tenant() AND public.is_manager());
CREATE POLICY "members_delete" ON public.tenant_members FOR DELETE TO authenticated USING (tenant_id = public.current_tenant() AND public.is_manager() AND user_id <> auth.uid());

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR EXISTS (SELECT 1 FROM public.tenant_members m WHERE m.user_id = public.profiles.id AND m.tenant_id = public.current_tenant())
);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "customers_all" ON public.customers FOR ALL TO authenticated USING (tenant_id = public.current_tenant()) WITH CHECK (tenant_id = public.current_tenant());
CREATE POLICY "vehicles_all" ON public.vehicles FOR ALL TO authenticated USING (tenant_id = public.current_tenant()) WITH CHECK (tenant_id = public.current_tenant());
CREATE POLICY "orders_all" ON public.service_orders FOR ALL TO authenticated USING (tenant_id = public.current_tenant()) WITH CHECK (tenant_id = public.current_tenant());
CREATE POLICY "items_all" ON public.service_order_items FOR ALL TO authenticated USING (tenant_id = public.current_tenant()) WITH CHECK (tenant_id = public.current_tenant());
CREATE POLICY "payments_all" ON public.payments FOR ALL TO authenticated USING (tenant_id = public.current_tenant()) WITH CHECK (tenant_id = public.current_tenant());
CREATE POLICY "photos_all" ON public.order_photos FOR ALL TO authenticated USING (tenant_id = public.current_tenant()) WITH CHECK (tenant_id = public.current_tenant());

CREATE POLICY "services_select" ON public.services FOR SELECT TO authenticated USING (tenant_id = public.current_tenant());
CREATE POLICY "services_write" ON public.services FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant() AND public.is_manager());
CREATE POLICY "services_update" ON public.services FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant() AND public.is_manager()) WITH CHECK (tenant_id = public.current_tenant() AND public.is_manager());
CREATE POLICY "services_delete" ON public.services FOR DELETE TO authenticated USING (tenant_id = public.current_tenant() AND public.is_manager());

CREATE POLICY "lavajato_photos_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lavajato' AND (storage.foldername(name))[1] = public.current_tenant()::text);
CREATE POLICY "lavajato_photos_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lavajato' AND (storage.foldername(name))[1] = public.current_tenant()::text);
CREATE POLICY "lavajato_photos_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lavajato' AND (storage.foldername(name))[1] = public.current_tenant()::text);