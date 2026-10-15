ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS business_hours JSONB;

ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_business_hours_object_check;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_business_hours_object_check
  CHECK (business_hours IS NULL OR jsonb_typeof(business_hours) = 'object');

COMMENT ON COLUMN public.tenants.business_hours IS
  'Weekly opening hours keyed by weekday, with enabled, open and close fields.';
