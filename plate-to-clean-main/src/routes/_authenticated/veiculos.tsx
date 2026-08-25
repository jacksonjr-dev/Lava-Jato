import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { plateHistory } from "@/lib/lavajato.functions";
import { brl, dateBR, normalizePlate, STATUS_LABEL, type OrderStatus } from "@/lib/plate";

export const Route = createFileRoute("/_authenticated/veiculos")({
  head: () => ({
    meta: [
      { title: "Histórico por placa — LavaPro" },
      { name: "description", content: "Consulte o histórico de atendimentos de qualquer placa." },
      { property: "og:title", content: "Histórico por placa — LavaPro" },
      { property: "og:description", content: "Consulte o histórico de atendimentos de qualquer placa." },
    ],
  }),
  component: Veiculos,
});

function Veiculos() {
  const [placa, setPlaca] = useState("");
  const historyFn = useServerFn(plateHistory);
  const mutation = useMutation({
    mutationFn: () => historyFn({ data: { placa } }),
    onError: (e: Error) => toast.error(e.message),
  });
  const res = mutation.data;

  return (
    <AppShell title="Buscar placa" back="/home">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Input
          value={placa}
          onChange={(e) => setPlaca(normalizePlate(e.target.value).slice(0, 7))}
          placeholder="ABC1D23"
          className="plate h-13 text-lg uppercase"
        />
        <Button type="submit" className="h-13 px-5" disabled={placa.length < 6 || mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
        </Button>
      </form>

      {res && !res.vehicle && (
        <p className="mt-6 text-sm text-muted-foreground">Veículo ainda não cadastrado.</p>
      )}

      {res?.vehicle && (
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
            <p className="plate text-2xl">{res.vehicle.placa}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {[res.vehicle.marca, res.vehicle.modelo, res.vehicle.cor].filter(Boolean).join(" · ") || "—"}
            </p>
            <p className="mt-3 text-sm font-semibold">{res.vehicle.customers?.nome ?? "Sem cliente"}</p>
            <p className="text-sm text-muted-foreground">{res.vehicle.customers?.telefone ?? "—"}</p>
            <p className="mt-3 text-sm">
              {res.stats?.total ?? 0} atendimentos · gasto total {brl(res.stats?.totalGasto ?? 0)}
            </p>
          </div>

          <h2 className="text-sm font-semibold text-muted-foreground">Histórico</h2>
          <div className="space-y-2">
            {res.history.map((o) => (
              <Link
                key={o.id}
                to="/os/$id"
                params={{ id: o.id }}
                className="block rounded-2xl border border-border/60 bg-card p-4"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">#{o.numero}</span>
                  <span className="text-sm">{brl(o.total)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dateBR(o.created_at)} · {STATUS_LABEL[o.status as OrderStatus]}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(o.service_order_items ?? []).map((i) => i.nome).join(", ") || "—"}
                </p>
              </Link>
            ))}
            {res.history.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum atendimento ainda.</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
