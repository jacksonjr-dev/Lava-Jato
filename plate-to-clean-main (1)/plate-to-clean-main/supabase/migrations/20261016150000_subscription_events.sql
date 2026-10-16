-- Histórico das ações de plano feitas pela equipe LavaPro (painel admin).
-- Só o service role (servidor do painel) lê e grava: nenhum acesso pela API
-- pública, nem para os lava-jatos.
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL CHECK (action IN ('ATIVAR', 'ESTENDER_TESTE', 'GRATIS')),
  from_plan TEXT,
  to_plan TEXT,
  from_trial_ends_at TIMESTAMPTZ,
  to_trial_ends_at TIMESTAMPTZ,
  from_expires_at TIMESTAMPTZ,
  to_expires_at TIMESTAMPTZ,
  reason TEXT NOT NULL CHECK (length(trim(reason)) >= 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscription_events_tenant_created_idx
  ON public.subscription_events (tenant_id, created_at DESC);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.subscription_events TO service_role;
