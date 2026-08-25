import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { getOrder, registerPayment, updateOrderStatus } from "@/lib/lavajato.functions";
import {
  brl,
  ORDER_STATUSES,
  PAYMENT_LABEL,
  PAYMENT_METHODS,
  STATUS_LABEL,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/plate";

export const Route = createFileRoute("/_authenticated/os/$id")({
  head: () => ({
    meta: [
      { title: "Ordem de serviço — LavaPro" },
      { name: "description", content: "Acompanhe o status, o pagamento e a entrega do veículo." },
      { property: "og:title", content: "Ordem de serviço — LavaPro" },
      { property: "og:description", content: "Acompanhe o status, o pagamento e a entrega do veículo." },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const orderFn = useServerFn(getOrder);
  const statusFn = useServerFn(updateOrderStatus);
  const payFn = useServerFn(registerPayment);

  const query = useQuery({ queryKey: ["order", id], queryFn: () => orderFn({ data: { id } }) });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => statusFn({ data: { order_id: id, status } }),
    onSuccess: async () => {
      toast.success("Status atualizado.");
      await queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payMutation = useMutation({
    mutationFn: (metodo: PaymentMethod) => payFn({ data: { order_id: id, metodo } }),
    onSuccess: async () => {
      toast.success("Pagamento registrado!");
      await queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const order = query.data;
  const payment = order?.payments?.[0] ?? null;
  const isPaid = Boolean(payment) || order?.status === "PAGO" || order?.status === "ENTREGUE";

  return (
    <AppShell title={order ? `Atendimento #${order.numero}` : "Atendimento"} back="/home">
      {query.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {query.isError && (
        <p className="text-sm text-destructive">{(query.error as Error).message}</p>
      )}

      {order && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
            <p className="plate text-2xl">{order.vehicles?.placa ?? "—"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {[order.vehicles?.marca, order.vehicles?.modelo, order.vehicles?.cor]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
            <p className="mt-3 text-sm font-semibold">{order.customers?.nome ?? "Sem cliente"}</p>
            <p className="text-sm text-muted-foreground">{order.customers?.telefone ?? "—"}</p>

            <div className="mt-4 space-y-1 border-t border-border/60 pt-4 text-sm">
              {order.service_order_items?.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span>
                    {i.nome}
                    {i.quantidade > 1 ? ` ×${i.quantidade}` : ""}
                  </span>
                  <span>{brl(Number(i.preco) * (i.quantidade ?? 1))}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold">{brl(order.total)}</span>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground">Status</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => {
                const locked =
                  (isPaid && !["PAGO", "ENTREGUE"].includes(s)) ||
                  (s === "PAGO" && order.status !== "PAGO");
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={statusMutation.isPending || locked}
                    onClick={() => statusMutation.mutate(s)}
                    className={`rounded-full border px-4 py-2 text-sm transition disabled:opacity-40 ${
                      order.status === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 bg-card"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {order.status === "AGUARDANDO_PAGAMENTO" && !isPaid && (
            <div className="rounded-3xl border border-primary/40 bg-card p-5">
              <p className="text-sm text-muted-foreground">Total a receber</p>
              <p className="text-3xl font-bold">{brl(order.total)}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <Button
                    key={m}
                    variant="secondary"
                    className="h-12"
                    disabled={payMutation.isPending}
                    onClick={() => payMutation.mutate(m)}
                  >
                    {payMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : PAYMENT_LABEL[m]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {order.status === "PAGO" && (
            <Button
              className="h-14 w-full text-base font-semibold"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate("ENTREGUE")}
            >
              ENTREGAR VEÍCULO
            </Button>
          )}

          {payment ? (
            <div className="rounded-2xl border border-border/60 bg-card p-4 text-sm">
              <p className="font-semibold">Pagamento registrado</p>
              <div className="mt-2 flex justify-between text-muted-foreground">
                <span>Método</span>
                <span className="font-medium text-foreground">
                  {PAYMENT_LABEL[payment.metodo as PaymentMethod]}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>Valor</span>
                <span className="font-medium text-foreground">{brl(payment.valor)}</span>
              </div>
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>Data</span>
                <span className="font-medium text-foreground">
                  {new Date(payment.pago_em).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
