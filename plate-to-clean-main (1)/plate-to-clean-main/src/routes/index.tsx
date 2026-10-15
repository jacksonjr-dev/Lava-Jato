import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Car,
  ChartNoAxesCombined,
  Check,
  Clock,
  FileSpreadsheet,
  Menu,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { WashBrand } from "@/components/app/wash-brand";
import { WashHoseBackdrop } from "@/components/app/wash-hose-backdrop";
import { PLAN_IDS, PLANS, TRIAL_DAYS } from "@/lib/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LavaPro — Sistema de gestão para lava-jato" },
      {
        name: "description",
        content:
          "Atendimento pela placa, ordens de serviço, PIX, financeiro e acompanhamento em tempo real para o cliente. Tudo em um só sistema para o seu lava-jato.",
      },
      { property: "og:title", content: "LavaPro — Sistema de gestão para lava-jato" },
      {
        property: "og:description",
        content:
          "Do pátio até a entrega: organize o atendimento, o caixa e a experiência do cliente.",
      },
    ],
  }),
  component: Landing,
});

const NAV_LINKS = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#cliente", label: "Para o cliente" },
  { href: "#planos", label: "Planos" },
  { href: "#duvidas", label: "Dúvidas" },
];

function Landing() {
  return (
    <div className="min-h-screen min-h-dvh bg-hero text-foreground">
      <WashHoseBackdrop />
      <SiteHeader />
      <main className="page-enter">
        <Hero />
        <Audiences />
        <Features />
        <HowItWorks />
        <ClientArea />
        <Finance />
        <Security />
        <Plans />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="wash-header sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <a href="#inicio" aria-label="LavaPro — início">
          <WashBrand />
        </a>
        <nav className="hidden items-center gap-6 text-xs text-muted-foreground lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/cliente"
            className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            Área do cliente
          </Link>
          <Link
            to="/auth"
            className="border border-border px-3 py-2 text-xs font-semibold hover:border-primary/60 hover:text-primary"
          >
            Entrar
          </Link>
          <Link
            to="/auth"
            search={{ modo: "cadastro" }}
            className="border border-primary bg-brand px-3 py-2 text-xs font-bold text-primary-foreground shadow-glow"
          >
            Criar conta
          </Link>
        </div>
        <button
          type="button"
          className="border border-border p-2 lg:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-border/60 bg-background px-5 py-4 lg:hidden">
          <div className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm text-muted-foreground hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            <Link
              to="/auth"
              search={{ modo: "cadastro" }}
              className="border border-primary bg-brand px-4 py-3 text-center text-sm font-bold text-primary-foreground"
            >
              Criar conta
            </Link>
            <Link to="/auth" className="border border-border px-4 py-3 text-center text-sm">
              Entrar
            </Link>
            <Link to="/cliente" className="px-4 py-2 text-center text-sm text-muted-foreground">
              Área do cliente
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="inicio" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-12 pt-12 md:pt-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold text-primary">SISTEMA DE GESTÃO PARA LAVA-JATO</p>
          <h1 className="mt-4 text-[clamp(2.5rem,9vw,5rem)] font-bold leading-[0.95] tracking-[-0.06em]">
            Do pátio até a entrega, sem papel e sem planilha.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
            Abra o atendimento pela placa, acompanhe cada carro por etapa, receba no PIX e veja o
            faturamento do dia. O seu cliente acompanha o serviço pelo celular, sem instalar nada.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth"
              search={{ modo: "cadastro" }}
              className="group inline-flex h-14 items-center justify-between gap-6 border border-primary bg-brand px-5 text-sm font-bold text-primary-foreground shadow-glow"
            >
              COMEÇAR AGORA
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex h-14 items-center justify-center border border-border bg-secondary px-5 text-sm font-bold text-secondary-foreground hover:border-primary/50 hover:text-primary"
            >
              VER COMO FUNCIONA
            </a>
          </div>
        </div>
        <OrderMockup />
      </div>

      <dl className="reveal-stagger mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value="1 placa" label="identifica carro, cliente e histórico" />
        <Stat value="5 etapas" label="do carro aguardando até a entrega" />
        <Stat value="PIX" label="QR Code gerado com o valor da OS" />
        <Stat value="0 apps" label="para o cliente instalar" />
      </dl>
    </section>
  );
}

function OrderMockup() {
  const steps = ["Aguardando", "Em serviço", "Pronto", "Pago", "Entregue"];
  return (
    <div className="interactive-panel relative border border-border bg-card p-5 shadow-glow md:p-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[0.18em] text-muted-foreground">OS #1042</span>
        <span className="border border-primary/40 px-2 py-1 text-[10px] font-semibold text-primary">
          EM SERVIÇO
        </span>
      </div>
      <p className="plate mt-5 inline-block border-2 border-foreground/80 bg-foreground px-4 py-2 text-2xl font-bold tracking-[0.12em] text-background">
        ABC1D23
      </p>
      <p className="mt-3 text-sm text-muted-foreground">Onix prata · Carlos Souza</p>

      <ol className="mt-6 grid grid-cols-5 gap-1.5" aria-label="Etapas do atendimento">
        {steps.map((step, index) => (
          <li key={step}>
            <span
              className={`block h-1.5 ${index <= 1 ? "bg-primary" : "bg-muted"}`}
              aria-hidden="true"
            />
            <span
              className={`mt-2 block text-[9px] leading-tight ${
                index === 1 ? "font-semibold text-primary" : "text-muted-foreground"
              }`}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-6 space-y-2 border-t border-border/60 pt-4 text-sm">
        <MockRow label="Lavagem completa" value="R$ 60,00" />
        <MockRow label="Enceramento" value="R$ 80,00" />
        <MockRow label="Total" value="R$ 140,00" strong />
      </div>

      <div className="mt-5 flex items-center gap-3 border border-border/70 bg-background/60 p-3">
        <QrCode className="size-9 shrink-0 text-primary" strokeWidth={1.5} />
        <p className="text-xs leading-5 text-muted-foreground">
          PIX copia e cola pronto para o cliente pagar na retirada.
        </p>
      </div>
    </div>
  );
}

function MockRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-bold" : "text-muted-foreground"}>{label}</span>
      <span className={`tabular-nums ${strong ? "font-bold text-primary" : ""}`}>{value}</span>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-border bg-card/80 p-4">
      <dt className="text-xl font-bold text-primary md:text-2xl">{value}</dt>
      <dd className="mt-1 text-[11px] leading-4 text-muted-foreground">{label}</dd>
    </div>
  );
}

function Audiences() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <SectionTitle
        eyebrow="UM SISTEMA, DOIS LADOS"
        title="Feito para quem lava e para quem é atendido."
      />
      <div className="reveal-stagger mt-8 grid gap-6 md:grid-cols-2">
        <AudienceCard
          icon={<Store className="size-8" strokeWidth={1.5} />}
          eyebrow="PROPRIETÁRIO"
          title="Controle a operação."
          items={[
            "Atendimentos abertos em segundos pela placa",
            "Status de cada carro em tempo real",
            "Pagamentos, ticket médio e faturamento",
            "Equipe com acesso por função",
          ]}
          action={
            <Link
              to="/auth"
              search={{ modo: "cadastro" }}
              className="group mt-8 flex h-14 items-center justify-between border border-primary bg-brand px-4 text-sm font-bold text-primary-foreground shadow-glow"
            >
              CADASTRAR MEU LAVA-JATO
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          }
        />
        <AudienceCard
          icon={<Smartphone className="size-8" strokeWidth={1.5} />}
          eyebrow="CLIENTE"
          title="Acompanhe o seu carro."
          items={[
            "Entra só com a placa e o telefone",
            "Vê em que etapa está o serviço",
            "Consulta valores e histórico de visitas",
            "Paga com PIX direto pelo celular",
          ]}
          action={
            <Link
              to="/cliente"
              className="group mt-8 flex h-14 items-center justify-between border border-border bg-secondary px-4 text-sm font-bold text-secondary-foreground hover:border-primary/50 hover:text-primary"
            >
              ACESSAR COMO CLIENTE
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          }
        />
      </div>
    </section>
  );
}

function AudienceCard({
  icon,
  eyebrow,
  title,
  items,
  action,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  items: string[];
  action: ReactNode;
}) {
  return (
    <article className="interactive-panel flex flex-col border border-border bg-card p-6 md:p-9">
      <span className="text-primary">{icon}</span>
      <p className="mt-8 text-xs font-semibold text-primary">{eyebrow}</p>
      <h3 className="mt-3 text-3xl font-bold tracking-[-0.055em] md:text-4xl">{title}</h3>
      <ul className="mt-6 grid gap-3 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-auto">{action}</div>
    </article>
  );
}

const FEATURES = [
  {
    icon: <Car className="size-5" />,
    title: "Atendimento pela placa",
    text: "Digite a placa e o sistema traz cliente, veículo e histórico. Carro novo é cadastrado no mesmo passo.",
  },
  {
    icon: <Camera className="size-5" />,
    title: "Leitura da placa pela foto",
    text: "Tire uma foto do carro e a placa é preenchida automaticamente. Sem digitação no pátio.",
  },
  {
    icon: <Wrench className="size-5" />,
    title: "Ordens de serviço por etapa",
    text: "Aguardando, em serviço, pronto, pago e entregue. Cada mudança fica registrada.",
  },
  {
    icon: <BadgeCheck className="size-5" />,
    title: "Catálogo de serviços",
    text: "Monte seus preços de lavagens e adicionais. O sistema impede duas lavagens na mesma OS.",
  },
  {
    icon: <QrCode className="size-5" />,
    title: "Cobrança PIX",
    text: "Cadastre sua chave e o QR Code sai com o valor exato de cada ordem de serviço.",
  },
  {
    icon: <ChartNoAxesCombined className="size-5" />,
    title: "Financeiro em tempo real",
    text: "Faturamento do dia, semana e mês, ticket médio e receita por forma de pagamento.",
  },
  {
    icon: <Clock className="size-5" />,
    title: "Horário de funcionamento",
    text: "Defina os dias e horários de atendimento e mostre isso para os seus clientes.",
  },
  {
    icon: <Users className="size-5" />,
    title: "Equipe com permissões",
    text: "Proprietário, gerente e funcionário, cada um vendo e fazendo só o que deve.",
  },
];

function Features() {
  return (
    <section id="funcionalidades" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12">
      <SectionTitle
        eyebrow="FUNCIONALIDADES"
        title="Tudo o que o lava-jato precisa no dia a dia."
        description="Pensado para o ritmo do pátio: poucos toques, letras grandes e funcionando no celular."
      />
      <div className="reveal-stagger mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="interactive-panel border border-border bg-card p-5"
          >
            <span className="inline-flex size-10 items-center justify-center border border-primary/40 text-primary">
              {feature.icon}
            </span>
            <h3 className="mt-5 text-sm font-bold">{feature.title}</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "Carro chegou",
    text: "Digite ou fotografe a placa. Cliente e histórico aparecem na hora.",
  },
  {
    title: "Escolha os serviços",
    text: "Selecione a lavagem e os adicionais. O valor é calculado automaticamente.",
  },
  {
    title: "Acompanhe o pátio",
    text: "Mova a OS de etapa em etapa. O cliente vê cada mudança pelo celular.",
  },
  {
    title: "Receba e entregue",
    text: "Registre o pagamento em dinheiro, cartão ou PIX e libere o carro.",
  },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12">
      <SectionTitle eyebrow="COMO FUNCIONA" title="Quatro passos, do pátio ao caixa." />
      <ol className="reveal-stagger mt-8 grid gap-3 md:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="border border-border bg-card p-5">
            <span className="text-xs tabular-nums text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-6 text-lg font-bold tracking-[-0.03em]">{step.title}</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ClientArea() {
  return (
    <section id="cliente" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12">
      <div className="grid items-center gap-10 border border-border bg-card/70 p-6 md:p-10 lg:grid-cols-2">
        <div>
          <SectionTitle
            eyebrow="ÁREA DO CLIENTE"
            title="Seu cliente para de ligar perguntando se o carro está pronto."
            description="Ele encontra o seu lava-jato, informa a placa e o telefone usados no atendimento e acompanha tudo pelo navegador do celular."
          />
          <ul className="mt-6 grid gap-3 text-sm text-muted-foreground">
            {[
              "Status atualizado automaticamente enquanto o carro está no pátio",
              "Histórico de visitas e quanto já gastou",
              "QR Code PIX para pagar sem fila no caixa",
              "Endereço, telefone e horário de funcionamento do seu lava-jato",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            to="/cliente"
            className="group mt-8 inline-flex h-12 items-center gap-6 border border-border bg-secondary px-4 text-sm font-bold hover:border-primary/50 hover:text-primary"
          >
            VER A ÁREA DO CLIENTE
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <PhoneMockup />
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="mx-auto w-full max-w-[280px] border-[6px] border-secondary bg-background p-4 shadow-glow">
      <p className="text-[10px] text-muted-foreground">Olá, Carlos</p>
      <p className="plate mt-2 text-xl font-bold tracking-[0.1em]">ABC1D23</p>
      <div className="mt-4 border border-primary/40 bg-primary/10 p-3">
        <p className="text-[10px] text-muted-foreground">Status agora</p>
        <p className="mt-1 text-sm font-bold text-primary">Pronto para retirada</p>
      </div>
      <div className="mt-3 flex items-center gap-3 border border-border p-3">
        <QrCode className="size-10 text-foreground" strokeWidth={1.25} />
        <div>
          <p className="text-[10px] text-muted-foreground">Pagar com PIX</p>
          <p className="text-sm font-bold tabular-nums">R$ 140,00</p>
        </div>
      </div>
      <p className="mt-4 text-[10px] text-muted-foreground">Últimas visitas</p>
      <div className="mt-2 space-y-1.5 text-[11px]">
        <MockRow label="12/10 · Lavagem completa" value="R$ 60" />
        <MockRow label="28/09 · Polimento" value="R$ 150" />
      </div>
    </div>
  );
}

function Finance() {
  const bars = [38, 52, 44, 70, 61, 88, 74];
  const days = ["S", "T", "Q", "Q", "S", "S", "D"];
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="order-2 border border-border bg-card p-6 lg:order-1">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">Faturamento da semana</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">R$ 4.380,00</p>
            </div>
            <span className="text-[10px] text-muted-foreground">exemplo ilustrativo</span>
          </div>
          <div className="mt-6 flex h-36 items-end gap-2" aria-hidden="true">
            {bars.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <span className="w-full bg-primary/80" style={{ height: `${height}%` }} />
                <span className="text-[9px] text-muted-foreground">{days[index]}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[10px]">
            <MiniKpi label="PIX" value="58%" />
            <MiniKpi label="Cartão" value="31%" />
            <MiniKpi label="Dinheiro" value="11%" />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <SectionTitle
            eyebrow="FINANCEIRO"
            title="Saiba quanto entrou hoje sem fazer conta."
            description="Cada pagamento registrado alimenta o painel: faturamento por período, ticket médio, serviços mais vendidos e divisão por forma de pagamento."
          />
          <p className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
            <FileSpreadsheet className="size-5 shrink-0 text-primary" />
            Exporte o balanço do mês em PDF ou Excel para o seu contador.
          </p>
        </div>
      </div>
    </section>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/70 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold text-primary">{value}</p>
    </div>
  );
}

function Security() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-col gap-6 border border-border bg-card/70 p-6 md:flex-row md:items-center md:p-8">
        <ShieldCheck className="size-12 shrink-0 text-primary" strokeWidth={1.25} />
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] md:text-2xl">
            Os dados do seu lava-jato ficam só com você.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Cada empresa tem seus dados isolados no banco. Pagamentos só podem ser registrados pelo
            fluxo do sistema, e o cliente acessa apenas o próprio veículo, com placa e telefone e
            limite de tentativas.
          </p>
        </div>
      </div>
    </section>
  );
}

function Plans() {
  return (
    <section id="planos" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12">
      <SectionTitle
        eyebrow="PLANOS"
        title="Escolha o plano do tamanho do seu pátio."
        description={`Comece com ${TRIAL_DAYS} dias grátis do plano Max. Depois, escolha o seu plano ou continue no Grátis, sem perder seus dados.`}
      />
      <div className="reveal-stagger mt-8 grid gap-6 lg:grid-cols-3">
        {PLAN_IDS.map((id) => PLANS[id]).map((plan) => (
          <article
            key={plan.nome}
            className={`relative flex flex-col border bg-card p-6 md:p-8 ${
              plan.destaque ? "border-primary shadow-glow" : "border-border"
            }`}
          >
            {plan.destaque && (
              <span className="absolute -top-3 left-6 bg-brand px-2 py-1 text-[10px] font-bold text-primary-foreground">
                MAIS ESCOLHIDO
              </span>
            )}
            <h3 className="text-2xl font-bold tracking-[-0.04em]">{plan.nome}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{plan.descricao}</p>
            <p className="mt-6 text-3xl font-bold text-primary">
              {plan.preco ?? "Sob consulta"}
              {plan.preco && plan.id !== "GRATIS" && (
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              )}
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-muted-foreground">
              {plan.itens.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/auth"
              search={{ modo: "cadastro" }}
              className={`mt-8 flex h-12 items-center justify-center border text-sm font-bold ${
                plan.destaque
                  ? "border-primary bg-brand text-primary-foreground"
                  : "border-border bg-secondary hover:border-primary/50 hover:text-primary"
              }`}
            >
              COMEÇAR COM O {plan.nome.toUpperCase()}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

const FAQ = [
  {
    question: "Preciso instalar algum programa?",
    answer:
      "Não. O LavaPro funciona no navegador do celular, tablet ou computador. Basta criar a conta e cadastrar o seu lava-jato.",
  },
  {
    question: "Meu cliente precisa baixar um aplicativo?",
    answer:
      "Não. Ele acessa a área do cliente pelo navegador, escolhe o seu lava-jato e informa a placa e o telefone usados no atendimento.",
  },
  {
    question: "O PIX cai direto na minha conta?",
    answer:
      "Sim. O QR Code é gerado com a sua própria chave PIX e o valor da ordem de serviço. O LavaPro não intermedeia o dinheiro.",
  },
  {
    question: "Posso cadastrar os meus próprios serviços e preços?",
    answer:
      "Sim. Você monta o catálogo com lavagens e adicionais, define preço, duração e descrição, e pode desativar o que não oferece mais.",
  },
  {
    question: "Meus funcionários veem o financeiro?",
    answer:
      "Não. Funcionários abrem e movimentam atendimentos. Financeiro, preços, PIX e cancelamentos ficam com o proprietário e o gerente.",
  },
];

function Faq() {
  return (
    <section id="duvidas" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-12">
      <SectionTitle eyebrow="DÚVIDAS" title="Perguntas frequentes." />
      <div className="mt-8 divide-y divide-border border border-border bg-card">
        {FAQ.map((item) => (
          <details key={item.question} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
              {item.question}
              <span className="text-primary transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="border border-primary/50 bg-card p-8 text-center shadow-glow md:p-14">
        <h2 className="mx-auto max-w-2xl text-[clamp(1.75rem,5vw,3rem)] font-bold leading-tight tracking-[-0.05em]">
          Organize o seu lava-jato a partir de hoje.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          Crie a conta, cadastre a empresa e abra o primeiro atendimento em poucos minutos.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/auth"
            search={{ modo: "cadastro" }}
            className="group inline-flex h-14 items-center justify-center gap-6 border border-primary bg-brand px-6 text-sm font-bold text-primary-foreground"
          >
            CRIAR MINHA CONTA
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/auth"
            className="inline-flex h-14 items-center justify-center border border-border bg-secondary px-6 text-sm font-bold hover:border-primary/50 hover:text-primary"
          >
            JÁ TENHO CONTA
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <WashBrand />
          <p className="mt-4 max-w-sm text-xs leading-5 text-muted-foreground">
            Sistema de gestão para lava-jato: atendimento pela placa, ordens de serviço, PIX,
            financeiro e acompanhamento em tempo real para o cliente.
          </p>
        </div>
        <FooterColumn
          title="Proprietário"
          links={[
            { label: "Criar conta", to: "/auth", cadastro: true },
            { label: "Entrar", to: "/auth" },
            { label: "Planos", href: "#planos" },
          ]}
        />
        <FooterColumn
          title="Cliente"
          links={[
            { label: "Acompanhar meu carro", to: "/cliente" },
            { label: "Como funciona", href: "#cliente" },
            { label: "Dúvidas", href: "#duvidas" },
          ]}
        />
      </div>
      <div className="flex flex-col items-center justify-between gap-2 border-t border-border/60 px-5 py-5 text-center text-[10px] text-muted-foreground sm:flex-row sm:px-8">
        <p>© {new Date().getFullYear()} LavaPro. Todos os direitos reservados.</p>
        <p>
          Desenvolvido por{" "}
          <a
            href="https://jpglabs.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-primary underline-offset-2 hover:underline"
          >
            JPGLabs
          </a>
        </p>
      </div>
    </footer>
  );
}

type FooterLink =
  { label: string; to: "/auth" | "/cliente"; cadastro?: boolean } | { label: string; href: string };

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-primary">{title.toUpperCase()}</p>
      <ul className="mt-4 grid gap-2 text-xs text-muted-foreground">
        {links.map((link) => (
          <li key={link.label}>
            {"href" in link ? (
              <a href={link.href} className="hover:text-primary">
                {link.label}
              </a>
            ) : link.to === "/auth" && link.cadastro ? (
              <Link to="/auth" search={{ modo: "cadastro" }} className="hover:text-primary">
                {link.label}
              </Link>
            ) : (
              <Link to={link.to} className="hover:text-primary">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-[clamp(1.75rem,4.5vw,2.75rem)] font-bold leading-tight tracking-[-0.05em]">
        {title}
      </h2>
      {description && <p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>
  );
}
