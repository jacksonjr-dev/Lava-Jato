import {
  PLANS,
  applyAdminSubscriptionAction,
  resolveSubscription,
  type AdminSubscriptionAction,
  type PlanId,
  type Subscription,
  type SubscriptionFields,
} from "@core/lib/plans";
import type { NoteRecord, PaymentRecord } from "./billing";

/** Empresa (lava-jato) como o painel enxerga: dados, dono e uso do mês. */
export type CompanyRow = {
  id: string;
  nome: string;
  slug: string;
  telefone: string | null;
  logo_url: string | null;
  created_at: string;
  ownerEmail: string | null;
  plan: string;
  trial_ends_at: string | null;
  plan_expires_at: string | null;
  ordersThisMonth: number;
};

export type Company = CompanyRow & { subscription: Subscription };

export type SubscriptionEvent = {
  id: string;
  action: string;
  from_plan: string | null;
  to_plan: string | null;
  to_trial_ends_at: string | null;
  to_expires_at: string | null;
  reason: string;
  admin_email: string | null;
  created_at: string;
};

export type CompanyDetail = Company & {
  members: number;
  ordersTotal: number;
  events: SubscriptionEvent[];
  payments: PaymentRecord[];
  notes: NoteRecord[];
};

export function withSubscription<T extends SubscriptionFields>(row: T, now = new Date()) {
  return { ...row, subscription: resolveSubscription(row, now) };
}

export const STATUS_FILTERS = [
  "todas",
  "TESTE",
  "ATIVA",
  "TOLERANCIA",
  "GRATIS",
  "vencendo",
] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const STATUS_LABEL: Record<StatusFilter, string> = {
  todas: "Todas",
  TESTE: "Em teste",
  ATIVA: "Ativas",
  TOLERANCIA: "Vencidas",
  GRATIS: "Grátis",
  vencendo: "Vencendo em 7 dias",
};

/** Teste ou plano pago que termina em até 7 dias (quem precisa de contato). */
export function isExpiringSoon(subscription: Subscription): boolean {
  return (
    (subscription.status === "TESTE" || subscription.status === "ATIVA") &&
    subscription.daysLeft !== null &&
    subscription.daysLeft <= 7
  );
}

function fold(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function filterCompanies(
  companies: Company[],
  filters: { q?: string; status?: StatusFilter; plan?: PlanId | "todos" },
): Company[] {
  const terms = fold(filters.q ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return companies.filter((company) => {
    const text = fold(
      [company.nome, company.slug, company.ownerEmail ?? "", company.telefone ?? ""].join(" "),
    );
    if (!terms.every((term) => text.includes(term))) return false;
    const status = filters.status ?? "todas";
    if (status === "vencendo" && !isExpiringSoon(company.subscription)) return false;
    if (status !== "todas" && status !== "vencendo" && company.subscription.status !== status) {
      return false;
    }
    if (
      filters.plan &&
      filters.plan !== "todos" &&
      company.subscription.effectivePlan !== filters.plan
    ) {
      return false;
    }
    return true;
  });
}

/** Contagem por situação, para os números no topo da lista. */
export function summarize(companies: Company[]) {
  const count = (predicate: (company: Company) => boolean) => companies.filter(predicate).length;
  return {
    total: companies.length,
    teste: count((c) => c.subscription.status === "TESTE"),
    pagas: count(
      (c) => c.subscription.status === "ATIVA" || c.subscription.status === "TOLERANCIA",
    ),
    vencidas: count((c) => c.subscription.status === "TOLERANCIA"),
    gratis: count((c) => c.subscription.status === "GRATIS"),
    vencendo: count((c) => isExpiringSoon(c.subscription)),
    porPlano: {
      BASICO: count(
        (c) => c.subscription.status !== "TESTE" && c.subscription.effectivePlan === "BASICO",
      ),
      MAX: count(
        (c) => c.subscription.status !== "TESTE" && c.subscription.effectivePlan === "MAX",
      ),
    },
  };
}

/** Ação do painel: o administrador escolhe o plano e a duração em meses. */
export type PanelAction =
  | { action: "ATIVAR"; plan: "BASICO" | "MAX"; months: 1 | 3 | 6 | 12 }
  | { action: "ESTENDER_TESTE"; days: 7 | 14 }
  | { action: "GRATIS" };

export function toSubscriptionAction(action: PanelAction): AdminSubscriptionAction {
  if (action.action === "ATIVAR") {
    return { action: "ATIVAR", plan: action.plan, days: action.months * 30 };
  }
  if (action.action === "ESTENDER_TESTE") return { action: "ESTENDER_TESTE", days: action.days };
  return { action: "GRATIS" };
}

/** Valida a ação e calcula a nova assinatura (o motivo é obrigatório). */
export function planChange(
  current: SubscriptionFields,
  action: PanelAction,
  reason: string,
  now = new Date(),
) {
  const cleanReason = reason.trim();
  if (cleanReason.length < 3) throw new Error("Informe o motivo da alteração.");
  if (cleanReason.length > 300) throw new Error("O motivo deve ter no máximo 300 caracteres.");
  const next = applyAdminSubscriptionAction(current, toSubscriptionAction(action), now);
  return { next, reason: cleanReason };
}

/** Descrição curta de uma ação do histórico. */
export function describeEvent(event: SubscriptionEvent): string {
  if (event.action === "GRATIS") return "Voltou ao Grátis";
  if (event.action === "ESTENDER_TESTE") return "Teste estendido";
  const plan =
    event.to_plan && event.to_plan in PLANS ? PLANS[event.to_plan as PlanId].nome : event.to_plan;
  return event.from_plan === event.to_plan ? `Renovou ${plan}` : `Ativou ${plan}`;
}
