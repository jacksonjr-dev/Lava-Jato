//#region node_modules/.nitro/vite/services/ssr/assets/plans-CITMHSEu.js
/**
* Planos e assinatura do LavaPro: fonte única de verdade para o servidor, as
* telas e a página de apresentação.
*
* O banco repete apenas TRIAL_DAYS, GRACE_DAYS e FREE_MONTHLY_ORDER_LIMIT
* (migration 20261015140000_subscription_plans.sql); o teste
* plans.test.ts falha se os valores divergirem.
*/
var PLAN_IDS = [
	"GRATIS",
	"BASICO",
	"MAX"
];
/** WhatsApp de vendas (somente dígitos, com DDI e DDD). Vazio esconde o botão. */
var SALES_WHATSAPP = "5585991502928";
var FEATURE_LABEL = {
	area_cliente: "Área do cliente",
	pix: "Cobrança PIX com QR Code",
	financeiro: "Painel financeiro",
	logo: "Logo do lava-jato",
	analise: "Análise de receita",
	exportacao: "Exportação do financeiro em PDF e Excel",
	placa_foto: "Leitura da placa pela foto"
};
var PLANS = {
	GRATIS: {
		id: "GRATIS",
		nome: "Grátis",
		descricao: "Para organizar o pátio sem custo.",
		preco: "R$ 0",
		features: [],
		limiteMensalAtendimentos: 30,
		itens: [
			`Até 30 atendimentos por mês`,
			"Atendimento pela placa e ordens de serviço",
			"Catálogo de serviços e veículos com filtros",
			"Caixa do dia na tela de operação"
		]
	},
	BASICO: {
		id: "BASICO",
		nome: "Básico",
		descricao: "Para lava-jatos com movimento diário.",
		preco: null,
		features: [
			"area_cliente",
			"pix",
			"financeiro",
			"logo"
		],
		limiteMensalAtendimentos: null,
		itens: [
			"Atendimentos ilimitados",
			"Área do cliente com status em tempo real",
			"Cobrança PIX com QR Code",
			"Financeiro do mês e lista de pagamentos",
			"Logo do lava-jato no sistema e para o cliente"
		]
	},
	MAX: {
		id: "MAX",
		nome: "Max",
		descricao: "Para quem quer gestão completa e agilidade no pátio.",
		preco: null,
		destaque: true,
		features: [
			"area_cliente",
			"pix",
			"financeiro",
			"logo",
			"analise",
			"exportacao",
			"placa_foto"
		],
		limiteMensalAtendimentos: null,
		itens: [
			"Tudo do Básico",
			"Análise de receita: comparações, gráfico e serviços que mais dão retorno",
			"Exportação do financeiro em PDF e Excel",
			"Leitura da placa pela foto",
			"Em breve: equipe com login próprio e aviso por WhatsApp"
		]
	}
};
var DAY_MS = 864e5;
function isPlanId(value) {
	return typeof value === "string" && PLAN_IDS.includes(value);
}
function parseDate(value) {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}
function daysUntil(target, now) {
	return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / DAY_MS));
}
function resolveSubscription(fields, now = /* @__PURE__ */ new Date()) {
	const plan = isPlanId(fields?.plan) ? fields.plan : "GRATIS";
	const trialEnds = parseDate(fields?.trial_ends_at);
	const expires = parseDate(fields?.plan_expires_at);
	const graceEnds = expires ? new Date(expires.getTime() + 3 * DAY_MS) : null;
	let status = "GRATIS";
	let effectivePlan = "GRATIS";
	let daysLeft = null;
	if (trialEnds && trialEnds > now) {
		status = "TESTE";
		effectivePlan = "MAX";
		daysLeft = daysUntil(trialEnds, now);
	} else if (plan !== "GRATIS" && expires && expires > now) {
		status = "ATIVA";
		effectivePlan = plan;
		daysLeft = daysUntil(expires, now);
	} else if (plan !== "GRATIS" && graceEnds && graceEnds > now) {
		status = "TOLERANCIA";
		effectivePlan = plan;
		daysLeft = 0;
	}
	const definition = PLANS[effectivePlan];
	return {
		plan,
		effectivePlan,
		status,
		trialEndsAt: trialEnds?.toISOString() ?? null,
		expiresAt: expires?.toISOString() ?? null,
		graceEndsAt: status === "TOLERANCIA" && graceEnds ? graceEnds.toISOString() : null,
		daysLeft,
		features: [...definition.features],
		monthlyOrderLimit: definition.limiteMensalAtendimentos
	};
}
function hasFeature(subscription, feature) {
	return subscription.features.includes(feature);
}
/** Menor plano que libera o recurso. */
function minimumPlanFor(feature) {
	return PLAN_IDS.map((id) => PLANS[id]).find((plan) => plan.features.includes(feature));
}
function assertFeature(subscription, feature) {
	if (hasFeature(subscription, feature)) return;
	throw new Error(`${FEATURE_LABEL[feature]} está disponível a partir do plano ${minimumPlanFor(feature).nome}.`);
}
function salesWhatsappLink(message) {
	return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
/** Calcula os novos campos de assinatura a partir da ação do administrador. */
function applyAdminSubscriptionAction(current, change, now = /* @__PURE__ */ new Date()) {
	const plan = isPlanId(current.plan) ? current.plan : "GRATIS";
	if (change.action === "GRATIS") return {
		plan: "GRATIS",
		trial_ends_at: null,
		plan_expires_at: null
	};
	if (!Number.isInteger(change.days) || change.days < 1 || change.days > 400) throw new Error("Informe uma quantidade de dias entre 1 e 400.");
	const addDays = (from) => new Date(from.getTime() + change.days * 864e5);
	const trialEnds = current.trial_ends_at ? new Date(current.trial_ends_at) : null;
	if (change.action === "ESTENDER_TESTE") return {
		plan,
		trial_ends_at: addDays(trialEnds && trialEnds > now ? trialEnds : now).toISOString(),
		plan_expires_at: current.plan_expires_at ?? null
	};
	if (change.plan !== "BASICO" && change.plan !== "MAX") throw new Error("Plano inválido.");
	const currentExpiry = current.plan_expires_at ? new Date(current.plan_expires_at) : null;
	const base = plan === change.plan && currentExpiry && currentExpiry > now ? currentExpiry : now;
	return {
		plan: change.plan,
		trial_ends_at: null,
		plan_expires_at: addDays(base).toISOString()
	};
}
//#endregion
export { FEATURE_LABEL, PLANS, PLAN_IDS, applyAdminSubscriptionAction, assertFeature, hasFeature, minimumPlanFor, resolveSubscription, salesWhatsappLink };
