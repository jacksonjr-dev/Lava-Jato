import type { PaymentMethod } from "./plate";

/** Um pagamento com o contexto da OS (placa, cliente e serviços). */
export type PaymentRow = {
  id: string;
  valor: number;
  metodo: PaymentMethod | string;
  pago_em: string;
  orderId: string;
  numero: number | null;
  placa: string | null;
  cliente: string | null;
  itens: Array<{ nome: string; preco: number; quantidade: number }>;
};

export const FINANCE_PERIODS = ["7d", "30d", "mes", "mes_anterior", "personalizado"] as const;
export type FinancePeriod = (typeof FINANCE_PERIODS)[number];

export const FINANCE_PERIOD_LABEL: Record<FinancePeriod, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  mes: "Mês atual",
  mes_anterior: "Mês anterior",
  personalizado: "Período",
};

export type DateRange = { from: Date; to: Date };

const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Converte "aaaa-mm-dd" em data local (meia-noite). */
export function parseDay(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

export function formatDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Intervalo [from, to) do período, em horário local. `to` é exclusivo.
 * Período personalizado usa as datas "de" e "até" (inclusivas).
 */
export function periodRange(
  period: FinancePeriod,
  now = new Date(),
  custom?: { de?: string | undefined; ate?: string | undefined },
): DateRange {
  const tomorrow = addDays(startOfDay(now), 1);
  switch (period) {
    case "7d":
      return { from: addDays(tomorrow, -7), to: tomorrow };
    case "30d":
      return { from: addDays(tomorrow, -30), to: tomorrow };
    case "mes":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: tomorrow };
    case "mes_anterior":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    case "personalizado": {
      const from = parseDay(custom?.de) ?? addDays(tomorrow, -30);
      const until = parseDay(custom?.ate) ?? startOfDay(now);
      const to = addDays(until, 1);
      return from < to ? { from, to } : { from: addDays(to, -1), to };
    }
  }
}

/** Período imediatamente anterior, com a mesma duração (para comparar). */
export function previousRange(range: DateRange): DateRange {
  const days = Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS);
  return { from: addDays(range.from, -days), to: range.from };
}

function inRange(payment: PaymentRow, range: DateRange): boolean {
  const time = new Date(payment.pago_em).getTime();
  return time >= range.from.getTime() && time < range.to.getTime();
}

export function paymentsInRange(payments: PaymentRow[], range: DateRange): PaymentRow[] {
  return payments.filter((payment) => inRange(payment, range));
}

export type Totals = { receita: number; pagamentos: number; ticketMedio: number };

export function totals(payments: PaymentRow[]): Totals {
  const receita = payments.reduce((sum, payment) => sum + Number(payment.valor), 0);
  return {
    receita,
    pagamentos: payments.length,
    ticketMedio: payments.length ? receita / payments.length : 0,
  };
}

/** Variação percentual; null quando não há base de comparação. */
export function variation(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}

export type DayRevenue = { day: string; date: Date; receita: number; pagamentos: number };

/** Receita por dia do intervalo, incluindo os dias sem pagamento. */
export function revenueByDay(payments: PaymentRow[], range: DateRange): DayRevenue[] {
  const days: DayRevenue[] = [];
  for (let date = startOfDay(range.from); date < range.to; date = addDays(date, 1)) {
    days.push({ day: formatDay(date), date, receita: 0, pagamentos: 0 });
  }
  const index = new Map(days.map((entry) => [entry.day, entry]));
  for (const payment of payments) {
    const entry = index.get(formatDay(new Date(payment.pago_em)));
    if (!entry) continue;
    entry.receita += Number(payment.valor);
    entry.pagamentos += 1;
  }
  return days;
}

export type MethodShare = { metodo: string; receita: number; pagamentos: number; share: number };

export function revenueByMethod(payments: PaymentRow[]): MethodShare[] {
  const total = payments.reduce((sum, payment) => sum + Number(payment.valor), 0);
  const map = new Map<string, MethodShare>();
  for (const payment of payments) {
    const entry = map.get(payment.metodo) ?? {
      metodo: payment.metodo,
      receita: 0,
      pagamentos: 0,
      share: 0,
    };
    entry.receita += Number(payment.valor);
    entry.pagamentos += 1;
    map.set(payment.metodo, entry);
  }
  return [...map.values()]
    .map((entry) => ({ ...entry, share: total ? entry.receita / total : 0 }))
    .sort((a, b) => b.receita - a.receita);
}

export type ServiceStat = {
  nome: string;
  usos: number;
  receita: number;
  /** Participação na receita de serviços do período (0–1). */
  shareReceita: number;
  /** Participação no total de usos do período (0–1). */
  shareUsos: number;
  ticket: number;
};

/** Ranking dos serviços pelos itens das OS pagas no período. */
export function serviceStats(payments: PaymentRow[], by: "usos" | "receita"): ServiceStat[] {
  const map = new Map<string, { usos: number; receita: number }>();
  for (const payment of payments) {
    for (const item of payment.itens) {
      const quantity = Number(item.quantidade) || 1;
      const entry = map.get(item.nome) ?? { usos: 0, receita: 0 };
      entry.usos += quantity;
      entry.receita += Number(item.preco) * quantity;
      map.set(item.nome, entry);
    }
  }
  const totalUses = [...map.values()].reduce((sum, entry) => sum + entry.usos, 0);
  const totalRevenue = [...map.values()].reduce((sum, entry) => sum + entry.receita, 0);
  return [...map.entries()]
    .map(([nome, entry]) => ({
      nome,
      usos: entry.usos,
      receita: entry.receita,
      shareUsos: totalUses ? entry.usos / totalUses : 0,
      shareReceita: totalRevenue ? entry.receita / totalRevenue : 0,
      ticket: entry.usos ? entry.receita / entry.usos : 0,
    }))
    .sort((a, b) =>
      by === "usos" ? b.usos - a.usos || b.receita - a.receita : b.receita - a.receita,
    );
}

/** Busca por placa, cliente ou nº da OS (sem acentos). */
export function matchesPaymentSearch(payment: PaymentRow, query: string): boolean {
  const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const terms = fold(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = fold(
    [
      payment.placa,
      payment.cliente,
      payment.numero != null ? `#${payment.numero} ${payment.numero}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  );
  return terms.every(
    (term) => haystack.includes(term.replace(/^#/, "")) || haystack.includes(term),
  );
}
