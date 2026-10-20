import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { financialSummary, getPixSettings, listPayments, updatePixSettings, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { PAYMENT_LABEL, brl } from "./plate-C5WvEduv.mjs";
import { useMutation, useQuery, useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { toast } from "../_libs/sonner.mjs";
import { AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { m } from "../_libs/motion.mjs";
import { CountUp, comparisonLabel, comparisonRange, formatDay, paymentsInRange, periodRange, revenueByDay, revenueByMethod, serviceStats, totals, variation } from "./router-BJH1rJwZ.mjs";
import { Button } from "./button-DaOcT_hl.mjs";
import { ArrowRight, ArrowUpRight, Banknote, Car, FileSpreadsheet, FileText, LoaderCircle, Lock, Pin, QrCode, ReceiptText, Save, TrendingDown, TrendingUp, WalletCards, X } from "../_libs/lucide-react.mjs";
import { AppShell, UpgradeNotice, useFeature } from "./shell-CXqKyQlN.mjs";
import { Skeleton } from "./skeleton-CZb5vrGH.mjs";
import { Input } from "./input-DnEHUyw4.mjs";
import { Label } from "./label-DgAlJVOt.mjs";
import { FinancePeriodPicker } from "./finance-period-picker-C6g4CUsr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/financeiro-B23RMa7k.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var WEEKDAY = [
	"Dom",
	"Seg",
	"Ter",
	"Qua",
	"Qui",
	"Sex",
	"Sáb"
];
/** Receita interativa: período, comparação, gráfico por dia, serviços e formas de pagamento. */
function RevenueInsights() {
	const loadPayments = useServerFn(listPayments);
	const [period, setPeriod] = (0, import_react.useState)({ periodo: "30d" });
	const [rankBy, setRankBy] = (0, import_react.useState)("receita");
	const range = periodRange(period.periodo, /* @__PURE__ */ new Date(), period);
	const previous = comparisonRange(period.periodo, range);
	const comparison = comparisonLabel(period.periodo, range);
	const rangeKey = `${formatDay(previous.from)}_${formatDay(range.to)}`;
	const query = useQuery({
		queryKey: ["payments", rangeKey],
		queryFn: () => loadPayments({ data: {
			from: previous.from.toISOString(),
			to: range.to.toISOString()
		} }),
		placeholderData: (last) => last
	});
	const analysis = (0, import_react.useMemo)(() => {
		const all = query.data ?? [];
		const current = paymentsInRange(all, range);
		const before = paymentsInRange(all, previous);
		return {
			current,
			now: totals(current),
			before: totals(before),
			days: revenueByDay(current, range),
			methods: revenueByMethod(current),
			services: serviceStats(current, rankBy)
		};
	}, [
		query.data,
		rangeKey,
		rankBy
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-6 space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold text-primary",
					children: "Análise de receita"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 text-xl font-bold",
					children: "O que está entrando"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinancePeriodPicker, {
					value: period,
					onChange: setPeriod
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Receita",
						comparison,
						value: analysis.now.receita,
						format: brl,
						change: variation(analysis.now.receita, analysis.before.receita),
						loading: query.isLoading
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Pagamentos",
						comparison,
						value: analysis.now.pagamentos,
						change: variation(analysis.now.pagamentos, analysis.before.pagamentos),
						loading: query.isLoading
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Ticket médio",
						comparison,
						value: analysis.now.ticketMedio,
						format: brl,
						change: variation(analysis.now.ticketMedio, analysis.before.ticketMedio),
						loading: query.isLoading
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Receita por dia",
				hint: "Passe o mouse para ver o dia · clique na barra para fixar (clique de novo para soltar)",
				children: query.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-5 h-56 rounded-xl" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayChart, { days: analysis.days })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-[1.25fr_0.75fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Serviços",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex rounded-full border border-border p-0.5 text-[11px] font-semibold",
						children: [["receita", "Mais retorno"], ["usos", "Mais usados"]].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": rankBy === key,
							onClick: () => setRankBy(key),
							className: `relative rounded-full px-3 py-1.5 transition-colors ${rankBy === key ? "text-primary-foreground" : "text-muted-foreground"}`,
							children: [rankBy === key && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
								layoutId: "rank-toggle",
								className: "absolute inset-0 rounded-full bg-primary"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "relative",
								children: label
							})]
						}, key))
					}),
					children: analysis.services.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-4 space-y-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
							initial: false,
							children: analysis.services.map((service, index) => {
								const share = rankBy === "usos" ? service.shareUsos : service.shareReceita;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.li, {
									layout: true,
									initial: {
										opacity: 0,
										y: 8
									},
									animate: {
										opacity: 1,
										y: 0
									},
									className: "rounded-xl border border-border/60 bg-background/40 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "truncate text-sm font-semibold",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mr-2 text-xs tabular-nums text-muted-foreground",
													children: String(index + 1).padStart(2, "0")
												}), service.nome]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 text-[11px] text-muted-foreground",
												children: [
													service.usos,
													" ",
													service.usos === 1 ? "uso" : "usos",
													" ·",
													" ",
													brl(service.ticket),
													" cada"
												]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-right",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-bold tabular-nums",
												children: brl(service.receita)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[11px] tabular-nums text-primary",
												children: [
													Math.round(share * 100),
													"%",
													" ",
													rankBy === "usos" ? "dos usos" : "da receita"
												]
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
											className: "h-full rounded-full bg-brand",
											initial: { width: 0 },
											animate: { width: `${Math.max(2, share * 100)}%` },
											transition: {
												type: "spring",
												stiffness: 120,
												damping: 20
											}
										})
									})]
								}, service.nome);
							})
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Formas de pagamento",
					children: [analysis.methods.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-4",
						children: analysis.methods.map((method) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: PAYMENT_LABEL[method.metodo] ?? method.metodo }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold tabular-nums",
								children: brl(method.receita)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-1.5 flex-1 overflow-hidden rounded-full bg-secondary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
									className: "h-full rounded-full bg-brand",
									initial: { width: 0 },
									animate: { width: `${Math.max(2, method.share * 100)}%` },
									transition: {
										type: "spring",
										stiffness: 120,
										damping: 20
									}
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "w-16 text-right text-[11px] tabular-nums text-muted-foreground",
								children: [
									Math.round(method.share * 100),
									"% · ",
									method.pagamentos
								]
							})]
						})] }, method.metodo))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/financeiro/pagamentos",
						search: {
							periodo: period.periodo,
							...period.periodo === "personalizado" ? {
								de: period.de,
								ate: period.ate
							} : {}
						},
						className: "mt-5 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary",
						children: ["Ver todos os pagamentos do período ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
					})]
				})]
			})
		]
	});
}
function DayChart({ days }) {
	const [hovered, setHovered] = (0, import_react.useState)(null);
	const [pinned, setPinned] = (0, import_react.useState)(null);
	const max = Math.max(1, ...days.map((day) => day.receita));
	const dense = days.length > 14;
	const shownDay = hovered ?? pinned;
	const active = days.find((day) => day.day === shownDay) ?? null;
	const isPinnedShown = active !== null && active.day === pinned && hovered === null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-7 text-xs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
					mode: "wait",
					initial: false,
					children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
						initial: {
							opacity: 0,
							y: 4
						},
						animate: {
							opacity: 1,
							y: 0
						},
						exit: { opacity: 0 },
						transition: { duration: .15 },
						className: `inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1 ${isPinnedShown ? "bg-primary/10 ring-1 ring-primary/40" : ""}`,
						children: [
							isPinnedShown && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, {
								className: "size-3.5 text-primary",
								"aria-label": "Fixado"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-semibold",
								children: [
									WEEKDAY[active.date.getDay()],
									", ",
									active.date.toLocaleDateString("pt-BR")
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-primary tabular-nums",
								children: brl(active.receita)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground",
								children: [
									active.pagamentos,
									" ",
									active.pagamentos === 1 ? "pagamento" : "pagamentos"
								]
							}),
							active.pagamentos > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/financeiro/pagamentos",
								search: {
									periodo: "personalizado",
									de: active.day,
									ate: active.day
								},
								className: "font-semibold text-primary underline-offset-2 hover:underline",
								children: "Ver pagamentos"
							}),
							isPinnedShown && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setPinned(null),
								"aria-label": "Soltar o dia fixado",
								className: "rounded-full p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
							})
						]
					}, active.day) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.p, {
						initial: { opacity: 0 },
						animate: { opacity: 1 },
						className: "px-2 py-1 text-muted-foreground",
						children: ["Maior dia: ", brl(Math.max(0, ...days.map((day) => day.receita)))]
					}, "hint")
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex h-48 items-end gap-[3px] sm:gap-1",
				onMouseLeave: () => setHovered(null),
				onKeyDown: (event) => {
					if (event.key === "Escape") setPinned(null);
				},
				children: days.map((day, index) => {
					const isPinned = pinned === day.day;
					const isHovered = hovered === day.day;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": `${day.date.toLocaleDateString("pt-BR")}: ${brl(day.receita)}`,
						"aria-pressed": isPinned,
						onMouseEnter: () => setHovered(day.day),
						onFocus: () => setHovered(day.day),
						onBlur: () => setHovered(null),
						onClick: () => setPinned(isPinned ? null : day.day),
						className: "group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
							className: `w-full rounded-t-md transition-colors ${isPinned ? "bg-primary shadow-glow" : isHovered ? "bg-primary/85" : day.receita ? "bg-primary/50" : "bg-border"}`,
							initial: { height: 0 },
							animate: { height: `${Math.max(2, day.receita / max * 100)}%` },
							transition: {
								type: "spring",
								stiffness: 140,
								damping: 20,
								delay: index * .01
							}
						})
					}, day.day);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex gap-[3px] sm:gap-1",
				children: days.map((day, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `min-w-0 flex-1 truncate text-center text-[9px] ${pinned === day.day ? "font-bold text-primary" : "text-muted-foreground"}`,
					children: dense ? index % Math.ceil(days.length / 8) === 0 || pinned === day.day ? day.date.getDate() : "" : WEEKDAY[day.date.getDay()]
				}, day.day))
			})
		]
	});
}
function Kpi({ label, value, format, change, comparison, loading }) {
	const up = (change ?? 0) >= 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-card p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
				children: label
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-7 w-28" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-2xl font-bold tabular-nums",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountUp, {
					value,
					...format ? { format } : {}
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `mt-1 flex items-center gap-1 text-[11px] ${change === null ? "text-muted-foreground" : up ? "text-success" : "text-destructive"}`,
				children: change === null ? "sem dados no período de comparação" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					up ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "size-3.5" }),
					up ? "+" : "",
					change.toFixed(0),
					"% ",
					comparison
				] })
			})
		]
	});
}
function Panel({ title, hint, action, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-card p-5 md:p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-sm font-bold",
				children: title
			}), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-[11px] text-muted-foreground",
				children: hint
			})] }), action]
		}), children]
	});
}
function Empty() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-6 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground",
		children: "Nenhum pagamento neste período."
	});
}
var METHOD_LABEL = {
	PIX: "PIX",
	CREDITO: "Crédito",
	DEBITO: "Débito",
	DINHEIRO: "Dinheiro",
	OUTRO: "Outro"
};
function reportFilename(period, extension) {
	return `balanco-${period.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()}.${extension}`;
}
async function exportMonthlyExcel(data) {
	const { default: writeXlsxFile } = await import("../_libs/write-excel-file.mjs").then((n) => n.browser_exports);
	const moneyCell = (value) => ({
		value,
		type: Number,
		format: "R$ #,##0.00",
		align: "right"
	});
	const section = (title) => [
		{
			value: title,
			columnSpan: 3,
			fontWeight: "bold",
			textColor: "#09CBD2",
			backgroundColor: "#0D1B2A"
		},
		null,
		null
	];
	const header = (values) => values.map((value) => ({
		value,
		fontWeight: "bold",
		backgroundColor: "#DCE7EC"
	}));
	await writeXlsxFile([
		[
			{
				value: "BALANÇO MENSAL - LAVAPRO",
				columnSpan: 3,
				fontWeight: "bold",
				fontSize: 16,
				backgroundColor: "#09CBD2",
				textColor: "#061622"
			},
			null,
			null
		],
		["Período", data.periodo.titulo],
		["Gerado em", {
			value: new Date(data.periodo.geradoEm),
			type: Date,
			format: "dd/mm/yyyy hh:mm"
		}],
		[],
		section("RESUMO"),
		["Faturamento do mês", moneyCell(data.faturamentoMes)],
		["Ticket médio", moneyCell(data.ticketMedio)],
		["Veículos atendidos no mês", data.veiculosMes],
		["Pagamentos recebidos", data.pagosOuEntregues],
		["Atendimentos em andamento", data.emAndamento],
		[],
		section("FORMAS DE PAGAMENTO"),
		header(["Método", "Valor"]),
		...data.porMetodo.length ? data.porMetodo.map((item) => [METHOD_LABEL[item.metodo] ?? item.metodo, moneyCell(item.valor)]) : [["Nenhum pagamento registrado no período."]],
		[],
		section("SERVIÇOS COM MAIOR SAÍDA"),
		header([
			"Serviço",
			"Execuções",
			"Valor"
		]),
		...data.topServicos.length ? data.topServicos.map((service) => [
			service.nome,
			service.qtd,
			moneyCell(service.valor)
		]) : [["Nenhum serviço pago no período."]]
	], {
		sheet: "Balanço mensal",
		columns: [
			{ width: 36 },
			{ width: 22 },
			{ width: 24 }
		],
		stickyRowsCount: 3,
		showGridLines: false
	}).toFile(reportFilename(data.periodo.titulo, "xlsx"));
}
async function exportMonthlyPdf(data) {
	const [pdfMakeModule, pdfFontsModule] = await Promise.all([import("../_libs/pdfmake.mjs").then((n) => /* @__PURE__ */ __toESM(n.require_pdfmake())), import("../_libs/pdfmake.mjs").then((n) => /* @__PURE__ */ __toESM(n.require_vfs_fonts()))]);
	const pdfMake = pdfMakeModule.default;
	pdfMake.addVirtualFileSystem(pdfFontsModule.default);
	const money = (value) => new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL"
	}).format(value);
	const tableLayout = {
		fillColor: (rowIndex) => rowIndex === 0 ? "#0D1B2A" : null,
		hLineColor: "#D7E0E7",
		vLineColor: "#D7E0E7",
		paddingLeft: () => 8,
		paddingRight: () => 8,
		paddingTop: () => 6,
		paddingBottom: () => 6
	};
	const headerCell = (text) => ({
		text,
		bold: true,
		color: "#09CBD2"
	});
	const documentDefinition = {
		pageSize: "A4",
		pageMargins: [
			40,
			48,
			40,
			48
		],
		defaultStyle: {
			font: "Roboto",
			fontSize: 10,
			color: "#15212D"
		},
		content: [
			{
				stack: [{
					text: "BALANÇO MENSAL - LAVAPRO",
					fontSize: 20,
					bold: true,
					color: "#061622"
				}, {
					text: data.periodo.titulo.toUpperCase(),
					margin: [
						0,
						5,
						0,
						0
					],
					bold: true
				}],
				background: "#09CBD2",
				margin: [
					0,
					0,
					0,
					22
				]
			},
			{
				table: {
					headerRows: 1,
					widths: ["*", 130],
					body: [
						[headerCell("Resumo"), headerCell("Valor")],
						["Faturamento do mês", money(data.faturamentoMes)],
						["Ticket médio", money(data.ticketMedio)],
						["Veículos atendidos", String(data.veiculosMes)],
						["Pagamentos recebidos", String(data.pagosOuEntregues)],
						["Atendimentos em andamento", String(data.emAndamento)]
					]
				},
				layout: tableLayout
			},
			{
				table: {
					headerRows: 1,
					widths: ["*", 130],
					body: [[headerCell("Forma de pagamento"), headerCell("Valor")], ...data.porMetodo.length ? data.porMetodo.map((item) => [METHOD_LABEL[item.metodo] ?? item.metodo, money(item.valor)]) : [["Nenhum pagamento registrado", "-"]]]
				},
				layout: tableLayout,
				margin: [
					0,
					18,
					0,
					0
				]
			},
			{
				table: {
					headerRows: 1,
					widths: [
						"*",
						80,
						110
					],
					body: [[
						headerCell("Serviço"),
						headerCell("Execuções"),
						headerCell("Valor")
					], ...data.topServicos.length ? data.topServicos.map((item) => [
						item.nome,
						String(item.qtd),
						money(item.valor)
					]) : [[
						"Nenhum serviço pago",
						"-",
						"-"
					]]]
				},
				layout: tableLayout,
				margin: [
					0,
					18,
					0,
					0
				]
			}
		],
		footer: (currentPage, pageCount) => ({
			columns: [`Gerado em ${new Date(data.periodo.geradoEm).toLocaleString("pt-BR")}`, {
				text: `Página ${currentPage} de ${pageCount}`,
				alignment: "right"
			}],
			margin: [
				40,
				0,
				40,
				0
			],
			fontSize: 8,
			color: "#65717C"
		})
	};
	pdfMake.createPdf(documentDefinition).download(reportFilename(data.periodo.titulo, "pdf"));
}
function FinancialPage() {
	const financeiroLiberado = useFeature("financeiro");
	const exportacaoLiberada = useFeature("exportacao");
	const analiseLiberada = useFeature("analise");
	const loadSummary = useServerFn(financialSummary);
	const query = useQuery({
		queryKey: ["financial-summary"],
		queryFn: () => loadSummary(),
		enabled: financeiroLiberado
	});
	const data = query.data;
	const [exporting, setExporting] = (0, import_react.useState)(null);
	async function exportReport(format) {
		if (!data) return;
		setExporting(format);
		try {
			if (format === "excel") await exportMonthlyExcel(data);
			else await exportMonthlyPdf(data);
			toast.success(`Balanço de ${data.periodo.titulo} exportado.`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Não foi possível exportar o balanço.");
		} finally {
			setExporting(null);
		}
	}
	if (!financeiroLiberado) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Financeiro",
		wide: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpgradeNotice, { feature: "financeiro" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Financeiro",
		wide: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pb-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-5 border-b border-border/60 pb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold text-primary",
						children: "Visão do proprietário"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 text-[clamp(2rem,8vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.06em]",
						children: "Caixa e desempenho"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-full max-w-md lg:w-auto",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs leading-5 text-muted-foreground",
								children: "Valores calculados a partir dos pagamentos registrados e das ordens de serviço do mês."
							}),
							data && !exportacaoLiberada && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/planos",
								className: "mt-4 flex h-10 items-center justify-center gap-2 border border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4" }), "Exportar PDF e Excel no plano Max"]
							}),
							data && exportacaoLiberada && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "secondary",
									className: "min-w-0 px-3",
									disabled: exporting !== null,
									onClick: () => void exportReport("excel"),
									children: [exporting === "excel" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "size-4" }), "Excel"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "secondary",
									className: "min-w-0 px-3",
									disabled: exporting !== null,
									onClick: () => void exportReport("pdf"),
									children: [exporting === "pdf" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4" }), "PDF"]
								})]
							})
						]
					})]
				}),
				query.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 space-y-6",
					"aria-label": "Carregando dados financeiros",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-36 rounded-2xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-6 lg:grid-cols-[1.4fr_0.6fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-72 rounded-2xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-72 rounded-2xl" })]
					})]
				}),
				query.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "my-8 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive",
					children: query.error.message
				}),
				data && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "reveal-stagger mt-6 grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinancialMetric, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "size-5" }),
								label: "HOJE",
								value: Number(data.faturamentoDia),
								trend: "Caixa recebido"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinancialMetric, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletCards, { className: "size-5" }),
								label: "ÚLTIMOS 7 DIAS",
								value: Number(data.faturamentoSemana),
								trend: `${data.veiculosDia} veículos hoje`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinancialMetric, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptText, { className: "size-5" }),
								label: "MÊS ATUAL",
								value: Number(data.faturamentoMes),
								trend: `${data.pagosOuEntregues} pagamentos recebidos no mês`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinancialMetric, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Car, { className: "size-5" }),
								label: "TICKET MÉDIO",
								value: Number(data.ticketMedio),
								trend: `${data.veiculosMes} veículos no mês`
							})
						]
					}),
					analiseLiberada ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RevenueInsights, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpgradeNotice, {
							feature: "analise",
							compact: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-6 grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OperationalNumber, {
							label: "EM ANDAMENTO",
							value: String(data.emAndamento),
							hint: "Ver na Operação",
							link: { to: "/home" }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OperationalNumber, {
							label: "PAGAMENTOS NO MÊS",
							value: String(data.pagosOuEntregues),
							hint: "Ver quem pagou",
							link: {
								to: "/financeiro/pagamentos",
								search: { periodo: "mes" }
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PixSettingsSection, {})
				] })
			]
		})
	});
}
function PixSettingsSection() {
	if (useFeature("pix")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PixSettingsCard, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpgradeNotice, {
			feature: "pix",
			compact: true
		})
	});
}
function PixSettingsCard() {
	const queryClient = useQueryClient();
	const loadSettings = useServerFn(getPixSettings);
	const saveSettings = useServerFn(updatePixSettings);
	const query = useQuery({
		queryKey: ["pix-settings"],
		queryFn: () => loadSettings()
	});
	const [pixKey, setPixKey] = (0, import_react.useState)("");
	const [receiverName, setReceiverName] = (0, import_react.useState)("");
	const [city, setCity] = (0, import_react.useState)("");
	const [dirty, setDirty] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!query.data || dirty) return;
		setPixKey(query.data.pix_key ?? "");
		setReceiverName(query.data.pix_receiver_name ?? "");
		setCity(query.data.pix_city ?? "");
	}, [dirty, query.data]);
	const mutation = useMutation({
		mutationFn: () => saveSettings({ data: {
			pix_key: pixKey,
			pix_receiver_name: receiverName,
			pix_city: city
		} }),
		onSuccess: (saved) => {
			queryClient.setQueryData(["pix-settings"], saved);
			setDirty(false);
			toast.success("Configuração PIX salva.");
		},
		onError: (error) => toast.error(error.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "interactive-panel mt-6 border border-border bg-card p-5 md:p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
			index: "04",
			title: "Recebimento via PIX"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-7 lg:grid-cols-[0.7fr_1.3fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "size-8 text-primary" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-4 text-xl font-bold",
					children: "QR Code para o cliente"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-6 text-muted-foreground",
					children: "Quando uma ordem estiver aguardando pagamento, o cliente poderá gerar um PIX com o valor exato do serviço."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-4 sm:grid-cols-2",
				onSubmit: (event) => {
					event.preventDefault();
					mutation.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "pix-key",
							children: "Chave PIX"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "pix-key",
							value: pixKey,
							onChange: (event) => {
								setPixKey(event.target.value);
								setDirty(true);
							},
							placeholder: "CPF, CNPJ, telefone, e-mail ou chave aleatória",
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "pix-receiver",
							children: "Nome do recebedor"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "pix-receiver",
							value: receiverName,
							onChange: (event) => {
								setReceiverName(event.target.value);
								setDirty(true);
							},
							maxLength: 25,
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "pix-city",
							children: "Cidade"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "pix-city",
							value: city,
							onChange: (event) => {
								setCity(event.target.value);
								setDirty(true);
							},
							maxLength: 15,
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "submit",
						className: "h-12 sm:col-span-2",
						disabled: query.isLoading || mutation.isPending || !dirty,
						children: [mutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), "Salvar configuração PIX"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] leading-5 text-muted-foreground sm:col-span-2",
						children: dirty ? "Há alterações ainda não salvas." : "Configuração salva e mantida até você alterá-la novamente."
					})
				]
			})]
		})]
	});
}
function FinancialMetric({ icon, label, value, trend }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-b border-border/60 p-5 last:border-b-0 sm:border-r lg:border-b-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-primary",
				children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px]",
					children: label
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-2xl font-bold tabular-nums md:text-3xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountUp, {
					value,
					format: brl
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[11px] text-muted-foreground",
				children: trend
			})
		]
	});
}
function SectionTitle({ index, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 border-b border-border/60 pb-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs text-primary",
			children: index
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-sm font-bold",
			children: title
		})]
	});
}
function OperationalNumber({ label, value, hint, link }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		...link,
		className: "group border-b border-border/60 p-5 transition-colors last:border-b-0 hover:bg-primary/5 sm:border-r sm:border-b-0 md:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-between text-primary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px]",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 text-5xl font-bold tabular-nums",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-primary",
				children: [hint, " →"]
			})
		]
	});
}
//#endregion
export { FinancialPage as component };
