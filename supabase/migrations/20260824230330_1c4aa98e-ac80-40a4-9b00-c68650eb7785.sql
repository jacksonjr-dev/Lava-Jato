-- 1) Unique (tenant_id, id) targets for composite FKs
ALTER TABLE public.customers      ADD CONSTRAINT customers_tenant_id_uk      UNIQUE (tenant_id, id);
ALTER TABLE public.vehicles       ADD CONSTRAINT vehicles_tenant_id_uk       UNIQUE (tenant_id, id);
ALTER TABLE public.services       ADD CONSTRAINT services_tenant_id_uk       UNIQUE (tenant_id, id);
ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_tenant_id_uk UNIQUE (tenant_id, id);

-- 2) vehicles.customer_id must belong to the same tenant
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_customer_id_fkey;
ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_customer_same_tenant_fkey
  FOREIGN KEY (tenant_id, customer_id)
  REFERENCES public.customers (tenant_id, id) ON DELETE SET NULL;

-- 3) service_orders customer/vehicle must belong to the same tenant
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_customer_id_fkey;
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_vehicle_id_fkey;
ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_customer_same_tenant_fkey
  FOREIGN KEY (tenant_id, customer_id)
  REFERENCES public.customers (tenant_id, id) ON DELETE SET NULL;
ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_vehicle_same_tenant_fkey
  FOREIGN KEY (tenant_id, vehicle_id)
  REFERENCES public.vehicles (tenant_id, id) ON DELETE SET NULL;

-- 4) items must reference an order and a service of the same tenant
ALTER TABLE public.service_order_items DROP CONSTRAINT IF EXISTS service_order_items_order_id_fkey;
ALTER TABLE public.service_order_items DROP CONSTRAINT IF EXISTS service_order_items_service_id_fkey;
ALTER TABLE public.service_order_items
  ADD CONSTRAINT service_order_items_order_same_tenant_fkey
  FOREIGN KEY (tenant_id, order_id)
  REFERENCES public.service_orders (tenant_id, id) ON DELETE CASCADE;
ALTER TABLE public.service_order_items
  ADD CONSTRAINT service_order_items_service_same_tenant_fkey
  FOREIGN KEY (tenant_id, service_id)
  REFERENCES public.services (tenant_id, id) ON DELETE SET NULL;

-- 5) payments must reference an order of the same tenant
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_order_id_fkey;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_order_same_tenant_fkey
  FOREIGN KEY (tenant_id, order_id)
  REFERENCES public.service_orders (tenant_id, id) ON DELETE CASCADE;

-- 6) photos must reference an order/vehicle of the same tenant
ALTER TABLE public.order_photos DROP CONSTRAINT IF EXISTS order_photos_order_id_fkey;
ALTER TABLE public.order_photos DROP CONSTRAINT IF EXISTS order_photos_vehicle_id_fkey;
ALTER TABLE public.order_photos
  ADD CONSTRAINT order_photos_order_same_tenant_fkey
  FOREIGN KEY (tenant_id, order_id)
  REFERENCES public.service_orders (tenant_id, id) ON DELETE CASCADE;
ALTER TABLE public.order_photos
  ADD CONSTRAINT order_photos_vehicle_same_tenant_fkey
  FOREIGN KEY (tenant_id, vehicle_id)
  REFERENCES public.vehicles (tenant_id, id) ON DELETE SET NULL;