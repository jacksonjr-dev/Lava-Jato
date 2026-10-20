import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { listPayments, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { PAYMENT_LABEL, PAYMENT_METHODS, brl } from "./plate-C5WvEduv.mjs";
import { useQuery } from "../_libs/tanstack__react-query.mjs";
import { AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { m } from "../_libs/motion.mjs";
import { CountUp, FINANCE_PERIOD_LABEL, Route$1, formatDay, matchesPaymentSearch, periodRange, totals } from "./router-BJH1rJwZ.mjs";
import { ChevronRight, Receipt, Search, X } from "../_libs/lucide-react.mjs";
import { AppShell, UpgradeNotice, useFeature } from "./shell-CXqKyQlN.mjs";
import { Skeleton } from "./skeleton-CZb5vrGH.mjs";
import { Input } from "./input-DnEHUyw4.mjs";
import { FinancePeriodPicker } from "./finance-period-picker-C6g4CUsr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/financeiro_.pagamentos-DrUACblO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PaymentsPage() {
	const financeiroLiberado = useFeature("financeiro");
	const search = Route$1.useSearch();
	const navigate = Route$1.useNavigate();
	const loadPayments = useServerFn(listPayments);
	const periodo = search.periodo ?? "mes";
	const range = periodRange(periodo, /* @__PURE__ */ new Date(), search);
	const query = useQuery({
		queryKey: [
			"payments-list",
			formatDay(range.from),
			formatDay(range.to)
		],
		queryFn: () => loadPayments({ data: {
			from: range.from.toISOString(),
			to: range.to.toISOString()
		} }),
		enabled: financeiroLiberado,
		placeholderData: (last) => last
	});
	const rows = (0, import_react.useMemo)(() => (query.data ?? []).filter((payment) => (!search.metodo || payment.metodo === search.metodo) && matchesPaymentSearch(payment, search.q ?? "")), [
		query.data,
		search.metodo,
		search.q
	]);
	const summary = totals(rows);
	function update(patch) {
		const next = {
			...search,
			...patch
		};
		if (next.periodo !== "personalizado") {
			delete next.de;
			delete next.ate;
		}
		if (!next.q) delete next.q;
		if (!next.metodo) delete next.metodo;
		navigate({
			search: next,
			replace: true
		});
	}
	if (!financeiroLiberado) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Pagamentos",
		back: "/financeiro",
		wide: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpgradeNotice, { feature: "financeiro" })
	});
	const periodLabel = periodo === "personalizado" ? `${range.from.toLocaleDateString("pt-BR")} a ${(/* @__PURE__ */ new Date(range.to.getTime() - 1)).toLocaleDateString("pt-BR")}` : FINANCE_PERIOD_LABEL[periodo];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Pagamentos",
		back: "/financeiro",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold text-primary",
						children: "Financeiro"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 text-2xl font-bold",
						children: "Pagamentos recebidos"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: periodLabel
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-6 text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] uppercase tracking-wider text-muted-foreground",
						children: "Total"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xl font-bold tabular-nums text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountUp, {
							value: summary.receita,
							format: brl
						})
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] uppercase tracking-wider text-muted-foreground",
						children: "Pagamentos"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xl font-bold tabular-nums",
						children: summary.pagamentos
					})] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-3 rounded-2xl border border-border bg-card/70 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinancePeriodPicker, {
						value: {
							periodo,
							de: search.de,
							ate: search.ate
						},
						onChange: (next) => update(next)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-1.5",
						role: "group",
						"aria-label": "Forma de pagamento",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MethodChip, {
							active: !search.metodo,
							onClick: () => update({ metodo: void 0 }),
							children: "Todas"
						}), PAYMENT_METHODS.map((method) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MethodChip, {
							active: search.metodo === method,
							onClick: () => update({ metodo: method }),
							children: PAYMENT_LABEL[method]
						}, method))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: search.q ?? "",
								onChange: (event) => update({ q: event.target.value }),
								placeholder: "Placa, cliente ou nº da OS",
								"aria-label": "Buscar pagamentos",
								className: "h-11 pr-10 pl-10"
							}),
							search.q && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Limpar busca",
								onClick: () => update({ q: "" }),
								className: "absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							})
						]
					})
				]
			}),
			query.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 space-y-2",
				children: [
					0,
					1,
					2,
					3
				].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 rounded-2xl" }, item))
			}),
			query.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive",
				children: query.error.message
			}),
			!query.isLoading && rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 rounded-3xl border border-dashed border-border p-8 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "mx-auto size-7 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted-foreground",
					children: "Nenhum pagamento encontrado."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
					initial: false,
					children: rows.map((payment) => {
						const paidAt = new Date(payment.pago_em);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.li, {
							layout: true,
							initial: {
								opacity: 0,
								y: 8
							},
							animate: {
								opacity: 1,
								y: 0
							},
							exit: { opacity: 0 },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/os/$id",
								params: { id: payment.orderId },
								className: "interactive-panel group grid grid-cols-[1fr_auto] items-center gap-3 border border-border bg-card p-4 sm:grid-cols-[110px_1fr_auto_auto]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "hidden text-xs text-muted-foreground sm:block",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-foreground",
											children: paidAt.toLocaleDateString("pt-BR")
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: paidAt.toLocaleTimeString("pt-BR", {
											hour: "2-digit",
											minute: "2-digit"
										}) })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "flex flex-wrap items-center gap-x-2 text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "plate font-bold",
													children: payment.placa ?? "—"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted-foreground",
													children: payment.numero != null ? `OS #${payment.numero}` : ""
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-0.5 truncate text-sm font-medium",
												children: payment.cliente ?? "Cliente não informado"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-0.5 truncate text-[11px] text-muted-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "sm:hidden",
													children: [paidAt.toLocaleDateString("pt-BR"), " · "]
												}), payment.itens.map((item) => item.nome).join(" · ")]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold uppercase text-muted-foreground sm:inline",
										children: PAYMENT_LABEL[payment.metodo] ?? payment.metodo
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1 text-right",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block font-bold tabular-nums",
											children: brl(payment.valor)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-[10px] uppercase text-muted-foreground sm:hidden",
											children: PAYMENT_LABEL[payment.metodo] ?? payment.metodo
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" })]
									})
								]
							})
						}, payment.id);
					})
				})
			})
		]
	});
}
function MethodChip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": active,
		onClick,
		className: `h-8 rounded-full border px-3 text-xs font-semibold transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`,
		children
	});
}
//#endregion
export { PaymentsPage as component };
