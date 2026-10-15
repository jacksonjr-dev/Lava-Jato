/**
 * Planos e assinatura do LavaPro: fonte única de verdade para o servidor, as
 * telas e a página de apresentação.
 *
 * O banco repete apenas TRIAL_DAYS, GRACE_DAYS e FREE_MONTHLY_ORDER_LIMIT
 * (migration 20261015140000_subscription_plans.sql); o teste
 * plans.test.ts falha se os valores divergirem.
 */

export const PLAN_IDS = ["GRATIS", "BASICO", "MAX"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const FEATURES = ["area_cliente", "pix", "financeiro", "exportacao", "placa_foto"] as const;
export type Feature = (typeof FEATURES)[number];

export const TRIAL_DAYS = 7;
export const GRACE_DAYS = 3;
export const FREE_MONTHLY_ORDER_LIMIT = 30;

/** WhatsApp de vendas (somente dígitos, com DDI e DDD). Vazio esconde o botão. */
export const SALES_WHATSAPP = "";

export const FEATURE_LABEL: Record<Feature, string> = {
  area_cliente: "Área do cliente",
  pix: "Cobrança PIX com QR Code",
  financeiro: "Painel financeiro",
  exportacao: "Exportação do financeiro em PDF e Excel",
  placa_foto: "Leitura da placa pela foto",
};

export type PlanDefinition = {
  id: PlanId;
  nome: string;
  descricao: string;
  /** Ex.: "R$ 79". null exibe "Sob consulta". */
  preco: string | null;
  destaque?: boolean;
  features: Feature[];
  limiteMensalAtendimentos: number | null;
  itens: string[];
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  GRATIS: {
    id: "GRATIS",
    nome: "Grátis",
    descricao: "Para organizar o pátio sem custo.",
    preco: "R$ 0",
    features: [],
    limiteMensalAtendimentos: FREE_MONTHLY_ORDER_LIMIT,
    itens: [
      `Até ${FREE_MONTHLY_ORDER_LIMIT} atendimentos por mês`,
      "Atendimento pela placa",
      "Ordens de serviço com status",
      "Catálogo de serviços e veículos",
    ],
  },
  BASICO: {
    id: "BASICO",
    nome: "Básico",
    descricao: "Para lava-jatos com movimento diário.",
    preco: null,
    destaque: true,
    features: ["area_cliente", "pix", "financeiro"],
    limiteMensalAtendimentos: null,
    itens: [
      "Atendimentos ilimitados",
      "Área do cliente com status em tempo real",
      "Cobrança PIX com QR Code",
      "Painel financeiro completo",
    ],
  },
  MAX: {
    id: "MAX",
    nome: "Max",
    descricao: "Para quem quer agilidade máxima no pátio.",
    preco: null,
    features: ["area_cliente", "pix", "financeiro", "exportacao", "placa_foto"],
    limiteMensalAtendimentos: null,
    itens: [
      "Tudo do Básico",
      "Leitura da placa pela foto",
      "Exportação do financeiro em PDF e Excel",
    ],
  },
};

export type SubscriptionStatus = "TESTE" | "ATIVA" | "TOLERANCIA" | "GRATIS";

export type SubscriptionFields = {
  plan?: string | null;
  trial_ends_at?: string | null;
  plan_expires_at?: string | null;
};

export type Subscription = {
  /** Plano contratado. */
  plan: PlanId;
  /** Plano em vigor agora (teste dá Max; plano vencido volta ao Grátis). */
  effectivePlan: PlanId;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  expiresAt: string | null;
  /** Fim da tolerância, quando o plano pago já venceu. */
  graceEndsAt: string | null;
  /** Dias até o fim do teste ou do período pago (null no Grátis). */
  daysLeft: number | null;
  features: Feature[];
  monthlyOrderLimit: number | null;
};

const DAY_MS = 86_400_000;

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(target: Date, now: Date): number {
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / DAY_MS));
}

export function resolveSubscription(
  fields: SubscriptionFields | null | undefined,
  now = new Date(),
): Subscription {
  const plan = isPlanId(fields?.plan) ? fields.plan : "GRATIS";
  const trialEnds = parseDate(fields?.trial_ends_at);
  const expires = parseDate(fields?.plan_expires_at);
  const graceEnds = expires ? new Date(expires.getTime() + GRACE_DAYS * DAY_MS) : null;

  let status: SubscriptionStatus = "GRATIS";
  let effectivePlan: PlanId = "GRATIS";
  let daysLeft: number | null = null;

  if (trialEnds && trialEnds > now) {
    status = "TESTE";
    effectivePlan = "MAX";
    daysLeft = daysUntil(trialEnds, now);
  } else if (plan !== "GRATIS" && expires && expires > now) {
    status = "ATIVA";
    effectivePlan = plan;
    daysLeft = daysUntil(expires, now);
  } else if (plan !== "GRATIS" && graceEnds && graceEnds > now) {
    status = "TOLERANCIA";
    effectivePlan = plan;
    daysLeft = 0;
  }

  const definition = PLANS[effectivePlan];
  return {
    plan,
    effectivePlan,
    status,
    trialEndsAt: trialEnds?.toISOString() ?? null,
    expiresAt: expires?.toISOString() ?? null,
    graceEndsAt: status === "TOLERANCIA" && graceEnds ? graceEnds.toISOString() : null,
    daysLeft,
    features: [...definition.features],
    monthlyOrderLimit: definition.limiteMensalAtendimentos,
  };
}

export function hasFeature(subscription: Subscription, feature: Feature): boolean {
  return subscription.features.includes(feature);
}

/** Menor plano que libera o recurso. */
export function minimumPlanFor(feature: Feature): PlanDefinition {
  return PLAN_IDS.map((id) => PLANS[id]).find((plan) => plan.features.includes(feature))!;
}

export function assertFeature(subscription: Subscription, feature: Feature): void {
  if (hasFeature(subscription, feature)) return;
  throw new Error(
    `${FEATURE_LABEL[feature]} está disponível a partir do plano ${minimumPlanFor(feature).nome}.`,
  );
}

export function salesWhatsappLink(message: string): string | null {
  if (!SALES_WHATSAPP) return null;
  return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export type AdminSubscriptionAction =
  | { action: "ATIVAR"; plan: "BASICO" | "MAX"; days: number }
  | { action: "ESTENDER_TESTE"; days: number }
  | { action: "GRATIS" };

/** Calcula os novos campos de assinatura a partir da ação do administrador. */
export function applyAdminSubscriptionAction(
  current: SubscriptionFields,
  change: AdminSubscriptionAction,
  now = new Date(),
): { plan: PlanId; trial_ends_at: string | null; plan_expires_at: string | null } {
  const plan = isPlanId(current.plan) ? current.plan : "GRATIS";
  if (change.action === "GRATIS") {
    return { plan: "GRATIS", trial_ends_at: null, plan_expires_at: null };
  }
  if (!Number.isInteger(change.days) || change.days < 1 || change.days > 400) {
    throw new Error("Informe uma quantidade de dias entre 1 e 400.");
  }
  const addDays = (from: Date) => new Date(from.getTime() + change.days * 86_400_000);
  const trialEnds = current.trial_ends_at ? new Date(current.trial_ends_at) : null;
  if (change.action === "ESTENDER_TESTE") {
    const base = trialEnds && trialEnds > now ? trialEnds : now;
    return {
      plan,
      trial_ends_at: addDays(base).toISOString(),
      plan_expires_at: current.plan_expires_at ?? null,
    };
  }
  if (change.plan !== "BASICO" && change.plan !== "MAX") throw new Error("Plano inválido.");
  // Renovação do mesmo plano soma ao período vigente; troca de plano começa hoje.
  const currentExpiry = current.plan_expires_at ? new Date(current.plan_expires_at) : null;
  const base = plan === change.plan && currentExpiry && currentExpiry > now ? currentExpiry : now;
  return { plan: change.plan, trial_ends_at: null, plan_expires_at: addDays(base).toISOString() };
}
