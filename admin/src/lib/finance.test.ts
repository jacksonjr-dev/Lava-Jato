import { describe, expect, it } from "vitest";
import { withSubscription, type CompanyRow } from "./companies";
import {
  financeRange,
  financeSummary,
  forecast,
  paymentsCsv,
  type FinancePayment,
} from "./finance";

const NOW = new Date(2026, 9, 16, 15, 0);
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

const company = (id: string, overrides: Partial<CompanyRow>) =>
  withSubscription(
    {
      id,
      nome: `Empresa ${id}`,
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

const pay = (
  tenant: string,
  amount: number,
  paidAt: Date,
  extra: Partial<FinancePayment> = {},
): FinancePayment => ({
  id: `${tenant}-${paidAt.toISOString()}`,
  tenant_id: tenant,
  tenantName: `Empresa ${tenant}`,
  amount,
  method: "PIX",
  paid_at: paidAt.toISOString(),
  plan: "MAX",
  months: 1,
  note: null,
  admin_email: "admin@lavapro.local",
  created_at: paidAt.toISOString(),
  ...extra,
});

describe("períodos do financeiro", () => {
  it("monta o período e o anterior de mesmo tamanho", () => {
    const mes = financeRange("mes", NOW);
    expect(mes.current.start).toEqual(new Date(2026, 9, 1));
    expect(mes.previous.start).toEqual(new Date(2026, 8, 1));
    const tres = financeRange("3m", NOW);
    expect(tres.current.start).toEqual(new Date(2026, 7, 1));
    expect(tres.previous).toEqual({ start: new Date(2026, 4, 1), end: new Date(2026, 7, 1) });
  });
});

describe("resumo do financeiro", () => {
  const companies = [
    company("a", { plan: "MAX", plan_expires_at: day(10) }),
    company("b", { plan: "BASICO", plan_expires_at: day(-1) }), // vencida, na tolerância
    company("c", { plan: "MAX", plan_expires_at: day(60) }), // fora dos 30 dias
    company("d", { plan: "BASICO", plan_expires_at: day(5) }), // sem pagamento registrado
  ];
  const payments = [
    pay("a", 89.9, new Date(2026, 9, 6)),
    pay("b", 149.7, new Date(2026, 9, 2), { method: "BOLETO", plan: "BASICO", months: 3 }),
    pay("c", 89.9, new Date(2026, 8, 20)),
    pay("a", 89.9, new Date(2026, 8, 6)),
  ];
  const summary = financeSummary("mes", payments, companies, NOW);

  it("soma o período, compara e calcula o ticket médio", () => {
    expect(summary.recebido).toBe(239.6);
    expect(summary.anterior).toBe(179.8);
    expect(summary.quantidade).toBe(2);
    expect(summary.ticketMedio).toBe(119.8);
    expect(summary.empresasPagantes).toBe(2);
    expect(summary.pagamentos.map((payment) => payment.tenant_id)).toEqual(["a", "b"]);
  });

  it("separa por forma de pagamento e por plano", () => {
    expect(summary.porForma).toEqual([
      { key: "BOLETO", label: "Boleto", valor: 149.7, quantidade: 1 },
      { key: "PIX", label: "PIX", valor: 89.9, quantidade: 1 },
    ]);
    expect(summary.porPlano.map((item) => item.label)).toEqual(["Básico", "Max"]);
  });

  it("prevê as renovações dos próximos 30 dias com a mensalidade", () => {
    const items = forecast(companies, payments, NOW);
    expect(items.map((item) => [item.company.id, item.expected, item.overdue])).toEqual([
      ["b", 49.9, true],
      ["d", null, false],
      ["a", 89.9, false],
    ]);
    expect(summary.aReceber.total).toBe(139.8);
    expect(summary.aReceber.semValor).toBe(1);
  });

  it("gera a planilha com ; e vírgula decimal", () => {
    const csv = paymentsCsv([pay("a", 89.9, new Date(2026, 9, 6), { note: 'ref; "out"' })]);
    expect(csv.split("\n")[1]).toBe(
      '06/10/2026;Empresa a;89,90;PIX;Max;1;"ref; ""out""";admin@lavapro.local',
    );
  });
});
