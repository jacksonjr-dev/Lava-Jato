import { describe, expect, it } from "vitest";
import {
  describeEvent,
  filterCompanies,
  planChange,
  summarize,
  suspensionReason,
  withSubscription,
  type Company,
  type CompanyRow,
} from "./companies";

const NOW = new Date("2026-10-16T12:00:00.000Z");
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

const row = (overrides: Partial<CompanyRow>): CompanyRow => ({
  id: "t",
  nome: "Lava",
  slug: "lava",
  telefone: null,
  logo_url: null,
  created_at: days(-30),
  ownerEmail: "dono@exemplo.com",
  plan: "GRATIS",
  trial_ends_at: null,
  plan_expires_at: null,
  ordersThisMonth: 0,
  ...overrides,
});

const companies: Company[] = [
  row({ id: "1", nome: "Lava Jato Água Viva", ownerEmail: "ana@x.com", trial_ends_at: days(2) }),
  row({ id: "2", nome: "Brilho Total", plan: "BASICO", plan_expires_at: days(20) }),
  row({ id: "3", nome: "Auto Spa", plan: "MAX", plan_expires_at: days(5) }),
  row({ id: "4", nome: "Lava Rápido", plan: "MAX", plan_expires_at: days(-1) }),
  row({ id: "5", nome: "Espuma", plan: "GRATIS" }),
].map((c) => withSubscription(c, NOW));

const ids = (list: Company[]) => list.map((c) => c.id);

describe("lista de empresas", () => {
  it("busca por nome sem acento e por e-mail do dono", () => {
    expect(ids(filterCompanies(companies, { q: "agua viva" }))).toEqual(["1"]);
    expect(ids(filterCompanies(companies, { q: "ana@" }))).toEqual(["1"]);
  });

  it("filtra por situação, vencimento próximo e plano", () => {
    expect(ids(filterCompanies(companies, { status: "TESTE" }))).toEqual(["1"]);
    expect(ids(filterCompanies(companies, { status: "TOLERANCIA" }))).toEqual(["4"]);
    expect(ids(filterCompanies(companies, { status: "vencendo" }))).toEqual(["1", "3"]);
    expect(ids(filterCompanies(companies, { plan: "MAX" }))).toEqual(["1", "3", "4"]);
  });

  it("resume as empresas por situação e plano pago", () => {
    expect(summarize(companies)).toMatchObject({
      total: 5,
      teste: 1,
      pagas: 3,
      vencidas: 1,
      gratis: 1,
      vencendo: 2,
      porPlano: { BASICO: 1, MAX: 2 },
    });
  });
});

describe("ações de plano", () => {
  it("ativa por meses e exige motivo", () => {
    const { next, reason } = planChange(
      { plan: "GRATIS" },
      { action: "ATIVAR", plan: "BASICO", months: 3 },
      "  Pagou 3 meses no PIX  ",
      NOW,
    );
    expect(next).toEqual({ plan: "BASICO", trial_ends_at: null, plan_expires_at: days(90) });
    expect(reason).toBe("Pagou 3 meses no PIX");
    expect(() => planChange({ plan: "GRATIS" }, { action: "GRATIS" }, " ", NOW)).toThrow("motivo");
  });

  it("renovar o mesmo plano soma ao vencimento atual", () => {
    const { next } = planChange(
      { plan: "MAX", plan_expires_at: days(5) },
      { action: "ATIVAR", plan: "MAX", months: 1 },
      "Renovação mensal",
      NOW,
    );
    expect(next.plan_expires_at).toBe(days(35));
  });

  it("descreve as ações do histórico", () => {
    const base = {
      id: "e",
      reason: "x",
      admin_email: null,
      created_at: NOW.toISOString(),
      to_trial_ends_at: null,
      to_expires_at: null,
    };
    expect(describeEvent({ ...base, action: "ATIVAR", from_plan: "GRATIS", to_plan: "MAX" })).toBe(
      "Ativou Max",
    );
    expect(describeEvent({ ...base, action: "ATIVAR", from_plan: "MAX", to_plan: "MAX" })).toBe(
      "Renovou Max",
    );
    expect(describeEvent({ ...base, action: "GRATIS", from_plan: "MAX", to_plan: "GRATIS" })).toBe(
      "Voltou ao Grátis",
    );
  });
});

describe("suspensão de empresa", () => {
  const withSuspended = [
    ...companies,
    withSubscription(
      row({ id: "6", nome: "Fake", suspended_at: days(-1), suspended_reason: "x" }),
      NOW,
    ),
  ];

  it("filtra e conta as suspensas", () => {
    expect(filterCompanies(withSuspended, { status: "suspensas" }).map((c) => c.id)).toEqual(["6"]);
    expect(summarize(withSuspended).suspensas).toBe(1);
  });

  it("exige motivo e registra no histórico", () => {
    expect(() => suspensionReason("  ")).toThrow("motivo");
    expect(suspensionReason("  cadastro falso ")).toBe("cadastro falso");
    const event = {
      id: "e",
      from_plan: "MAX",
      to_plan: "MAX",
      to_trial_ends_at: null,
      to_expires_at: null,
      reason: "x",
      admin_email: null,
      created_at: NOW.toISOString(),
    };
    expect(describeEvent({ ...event, action: "SUSPENDER" })).toBe("Empresa suspensa");
    expect(describeEvent({ ...event, action: "REATIVAR" })).toBe("Empresa reativada");
  });
});
