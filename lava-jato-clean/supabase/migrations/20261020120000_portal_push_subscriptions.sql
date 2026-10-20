-- Notificações no celular (web push) da área do cliente: cada aparelho que tocou
-- em "Me avise quando ficar pronto" guarda aqui o endereço de entrega do serviço
-- de push do navegador. Só o servidor (service role) lê e grava.

CREATE TABLE IF NOT EXISTS public.portal_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE CHECK (endpoint LIKE 'https://%' AND length(endpoint) <= 1000),
  p256dh TEXT NOT NULL CHECK (length(p256dh) BETWEEN 40 AND 200),
  auth TEXT NOT NULL CHECK (length(auth) BETWEEN 10 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS portal_push_subscriptions_vehicle_idx
  ON public.portal_push_subscriptions (tenant_id, vehicle_id);

ALTER TABLE public.portal_push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.portal_push_subscriptions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.portal_push_subscriptions TO service_role;
