import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { dateBR } from "./plate-C5WvEduv.mjs";
import { PLANS, PLAN_IDS, salesWhatsappLink } from "./plans-CITMHSEu.mjs";
import { Check, Crown, MessageCircle } from "../_libs/lucide-react.mjs";
import { AppShell, useSessionQuery } from "./shell-CXqKyQlN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/planos-Bs3ZiEel.js
var import_jsx_runtime = require_jsx_runtime();
var STATUS_LABEL = {
	TESTE: "Em teste grátis",
	ATIVA: "Ativa",
	TOLERANCIA: "Vencida (em tolerância)",
	GRATIS: "Plano Grátis"
};
function PlansPage() {
	const sessionQuery = useSessionQuery();
	const subscription = sessionQuery.data?.subscription ?? null;
	const tenantName = sessionQuery.data?.tenant?.nome ?? "meu lava-jato";
	const usage = sessionQuery.data?.usage?.ordersThisMonth ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Planos",
		back: "/home",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b border-border/60 pb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold text-primary",
						children: "Assinatura"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 text-[clamp(2rem,7vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.06em]",
						children: "Planos do LavaPro"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 max-w-xl text-sm leading-6 text-muted-foreground",
						children: [
							"Toda empresa nova começa com ",
							3,
							" dias de teste do plano Max. Depois, escolha o plano que faz sentido para o seu pátio. Se não assinar, a conta continua no Grátis, sem perder nenhum dado."
						]
					})
				]
			}),
			subscription && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 grid gap-4 border border-border bg-card p-5 md:grid-cols-4 md:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
						label: "Situação",
						value: STATUS_LABEL[subscription.status]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
						label: "Plano em uso",
						value: PLANS[subscription.effectivePlan].nome
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
						label: subscription.status === "TESTE" ? "Teste até" : "Válido até",
						value: subscription.status === "TESTE" ? dateBR(subscription.trialEndsAt) : subscription.expiresAt ? dateBR(subscription.expiresAt) : "-"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
						label: "Atendimentos no mês",
						value: subscription.monthlyOrderLimit === null ? "Ilimitados" : `${usage ?? 0} de ${subscription.monthlyOrderLimit}`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "reveal-stagger mt-6 grid gap-4 lg:grid-cols-3",
				children: PLAN_IDS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanCard, {
					id,
					current: subscription?.effectivePlan === id && subscription.status !== "TESTE",
					tenantName
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-xs leading-5 text-muted-foreground",
				children: "A liberação do plano é feita pela equipe LavaPro após a confirmação do pagamento."
			})
		]
	});
}
function PlanCard({ id, current, tenantName }) {
	const plan = PLANS[id];
	const whatsapp = id === "GRATIS" ? null : salesWhatsappLink(current ? `Olá! Quero renovar o plano ${plan.nome} do LavaPro para ${tenantName}.` : `Olá! Quero assinar o plano ${plan.nome} do LavaPro para ${tenantName}.`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: `relative flex flex-col border bg-card p-6 ${plan.destaque ? "border-primary shadow-glow" : "border-border"}`,
		children: [
			current && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute -top-3 left-6 bg-brand px-2 py-1 text-[10px] font-bold text-primary-foreground",
				children: "SEU PLANO"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [id === "MAX" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-2xl font-bold tracking-[-0.04em]",
					children: plan.nome
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: plan.descricao
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-5 text-3xl font-bold text-primary",
				children: [plan.preco ?? "Sob consulta", plan.preco && id !== "GRATIS" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-normal text-muted-foreground",
					children: "/mês"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-5 grid gap-2.5 text-sm text-muted-foreground",
				children: plan.itens.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 size-4 shrink-0 text-primary" }), item]
				}, item))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-auto pt-6",
				children: id === "GRATIS" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-xs text-muted-foreground",
					children: "Sem custo. Ativado automaticamente quando não há assinatura."
				}) : whatsapp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: whatsapp,
					target: "_blank",
					rel: "noreferrer",
					className: "flex h-12 items-center justify-center gap-2 border border-primary bg-brand text-sm font-bold text-primary-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-4" }), current ? "RENOVAR PELO WHATSAPP" : "ASSINAR PELO WHATSAPP"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "border border-border p-3 text-center text-xs leading-5 text-muted-foreground",
					children: [
						"Para assinar o plano ",
						plan.nome,
						", fale com a equipe LavaPro."
					]
				})
			})
		]
	});
}
function Info({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-[10px] uppercase tracking-wider text-muted-foreground",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-1 text-sm font-bold",
		children: value
	})] });
}
//#endregion
export { PlansPage as component };
