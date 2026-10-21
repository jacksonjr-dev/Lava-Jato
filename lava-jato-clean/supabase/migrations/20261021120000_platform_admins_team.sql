-- Equipe do painel administrativo: nome e papel de cada administrador e o
-- registro de quem adicionou ou removeu quem. Tudo só para o service role
-- (o painel acessa pelo servidor depois de conferir senha + autenticador).

ALTER TABLE public.platform_admins
  ADD COLUMN IF NOT EXISTS nome TEXT
    CHECK (nome IS NULL OR length(trim(nome)) BETWEEN 2 AND 80),
  -- Por enquanto todos são ADMIN; outro nível (ex.: ATENDIMENTO) entra aqui depois.
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN')),
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.platform_admin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('ADICIONAR', 'REMOVER')),
  target_user_id UUID,
  target_email TEXT NOT NULL,
  actor_user_id UUID,
  actor_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_admin_events_created_idx
  ON public.platform_admin_events (created_at DESC);

ALTER TABLE public.platform_admin_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_admin_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.platform_admin_events TO service_role;
