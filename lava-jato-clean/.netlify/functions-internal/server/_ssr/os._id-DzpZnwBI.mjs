import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { getOrder, registerPayment, updateOrderStatus, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { PAYMENT_LABEL, PAYMENT_METHODS, STATUS_LABEL, brl } from "./plate-C5WvEduv.mjs";
import { useMutation, useQuery, useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { toast } from "../_libs/sonner.mjs";
import { AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { m } from "../_libs/motion.mjs";
import { Route } from "./router-BJH1rJwZ.mjs";
import { Button } from "./button-DaOcT_hl.mjs";
import { Banknote, Check, CircleDollarSign, CircleX, CreditCard, LoaderCircle, QrCode } from "../_libs/lucide-react.mjs";
import { AppShell } from "./shell-CXqKyQlN.mjs";
import { Skeleton } from "./skeleton-CZb5vrGH.mjs";
import { OrderTimeline } from "./order-timeline-CEUvHlFy.mjs";
import { allowedManualTransitions } from "./order-flow-WW0v_EAr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/os._id-DzpZnwBI.js
var import_jsx_runtime = require_jsx_runtime();
function OrderPage() {
	const { id } = Route.useParams();
	const queryClient = useQueryClient();
	const orderFn = useServerFn(getOrder);
	const statusFn = useServerFn(updateOrderStatus);
	const payFn = useServerFn(registerPayment);
	const query = useQuery({
		queryKey: ["order", id],
		queryFn: () => orderFn({ data: { id } })
	});
	const statusMutation = useMutation({
		mutationFn: (status) => statusFn({ data: {
			order_id: id,
			status
		} }),
		onSuccess: async () => {
			toast.success("Status atualizado.");
			await queryClient.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const payMutation = useMutation({
		mutationFn: (metodo) => payFn({ data: {
			order_id: id,
			metodo
		} }),
		onSuccess: async () => {
			toast.success("Pagamento registrado!");
			await queryClient.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const order = query.data;
	const payment = order?.payments?.[0] ?? null;
	const isPaid = Boolean(payment) || order?.status === "PAGO" || order?.status === "ENTREGUE";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: order ? `Atendimento #${order.numero}` : "Atendimento",
		back: "/home",
		children: [
			query.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-5",
				"aria-label": "Carregando atendimento",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-44 rounded-3xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-28 rounded-3xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-56 rounded-3xl" })
				]
			}),
			query.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-destructive",
				children: query.error.message
			}),
			order && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-3xl border border-border/60 bg-card p-5 shadow-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "plate text-2xl",
								children: order.vehicles?.placa ?? "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted-foreground",
								children: [
									order.vehicles?.marca,
									order.vehicles?.modelo,
									order.vehicles?.cor
								].filter(Boolean).join(" · ") || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm font-semibold",
								children: order.customers?.nome ?? "Sem cliente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: order.customers?.telefone ?? "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 space-y-1 border-t border-border/60 pt-4 text-sm",
								children: order.service_order_items?.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [i.nome, i.quantidade > 1 ? ` ×${i.quantidade}` : ""] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: brl(Number(i.preco) * (i.quantidade ?? 1)) })]
								}, i.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex items-center justify-between border-t border-border/60 pt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold",
									children: "Total"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xl font-bold",
									children: brl(order.total)
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderTimeline, { status: order.status }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
						mode: "popLayout",
						children: order.status === "AGUARDANDO_PAGAMENTO" && !isPaid && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
							initial: {
								opacity: 0,
								y: 16
							},
							animate: {
								opacity: 1,
								y: 0
							},
							exit: {
								opacity: 0,
								scale: .95
							},
							className: "rounded-3xl border border-primary/40 bg-card p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: "Total a receber"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-3xl font-bold tabular-nums",
									children: brl(order.total)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 text-xs text-muted-foreground",
									children: "Como o cliente pagou?"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5",
									children: PAYMENT_METHODS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										className: "h-14 flex-col gap-1 rounded-2xl text-xs transition-transform hover:-translate-y-0.5 hover:border-primary/50 active:scale-95",
										disabled: payMutation.isPending,
										onClick: () => payMutation.mutate(m),
										children: payMutation.isPending && payMutation.variables === m ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [PAYMENT_ICON[m], PAYMENT_LABEL[m]] })
									}, m))
								})
							]
						}, "charge")
					}),
					(() => {
						const transitions = allowedManualTransitions(order.status);
						const next = transitions.find((item) => item !== "CANCELADO");
						const canCancel = transitions.includes("CANCELADO");
						if (!next && !canCancel) return null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [next && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "h-14 w-full rounded-2xl text-base font-bold shadow-glow transition-transform active:scale-[0.98]",
								disabled: statusMutation.isPending,
								onClick: () => statusMutation.mutate(next),
								children: statusMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin" }) : NEXT_ACTION_LABEL[next] ?? STATUS_LABEL[next].toUpperCase()
							}), canCancel && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: statusMutation.isPending,
								onClick: () => {
									if (window.confirm("Cancelar este atendimento? Essa ação não pode ser desfeita.")) statusMutation.mutate("CANCELADO");
								},
								className: "flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-4" }), "Cancelar atendimento"]
							})]
						});
					})(),
					payment ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
						initial: {
							opacity: 0,
							y: 16
						},
						animate: {
							opacity: 1,
							y: 0
						},
						className: "rounded-2xl border border-success/40 bg-card p-4 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center gap-2 font-semibold text-success",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
									initial: { scale: 0 },
									animate: { scale: 1 },
									transition: {
										type: "spring",
										stiffness: 600,
										damping: 15,
										delay: .15
									},
									className: "flex size-5 items-center justify-center rounded-full bg-success text-success-foreground",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" })
								}), "Pagamento registrado"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex justify-between text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Método" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground",
									children: PAYMENT_LABEL[payment.metodo]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex justify-between text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Valor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground",
									children: brl(payment.valor)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex justify-between text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Data" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground",
									children: new Date(payment.pago_em).toLocaleString("pt-BR")
								})]
							})
						]
					}) : null
				]
			})
		]
	});
}
var NEXT_ACTION_LABEL = {
	EM_LAVAGEM: "INICIAR SERVIÇO",
	AGUARDANDO_PAGAMENTO: "MARCAR COMO PRONTO",
	ENTREGUE: "ENTREGAR VEÍCULO"
};
var PAYMENT_ICON = {
	DINHEIRO: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "size-5" }),
	PIX: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "size-5" }),
	DEBITO: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-5" }),
	CREDITO: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-5" }),
	OUTRO: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleDollarSign, { className: "size-5" })
};
//#endregion
export { OrderPage as component };
