-- Teste grátis do plano Max passa de 7 para 3 dias (espelha TRIAL_DAYS em
-- src/lib/plans.ts; plans.test.ts confere). Vale para empresas criadas a partir
-- de agora: quem já está em teste mantém o prazo que recebeu no cadastro.
ALTER TABLE public.tenants
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '3 days');
