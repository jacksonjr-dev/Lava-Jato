-- Suspensão de empresas pelo painel administrativo (contas falsas, abuso, etc.).
-- A trava fica no banco: app.current_tenant() não devolve empresa suspensa, então
-- todas as políticas de RLS que dependem dela deixam de liberar leitura e escrita,
-- mesmo para chamadas diretas à API. Só o service role altera estas colunas (o
-- UPDATE de tenants para authenticated é liberado coluna a coluna desde
-- 20261015120000_security_hardening.sql).

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT
    CHECK (suspended_reason IS NULL OR length(suspended_reason) <= 300);

CREATE OR REPLACE FUNCTION app.current_tenant()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.tenant_id
  FROM public.tenant_members m
  JOIN public.tenants t ON t.id = m.tenant_id
  WHERE m.user_id = auth.uid() AND t.suspended_at IS NULL
  LIMIT 1;
$$;

-- Histórico do painel passa a registrar suspensão e reativação.
ALTER TABLE public.subscription_events DROP CONSTRAINT IF EXISTS subscription_events_action_check;
ALTER TABLE public.subscription_events
  ADD CONSTRAINT subscription_events_action_check
  CHECK (action IN ('ATIVAR', 'ESTENDER_TESTE', 'GRATIS', 'SUSPENDER', 'REATIVAR'));
