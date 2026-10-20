import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Link, useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { getSession, homeSummary, listActiveOrders, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { STATUS_LABEL, brl } from "./plate-C5WvEduv.mjs";
import { useQuery } from "../_libs/tanstack__react-query.mjs";
import { AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { m } from "../_libs/motion.mjs";
import { CountUp } from "./router-BJH1rJwZ.mjs";
import { Button } from "./button-DaOcT_hl.mjs";
import { Camera, Car, ChevronRight, Clock, Wallet } from "../_libs/lucide-react.mjs";
import { AppShell } from "./shell-CXqKyQlN.mjs";
import { Skeleton } from "./skeleton-CZb5vrGH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/home-CmodE6jn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const navigate = useNavigate();
	const session = useServerFn(getSession);
	const summary = useServerFn(homeSummary);
	const orders = useServerFn(listActiveOrders);
	const sessionQuery = useQuery({
		queryKey: ["session"],
		queryFn: () => session()
	});
	const hasTenant = !!sessionQuery.data?.membership;
	(0, import_react.useEffect)(() => {
		if (sessionQuery.isSuccess && !hasTenant) navigate({
			to: "/onboarding",
			replace: true
		});
	}, [
		sessionQuery.isSuccess,
		hasTenant,
		navigate
	]);
	const summaryQuery = useQuery({
		queryKey: ["home-summary"],
		queryFn: () => summary(),
		enabled: hasTenant
	});
	const ordersQuery = useQuery({
		queryKey: ["active-orders"],
		queryFn: () => orders(),
		enabled: hasTenant
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Operação",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
				whileHover: { y: -2 },
				whileTap: { scale: .97 },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "group h-24 w-full rounded-3xl bg-brand text-lg font-bold text-primary-foreground shadow-glow md:h-28",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/atendimento/novo",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "mr-2 size-7 transition-transform group-hover:-rotate-6 group-hover:scale-110" }), "NOVO ATENDIMENTO"]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "reveal-stagger mt-4 grid grid-cols-3 gap-2 md:mt-5 md:gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-4" }),
						label: "Em andamento",
						value: summaryQuery.data?.emAndamento ?? null
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Car, { className: "size-4" }),
						label: "Veículos hoje",
						value: summaryQuery.data?.veiculosDia ?? null
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4" }),
						label: "Caixa hoje",
						value: summaryQuery.data ? Number(summaryQuery.data.faturamentoDia) : null,
						format: brl
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold text-muted-foreground",
					children: "Atendimentos abertos"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/veiculos",
					className: "text-sm text-primary",
					children: "Buscar placa"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-2 lg:grid-cols-2",
				children: [
					ordersQuery.isLoading && [0, 1].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-[74px] rounded-2xl" }, item)),
					ordersQuery.data?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "col-span-full rounded-2xl border border-dashed border-border p-8 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Car, {
								className: "mx-auto size-8 text-muted-foreground",
								strokeWidth: 1.5
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm font-semibold",
								children: "Nenhum atendimento aberto"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: "Toque em Novo atendimento quando o próximo carro chegar."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
						initial: true,
						mode: "popLayout",
						children: ordersQuery.data?.map((o, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
							layout: true,
							initial: {
								opacity: 0,
								y: 16
							},
							animate: {
								opacity: 1,
								y: 0,
								transition: { delay: index * .05 }
							},
							exit: {
								opacity: 0,
								scale: .96
							},
							whileTap: { scale: .98 },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/os/$id",
								params: { id: o.id },
								className: "interactive-panel group flex items-center justify-between gap-3 border border-border bg-card p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "plate text-base",
										children: o.vehicles?.placa ?? "—"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 flex items-center gap-2 text-xs text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusDot, { status: o.status }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											"#",
											o.numero,
											" · ",
											STATUS_LABEL[o.status]
										] })]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1 text-sm font-semibold",
									children: [brl(o.total), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" })]
								})]
							})
						}, o.id))
					})
				]
			})
		]
	});
}
function Stat({ icon, label, value, format }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "interactive-panel min-w-0 border border-border bg-card p-3 md:p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-1 text-primary",
				children: icon
			}),
			value === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-5 w-12" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 truncate text-base font-bold leading-tight tabular-nums md:text-xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountUp, {
					value,
					...format ? { format } : {}
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 truncate text-[10px] text-muted-foreground md:text-[11px]",
				children: label
			})
		]
	});
}
var STATUS_DOT = {
	AGUARDANDO: "bg-muted-foreground",
	EM_LAVAGEM: "bg-primary animate-pulse",
	AGUARDANDO_PAGAMENTO: "bg-warning",
	PAGO: "bg-success"
};
function StatusDot({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		"aria-hidden": "true",
		className: `inline-block size-2 shrink-0 rounded-full ${STATUS_DOT[status] ?? "bg-muted-foreground"}`
	});
}
//#endregion
export { Home as component };
