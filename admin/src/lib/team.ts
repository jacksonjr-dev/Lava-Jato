// Equipe do painel: quem pode entrar, convites e remoção de acesso.

export type TeamMember = {
  userId: string;
  nome: string | null;
  email: string;
  role: string;
  since: string;
  /** Último login; null = ainda não entrou (convite pendente). */
  lastSignInAt: string | null;
  /** Google Authenticator configurado (fator TOTP verificado). */
  mfa: boolean;
  addedByEmail: string | null;
};

export type TeamEvent = {
  id: string;
  action: "ADICIONAR" | "REMOVER";
  target_email: string;
  actor_email: string | null;
  created_at: string;
};

/** Senha mínima de quem entra no painel (mais exigente que a dos lava-jatos). */
export const ADMIN_MIN_PASSWORD = 10;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateInvite(input: { nome: string; email: string }) {
  const nome = input.nome.trim().replace(/\s+/g, " ");
  const email = input.email.trim().toLowerCase();
  if (nome.length < 2 || nome.length > 80) throw new Error("Informe o nome (2 a 80 caracteres).");
  if (!EMAIL.test(email) || email.length > 254) throw new Error("Informe um e-mail válido.");
  return { nome, email };
}

/**
 * Regras para remover um acesso: ninguém remove a si mesmo (evita ficar trancado
 * para fora por engano) e o painel nunca fica sem administrador.
 */
export function assertCanRemove(actorId: string, targetId: string, members: TeamMember[]) {
  if (actorId === targetId) throw new Error("Você não pode remover o seu próprio acesso.");
  const target = members.find((member) => member.userId === targetId);
  if (!target) throw new Error("Administrador não encontrado.");
  if (isOwner(target.role)) throw new Error("O dono do painel não pode ser removido por aqui.");
  if (members.length <= 1) throw new Error("O painel precisa ter pelo menos um administrador.");
}

export function validatePassword(password: string, confirmation: string): string {
  if (password.length < ADMIN_MIN_PASSWORD) {
    throw new Error(`Use pelo menos ${ADMIN_MIN_PASSWORD} caracteres.`);
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("Use letras e números na senha.");
  }
  if (password !== confirmation) throw new Error("As senhas não conferem.");
  return password;
}

export function memberStatus(member: TeamMember): "pendente" | "sem-autenticador" | "ativo" {
  if (!member.lastSignInAt) return "pendente";
  if (!member.mfa) return "sem-autenticador";
  return "ativo";
}

/** Dono do painel: o único que gerencia a equipe (definido pelo SQL, não pelo painel). */
export function isOwner(role: string | null | undefined): boolean {
  return role === "DONO";
}

export function assertOwner(role: string | null | undefined) {
  if (!isOwner(role)) throw new Error("Somente o dono do painel gerencia a equipe.");
}

export const ROLE_LABEL: Record<string, string> = { DONO: "Dono", ADMIN: "Administrador" };
