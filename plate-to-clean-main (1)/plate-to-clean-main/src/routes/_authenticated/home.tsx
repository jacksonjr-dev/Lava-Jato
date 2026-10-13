import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Camera, Car, Clock, Wallet } from "lucide-react";
import { AppShell } from "@/components/app/shell";
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
      <Button
        asChild
        className="h-24 w-full bg-brand text-lg font-bold text-primary-foreground md:h-28"
      >
        <Link to="/atendimento/novo">
          <Camera className="mr-2 size-7" />
          NOVO ATENDIMENTO
        </Link>
      </Button>

      <div className="reveal-stagger mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          icon={<Clock className="size-4" />}
          label="Em andamento"
          value={String(summaryQuery.data?.emAndamento ?? "—")}
        />
        <Stat
          icon={<Car className="size-4" />}
          label="Veículos hoje"
          value={String(summaryQuery.data?.veiculosDia ?? "—")}
        />
        <Stat
          icon={<Wallet className="size-4" />}
          label="Hoje"
          value={summaryQuery.data ? brl(summaryQuery.data.faturamentoDia) : "—"}
        />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Atendimentos abertos</h2>
        <Link to="/veiculos" className="text-sm text-primary">
          Buscar placa
        </Link>
      </div>

      <div className="reveal-stagger mt-3 grid gap-2 lg:grid-cols-2">
        {ordersQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {ordersQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum atendimento aberto.</p>
        )}
        {ordersQuery.data?.map((o) => (
          <Link
            key={o.id}
            to="/os/$id"
            params={{ id: o.id }}
            className="interactive-panel flex items-center justify-between border border-border bg-card p-4"
          >
            <div>
              <p className="plate text-base">{o.vehicles?.placa ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                #{o.numero} · {STATUS_LABEL[o.status as OrderStatus]}
              </p>
            </div>
            <span className="text-sm font-semibold">{brl(o.total)}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="interactive-panel border border-border bg-card p-4">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}</div>
      <p className="mt-2 text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
