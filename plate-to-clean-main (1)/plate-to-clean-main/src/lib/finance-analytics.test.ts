import { describe, expect, it } from "vitest";
import {
  comparisonLabel,
  comparisonRange,
  formatDay,
  matchesPaymentSearch,
  paymentsInRange,
  periodRange,
  previousRange,
  revenueByDay,
  revenueByMethod,
  serviceStats,
  totals,
  variation,
  type PaymentRow,
} from "./finance-analytics";

const NOW = new Date(2026, 9, 16, 15, 0);
const at = (day: number, hour = 10) => new Date(2026, 9, day, hour).toISOString();

const payment = (
  id: string,
  day: number,
  valor: number,
  metodo: string,
  itens: PaymentRow["itens"],
  extra: Partial<PaymentRow> = {},
): PaymentRow => ({
  id,
  valor,
  metodo,
  pago_em: at(day),
  orderId: `o-${id}`,
  numero: Number(id),
  placa: "ABC1D23",
  cliente: "Marina Souza",
  itens,
  ...extra,
});

const simples = { nome: "Lavagem simples", preco: 35, quantidade: 1 };
const completa = { nome: "Lavagem completa", preco: 60, quantidade: 1 };
const polimento = { nome: "Polimento", preco: 150, quantidade: 1 };

const payments = [
  payment("1", 16, 35, "PIX", [simples]),
  payment("2", 16, 210, "CREDITO", [completa, polimento]),
  payment("3", 14, 35, "PIX", [simples]),
  payment("4", 12, 35, "DINHEIRO", [simples], { placa: "BRA2E19", cliente: "Ângela Ribeiro" }),
  payment("5", 2, 60, "PIX", [completa]),
];

describe("períodos do financeiro", () => {
  it("calcula 7 dias, mês atual e mês anterior", () => {
    const week = periodRange("7d", NOW);
    expect(formatDay(week.from)).toBe("2026-10-10");
    expect(formatDay(week.to)).toBe("2026-10-17");
    expect(formatDay(periodRange("mes", NOW).from)).toBe("2026-10-01");
    const last = periodRange("mes_anterior", NOW);
    expect([formatDay(last.from), formatDay(last.to)]).toEqual(["2026-09-01", "2026-10-01"]);
  });

  it("período personalizado inclui o dia final e corrige datas invertidas", () => {
    const custom = periodRange("personalizado", NOW, { de: "2026-10-12", ate: "2026-10-14" });
    expect(paymentsInRange(payments, custom).map((p) => p.id)).toEqual(["3", "4"]);
  });

  it("o período anterior tem a mesma duração", () => {
    const prev = previousRange(periodRange("7d", NOW));
    expect([formatDay(prev.from), formatDay(prev.to)]).toEqual(["2026-10-03", "2026-10-10"]);
  });
});

describe("indicadores", () => {
  it("soma receita, conta pagamentos e calcula ticket médio", () => {
    const week = paymentsInRange(payments, periodRange("7d", NOW));
    expect(totals(week)).toEqual({ receita: 315, pagamentos: 4, ticketMedio: 78.75 });
  });

  it("calcula a variação contra o período anterior", () => {
    expect(variation(150, 100)).toBe(50);
    expect(variation(50, 100)).toBe(-50);
    expect(variation(100, 0)).toBeNull();
    expect(variation(0, 0)).toBe(0);
  });

  it("monta a receita de todos os dias, inclusive os sem pagamento", () => {
    const days = revenueByDay(payments, periodRange("7d", NOW));
    expect(days).toHaveLength(7);
    expect(days.find((d) => d.day === "2026-10-16")).toMatchObject({ receita: 245, pagamentos: 2 });
    expect(days.find((d) => d.day === "2026-10-11")).toMatchObject({ receita: 0, pagamentos: 0 });
  });

  it("divide a receita por forma de pagamento", () => {
    const methods = revenueByMethod(paymentsInRange(payments, periodRange("7d", NOW)));
    expect(methods[0]).toMatchObject({ metodo: "CREDITO", receita: 210, pagamentos: 1 });
    expect(methods.find((m) => m.metodo === "PIX")?.share).toBeCloseTo(70 / 315);
  });
});

describe("serviços", () => {
  it("o mais usado não é necessariamente o que mais dá retorno", () => {
    const week = paymentsInRange(payments, periodRange("7d", NOW));
    expect(serviceStats(week, "usos")[0]).toMatchObject({ nome: "Lavagem simples", usos: 3 });
    expect(serviceStats(week, "receita")[0]).toMatchObject({ nome: "Polimento", receita: 150 });
    const simple = serviceStats(week, "usos")[0]!;
    expect(simple.shareUsos).toBeCloseTo(3 / 5);
    expect(simple.ticket).toBe(35);
  });
});

describe("busca de pagamentos", () => {
  it("encontra por placa, cliente sem acento e número da OS", () => {
    expect(payments.filter((p) => matchesPaymentSearch(p, "bra2")).map((p) => p.id)).toEqual(["4"]);
    expect(payments.filter((p) => matchesPaymentSearch(p, "angela")).map((p) => p.id)).toEqual([
      "4",
    ]);
    expect(payments.filter((p) => matchesPaymentSearch(p, "#5")).map((p) => p.id)).toEqual(["5"]);
  });
});

describe("comparação entre períodos", () => {
  it("mês atual compara com os mesmos dias do mês anterior", () => {
    const range = periodRange("mes", NOW);
    const prev = comparisonRange("mes", range);
    expect([formatDay(prev.from), formatDay(prev.to)]).toEqual(["2026-09-01", "2026-09-17"]);
    expect(comparisonLabel("mes", range)).toBe("em relação ao mesmo período de setembro");
  });

  it("mês anterior compara com o mês completo antes dele", () => {
    const range = periodRange("mes_anterior", NOW);
    const prev = comparisonRange("mes_anterior", range);
    expect([formatDay(prev.from), formatDay(prev.to)]).toEqual(["2026-08-01", "2026-09-01"]);
    expect(comparisonLabel("mes_anterior", range)).toBe("em relação a agosto");
  });

  it("7 e 30 dias comparam com o mesmo número de dias antes", () => {
    const range = periodRange("30d", NOW);
    const prev = comparisonRange("30d", range);
    expect(formatDay(prev.to)).toBe(formatDay(range.from));
    expect(comparisonLabel("30d", range)).toBe("em relação ao mês anterior");
    expect(comparisonLabel("7d", periodRange("7d", NOW))).toBe("em relação aos 7 dias anteriores");
  });

  it("no fim de um mês longo, não passa do mês anterior", () => {
    const range = periodRange("mes", new Date(2026, 2, 31, 12));
    const prev = comparisonRange("mes", range);
    expect(formatDay(prev.to)).toBe("2026-03-01");
  });
});
