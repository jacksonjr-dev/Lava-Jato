-- Papel "Dono do painel": só ele gerencia a equipe (convidar e remover
-- administradores). Os demais administradores continuam com acesso ao resto do
-- painel. O Dono é definido pelo SQL (ninguém se promove pelo painel).
ALTER TABLE public.platform_admins DROP CONSTRAINT IF EXISTS platform_admins_role_check;
ALTER TABLE public.platform_admins
  ADD CONSTRAINT platform_admins_role_check CHECK (role IN ('DONO', 'ADMIN'));
