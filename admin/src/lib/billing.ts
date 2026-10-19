import { TRIAL_DAYS } from "@core/lib/plans";
import { isExpiringSoon, type Company } from "./companies";

export const PAYMENT_METHODS = [
  "PIX",
  "BOLETO",
  "CARTAO",
  "DINHEIRO",
  "TRANSFERENCIA",
  "OUTRO",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX: "PIX",
  BOLETO: "Boleto",
  CARTAO: "Cartão",
  DINHEIRO: "Dinheiro",
  TRANSFERENCIA: "Transferência",
  OUTRO: "Outro",
};

/** Pagamento de assinatura registrado pela equipe. */
export type PaymentRecord = {
  id: string;
  tenant_id: string;
  amount: number;
  method: string;
  paid_at: string;
  plan: string | null;
  months: number | null;
  note: string | null;
  admin_email: string | null;
  created_at: string;
};

export type NoteRecord = {
  id: string;
  tenant_id: string;
  body: string;
  admin_email: string | null;
  created_at: string;
};

export type PaymentInput = {
  amount: number;
  method: PaymentMethod;
  /** yyyy-mm-dd */
  paidOn: string;
  note: string;
  /** Ativa/renova o plano junto com o pagamento. */
  activate: { plan: "BASICO" | "MAX"; months: 1 | 3 | 6 | 12 } | null;
};

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

/** Valida e normaliza o pagamento; data no meio do dia evita troca de dia por fuso. */
export function validatePayment(input: PaymentInput, now = new Date()) {
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000) {
    throw new Error("Informe um valor válido.");
  }
  if (!(PAYMENT_METHODS as readonly string[]).includes(input.method)) {
    throw new Error("Escolha a forma de pagamento.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paidOn)) throw new Error("Informe a data do pagamento.");
  const paidAt = new Date(`${input.paidOn}T12:00:00`);
  if (Number.isNaN(paidAt.getTime())) throw new Error("Informe a data do pagamento.");
  if (paidAt.getTime() > now.getTime() + 86_400_000) {
    throw new Error("A data do pagamento não pode ser no futuro.");
  }
  const note = input.note.trim();
  if (note.length > 300) throw new Error("A observação deve ter no máximo 300 caracteres.");
  if (
    input.activate &&
    !(
      (input.activate.plan === "BASICO" || input.activate.plan === "MAX") &&
      [1, 3, 6, 12].includes(input.activate.months)
    )
  ) {
    throw new Error("Plano ou duração inválidos.");
  }
  return {
    amount,
    method: input.method,
    paidAt: paidAt.toISOString(),
    note: note || null,
    activate: input.activate,
  };
}

/** Motivo automático do histórico quando o plano é ativado pelo pagamento. */
export function paymentReason(amount: number, method: PaymentMethod, note: string | null) {
  return `Pagamento registrado: ${formatMoney(amount)} (${METHOD_LABEL[method]})${note ? ` — ${note}` : ""}`;
}

export function validateNote(body: string): string {
  const clean = body.trim();
  if (!clean) throw new Error("Escreva a nota.");
  if (clean.length > 1000) throw new Error("A nota deve ter no máximo 1000 caracteres.");
  return clean;
}

// ---------------------------------------------------------------------------
// Números do negócio
// ---------------------------------------------------------------------------

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function lastMonths(now: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return {
      key: monthKey(date),
      label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    };
  });
}

export type BusinessMetrics = {
  receitaMes: number;
  receitaMesAnterior: number;
  mrr: number;
  pagantesSemPagamento: number;
  testesAtivos: number;
  pagantes: { BASICO: number; MAX: number };
  vencendo: number;
  conversao: { taxa: number | null; convertidas: number; avaliadas: number };
  receitaPorMes: Array<{ key: string; label: string; valor: number }>;
  novasPorMes: Array<{ key: string; label: string; valor: number }>;
};

/**
 * Números para a visão geral.
 * - MRR: soma, para cada empresa pagante, do último pagamento dividido pelos meses pagos.
 * - Conversão: empresas criadas há TRIAL_DAYS a 90 dias (teste já terminou) que já pagaram ou
 *   tiveram plano ativado, sobre o total dessas empresas.
 */
export function businessMetrics(
  companies: Company[],
  payments: PaymentRecord[],
  activatedTenantIds: Set<string>,
  now = new Date(),
): BusinessMetrics {
  const thisMonth = monthKey(now);
  const previousMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const sumMonth = (key: string) =>
    payments
      .filter((payment) => monthKey(new Date(payment.paid_at)) === key)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const latestByTenant = new Map<string, PaymentRecord>();
  for (const payment of payments) {
    const current = latestByTenant.get(payment.tenant_id);
    if (!current || payment.paid_at > current.paid_at)
      latestByTenant.set(payment.tenant_id, payment);
  }

  const paying = companies.filter(
    (company) =>
      company.subscription.status === "ATIVA" || company.subscription.status === "TOLERANCIA",
  );
  let mrr = 0;
  let semPagamento = 0;
  for (const company of paying) {
    const last = latestByTenant.get(company.id);
    if (last && last.months) mrr += Number(last.amount) / last.months;
    else semPagamento++;
  }

  const day = 86_400_000;
  const cohort = companies.filter((company) => {
    const age = now.getTime() - new Date(company.created_at).getTime();
    return age >= TRIAL_DAYS * day && age <= 90 * day;
  });
  const paidTenants = new Set(payments.map((payment) => payment.tenant_id));
  const converted = cohort.filter(
    (company) => paidTenants.has(company.id) || activatedTenantIds.has(company.id),
  ).length;

  const months = lastMonths(now, 6);
  return {
    receitaMes: sumMonth(thisMonth),
    receitaMesAnterior: sumMonth(previousMonth),
    mrr: Math.round(mrr * 100) / 100,
    pagantesSemPagamento: semPagamento,
    testesAtivos: companies.filter((company) => company.subscription.status === "TESTE").length,
    pagantes: {
      BASICO: paying.filter((company) => company.subscription.effectivePlan === "BASICO").length,
      MAX: paying.filter((company) => company.subscription.effectivePlan === "MAX").length,
    },
    vencendo: companies.filter((company) => isExpiringSoon(company.subscription)).length,
    conversao: {
      taxa: cohort.length ? converted / cohort.length : null,
      convertidas: converted,
      avaliadas: cohort.length,
    },
    receitaPorMes: months.map((month) => ({ ...month, valor: sumMonth(month.key) })),
    novasPorMes: months.map((month) => ({
      ...month,
      valor: companies.filter((company) => monthKey(new Date(company.created_at)) === month.key)
        .length,
    })),
  };
}
