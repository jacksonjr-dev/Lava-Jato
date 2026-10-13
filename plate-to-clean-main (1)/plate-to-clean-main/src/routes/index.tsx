import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Car, ChartNoAxesCombined, CircleUserRound, Wrench } from "lucide-react";
import { WashBrand } from "@/components/app/wash-brand";
import { WashHoseBackdrop } from "@/components/app/wash-hose-backdrop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LavaPro — Operação e acompanhamento do seu lava-jato" },
      {
        name: "description",
        content:
          "Gestão do lava-jato para o proprietário e acompanhamento de serviços para o cliente.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen min-h-dvh bg-hero">
      <WashHoseBackdrop />
      <header className="wash-header border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <WashBrand />
          <p className="text-[10px] tracking-[0.18em] text-muted-foreground">GESTÃO DE LAVA-JATO</p>
        </div>
      </header>

      <main className="page-enter mx-auto max-w-6xl px-5 py-10 md:py-16">
        <div className="grid items-end gap-8 border-b border-border/60 pb-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold text-primary">Gestão e acompanhamento</p>
            <h1 className="mt-4 max-w-3xl text-[clamp(2.75rem,12vw,6rem)] font-bold leading-[0.9] tracking-[-0.075em]">
              Do pátio até a entrega.
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground md:justify-self-end">
            O proprietário controla atendimento e caixa. O cliente acompanha o próprio veículo em
            tempo real, usando apenas placa e telefone.
          </p>
        </div>

        <section className="reveal-stagger mt-6 grid gap-6 md:grid-cols-2">
          <AccessCard
            index="01"
            icon={<ChartNoAxesCombined className="size-8" strokeWidth={1.5} />}
            eyebrow="PROPRIETÁRIO"
            title="Controle sua operação."
            description="Atendimentos, status dos veículos, pagamentos, indicadores e visão financeira em um só painel."
            to="/auth"
            action="ENTRAR NA GESTÃO"
          />
          <AccessCard
            index="02"
            icon={<CircleUserRound className="size-8" strokeWidth={1.5} />}
            eyebrow="CLIENTE"
            title="Acompanhe seu carro."
            description="Consulte o andamento do serviço, o valor e todo o histórico do veículo com placa e telefone."
            to="/cliente"
            action="ACESSAR COMO CLIENTE"
            secondary
          />
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Feature icon={<Car className="size-4" />} label="VEÍCULO IDENTIFICADO PELA PLACA" />
          <Feature icon={<Wrench className="size-4" />} label="STATUS DO SERVIÇO EM ETAPAS" />
          <Feature
            icon={<ChartNoAxesCombined className="size-4" />}
            label="FATURAMENTO E DESEMPENHO"
          />
        </section>
      </main>
    </div>
  );
}

function AccessCard({
  index,
  icon,
  eyebrow,
  title,
  description,
  to,
  action,
  secondary,
}: {
  index: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  to: "/auth" | "/cliente";
  action: string;
  secondary?: boolean;
}) {
  return (
    <article className="interactive-panel group border border-border bg-card p-6 md:p-9">
      <div className="flex items-start justify-between text-primary">
        {icon}
        <span className="text-xs tabular-nums text-muted-foreground">{index} / 02</span>
      </div>
      <p className="mt-10 text-xs font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-[-0.055em] md:text-4xl">{title}</h2>
      <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
      <Link
        to={to}
        className={`mt-9 flex h-14 items-center justify-between border px-4 text-sm font-bold transition-colors ${
          secondary
            ? "border-border bg-secondary text-secondary-foreground hover:border-primary/50 hover:text-primary"
            : "border-primary bg-brand text-primary-foreground shadow-glow"
        }`}
      >
        {action}
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
      </Link>
    </article>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="interactive-panel flex items-center gap-3 border border-border bg-card p-4 text-[10px] text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}
