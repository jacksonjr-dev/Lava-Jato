CREATE SCHEMA IF NOT EXISTS app;
GRANT USAGE ON SCHEMA app TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app.current_tenant()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app.current_role_in_tenant()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.tenant_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app.is_manager()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid() AND role IN ('OWNER','MANAGER'));
$$;

CREATE OR REPLACE FUNCTION app.tenant_is_empty(_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = _tenant_id);
$$;

REVOKE ALL ON FUNCTION app.current_tenant(), app.current_role_in_tenant(), app.is_manager(), app.tenant_is_empty(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.current_tenant(), app.current_role_in_tenant(), app.is_manager(), app.tenant_is_empty(uuid) TO authenticated, service_role;

-- Recreate policies against the private helpers
DROP POLICY IF EXISTS customers_all ON public.customers;
CREATE POLICY customers_all ON public.customers FOR ALL TO authenticated
  USING (tenant_id = app.current_tenant()) WITH CHECK (tenant_id = app.current_tenant());

DROP POLICY IF EXISTS photos_all ON public.order_photos;
CREATE POLICY photos_all ON public.order_photos FOR ALL TO authenticated
  USING (tenant_id = app.current_tenant()) WITH CHECK (tenant_id = app.current_tenant());

DROP POLICY IF EXISTS payments_all ON public.payments;
CREATE POLICY payments_all ON public.payments FOR ALL TO authenticated
  USING (tenant_id = app.current_tenant()) WITH CHECK (tenant_id = app.current_tenant());

DROP POLICY IF EXISTS items_all ON public.service_order_items;
CREATE POLICY items_all ON public.service_order_items FOR ALL TO authenticated
  USING (tenant_id = app.current_tenant()) WITH CHECK (tenant_id = app.current_tenant());

DROP POLICY IF EXISTS orders_all ON public.service_orders;
CREATE POLICY orders_all ON public.service_orders FOR ALL TO authenticated
  USING (tenant_id = app.current_tenant()) WITH CHECK (tenant_id = app.current_tenant());

DROP POLICY IF EXISTS vehicles_all ON public.vehicles;
CREATE POLICY vehicles_all ON public.vehicles FOR ALL TO authenticated
  USING (tenant_id = app.current_tenant()) WITH CHECK (tenant_id = app.current_tenant());

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING ((id = auth.uid()) OR EXISTS (
    SELECT 1 FROM public.tenant_members m
    WHERE m.user_id = profiles.id AND m.tenant_id = app.current_tenant()));

DROP POLICY IF EXISTS services_select ON public.services;
CREATE POLICY services_select ON public.services FOR SELECT TO authenticated
  USING (tenant_id = app.current_tenant());
DROP POLICY IF EXISTS services_write ON public.services;
CREATE POLICY services_write ON public.services FOR INSERT TO authenticated
  WITH CHECK (tenant_id = app.current_tenant() AND app.is_manager());
DROP POLICY IF EXISTS services_update ON public.services;
CREATE POLICY services_update ON public.services FOR UPDATE TO authenticated
  USING (tenant_id = app.current_tenant() AND app.is_manager())
  WITH CHECK (tenant_id = app.current_tenant() AND app.is_manager());
DROP POLICY IF EXISTS services_delete ON public.services;
CREATE POLICY services_delete ON public.services FOR DELETE TO authenticated
  USING (tenant_id = app.current_tenant() AND app.is_manager());

DROP POLICY IF EXISTS tenant_insert ON public.tenants;
CREATE POLICY tenant_insert ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (app.current_tenant() IS NULL);
DROP POLICY IF EXISTS tenant_select ON public.tenants;
CREATE POLICY tenant_select ON public.tenants FOR SELECT TO authenticated
  USING (id = app.current_tenant());
DROP POLICY IF EXISTS tenant_update ON public.tenants;
CREATE POLICY tenant_update ON public.tenants FOR UPDATE TO authenticated
  USING (id = app.current_tenant() AND app.is_manager())
  WITH CHECK (id = app.current_tenant() AND app.is_manager());

-- tenant_members: block privilege escalation
DROP POLICY IF EXISTS members_select ON public.tenant_members;
CREATE POLICY members_select ON public.tenant_members FOR SELECT TO authenticated
  USING (tenant_id = app.current_tenant() OR user_id = auth.uid());

DROP POLICY IF EXISTS members_insert_self ON public.tenant_members;
CREATE POLICY members_insert_self ON public.tenant_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND app.current_tenant() IS NULL
    AND role = 'OWNER'::public.app_role
    AND app.tenant_is_empty(tenant_id)
  );

DROP POLICY IF EXISTS members_update ON public.tenant_members;
CREATE POLICY members_update ON public.tenant_members FOR UPDATE TO authenticated
  USING (tenant_id = app.current_tenant() AND app.is_manager() AND user_id <> auth.uid())
  WITH CHECK (
    tenant_id = app.current_tenant()
    AND app.is_manager()
    AND user_id <> auth.uid()
    AND (role <> 'OWNER'::public.app_role OR app.current_role_in_tenant() = 'OWNER'::public.app_role)
  );

DROP POLICY IF EXISTS members_delete ON public.tenant_members;
CREATE POLICY members_delete ON public.tenant_members FOR DELETE TO authenticated
  USING (tenant_id = app.current_tenant() AND app.is_manager() AND user_id <> auth.uid());

-- Storage policies
DROP POLICY IF EXISTS lavajato_photos_read ON storage.objects;
CREATE POLICY lavajato_photos_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lavajato' AND (storage.foldername(name))[1] = (app.current_tenant())::text);
DROP POLICY IF EXISTS lavajato_photos_write ON storage.objects;
CREATE POLICY lavajato_photos_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lavajato' AND (storage.foldername(name))[1] = (app.current_tenant())::text);
DROP POLICY IF EXISTS lavajato_photos_delete ON storage.objects;
CREATE POLICY lavajato_photos_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lavajato' AND (storage.foldername(name))[1] = (app.current_tenant())::text);
DROP POLICY IF EXISTS lavajato_photos_update ON storage.objects;
CREATE POLICY lavajato_photos_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lavajato' AND (storage.foldername(name))[1] = (app.current_tenant())::text)
  WITH CHECK (bucket_id = 'lavajato' AND (storage.foldername(name))[1] = (app.current_tenant())::text);

DROP FUNCTION IF EXISTS public.current_tenant();
DROP FUNCTION IF EXISTS public.current_role_in_tenant();
DROP FUNCTION IF EXISTS public.is_manager();