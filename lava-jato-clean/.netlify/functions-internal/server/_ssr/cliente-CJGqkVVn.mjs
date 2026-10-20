import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { clientPortalLogin, searchPublicTenants, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { brl, dateBR, normalizePlate } from "./plate-C5WvEduv.mjs";
import { useMutation, useQuery } from "../_libs/tanstack__react-query.mjs";
import { m } from "../_libs/motion.mjs";
import { Reveal, getDemoBusiness, isDemoEnabled } from "./router-BJH1rJwZ.mjs";
import { WashBrand, WashHoseBackdrop } from "./wash-hose-backdrop-NFnLurD2.mjs";
import { TenantLogo } from "./tenant-logo-B6jOuKk0.mjs";
import { ArrowRight, Building2, Car, Check, ChevronDown, CircleCheckBig, Clock3, Copy, LogOut, Phone, QrCode, ReceiptText, RefreshCw, Search, Wrench } from "../_libs/lucide-react.mjs";
import { PlateBadge } from "./plate-badge-BdINDfHE.mjs";
import { BUSINESS_DAYS, formatBusinessDay, normalizeBusinessHours, todayBusinessDayKey } from "./business-hours-CNCSnIUh.mjs";
import { OrderTimeline } from "./order-timeline-CEUvHlFy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cliente-CJGqkVVn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CLIENT_STATUS_LABEL = {
	AGUARDANDO: "Aguardando início",
	EM_LAVAGEM: "Em serviço",
	EM_FINALIZACAO: "Em serviço",
	FINALIZADO: "Pronto para retirada — aguardando pagamento",
	AGUARDANDO_PAGAMENTO: "Pronto para retirada — aguardando pagamento",
	PAGO: "Pagamento confirmado",
	ENTREGUE: "Veículo entregue",
	CANCELADO: "Cancelado"
};
function tenantSearchText(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}
function ClientBusinessHours({ value, legacyValue }) {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const hours = normalizeBusinessHours(value);
	if (!hours) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "mt-2 flex items-center gap-2 text-xs text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-3.5 shrink-0 text-primary" }), legacyValue || "Horários não informados"]
	});
	const todayKey = todayBusinessDayKey();
	const today = BUSINESS_DAYS.find(({ key }) => key === todayKey);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 max-w-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "group flex w-full items-center gap-2 rounded-xl py-1 text-left text-xs text-muted-foreground transition-colors hover:text-primary",
			onClick: () => setExpanded((current) => !current),
			"aria-expanded": expanded,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-3.5 shrink-0 text-primary" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					"Hoje (",
					today.shortLabel,
					") · ",
					formatBusinessDay(hours[todayKey])
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `size-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}` })
			]
		}), expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 grid gap-1.5 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-xl sm:min-w-72",
			children: BUSINESS_DAYS.map(({ key, shortLabel }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex items-center justify-between gap-6 text-xs ${key === todayKey ? "text-primary" : "text-muted-foreground"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-semibold",
					children: shortLabel
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatBusinessDay(hours[key]) })]
			}, key))
		}) : null]
	});
}
function ClientPortal() {
	const login = useServerFn(clientPortalLogin);
	const searchTenants = useServerFn(searchPublicTenants);
	const [tenantSearch, setTenantSearch] = (0, import_react.useState)("");
	const deferredTenantSearch = (0, import_react.useDeferredValue)(tenantSearch);
	const [selectedTenant, setSelectedTenant] = (0, import_react.useState)(null);
	const [placa, setPlaca] = (0, import_react.useState)("");
	const [telefone, setTelefone] = (0, import_react.useState)("");
	const [accessToken, setAccessToken] = (0, import_react.useState)(null);
	const demoBusiness = getDemoBusiness();
	const mutation = useMutation({
		mutationFn: () => login({ data: {
			tenantId: selectedTenant?.id,
			placa,
			telefone
		} }),
		onSuccess: (data) => setAccessToken(data.accessToken)
	});
	const tenantsQuery = useQuery({
		queryKey: ["public-tenants", deferredTenantSearch.trim().toLocaleLowerCase("pt-BR")],
		queryFn: () => searchTenants({ data: { query: deferredTenantSearch } }),
		enabled: !selectedTenant && deferredTenantSearch.trim().length >= 2,
		staleTime: 6e4
	});
	const normalizedSearch = tenantSearchText(deferredTenantSearch.trim());
	const tenantOptions = [...demoBusiness && (tenantSearchText(demoBusiness.nome).includes(normalizedSearch) || demoBusiness.slug.includes(normalizedSearch)) ? [demoBusiness] : [], ...(tenantsQuery.data ?? []).filter((tenant) => tenant.id !== demoBusiness?.id)];
	const liveQuery = useQuery({
		queryKey: ["client-portal-live", accessToken],
		queryFn: () => login({ data: { accessToken } }),
		enabled: accessToken !== null,
		refetchInterval: (query) => {
			return (query.state.data?.orders ?? []).some((order) => !["ENTREGUE", "CANCELADO"].includes(order.status)) ? 5e3 : false;
		},
		refetchIntervalInBackground: false
	});
	const portalData = accessToken ? liveQuery.data ?? mutation.data : mutation.data;
	if (portalData) {
		const data = portalData;
		const displayedTenant = selectedTenant ?? data.tenant;
		const activeOrder = data.orders.find((order) => !["ENTREGUE", "CANCELADO"].includes(order.status));
		const activeStatus = activeOrder?.status;
		const readyForPickup = activeStatus === "FINALIZADO" || activeStatus === "AGUARDANDO_PAGAMENTO";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-screen min-h-dvh bg-hero",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashHoseBackdrop, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "wash-header border-b border-border/60 bg-background/95 px-5 py-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto flex max-w-5xl items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashBrand, { suffix: "CLIENTE" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 flex items-center gap-2 text-sm font-semibold",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TenantLogo, {
										url: data.tenant?.logo_url ?? displayedTenant?.logo_url,
										name: displayedTenant?.nome ?? "lava-jato",
										className: "size-7",
										fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4 text-primary" })
									}),
									" ",
									displayedTenant?.nome
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: displayedTenant?.endereco ?? "Endereço não informado"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientBusinessHours, {
								value: data.tenant?.business_hours,
								legacyValue: data.tenant?.horario
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								setAccessToken(null);
								mutation.reset();
							},
							className: "flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), " SAIR"]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "page-enter mx-auto max-w-5xl px-5 py-8 md:py-12",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-8 md:grid-cols-[1.25fr_0.75fr]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted-foreground",
									children: [
										"Olá, ",
										data.customer?.nome,
										" 👋"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									className: "sr-only",
									children: ["Veículo ", data.vehicle.placa]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
									initial: {
										opacity: 0,
										y: 16,
										rotate: -2
									},
									animate: {
										opacity: 1,
										y: 0,
										rotate: 0
									},
									transition: {
										type: "spring",
										stiffness: 220,
										damping: 20
									},
									className: "mt-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateBadge, {
										plate: data.vehicle.placa,
										size: "lg"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-muted-foreground",
									children: [
										data.vehicle.marca,
										data.vehicle.modelo,
										data.vehicle.cor
									].filter(Boolean).join(" · ")
								}),
								activeOrder ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "relative flex size-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex size-2 rounded-full bg-primary" })]
										}),
										"AO VIVO · atualiza sozinho",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `size-3 ${liveQuery.isFetching ? "animate-spin" : "opacity-60"}` })
									]
								}) : null
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "reveal-stagger grid h-fit grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
										label: "ATENDIMENTOS",
										value: String(data.summary.totalOrders)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
										label: "TOTAL PAGO",
										value: brl(data.summary.totalSpent)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
										label: "ÚLTIMA VISITA",
										value: dateBR(data.summary.lastVisit),
										wide: true
									})
								]
							})]
						}),
						activeOrder ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
							className: "mt-10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "overflow-hidden rounded-3xl border border-primary/50 bg-card shadow-glow",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-start justify-between gap-4 bg-brand px-5 py-4 text-primary-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-bold",
										children: readyForPickup ? "VEÍCULO PRONTO PARA RETIRADA" : "ATENDIMENTO EM CURSO"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
										className: "mt-1 text-2xl font-bold",
										children: ["#", activeOrder.numero]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "rounded-xl border border-primary-foreground/30 bg-background/15 px-3 py-2 text-xs font-bold",
										children: CLIENT_STATUS_LABEL[activeOrder.status]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-5 md:p-7",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderTimeline, {
											status: activeOrder.status,
											title: "Onde está o seu carro"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickupNotice, {
											status: activeOrder.status,
											pix: data.pix
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-7 grid gap-5 border-t border-border/60 pt-5 md:grid-cols-[1fr_auto]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Serviços"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-3 space-y-2",
												children: activeOrder.service_order_items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-sm",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "size-4 text-primary" }), item.nome]
												}, item.id))
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "md:text-right",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children: "Total"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-2 text-3xl font-bold tabular-nums",
													children: brl(activeOrder.total)
												})]
											})]
										})
									]
								})]
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-10 flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Car, {
								className: "size-8 shrink-0 text-primary",
								strokeWidth: 1.5
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "Nenhum atendimento em andamento"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: "Quando o seu carro chegar ao lava-jato, o andamento aparece aqui."
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-end justify-between border-b border-border/60 pb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-semibold text-primary",
									children: "Histórico"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-1 text-2xl font-bold",
									children: "Serviços realizados"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptText, { className: "size-6 text-muted-foreground" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "reveal-stagger mt-3 divide-y divide-border rounded-2xl border border-border bg-card px-5",
								children: [data.orders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "grid gap-4 py-5 md:grid-cols-[110px_1fr_140px]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: ["#", order.numero]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm",
											children: dateBR(order.created_at)
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-primary",
											children: CLIENT_STATUS_LABEL[order.status]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-sm text-muted-foreground",
											children: order.service_order_items.map((item) => item.nome).join(" · ")
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-lg font-bold tabular-nums md:text-right",
											children: brl(order.total)
										})
									]
								}, order.id)), data.orders.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "py-6 text-sm text-muted-foreground",
									children: "Nenhum serviço encontrado."
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
							className: "mt-12 grid gap-3 border-t border-border/60 pt-5 text-xs text-muted-foreground md:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-4" }), displayedTenant?.telefone ?? data.tenant?.telefone ?? "Telefone não informado"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "md:text-right",
								children: displayedTenant?.endereco ?? "Endereço não informado"
							})]
						})
					]
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-enter min-h-screen min-h-dvh bg-hero",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashHoseBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "wash-header border-b border-border/60 bg-background/95 px-5 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-5xl items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						"aria-label": "Voltar para a página inicial",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashBrand, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/auth",
						className: "text-xs text-muted-foreground hover:text-primary",
						children: "ACESSO DO PROPRIETÁRIO"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto grid min-h-[calc(100vh-65px)] max-w-5xl items-center gap-6 px-5 py-8 md:grid-cols-2 md:py-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex h-full flex-col justify-between rounded-3xl border border-border/60 bg-card p-6 shadow-card md:p-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Car, {
							className: "size-9 text-primary",
							strokeWidth: 1.5
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "mt-8 text-[clamp(2.65rem,12vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.07em]",
							children: [
								"Acompanhe",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"seu carro."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-6 max-w-md text-sm leading-6 text-muted-foreground",
							children: "Consulte o andamento da lavagem, os serviços realizados e o histórico completo do veículo."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-12 grid grid-cols-3 overflow-hidden rounded-2xl border border-border/60 bg-secondary/50 text-center text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-r border-border/60 p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "mx-auto mb-2 size-4" }), "STATUS"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-r border-border/60 p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "mx-auto mb-2 size-4" }), "SERVIÇOS"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptText, { className: "mx-auto mb-2 size-4" }), "HISTÓRICO"]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "flex items-center rounded-3xl border border-border/60 bg-card p-6 shadow-card md:p-10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "w-full",
						onSubmit: (event) => {
							event.preventDefault();
							mutation.mutate();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold text-primary",
								children: "Área do cliente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-2 text-2xl font-bold",
								children: "Entrar"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: "Primeiro escolha a empresa. Depois use a placa e o telefone informados no atendimento."
							}),
							isDemoEnabled() && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									const tenant = demoBusiness ?? {
										id: "demo-tenant",
										slug: "lavapro-demonstracao",
										nome: "LavaPro Demonstração",
										endereco: "Fortaleza - CE",
										logo_url: null
									};
									setSelectedTenant(tenant);
									setTenantSearch(tenant.nome);
									setPlaca("ABC1D23");
									setTelefone("85999991234");
									mutation.reset();
								},
								className: "mt-6 w-full rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left text-sm text-primary hover:bg-primary/15",
								children: "PREENCHER ACESSO DE DEMONSTRAÇÃO"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-7",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-bold tracking-[0.14em] text-primary",
									children: "01 / LAVA-JATO"
								}), selectedTenant ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-start gap-3 rounded-2xl border border-primary/45 bg-primary/10 p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "truncate text-sm font-bold",
												children: selectedTenant.nome
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 truncate text-xs text-muted-foreground",
												children: selectedTenant.endereco ?? "Endereço não informado"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												setSelectedTenant(null);
												setTenantSearch("");
												mutation.reset();
											},
											className: "rounded-xl border border-border/70 px-3 py-2 text-[10px] font-bold text-muted-foreground hover:border-primary/50 hover:text-primary",
											children: "TROCAR"
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative mt-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-4 left-4 size-5 text-muted-foreground" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: tenantSearch,
											onChange: (event) => {
												setTenantSearch(event.target.value);
												mutation.reset();
											},
											placeholder: "Digite o nome ou código do lava-jato",
											autoComplete: "organization",
											className: "h-14 w-full rounded-xl border border-input bg-background/40 pr-4 pl-12 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
										}),
										tenantSearch.trim().length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-border bg-background p-2 shadow-card",
											children: tenantsQuery.isFetching ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "p-3 text-xs text-muted-foreground",
												children: "Buscando lava-jatos..."
											}) : tenantOptions.length ? tenantOptions.map((tenant) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => {
													setSelectedTenant(tenant);
													setTenantSearch(tenant.nome);
													mutation.reset();
												},
												className: "flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-secondary",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TenantLogo, {
													url: tenant.logo_url,
													name: tenant.nome,
													className: "size-9",
													fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "mt-0.5 size-5 shrink-0 text-primary" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block truncate text-sm font-semibold",
														children: tenant.nome
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "mt-1 block truncate text-xs text-muted-foreground",
														children: tenant.endereco ?? `Código: ${tenant.slug}`
													})]
												})]
											}, tenant.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "p-3 text-xs leading-5 text-muted-foreground",
												children: "Nenhum lava-jato encontrado. Confirme o nome com o estabelecimento."
											})
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-7 text-[10px] font-bold tracking-[0.14em] text-primary",
								children: "02 / SEUS DADOS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mt-3 block text-sm font-medium",
								htmlFor: "client-plate",
								children: "PLACA DO VEÍCULO"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "client-plate",
								value: placa,
								onChange: (event) => setPlaca(normalizePlate(event.target.value).slice(0, 7)),
								placeholder: "ABC1D23",
								autoComplete: "off",
								className: "mt-2 h-14 w-full rounded-xl border border-input bg-background/40 px-4 text-lg uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
								required: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mt-5 block text-sm font-medium",
								htmlFor: "client-phone",
								children: "TELEFONE"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "client-phone",
								value: telefone,
								onChange: (event) => setTelefone(event.target.value),
								placeholder: "(85) 99999-1234",
								inputMode: "tel",
								autoComplete: "tel",
								className: "mt-2 h-14 w-full rounded-xl border border-input bg-background/40 px-4 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
								required: true
							}),
							mutation.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive",
								children: mutation.error.message
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								disabled: mutation.isPending || !selectedTenant || placa.length < 6 || telefone.length < 8,
								className: "mt-6 flex h-14 w-full items-center justify-between rounded-xl bg-brand px-4 font-bold text-primary-foreground shadow-glow disabled:opacity-40",
								children: [mutation.isPending ? "CONSULTANDO..." : "ACESSAR MEUS SERVIÇOS", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-5" })]
							})
						]
					})
				})]
			})
		]
	});
}
function Metric({ label, value, wide }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `p-4 ${wide ? "col-span-2 border-t border-border/60" : "border-r border-border/60 last:border-r-0"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-lg font-bold tabular-nums",
			children: value
		})]
	});
}
function PickupNotice({ status, pix }) {
	if (status === "FINALIZADO" || status === "AGUARDANDO_PAGAMENTO") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5 flex gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "mt-0.5 size-5 shrink-0 text-warning" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-semibold",
				children: "Seu veículo está pronto para retirada."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm leading-5 text-muted-foreground",
				children: pix ? "O serviço foi concluído. Pague via PIX agora ou no lava-jato e retire o veículo." : "O serviço foi concluído. Faça o pagamento no lava-jato e retire o veículo."
			}),
			pix ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PixPaymentCard, { pix }) : null
		] })]
	});
	return null;
}
function PixPaymentCard({ pix }) {
	const [showQrCode, setShowQrCode] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(null);
	async function copyPix(value, type) {
		await navigator.clipboard.writeText(value);
		setCopied(type);
		window.setTimeout(() => setCopied(null), 2e3);
	}
	if (!showQrCode) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => setShowQrCode(true),
		className: "mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 font-semibold text-primary-foreground shadow-glow",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "size-5" }), " Pagar com PIX"]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 rounded-2xl border border-border/60 bg-card p-4 text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid items-center gap-5 sm:grid-cols-[180px_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: pix.qrCodeDataUrl,
					alt: "QR Code PIX para pagamento do serviço",
					className: "mx-auto aspect-square w-full max-w-[180px] rounded-xl bg-white p-2"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 rounded-xl border border-border/70 bg-background/60 p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted-foreground",
							children: "Chave PIX"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 break-all text-sm font-semibold",
							children: pix.key
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => copyPix(pix.key, "key"),
							className: "mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/15 active:scale-[0.98]",
							children: [copied === "key" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), copied === "key" ? "Chave copiada" : "Copiar chave PIX"]
						})
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Valor do PIX"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-2xl font-bold tabular-nums",
						children: brl(pix.amount)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-muted-foreground",
						children: "Recebedor"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm font-semibold",
						children: pix.receiverName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => copyPix(pix.copiaECola, "code"),
						className: "mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 text-sm font-semibold text-primary",
						children: [copied === "code" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), copied === "code" ? "Código copiado" : "Copiar código PIX"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs leading-5 text-muted-foreground",
						children: "No celular, copie o código e cole na opção “PIX Copia e Cola” do aplicativo do seu banco."
					})
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptText, { className: "mt-0.5 size-5 shrink-0 text-warning" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold",
					children: "Após pagar, envie o comprovante ao lava-jato."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs leading-5 text-muted-foreground",
					children: "Isso ajuda a confirmar o pagamento e liberar a retirada do veículo mais rápido."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs leading-5 text-muted-foreground",
				children: "O status será atualizado automaticamente após a confirmação do lava-jato."
			})
		]
	});
}
//#endregion
export { ClientPortal as component };
