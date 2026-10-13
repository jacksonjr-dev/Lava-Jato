import type { PaymentMethod } from "./plate";

export const FINANCIAL_TIME_ZONE = "America/Fortaleza";

export type FinancialPayment = {
  order_id: string;
  valor: number | string;
  metodo: PaymentMethod | string;
  pago_em: string;
};

export type FinancialOrder = {
  id: string;
  vehicle_id: string | null;
  status: string;
  created_at: string;
};

export type FinancialItem = {
  nome: string;
  preco: number | string;
  quantidade: number | null;
};

function zonedParts(date: Date, timeZone = FINANCIAL_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function zonedMidnightUtc(
  year: number,
  month: number,
  day: number,
  timeZone = FINANCIAL_TIME_ZONE,
): Date {
  const desired = Date.UTC(year, month - 1, day);
  let guess = new Date(desired);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const actual = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(guess);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(actual.find((part) => part.type === type)?.value ?? 0);
    const represented = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    guess = new Date(guess.getTime() + (desired - represented));
  }
  return guess;
}

export function financialPeriod(now = new Date(), timeZone = FINANCIAL_TIME_ZONE) {
  const local = zonedParts(now, timeZone);
  const startDay = zonedMidnightUtc(local.year, local.month, local.day, timeZone);
  const calendarDay = new Date(Date.UTC(local.year, local.month - 1, local.day));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(calendarDay.getTime() - (6 - index) * 86_400_000);
    return zonedMidnightUtc(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      timeZone,
    );
  });
  const startMonth = zonedMidnightUtc(local.year, local.month, 1, timeZone);
  const nextMonth = zonedMidnightUtc(local.year, local.month + 1, 1, timeZone);
  const nextDayDate = new Date(calendarDay.getTime() + 86_400_000);
  const nextDay = zonedMidnightUtc(
    nextDayDate.getUTCFullYear(),
    nextDayDate.getUTCMonth() + 1,
    nextDayDate.getUTCDate(),
    timeZone,
  );
  return { startDay, nextDay, startWeek: days[0]!, startMonth, nextMonth, days };
}

function inRange(value: string, start: Date, end: Date): boolean {
  const timestamp = Date.parse(value);
  return timestamp >= start.getTime() && timestamp < end.getTime();
}

export function calculateFinancialStats({
  now = new Date(),
  payments,
  monthOrders,
  activeOrders,
  paidItems,
}: {
  now?: Date;
  payments: FinancialPayment[];
  monthOrders: FinancialOrder[];
  activeOrders: number;
  paidItems: FinancialItem[];
}) {
  const period = financialPeriod(now);
  const end = now.getTime();
  const untilNow = (payment: FinancialPayment) => Date.parse(payment.pago_em) <= end;
  const dayPayments = payments.filter(
    (payment) => inRange(payment.pago_em, period.startDay, period.nextDay) && untilNow(payment),
  );
  const weekPayments = payments.filter(
    (payment) => Date.parse(payment.pago_em) >= period.startWeek.getTime() && untilNow(payment),
  );
  const monthPayments = payments.filter(
    (payment) => inRange(payment.pago_em, period.startMonth, period.nextMonth) && untilNow(payment),
  );
  const total = (source: FinancialPayment[]) =>
    source.reduce((sum, payment) => sum + Number(payment.valor), 0);

  const byMethod = new Map<string, number>();
  for (const payment of monthPayments) {
    byMethod.set(payment.metodo, (byMethod.get(payment.metodo) ?? 0) + Number(payment.valor));
  }

  const services = new Map<string, { qtd: number; valor: number }>();
  for (const item of paidItems) {
    const current = services.get(item.nome) ?? { qtd: 0, valor: 0 };
    const quantity = item.quantidade ?? 1;
    current.qtd += quantity;
    current.valor += Number(item.preco) * quantity;
    services.set(item.nome, current);
  }

  const dayOrders = monthOrders.filter((order) =>
    inRange(order.created_at, period.startDay, period.nextDay),
  );
  const distinctVehicles = (orders: FinancialOrder[]) =>
    new Set(orders.map((order) => order.vehicle_id).filter((id): id is string => Boolean(id))).size;
  const monthRevenue = total(monthPayments);

  const last7 = period.days.map((date, index) => {
    const next = index === period.days.length - 1 ? period.nextDay : period.days[index + 1]!;
    const value = payments
      .filter((payment) => inRange(payment.pago_em, date, next) && untilNow(payment))
      .reduce((sum, payment) => sum + Number(payment.valor), 0);
    return {
      dia: date.toLocaleDateString("pt-BR", {
        weekday: "short",
        timeZone: FINANCIAL_TIME_ZONE,
      }),
      valor: value,
    };
  });

  return {
    periodo: {
      titulo: new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
        timeZone: FINANCIAL_TIME_ZONE,
      }).format(now),
      inicio: period.startMonth.toISOString(),
      fim: period.nextMonth.toISOString(),
      geradoEm: now.toISOString(),
    },
    faturamentoDia: total(dayPayments),
    faturamentoSemana: total(weekPayments),
    faturamentoMes: monthRevenue,
    veiculosDia: distinctVehicles(dayOrders),
    veiculosMes: distinctVehicles(monthOrders),
    ticketMedio: monthPayments.length ? monthRevenue / monthPayments.length : 0,
    emAndamento: activeOrders,
    pagosOuEntregues: monthPayments.length,
    porMetodo: [...byMethod.entries()].map(([metodo, valor]) => ({ metodo, valor })),
    topServicos: [...services.entries()]
      .map(([nome, values]) => ({ nome, ...values }))
      .sort((a, b) => b.qtd - a.qtd || b.valor - a.valor)
      .slice(0, 5),
    last7,
  };
}
