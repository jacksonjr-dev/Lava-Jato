import { describe, expect, it } from "vitest";
import {
  businessMetrics,
  paymentReason,
  validateNote,
  validatePayment,
  type PaymentRecord,
} from "./billing";
import { withSubscription, type CompanyRow } from "./companies";

const NOW = new Date(2026, 9, 16, 15, 0);
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

describe("registro de pagamento", () => {
  it("valida valor, forma, data e plano", () => {
    const ok = validatePayment(
      {
        amount: 89.9,
        method: "PIX",
        paidOn: "2026-10-15",
        note: "  ref. outubro ",
        activate: { plan: "MAX", months: 1 },
      },
      NOW,
    );
    expect(ok).toMatchObject({ amount: 89.9, method: "PIX", note: "ref. outubro" });
    expect(new Date(ok.paidAt).getDate()).toBe(15);
    const base = { method: "PIX" as const, paidOn: "2026-10-15", note: "", activate: null };
    expect(() => validatePayment({ ...base, amount: 0 }, NOW)).toThrow("valor");
    expect(() => validatePayment({ ...base, amount: 50, paidOn: "2026-12-01" }, NOW)).toThrow(
      "futuro",
    );
    expect(() => validatePayment({ ...base, amount: 50, method: "CHEQUE" as never }, NOW)).toThrow(
      "forma",
    );
  });

  it("monta o motivo do histórico e valida notas", () => {
    expect(paymentReason(267, "PIX", "3 meses")).toBe(
      "Pagamento registrado: R$ 267,00 (PIX) — 3 meses",
    );
    expect(validateNote("  ligar na segunda  ")).toBe("ligar na segunda");
    expect(() => validateNote("   ")).toThrow("Escreva");
  });
});

const company = (id: string, overrides: Partial<CompanyRow>) =>
  withSubscription(
    {
      id,
      nome: id,
      slug: id,
      telefone: null,
      logo_url: null,
      created_at: day(-200),
      ownerEmail: null,
      plan: "GRATIS",
      trial_ends_at: null,
      plan_expires_at: null,
      ordersThisMonth: 0,
      ...overrides,
    },
    NOW,
  );

const payment = (
  tenant: string,
  amount: number,
  months: number,
  paidAt: string,
): PaymentRecord => ({
  id: `${tenant}-${paidAt}`,
  tenant_id: tenant,
  amount,
  method: "PIX",
  paid_at: paidAt,
  plan: "MAX",
  months,
  note: null,
  admin_email: null,
  created_at: paidAt,
});

describe("números do negócio", () => {
  const companies = [
    company("a", { plan: "MAX", plan_expires_at: day(20) }),
    company("b", { plan: "BASICO", plan_expires_at: day(60), created_at: day(-30) }),
    company("c", { plan: "MAX", plan_expires_at: day(10) }), // pagante sem pagamento registrado
    company("d", { trial_ends_at: day(1), created_at: day(-2) }), // em teste (fora da coorte)
    company("e", { created_at: day(-20) }), // terminou o teste e não pagou
  ];
  const payments = [
    payment("a", 100, 1, new Date(2026, 9, 2).toISOString()),
    payment("a", 90, 1, new Date(2026, 8, 2).toISOString()),
    payment("b", 240, 6, new Date(2026, 9, 5).toISOString()),
  ];
  const metrics = businessMetrics(companies, payments, new Set(), NOW);

  it("soma a receita do mês e do mês anterior", () => {
    expect(metrics.receitaMes).toBe(340);
    expect(metrics.receitaMesAnterior).toBe(90);
  });

  it("calcula a receita recorrente pelo último pagamento de cada pagante", () => {
    expect(metrics.mrr).toBe(140); // 100/1 + 240/6
    expect(metrics.pagantesSemPagamento).toBe(1);
    expect(metrics.pagantes).toEqual({ BASICO: 1, MAX: 2 });
  });

  it("calcula a conversão de teste para pago", () => {
    expect(metrics.testesAtivos).toBe(1);
    expect(metrics.conversao).toEqual({ taxa: 0.5, convertidas: 1, avaliadas: 2 });
  });

  it("monta os últimos 6 meses de receita e de novas empresas", () => {
    expect(metrics.receitaPorMes).toHaveLength(6);
    expect(metrics.receitaPorMes.at(-1)?.valor).toBe(340);
    expect(metrics.novasPorMes.at(-1)?.valor).toBe(1); // "d" criada em outubro
  });
});
