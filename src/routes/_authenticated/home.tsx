import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Camera, Car, ChevronRight, Clock, Wallet } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, m } from "motion/react";
import { CountUp } from "@/components/app/motion";
import { Button } from "@/components/ui/button";
import { getSession, homeSummary, listActiveOrders } from "@/lib/lavajato.functions";
import { brl, STATUS_LABEL, type OrderStatus } from "@/lib/plate";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Início — LavaPro" },
      { name: "description", content: "Inicie um novo atendimento em segundos." },
      { property: "og:title", content: "Início — LavaPro" },
      { property: "og:description", content: "Inicie um novo atendimento em segundos." },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const session = useServerFn(getSession);
  const summary = useServerFn(homeSummary);
  const orders = useServerFn(listActiveOrders);

  const sessionQuery = useQuery({ queryKey: ["session"], queryFn: () => session() });
  const hasTenant = !!sessionQuery.data?.membership;

  useEffect(() => {
    if (sessionQuery.isSuccess && !hasTenant) navigate({ to: "/onboarding", replace: true });
  }, [sessionQuery.isSuccess, hasTenant, navigate]);

  const summaryQuery = useQuery({
    queryKey: ["home-summary"],
    queryFn: () => summary(),
    enabled: hasTenant,
  });
  const ordersQuery = useQuery({
    queryKey: ["active-orders"],
    queryFn: () => orders(),
    enabled: hasTenant,
  });

  return (
    <AppShell title="Operação">
      <m.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
        <Button
          asChild
          className="group h-24 w-full rounded-3xl bg-brand text-lg font-bold text-primary-foreground shadow-glow md:h-28"
        >
          <Link to="/atendimento/novo">
            <Camera className="mr-2 size-7 transition-transform group-hover:-rotate-6 group-hover:scale-110" />
            NOVO ATENDIMENTO
          </Link>
        </Button>
      </m.div>

      <div className="reveal-stagger mt-4 grid grid-cols-3 gap-2 md:mt-5 md:gap-3">
        <Stat
          icon={<Clock className="size-4" />}
          label="Em andamento"
          value={summaryQuery.data?.emAndamento ?? null}
        />
        <Stat
          icon={<Car className="size-4" />}
          label="Veículos hoje"
          value={summaryQuery.data?.veiculosDia ?? null}
        />
        <Stat
          icon={<Wallet className="size-4" />}
          label="Caixa hoje"
          value={summaryQuery.data ? Number(summaryQuery.data.faturamentoDia) : null}
          format={brl}
        />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Atendimentos abertos</h2>
        <Link to="/veiculos" className="text-sm text-primary">
          Buscar placa
        </Link>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        {ordersQuery.isLoading &&
          [0, 1].map((item) => <Skeleton key={item} className="h-[74px] rounded-2xl" />)}
        {ordersQuery.data?.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center">
            <Car className="mx-auto size-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold">Nenhum atendimento aberto</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Toque em Novo atendimento quando o próximo carro chegar.
            </p>
          </div>
        )}
        <AnimatePresence initial={true} mode="popLayout">
          {ordersQuery.data?.map((o, index) => (
            <m.div
              key={o.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
              exit={{ opacity: 0, scale: 0.96 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/os/$id"
                params={{ id: o.id }}
                className="interactive-panel group flex items-center justify-between gap-3 border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="plate text-base">{o.vehicles?.placa ?? "—"}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot status={o.status as OrderStatus} />
                    <span>
                      #{o.numero} · {STATUS_LABEL[o.status as OrderStatus]}
                    </span>
                  </p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  {brl(o.total)}
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
              </Link>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function Stat({
  icon,
  label,
  value,
  format,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  format?: (value: number) => string;
}) {
  return (
    <div className="interactive-panel min-w-0 border border-border bg-card p-3 md:p-4">
      <div className="flex items-center gap-1 text-primary">{icon}</div>
      {value === null ? (
        <Skeleton className="mt-2 h-5 w-12" />
      ) : (
        <p className="mt-2 truncate text-base font-bold leading-tight tabular-nums md:text-xl">
          <CountUp value={value} {...(format ? { format } : {})} />
        </p>
      )}
      <p className="mt-1 truncate text-[10px] text-muted-foreground md:text-[11px]">{label}</p>
    </div>
  );
}

const STATUS_DOT: Partial<Record<OrderStatus, string>> = {
  AGUARDANDO: "bg-muted-foreground",
  EM_LAVAGEM: "bg-primary animate-pulse",
  AGUARDANDO_PAGAMENTO: "bg-warning",
  PAGO: "bg-success",
};

function StatusDot({ status }: { status: OrderStatus }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-2 shrink-0 rounded-full ${STATUS_DOT[status] ?? "bg-muted-foreground"}`}
    />
  );
}
