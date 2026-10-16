// Financeiro do próprio LavaPro: o que entrou das assinaturas e o que está por vir.
import {
  lastMonths,
  METHOD_LABEL,
  monthKey,
  type PaymentMethod,
  type PaymentRecord,
} from "./billing";
import type { Company } from "./companies";

/** Pagamento com o nome da empresa, para listar no financeiro. */
export type FinancePayment = PaymentRecord & { tenantName: string };

export const FINANCE_PERIODS = ["mes", "mes-anterior", "3m", "12m"] as const;
export type FinancePeriod = (typeof FINANCE_PERIODS)[number];

export const PERIOD_LABEL: Record<FinancePeriod, string> = {
  mes: "Este mês",
  "mes-anterior": "Mês anterior",
  "3m": "Últimos 3 meses",
  "12m": "Últimos 12 meses",
};

export type Range = { start: Date; end: Date };

/** Intervalo do período [start, end) e o intervalo anterior, de mesmo tamanho, para comparar. */
export function financeRange(period: FinancePeriod, now = new Date()) {
  const y = now.getFullYear();
  const mo = now.getMonth();
  const month = (offset: number) => new Date(y, mo + offset, 1);
  const ranges: Record<FinancePeriod, { current: Range; previous: Range; compare: string }> = {
    mes: {
      current: { start: month(0), end: month(1) },
      previous: { start: month(-1), end: month(0) },
      compare: "em relação ao mês anterior",
    },
    "mes-anterior": {
      current: { start: month(-1), end: month(0) },
      previous: { start: month(-2), end: month(-1) },
      compare: "em relação ao mês antes dele",
    },
    "3m": {
      current: { start: month(-2), end: month(1) },
      previous: { start: month(-5), end: month(-2) },
      compare: "em relação aos 3 meses anteriores",
    },
    "12m": {
      current: { start: month(-11), end: month(1) },
      previous: { start: month(-23), end: month(-11) },
      compare: "em relação aos 12 meses anteriores",
    },
  };
  return ranges[period];
}

const inRange = (payment: PaymentRecord, range: Range) => {
  const time = new Date(payment.paid_at).getTime();
  return time >= range.start.getTime() && time < range.end.getTime();
};

const sum = (payments: PaymentRecord[]) =>
  Math.round(payments.reduce((total, payment) => total + Number(payment.amount), 0) * 100) / 100;

export type Breakdown = Array<{ key: string; label: string; valor: number; quantidade: number }>;

function breakdown(
  payments: PaymentRecord[],
  keyOf: (payment: PaymentRecord) => string,
  labelOf: (key: string) => string,
): Breakdown {
  const groups = new Map<string, PaymentRecord[]>();
  for (const payment of payments) {
    const key = keyOf(payment);
    groups.set(key, [...(groups.get(key) ?? []), payment]);
  }
  return [...groups.entries()]
    .map(([key, items]) => ({
      key,
      label: labelOf(key),
      valor: sum(items),
      quantidade: items.length,
    }))
    .sort((a, b) => b.valor - a.valor);
}

const PLAN_LABEL: Record<string, string> = {
  BASICO: "Básico",
  MAX: "Max",
  SEM_PLANO: "Sem plano informado",
};

export type Forecast = {
  company: Company;
  dueAt: string;
  /** Valor esperado: o último pagamento dividido pelos meses dele (mensalidade). */
  expected: number | null;
  overdue: boolean;
};

/**
 * Renovações esperadas: pagantes que vencem nos próximos `days` dias (ou já venceram
 * e estão na tolerância), com o valor mensal do último pagamento.
 */
export function forecast(
  companies: Company[],
  payments: PaymentRecord[],
  now = new Date(),
  days = 30,
): Forecast[] {
  const limit = now.getTime() + days * 86_400_000;
  const latest = new Map<string, PaymentRecord>();
  for (const payment of payments) {
    const current = latest.get(payment.tenant_id);
    if (!current || payment.paid_at > current.paid_at) latest.set(payment.tenant_id, payment);
  }
  return companies
    .filter((company) => {
      const { status, expiresAt } = company.subscription;
      if (status === "TOLERANCIA") return true;
      return status === "ATIVA" && !!expiresAt && new Date(expiresAt).getTime() <= limit;
    })
    .map((company) => {
      const last = latest.get(company.id);
      return {
        company,
        dueAt: company.subscription.expiresAt ?? "",
        expected: last ? Math.round((Number(last.amount) / (last.months || 1)) * 100) / 100 : null,
        overdue: company.subscription.status === "TOLERANCIA",
      };
    })
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export type FinanceSummary = {
  recebido: number;
  anterior: number;
  quantidade: number;
  ticketMedio: number | null;
  empresasPagantes: number;
  porForma: Breakdown;
  porPlano: Breakdown;
  porMes: Array<{ key: string; label: string; valor: number }>;
  pagamentos: FinancePayment[];
  aReceber: { total: number; semValor: number; itens: Forecast[] };
};

export function financeSummary(
  period: FinancePeriod,
  payments: FinancePayment[],
  companies: Company[],
  now = new Date(),
): FinanceSummary {
  const { current, previous } = financeRange(period, now);
  const inPeriod = payments
    .filter((payment) => inRange(payment, current))
    .sort((a, b) => b.paid_at.localeCompare(a.paid_at));
  const recebido = sum(inPeriod);
  const itens = forecast(companies, payments, now);
  return {
    recebido,
    anterior: sum(payments.filter((payment) => inRange(payment, previous))),
    quantidade: inPeriod.length,
    ticketMedio: inPeriod.length ? Math.round((recebido / inPeriod.length) * 100) / 100 : null,
    empresasPagantes: new Set(inPeriod.map((payment) => payment.tenant_id)).size,
    porForma: breakdown(
      inPeriod,
      (payment) => payment.method,
      (key) => METHOD_LABEL[key as PaymentMethod] ?? key,
    ),
    porPlano: breakdown(
      inPeriod,
      (payment) => payment.plan ?? "SEM_PLANO",
      (key) => PLAN_LABEL[key] ?? key,
    ),
    porMes: lastMonths(now, 12).map((month) => ({
      ...month,
      valor: sum(payments.filter((payment) => monthKey(new Date(payment.paid_at)) === month.key)),
    })),
    pagamentos: inPeriod,
    aReceber: {
      total: Math.round(itens.reduce((total, item) => total + (item.expected ?? 0), 0) * 100) / 100,
      semValor: itens.filter((item) => item.expected === null).length,
      itens,
    },
  };
}

/** Planilha (CSV com ;) dos pagamentos, no formato que o Excel brasileiro abre direto. */
export function paymentsCsv(payments: FinancePayment[]): string {
  const cell = (value: string) => (/[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const rows = payments.map((payment) =>
    [
      new Date(payment.paid_at).toLocaleDateString("pt-BR"),
      payment.tenantName,
      Number(payment.amount).toFixed(2).replace(".", ","),
      METHOD_LABEL[payment.method as PaymentMethod] ?? payment.method,
      payment.plan ? (PLAN_LABEL[payment.plan] ?? payment.plan) : "",
      payment.months ? String(payment.months) : "",
      payment.note ?? "",
      payment.admin_email ?? "",
    ]
      .map(cell)
      .join(";"),
  );
  return ["Data;Empresa;Valor (R$);Forma;Plano;Meses;Observação;Registrado por", ...rows].join(
    "\n",
  );
}
