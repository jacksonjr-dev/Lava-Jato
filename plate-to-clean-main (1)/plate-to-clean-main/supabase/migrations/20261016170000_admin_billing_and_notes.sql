-- Painel admin: pagamentos das assinaturas (registro manual por enquanto) e
-- notas internas por empresa. Só o service role (servidor do painel) acessa.

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL
    CHECK (method IN ('PIX', 'BOLETO', 'CARTAO', 'DINHEIRO', 'TRANSFERENCIA', 'OUTRO')),
  paid_at TIMESTAMPTZ NOT NULL,
  plan TEXT CHECK (plan IN ('BASICO', 'MAX')),
  months INTEGER CHECK (months BETWEEN 1 AND 24),
  note TEXT CHECK (note IS NULL OR length(note) <= 300),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscription_payments_tenant_paid_idx
  ON public.subscription_payments (tenant_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS subscription_payments_paid_idx
  ON public.subscription_payments (paid_at DESC);

CREATE TABLE IF NOT EXISTS public.tenant_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 1000),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_notes_tenant_created_idx
  ON public.tenant_notes (tenant_id, created_at DESC);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_payments FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.tenant_notes FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.subscription_payments TO service_role;
GRANT ALL ON public.tenant_notes TO service_role;
