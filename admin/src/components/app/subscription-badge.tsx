import { PLANS, type Subscription } from "@core/lib/plans";

const STYLE: Record<Subscription["status"], string> = {
  TESTE: "border-primary/40 bg-primary/10 text-primary",
  ATIVA: "border-success/40 bg-success/10 text-success",
  TOLERANCIA: "border-warning/50 bg-warning/10 text-warning",
  GRATIS: "border-border bg-secondary text-muted-foreground",
};

const LABEL: Record<Subscription["status"], string> = {
  TESTE: "Teste",
  ATIVA: "Ativa",
  TOLERANCIA: "Vencida",
  GRATIS: "Grátis",
};

/** Situação + plano em vigor, ex.: "Ativa · Max". */
export function SubscriptionBadge({ subscription }: { subscription: Subscription }) {
  const plan = PLANS[subscription.effectivePlan].nome;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STYLE[subscription.status]}`}
    >
      {LABEL[subscription.status]}
      {subscription.status !== "GRATIS" && <span className="opacity-80">· {plan}</span>}
    </span>
  );
}

export function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "—";
}

/** Texto do vencimento: data e quanto falta. */
export function expiryText(subscription: Subscription): string {
  if (subscription.status === "TESTE") {
    return `Teste até ${formatDate(subscription.trialEndsAt)} (${subscription.daysLeft ?? 0}d)`;
  }
  if (subscription.status === "ATIVA") {
    return `${formatDate(subscription.expiresAt)} (${subscription.daysLeft ?? 0}d)`;
  }
  if (subscription.status === "TOLERANCIA") {
    return `Venceu ${formatDate(subscription.expiresAt)} · cai ao Grátis ${formatDate(subscription.graceEndsAt)}`;
  }
  return "—";
}
