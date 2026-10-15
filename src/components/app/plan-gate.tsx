import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { useSessionQuery } from "@/hooks/use-plan";
import { dateBR } from "@/lib/plate";
import { FEATURE_LABEL, PLANS, minimumPlanFor, type Feature } from "@/lib/plans";

export function SubscriptionBanner() {
  const { data } = useSessionQuery();
  const subscription = data?.subscription;
  if (!subscription) return null;

  let message: string | null = null;
  if (subscription.status === "TESTE") {
    const days = subscription.daysLeft ?? 0;
    message = `Teste grátis do plano Max: ${days === 1 ? "falta 1 dia" : `faltam ${days} dias`}.`;
  } else if (subscription.status === "TOLERANCIA") {
    message = `Seu plano ${PLANS[subscription.plan].nome} venceu. Regularize até ${dateBR(subscription.graceEndsAt)} para não voltar ao Grátis.`;
  } else if (subscription.status === "GRATIS") {
    const used = data?.usage?.ordersThisMonth ?? 0;
    message = `Plano Grátis: ${used} de ${subscription.monthlyOrderLimit} atendimentos usados este mês.`;
  } else if (subscription.daysLeft !== null && subscription.daysLeft <= 5) {
    message = `Seu plano ${PLANS[subscription.plan].nome} vence em ${dateBR(subscription.expiresAt)}.`;
  }
  if (!message) return null;

  const warning = subscription.status === "TOLERANCIA";
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b px-4 py-2 text-center text-[11px] ${
        warning
          ? "border-warning/40 bg-warning/15 text-warning"
          : "border-primary/30 bg-primary/10 text-primary"
      }`}
    >
      <span>{message}</span>
      <Link to="/planos" className="font-bold underline underline-offset-2">
        Ver planos
      </Link>
    </div>
  );
}

/** Card exibido no lugar de um recurso que o plano atual não inclui. */
export function UpgradeNotice({ feature, compact }: { feature: Feature; compact?: boolean }) {
  const plan = minimumPlanFor(feature);
  return (
    <div
      className={`border border-primary/40 bg-card text-center ${compact ? "p-4" : "p-8 md:p-12"}`}
    >
      <span className="mx-auto inline-flex size-11 items-center justify-center border border-primary/40 text-primary">
        <Lock className="size-5" />
      </span>
      <h2 className={`mt-4 font-bold ${compact ? "text-sm" : "text-xl"}`}>
        {FEATURE_LABEL[feature]}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
        Disponível a partir do plano <strong className="text-foreground">{plan.nome}</strong>.
      </p>
      <Link
        to="/planos"
        className="mt-5 inline-flex h-11 items-center gap-2 border border-primary bg-brand px-5 text-xs font-bold text-primary-foreground"
      >
        <Sparkles className="size-4" />
        CONHECER OS PLANOS
      </Link>
    </div>
  );
}
