import { describe, expect, it } from "vitest";
import { calculateFinancialStats, financialPeriod } from "./financial";

describe("contagens financeiras", () => {
  const now = new Date("2026-10-02T15:00:00.000Z"); // 12h em Fortaleza

  it("usa a meia-noite de Fortaleza", () => {
    const period = financialPeriod(now);
    expect(period.startDay.toISOString()).toBe("2026-10-02T03:00:00.000Z");
    expect(period.startMonth.toISOString()).toBe("2026-10-01T03:00:00.000Z");
  });

  it("inclui o mês anterior nos últimos sete dias sem misturar o faturamento mensal", () => {
    const result = calculateFinancialStats({
      now,
      payments: [
        { order_id: "sep", valor: 40, metodo: "PIX", pago_em: "2026-09-28T15:00:00.000Z" },
        { order_id: "oct-1", valor: 100, metodo: "DINHEIRO", pago_em: "2026-10-01T15:00:00.000Z" },
        { order_id: "oct-2", valor: 50, metodo: "PIX", pago_em: "2026-10-02T12:00:00.000Z" },
        // Ainda é 1º de outubro em Fortaleza.
        { order_id: "late", valor: 25, metodo: "PIX", pago_em: "2026-10-02T02:30:00.000Z" },
      ],
      monthOrders: [
        { id: "1", vehicle_id: "car-1", status: "PAGO", created_at: "2026-10-01T10:00:00Z" },
        { id: "2", vehicle_id: "car-1", status: "PAGO", created_at: "2026-10-02T10:00:00Z" },
        { id: "3", vehicle_id: null, status: "AGUARDANDO", created_at: "2026-10-02T11:00:00Z" },
      ],
      activeOrders: 3,
      paidItems: [
        { nome: "Lavagem", preco: 50, quantidade: 2 },
        { nome: "Polimento", preco: 100, quantidade: 1 },
      ],
    });

    expect(result.faturamentoDia).toBe(50);
    expect(result.faturamentoSemana).toBe(215);
    expect(result.faturamentoMes).toBe(175);
    expect(result.ticketMedio).toBeCloseTo(175 / 3);
    expect(result.pagosOuEntregues).toBe(3);
    expect(result.veiculosDia).toBe(1);
    expect(result.veiculosMes).toBe(1);
    expect(result.emAndamento).toBe(3);
    expect(result.topServicos[0]).toEqual({ nome: "Lavagem", qtd: 2, valor: 100 });
  });
});
