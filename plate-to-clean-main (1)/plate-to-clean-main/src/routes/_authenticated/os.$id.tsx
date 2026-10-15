import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Banknote,
  Check,
  CircleDollarSign,
  CreditCard,
  Loader2,
  QrCode,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, m } from "motion/react";
import { Button } from "@/components/ui/button";
import { getOrder, registerPayment, updateOrderStatus } from "@/lib/lavajato.functions";
import {
  brl,
  PAYMENT_LABEL,
  PAYMENT_METHODS,
  STATUS_LABEL,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/plate";
import { allowedManualTransitions } from "@/lib/order-flow";

export const Route = createFileRoute("/_authenticated/os/$id")({
  head: () => ({
    meta: [
      { title: "Ordem de serviço — LavaPro" },
      { name: "description", content: "Acompanhe o status, o pagamento e a entrega do veículo." },
      { property: "og:title", content: "Ordem de serviço — LavaPro" },
      {
        property: "og:description",
        content: "Acompanhe o status, o pagamento e a entrega do veículo.",
      },
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
      {query.isLoading && (
        <div className="space-y-5" aria-label="Carregando atendimento">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      )}
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

          <StatusTimeline status={order.status as OrderStatus} />

          <AnimatePresence mode="popLayout">
            {order.status === "AGUARDANDO_PAGAMENTO" && !isPaid && (
              <m.div
                key="charge"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl border border-primary/40 bg-card p-5"
              >
                <p className="text-sm text-muted-foreground">Total a receber</p>
                <p className="text-3xl font-bold tabular-nums">{brl(order.total)}</p>
                <p className="mt-4 text-xs text-muted-foreground">Como o cliente pagou?</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {PAYMENT_METHODS.map((m) => (
                    <Button
                      key={m}
                      variant="secondary"
                      className="h-14 flex-col gap-1 rounded-2xl text-xs transition-transform hover:-translate-y-0.5 hover:border-primary/50 active:scale-95"
                      disabled={payMutation.isPending}
                      onClick={() => payMutation.mutate(m)}
                    >
                      {payMutation.isPending && payMutation.variables === m ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          {PAYMENT_ICON[m]}
                          {PAYMENT_LABEL[m]}
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {(() => {
            const transitions = allowedManualTransitions(order.status as OrderStatus);
            const next = transitions.find((item) => item !== "CANCELADO");
            const canCancel = transitions.includes("CANCELADO");
            if (!next && !canCancel) return null;
            return (
              <div className="space-y-2">
                {next && (
                  <Button
                    className="h-14 w-full rounded-2xl text-base font-bold shadow-glow transition-transform active:scale-[0.98]"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate(next)}
                  >
                    {statusMutation.isPending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      (NEXT_ACTION_LABEL[next] ?? STATUS_LABEL[next].toUpperCase())
                    )}
                  </Button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Cancelar este atendimento? Essa ação não pode ser desfeita.",
                        )
                      ) {
                        statusMutation.mutate("CANCELADO");
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <XCircle className="size-4" />
                    Cancelar atendimento
                  </button>
                )}
              </div>
            );
          })()}

          {payment ? (
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-success/40 bg-card p-4 text-sm"
            >
              <p className="flex items-center gap-2 font-semibold text-success">
                <m.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 600, damping: 15, delay: 0.15 }}
                  className="flex size-5 items-center justify-center rounded-full bg-success text-success-foreground"
                >
                  <Check className="size-3.5" />
                </m.span>
                Pagamento registrado
              </p>
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
            </m.div>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  EM_LAVAGEM: "INICIAR SERVIÇO",
  AGUARDANDO_PAGAMENTO: "MARCAR COMO PRONTO",
  ENTREGUE: "ENTREGAR VEÍCULO",
};

const PAYMENT_ICON: Record<PaymentMethod, React.ReactNode> = {
  DINHEIRO: <Banknote className="size-5" />,
  PIX: <QrCode className="size-5" />,
  DEBITO: <CreditCard className="size-5" />,
  CREDITO: <CreditCard className="size-5" />,
  OUTRO: <CircleDollarSign className="size-5" />,
};

const TIMELINE: OrderStatus[] = [
  "AGUARDANDO",
  "EM_LAVAGEM",
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "ENTREGUE",
];

const TIMELINE_LABEL: Partial<Record<OrderStatus, string>> = {
  AGUARDANDO: "Chegou",
  EM_LAVAGEM: "Lavando",
  AGUARDANDO_PAGAMENTO: "Pronto",
  PAGO: "Pago",
  ENTREGUE: "Entregue",
};

/** Status legados caem na etapa equivalente da linha do tempo. */
const TIMELINE_INDEX: Partial<Record<OrderStatus, number>> = {
  EM_FINALIZACAO: 1,
  FINALIZADO: 2,
};

function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELADO") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <XCircle className="size-5 shrink-0" />
        Este atendimento foi cancelado.
      </div>
    );
  }
  const current = TIMELINE_INDEX[status] ?? TIMELINE.indexOf(status);
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Andamento
      </h2>
      <ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Etapas do atendimento">
        {TIMELINE.map((step, index) => {
          const done = index < current || (index === current && step === "ENTREGUE");
          const active = index === current && !done;
          return (
            <li key={step} className="relative flex flex-col items-center text-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 overflow-hidden bg-border"
                >
                  <m.span
                    className="block h-full w-full origin-left bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: index <= current ? 1 : 0 }}
                    transition={{ duration: 0.45, delay: index * 0.12, ease: "easeOut" }}
                  />
                </span>
              )}
              <span
                className={`relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary bg-background text-primary shadow-glow"
                      : "border-border bg-background text-muted-foreground"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? (
                  <m.span
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 600,
                      damping: 18,
                      delay: index * 0.12,
                    }}
                  >
                    <Check className="size-4" />
                  </m.span>
                ) : (
                  index + 1
                )}
                {active && (
                  <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary/50" />
                )}
              </span>
              <span
                className={`mt-2 text-[10px] leading-tight ${
                  active
                    ? "font-bold text-primary"
                    : done
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {TIMELINE_LABEL[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
