import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { useSessionQuery } from "@/hooks/use-plan";
import { dateBR } from "@/lib/plate";
import {
  PLAN_IDS,
  PLANS,
  TRIAL_DAYS,
  salesWhatsappLink,
  type PlanId,
  type Subscription,
} from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/planos")({
  head: () => ({
    meta: [
      { title: "Planos — LavaPro" },
      { name: "description", content: "Plano atual e opções de assinatura do LavaPro." },
    ],
  }),
  component: PlansPage,
});

const STATUS_LABEL: Record<Subscription["status"], string> = {
  TESTE: "Em teste grátis",
  ATIVA: "Ativa",
  TOLERANCIA: "Vencida (em tolerância)",
  GRATIS: "Plano Grátis",
};

function PlansPage() {
  const sessionQuery = useSessionQuery();
  const subscription = sessionQuery.data?.subscription ?? null;
  const tenantName = sessionQuery.data?.tenant?.nome ?? "meu lava-jato";
  const usage = sessionQuery.data?.usage?.ordersThisMonth ?? null;

  return (
    <AppShell title="Planos" back="/home" wide>
      <div className="border-b border-border/60 pb-6">
        <p className="text-xs font-semibold text-primary">Assinatura</p>
        <h1 className="mt-2 text-[clamp(2rem,7vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.06em]">
          Planos do LavaPro
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Toda empresa nova começa com {TRIAL_DAYS} dias de teste do plano Max. Depois, escolha o
          plano que faz sentido para o seu pátio. Se não assinar, a conta continua no Grátis, sem
          perder nenhum dado.
        </p>
      </div>

      {subscription && (
        <section className="mt-6 grid gap-4 border border-border bg-card p-5 md:grid-cols-4 md:p-6">
          <Info label="Situação" value={STATUS_LABEL[subscription.status]} />
          <Info label="Plano em uso" value={PLANS[subscription.effectivePlan].nome} />
          <Info
            label={subscription.status === "TESTE" ? "Teste até" : "Válido até"}
            value={
              subscription.status === "TESTE"
                ? dateBR(subscription.trialEndsAt)
                : subscription.expiresAt
                  ? dateBR(subscription.expiresAt)
                  : "-"
            }
          />
          <Info
            label="Atendimentos no mês"
            value={
              subscription.monthlyOrderLimit === null
                ? "Ilimitados"
                : `${usage ?? 0} de ${subscription.monthlyOrderLimit}`
            }
          />
        </section>
      )}

      <section className="reveal-stagger mt-6 grid gap-4 lg:grid-cols-3">
        {PLAN_IDS.map((id) => (
          <PlanCard
            key={id}
            id={id}
            current={subscription?.effectivePlan === id && subscription.status !== "TESTE"}
            tenantName={tenantName}
          />
        ))}
      </section>

      <p className="mt-6 text-xs leading-5 text-muted-foreground">
        A liberação do plano é feita pela equipe LavaPro após a confirmação do pagamento.
      </p>
    </AppShell>
  );
}

function PlanCard({
  id,
  current,
  tenantName,
}: {
  id: PlanId;
  current: boolean;
  tenantName: string;
}) {
  const plan = PLANS[id];
  const whatsapp =
    id === "GRATIS"
      ? null
      : salesWhatsappLink(
          current
            ? `Olá! Quero renovar o plano ${plan.nome} do LavaPro para ${tenantName}.`
            : `Olá! Quero assinar o plano ${plan.nome} do LavaPro para ${tenantName}.`,
        );

  return (
    <article
      className={`relative flex flex-col border bg-card p-6 ${
        plan.destaque ? "border-primary shadow-glow" : "border-border"
      }`}
    >
      {current && (
        <span className="absolute -top-3 left-6 bg-brand px-2 py-1 text-[10px] font-bold text-primary-foreground">
          SEU PLANO
        </span>
      )}
      <div className="flex items-center gap-2">
        {id === "MAX" && <Crown className="size-5 text-primary" />}
        <h2 className="text-2xl font-bold tracking-[-0.04em]">{plan.nome}</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{plan.descricao}</p>
      <p className="mt-5 text-3xl font-bold text-primary">
        {plan.preco ?? "Sob consulta"}
        {plan.preco && id !== "GRATIS" && (
          <span className="text-sm font-normal text-muted-foreground">/mês</span>
        )}
      </p>
      <ul className="mt-5 grid gap-2.5 text-sm text-muted-foreground">
        {plan.itens.map((item) => (
          <li key={item} className="flex gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        {id === "GRATIS" ? (
          <p className="text-center text-xs text-muted-foreground">
            Sem custo. Ativado automaticamente quando não há assinatura.
          </p>
        ) : whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 border border-primary bg-brand text-sm font-bold text-primary-foreground"
          >
            <MessageCircle className="size-4" />
            {current ? "RENOVAR PELO WHATSAPP" : "ASSINAR PELO WHATSAPP"}
          </a>
        ) : (
          <p className="border border-border p-3 text-center text-xs leading-5 text-muted-foreground">
            Para assinar o plano {plan.nome}, fale com a equipe LavaPro.
          </p>
        )}
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
