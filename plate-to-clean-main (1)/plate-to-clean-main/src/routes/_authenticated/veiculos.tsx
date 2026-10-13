import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Car, ChevronRight, Clock3, Loader2, Search } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listVehicles, plateHistory } from "@/lib/lavajato.functions";
import { brl, dateBR, normalizePlate, STATUS_LABEL, type OrderStatus } from "@/lib/plate";

export const Route = createFileRoute("/_authenticated/veiculos")({
  head: () => ({
    meta: [
      { title: "Veículos — LavaPro" },
      {
        name: "description",
        content: "Consulte os veículos cadastrados e o histórico de atendimentos.",
      },
    ],
  }),
  component: Veiculos,
});

function Veiculos() {
  const [placa, setPlaca] = useState("");
  const historyFn = useServerFn(plateHistory);
  const listFn = useServerFn(listVehicles);
  const vehiclesQuery = useQuery({ queryKey: ["vehicles"], queryFn: () => listFn() });
  const historyMutation = useMutation({
    mutationFn: (selectedPlate: string) => historyFn({ data: { placa: selectedPlate } }),
    onError: (error: Error) => toast.error(error.message),
  });
  const result = historyMutation.data;
  const visibleVehicles = useMemo(() => {
    const search = normalizePlate(placa);
    if (!search) return vehiclesQuery.data ?? [];
    return (vehiclesQuery.data ?? []).filter(
      (vehicle) =>
        vehicle.placa.includes(search) ||
        vehicle.customers?.nome
          .toLocaleUpperCase("pt-BR")
          .includes(placa.toLocaleUpperCase("pt-BR")),
    );
  }, [placa, vehiclesQuery.data]);

  function openVehicle(selectedPlate: string) {
    setPlaca(selectedPlate);
    historyMutation.mutate(selectedPlate);
  }

  return (
    <AppShell title="Veículos">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary">Cadastro de veículos</p>
          <h1 className="mt-1 text-2xl font-bold">Placas salvas</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {vehiclesQuery.data?.length ?? 0} cadastrados
        </p>
      </div>

      <form
        className="mt-5 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          historyMutation.mutate(placa);
        }}
      >
        <Input
          value={placa}
          onChange={(event) => setPlaca(normalizePlate(event.target.value).slice(0, 7))}
          placeholder="Buscar placa"
          className="plate h-13 text-lg uppercase"
        />
        <Button
          type="submit"
          className="h-13 px-5"
          disabled={placa.length < 6 || historyMutation.isPending}
        >
          {historyMutation.isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Search className="size-5" />
          )}
        </Button>
      </form>

      {result && !result.vehicle && (
        <p className="mt-6 rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
          Veículo ainda não cadastrado.
        </p>
      )}

      {result?.vehicle && <VehicleHistory result={result} />}

      <section className="mt-8">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-sm font-semibold">Veículos cadastrados</h2>
          <Car className="size-5 text-primary" />
        </div>

        {vehiclesQuery.isLoading && (
          <p className="py-6 text-sm text-muted-foreground">Carregando veículos…</p>
        )}
        {vehiclesQuery.isError && (
          <p className="py-6 text-sm text-destructive">{(vehiclesQuery.error as Error).message}</p>
        )}

        <div className="reveal-stagger mt-3 grid gap-3 lg:grid-cols-2">
          {visibleVehicles.map((vehicle) => {
            const last = vehicle.ultimoAtendimento;
            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => openVehicle(vehicle.placa)}
                className="interactive-panel grid w-full gap-4 border border-border bg-card p-5 text-left sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="plate text-xl">{vehicle.placa}</span>
                    {last && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                        {STATUS_LABEL[last.status as OrderStatus]}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {[vehicle.marca, vehicle.modelo, vehicle.cor].filter(Boolean).join(" · ") ||
                      "Dados do veículo não informados"}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {vehicle.customers?.nome ?? "Cliente não informado"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{vehicle.totalAtendimentos} atendimento(s)</span>
                    {last && (
                      <span className="flex items-center gap-1">
                        <Clock3 className="size-3.5" /> Último em {dateBR(last.created_at)}
                      </span>
                    )}
                  </div>
                  {last && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {last.service_order_items.map((item) => item.nome).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  {last && <span className="font-semibold tabular-nums">{brl(last.total)}</span>}
                  <ChevronRight className="size-5 text-primary" />
                </div>
              </button>
            );
          })}
        </div>

        {!vehiclesQuery.isLoading && visibleVehicles.length === 0 && (
          <div className="mt-3 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-card">
            <Car className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              {placa ? "Nenhuma placa corresponde à busca." : "Nenhum veículo cadastrado ainda."}
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function VehicleHistory({ result }: { result: Awaited<ReturnType<typeof plateHistory>> }) {
  if (!result.vehicle) return null;
  return (
    <section className="mt-6 space-y-4 border-b border-border/60 pb-8">
      <div className="rounded-3xl border border-primary/30 bg-card p-5 shadow-card">
        <p className="plate text-2xl">{result.vehicle.placa}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {[result.vehicle.marca, result.vehicle.modelo, result.vehicle.cor]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
        <p className="mt-3 text-sm font-semibold">
          {result.vehicle.customers?.nome ?? "Sem cliente"}
        </p>
        <p className="text-sm text-muted-foreground">{result.vehicle.customers?.telefone ?? "—"}</p>
        <p className="mt-3 text-sm">
          {result.stats?.total ?? 0} atendimentos · gasto total {brl(result.stats?.totalGasto ?? 0)}
        </p>
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground">Histórico da placa</h2>
      <div className="space-y-2">
        {result.history.map((order) => (
          <Link
            key={order.id}
            to="/os/$id"
            params={{ id: order.id }}
            className="block rounded-2xl border border-border/60 bg-card p-4"
          >
            <div className="flex justify-between">
              <span className="font-semibold">#{order.numero}</span>
              <span className="text-sm">{brl(order.total)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dateBR(order.created_at)} · {STATUS_LABEL[order.status as OrderStatus]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(order.service_order_items ?? []).map((item) => item.nome).join(", ") || "—"}
            </p>
          </Link>
        ))}
        {result.history.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum atendimento ainda.</p>
        )}
      </div>
    </section>
  );
}
