import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { listVehicles, plateHistory, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { STATUS_LABEL, brl, dateBR, isValidPlate, normalizePlate } from "./plate-C5WvEduv.mjs";
import { useMutation, useQuery } from "../_libs/tanstack__react-query.mjs";
import { toast } from "../_libs/sonner.mjs";
import { AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { m } from "../_libs/motion.mjs";
import { DEFAULT_FILTERS, PERIODS, PERIOD_LABEL, Route$3, SITUATIONS, SITUATION_LABEL, SORTS, SORT_LABEL, activeFilterCount, compactFilters, filterVehicles } from "./router-BJH1rJwZ.mjs";
import { Button } from "./button-DaOcT_hl.mjs";
import { CalendarDays, Car, ChevronRight, Clock3, Search, SlidersHorizontal, X } from "../_libs/lucide-react.mjs";
import { AppShell } from "./shell-CXqKyQlN.mjs";
import { Skeleton } from "./skeleton-CZb5vrGH.mjs";
import { Input } from "./input-DnEHUyw4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/veiculos-CZHXQxQK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Só os filtros diferentes do padrão vão para a URL. */
function Veiculos() {
	const navigate = Route$3.useNavigate();
	const search = Route$3.useSearch();
	const filters = {
		...DEFAULT_FILTERS,
		...search
	};
	const [showFilters, setShowFilters] = (0, import_react.useState)(false);
	const historyFn = useServerFn(plateHistory);
	const listFn = useServerFn(listVehicles);
	const vehiclesQuery = useQuery({
		queryKey: ["vehicles"],
		queryFn: () => listFn()
	});
	const historyMutation = useMutation({
		mutationFn: (selectedPlate) => historyFn({ data: { placa: selectedPlate } }),
		onError: (error) => toast.error(error.message)
	});
	const result = historyMutation.data;
	const all = (0, import_react.useMemo)(() => vehiclesQuery.data ?? [], [vehiclesQuery.data]);
	const filterKey = JSON.stringify(filters);
	const visibleVehicles = (0, import_react.useMemo)(() => filterVehicles(all, JSON.parse(filterKey)), [all, filterKey]);
	const activeCount = activeFilterCount(filters);
	const hasAnyFilter = activeCount > 0 || filters.q.length > 0;
	function update(patch) {
		navigate({
			search: compactFilters({
				...filters,
				...patch
			}),
			replace: true
		});
	}
	function clearFilters() {
		navigate({
			search: {},
			replace: true
		});
	}
	function openVehicle(selectedPlate) {
		historyMutation.mutate(selectedPlate);
		window.scrollTo({
			top: 0,
			behavior: "smooth"
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Veículos",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold text-primary",
					children: "Cadastro de veículos"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 text-2xl font-bold",
					children: "Placas salvas"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm tabular-nums text-muted-foreground",
					children: [hasAnyFilter ? `${visibleVehicles.length} de ${all.length}` : all.length, " veículos"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-5 flex gap-2",
				onSubmit: (event) => {
					event.preventDefault();
					const plate = normalizePlate(filters.q);
					if (isValidPlate(plate)) openVehicle(plate);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: filters.q,
							onChange: (event) => update({ q: event.target.value }),
							placeholder: "Buscar placa ou cliente",
							"aria-label": "Buscar veículos",
							className: "h-13 pr-11 pl-12 text-base"
						}),
						filters.q && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => update({ q: "" }),
							"aria-label": "Limpar busca",
							className: "absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "secondary",
					className: "relative h-13 px-4 lg:hidden",
					"aria-expanded": showFilters,
					onClick: () => setShowFilters((open) => !open),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-5" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Filtros"
						}),
						activeCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground",
							children: activeCount
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
				initial: false,
				animate: showFilters ? {
					height: "auto",
					opacity: 1
				} : {
					height: 0,
					opacity: 0
				},
				transition: {
					duration: .28,
					ease: [
						.2,
						.75,
						.25,
						1
					]
				},
				className: "overflow-hidden lg:!h-auto lg:!overflow-visible lg:!opacity-100",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPanel, {
					filters,
					onChange: update,
					onClear: clearFilters,
					hasAnyFilter
				})
			}),
			historyMutation.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-6 h-40 rounded-3xl" }),
			result && !result.vehicle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground",
				children: [
					"Veículo ",
					result.placa,
					" ainda não cadastrado."
				]
			}),
			result?.vehicle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VehicleHistory, { result }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [
					vehiclesQuery.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 lg:grid-cols-2",
						"aria-label": "Carregando veículos",
						children: [
							0,
							1,
							2,
							3
						].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 rounded-2xl" }, item))
					}),
					vehiclesQuery.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-6 text-sm text-destructive",
						children: vehiclesQuery.error.message
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 lg:grid-cols-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
							initial: false,
							mode: "popLayout",
							children: visibleVehicles.map((vehicle) => {
								const last = vehicle.ultimoAtendimento;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.button, {
									layout: true,
									initial: {
										opacity: 0,
										scale: .97
									},
									animate: {
										opacity: 1,
										scale: 1
									},
									exit: {
										opacity: 0,
										scale: .97
									},
									type: "button",
									onClick: () => openVehicle(vehicle.placa),
									className: "interactive-panel grid w-full gap-4 border border-border bg-card p-5 text-left sm:grid-cols-[1fr_auto] sm:items-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "plate text-xl",
													children: vehicle.placa
												}), last && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary",
													children: STATUS_LABEL[last.status]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-sm text-muted-foreground",
												children: [
													vehicle.marca,
													vehicle.modelo,
													vehicle.cor
												].filter(Boolean).join(" · ") || "Dados do veículo não informados"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-sm font-medium",
												children: vehicle.customers?.nome ?? "Cliente não informado"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [vehicle.totalAtendimentos, " atendimento(s)"] }), last && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-center gap-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-3.5" }),
														" Último em ",
														dateBR(last.created_at)
													]
												})]
											}),
											last && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 truncate text-xs text-muted-foreground",
												children: last.service_order_items.map((item) => item.nome).join(" · ")
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-3 sm:justify-end",
										children: [last && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold tabular-nums",
											children: brl(last.total)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 text-primary" })]
									})]
								}, vehicle.id);
							})
						})
					}),
					!vehiclesQuery.isLoading && visibleVehicles.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 rounded-3xl border border-dashed border-border p-8 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Car, { className: "mx-auto size-7 text-muted-foreground" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted-foreground",
								children: hasAnyFilter ? "Nenhum veículo corresponde aos filtros." : "Nenhum veículo cadastrado ainda."
							}),
							hasAnyFilter && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								className: "mt-4",
								onClick: clearFilters,
								children: "Limpar filtros"
							})
						]
					})
				]
			})
		]
	});
}
function FilterPanel({ filters, onChange, onClear, hasAnyFilter }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 grid gap-4 rounded-2xl border border-border bg-card/70 p-4 lg:grid-cols-[auto_1fr_auto] lg:items-start lg:gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FilterGroup, {
				label: "Última visita",
				children: [PERIODS.map((period) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
					active: filters.periodo === period,
					onClick: () => onChange({ periodo: period }),
					children: [period === "personalizado" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-3.5" }), PERIOD_LABEL[period]]
				}, period)), filters.periodo === "personalizado" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex w-full items-center gap-2 pt-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							"aria-label": "De",
							value: filters.de ?? "",
							onChange: (event) => onChange({ de: event.target.value || void 0 }),
							className: "h-9 text-xs"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "até"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							"aria-label": "Até",
							value: filters.ate ?? "",
							onChange: (event) => onChange({ ate: event.target.value || void 0 }),
							className: "h-9 text-xs"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterGroup, {
				label: "Situação",
				children: SITUATIONS.map((situation) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					active: filters.situacao === situation,
					onClick: () => onChange({ situacao: situation }),
					children: SITUATION_LABEL[situation]
				}, situation))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end gap-3 lg:flex-col lg:items-stretch",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
					children: ["Ordenar por", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: filters.ordem,
						onChange: (event) => onChange({ ordem: event.target.value }),
						className: "h-9 rounded-xl border border-border bg-background px-3 text-xs font-normal normal-case tracking-normal text-foreground",
						children: SORTS.map((sort) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: sort,
							children: SORT_LABEL[sort]
						}, sort))
					})]
				}), hasAnyFilter && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: onClear,
					className: "flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" }), " Limpar filtros"]
				})]
			})
		]
	});
}
function FilterGroup({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
			className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1.5 flex flex-wrap gap-1.5",
			children
		})]
	});
}
function Chip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": active,
		onClick,
		className: `flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`,
		children
	});
}
function VehicleHistory({ result }) {
	if (!result.vehicle) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-6 space-y-4 border-b border-border/60 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-3xl border border-primary/30 bg-card p-5 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "plate text-2xl",
						children: result.vehicle.placa
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: [
							result.vehicle.marca,
							result.vehicle.modelo,
							result.vehicle.cor
						].filter(Boolean).join(" · ") || "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm font-semibold",
						children: result.vehicle.customers?.nome ?? "Sem cliente"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: result.vehicle.customers?.telefone ?? "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm",
						children: [
							result.stats?.total ?? 0,
							" atendimentos · gasto total ",
							brl(result.stats?.totalGasto ?? 0)
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-semibold text-muted-foreground",
				children: "Histórico da placa"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [result.history.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/os/$id",
					params: { id: order.id },
					className: "block rounded-2xl border border-border/60 bg-card p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-semibold",
								children: ["#", order.numero]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm",
								children: brl(order.total)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: [
								dateBR(order.created_at),
								" · ",
								STATUS_LABEL[order.status]
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: (order.service_order_items ?? []).map((item) => item.nome).join(", ") || "—"
						})
					]
				}, order.id)), result.history.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Nenhum atendimento ainda."
				})]
			})
		]
	});
}
//#endregion
export { Veiculos as component };
