import { describe, expect, it } from "vitest";
import {
  assertCanRemove,
  assertOwner,
  memberStatus,
  validateInvite,
  validatePassword,
  type TeamMember,
} from "./team";

const member = (userId: string, overrides: Partial<TeamMember> = {}): TeamMember => ({
  userId,
  nome: userId,
  email: `${userId}@lavapro.com.br`,
  role: "ADMIN",
  since: "2026-10-21T12:00:00.000Z",
  lastSignInAt: "2026-10-21T12:00:00.000Z",
  mfa: true,
  addedByEmail: null,
  ...overrides,
});

describe("convite", () => {
  it("normaliza nome e e-mail", () => {
    expect(validateInvite({ nome: "  Ana   Souza ", email: " Ana@LavaPro.com.br " })).toEqual({
      nome: "Ana Souza",
      email: "ana@lavapro.com.br",
    });
  });

  it("recusa nome curto e e-mail inválido", () => {
    expect(() => validateInvite({ nome: "A", email: "a@b.com" })).toThrow("nome");
    expect(() => validateInvite({ nome: "Ana", email: "ana@" })).toThrow("e-mail");
  });
});

describe("remover acesso", () => {
  const team = [member("a"), member("b"), member("c")];

  it("não remove a si mesmo nem deixa o painel sem administrador", () => {
    expect(() => assertCanRemove("a", "a", team)).toThrow("próprio acesso");
    expect(() => assertCanRemove("a", "z", team)).toThrow("não encontrado");
    expect(() => assertCanRemove("a", "b", [member("b")])).toThrow("pelo menos um");
    expect(() => assertCanRemove("a", "b", team)).not.toThrow();
  });
});

describe("senha do painel", () => {
  it("exige 10 caracteres com letras e números, e a confirmação", () => {
    expect(() => validatePassword("abc123", "abc123")).toThrow("10");
    expect(() => validatePassword("abcdefghijk", "abcdefghijk")).toThrow("letras e números");
    expect(() => validatePassword("lavapro2026x", "lavapro2026y")).toThrow("não conferem");
    expect(validatePassword("lavapro2026x", "lavapro2026x")).toBe("lavapro2026x");
  });
});

describe("situação de cada pessoa", () => {
  it("mostra convite pendente, sem autenticador e ativo", () => {
    expect(memberStatus(member("a", { lastSignInAt: null }))).toBe("pendente");
    expect(memberStatus(member("a", { mfa: false }))).toBe("sem-autenticador");
    expect(memberStatus(member("a"))).toBe("ativo");
  });
});

describe("dono do painel", () => {
  it("só o dono gerencia a equipe e ninguém remove o dono", () => {
    expect(() => assertOwner("ADMIN")).toThrow("dono do painel");
    expect(() => assertOwner("DONO")).not.toThrow();
    const team = [member("dono", { role: "DONO" }), member("b"), member("c")];
    expect(() => assertCanRemove("b", "dono", team)).toThrow("dono do painel não pode");
    expect(() => assertCanRemove("dono", "b", team)).not.toThrow();
  });
});
