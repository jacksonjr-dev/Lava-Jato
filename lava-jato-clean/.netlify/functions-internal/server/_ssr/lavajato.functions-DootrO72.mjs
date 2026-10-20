import { __toESM } from "../_runtime.mjs";
import { TSS_SERVER_FUNCTION, createServerFn, getRequest } from "./server-BpsVjaE1.mjs";
import { requireSupabaseAuth } from "./auth-middleware-CkvhgX1Y.mjs";
import { normalizePlate } from "./plate-C5WvEduv.mjs";
import { applyAdminSubscriptionAction, assertFeature, hasFeature, resolveSubscription } from "./plans-CITMHSEu.mjs";
import { assertCompatibleServices, parsePlateResponse } from "./service-selection-BA5z5PKT.mjs";
import { validateBusinessHours } from "./business-hours-CNCSnIUh.mjs";
import { assertOrderTransition } from "./order-flow-WW0v_EAr.mjs";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
//#region node_modules/.nitro/vite/services/ssr/assets/lavajato.functions-DootrO72.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var FINANCIAL_TIME_ZONE = "America/Fortaleza";
function zonedParts(date, timeZone = FINANCIAL_TIME_ZONE) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).formatToParts(date);
	const value = (type) => Number(parts.find((part) => part.type === type)?.value ?? 0);
	return {
		year: value("year"),
		month: value("month"),
		day: value("day")
	};
}
function zonedMidnightUtc(year, month, day, timeZone = FINANCIAL_TIME_ZONE) {
	const desired = Date.UTC(year, month - 1, day);
	let guess = new Date(desired);
	for (let attempt = 0; attempt < 2; attempt += 1) {
		const actual = new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hourCycle: "h23"
		}).formatToParts(guess);
		const get = (type) => Number(actual.find((part) => part.type === type)?.value ?? 0);
		const represented = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
		guess = new Date(guess.getTime() + (desired - represented));
	}
	return guess;
}
function financialPeriod(now = /* @__PURE__ */ new Date(), timeZone = FINANCIAL_TIME_ZONE) {
	const local = zonedParts(now, timeZone);
	const startDay = zonedMidnightUtc(local.year, local.month, local.day, timeZone);
	const calendarDay = new Date(Date.UTC(local.year, local.month - 1, local.day));
	const days = Array.from({ length: 7 }, (_, index) => {
		const date = /* @__PURE__ */ new Date(calendarDay.getTime() - (6 - index) * 864e5);
		return zonedMidnightUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), timeZone);
	});
	const startMonth = zonedMidnightUtc(local.year, local.month, 1, timeZone);
	const nextMonth = zonedMidnightUtc(local.year, local.month + 1, 1, timeZone);
	const nextDayDate = new Date(calendarDay.getTime() + 864e5);
	return {
		startDay,
		nextDay: zonedMidnightUtc(nextDayDate.getUTCFullYear(), nextDayDate.getUTCMonth() + 1, nextDayDate.getUTCDate(), timeZone),
		startWeek: days[0],
		startMonth,
		nextMonth,
		days
	};
}
function inRange(value, start, end) {
	const timestamp = Date.parse(value);
	return timestamp >= start.getTime() && timestamp < end.getTime();
}
function calculateFinancialStats({ now = /* @__PURE__ */ new Date(), payments, monthOrders, activeOrders, paidItems }) {
	const period = financialPeriod(now);
	const end = now.getTime();
	const untilNow = (payment) => Date.parse(payment.pago_em) <= end;
	const dayPayments = payments.filter((payment) => inRange(payment.pago_em, period.startDay, period.nextDay) && untilNow(payment));
	const weekPayments = payments.filter((payment) => Date.parse(payment.pago_em) >= period.startWeek.getTime() && untilNow(payment));
	const monthPayments = payments.filter((payment) => inRange(payment.pago_em, period.startMonth, period.nextMonth) && untilNow(payment));
	const total = (source) => source.reduce((sum, payment) => sum + Number(payment.valor), 0);
	const byMethod = /* @__PURE__ */ new Map();
	for (const payment of monthPayments) byMethod.set(payment.metodo, (byMethod.get(payment.metodo) ?? 0) + Number(payment.valor));
	const services = /* @__PURE__ */ new Map();
	for (const item of paidItems) {
		const current = services.get(item.nome) ?? {
			qtd: 0,
			valor: 0
		};
		const quantity = item.quantidade ?? 1;
		current.qtd += quantity;
		current.valor += Number(item.preco) * quantity;
		services.set(item.nome, current);
	}
	const dayOrders = monthOrders.filter((order) => inRange(order.created_at, period.startDay, period.nextDay));
	const distinctVehicles = (orders) => new Set(orders.map((order) => order.vehicle_id).filter((id) => Boolean(id))).size;
	const monthRevenue = total(monthPayments);
	const last7 = period.days.map((date, index) => {
		const next = index === period.days.length - 1 ? period.nextDay : period.days[index + 1];
		const value = payments.filter((payment) => inRange(payment.pago_em, date, next) && untilNow(payment)).reduce((sum, payment) => sum + Number(payment.valor), 0);
		return {
			dia: date.toLocaleDateString("pt-BR", {
				weekday: "short",
				timeZone: FINANCIAL_TIME_ZONE
			}),
			valor: value
		};
	});
	return {
		periodo: {
			titulo: new Intl.DateTimeFormat("pt-BR", {
				month: "long",
				year: "numeric",
				timeZone: FINANCIAL_TIME_ZONE
			}).format(now),
			inicio: period.startMonth.toISOString(),
			fim: period.nextMonth.toISOString(),
			geradoEm: now.toISOString()
		},
		faturamentoDia: total(dayPayments),
		faturamentoSemana: total(weekPayments),
		faturamentoMes: monthRevenue,
		veiculosDia: distinctVehicles(dayOrders),
		veiculosMes: distinctVehicles(monthOrders),
		ticketMedio: monthPayments.length ? monthRevenue / monthPayments.length : 0,
		emAndamento: activeOrders,
		pagosOuEntregues: monthPayments.length,
		porMetodo: [...byMethod.entries()].map(([metodo, valor]) => ({
			metodo,
			valor
		})),
		topServicos: [...services.entries()].map(([nome, values]) => ({
			nome,
			...values
		})).sort((a, b) => b.qtd - a.qtd || b.valor - a.valor).slice(0, 5),
		last7
	};
}
async function getMembership(sb, userId) {
	const { data, error } = await sb.from("tenant_members").select("tenant_id, role").eq("user_id", userId).maybeSingle();
	if (error) throw new Error(error.message);
	if (!data) return null;
	return {
		tenantId: data.tenant_id,
		role: data.role
	};
}
async function requireMembership(sb, userId) {
	const m = await getMembership(sb, userId);
	if (!m) throw new Error("Nenhum lava-jato vinculado a este usuário.");
	return m;
}
async function requireManager(sb, userId) {
	const m = await requireMembership(sb, userId);
	if (m.role !== "OWNER" && m.role !== "MANAGER") throw new Error("Apenas proprietário ou gerente podem executar esta ação.");
	return m;
}
async function loadSubscription(sb, tenantId) {
	const { data, error } = await sb.from("tenants").select("plan, trial_ends_at, plan_expires_at").eq("id", tenantId).single();
	if (error) throw new Error(error.message);
	return resolveSubscription(data);
}
async function requireFeature(sb, tenantId, feature) {
	const subscription = await loadSubscription(sb, tenantId);
	assertFeature(subscription, feature);
	return subscription;
}
async function ordersThisMonth(sb, tenantId) {
	const { count, error } = await sb.from("service_orders").select("id", {
		count: "exact",
		head: true
	}).eq("tenant_id", tenantId).gte("created_at", financialPeriod(/* @__PURE__ */ new Date()).startMonth.toISOString());
	if (error) throw new Error(error.message);
	return count ?? 0;
}
var PLATE_READ_TIMEOUT_MS = 2e4;
/**
* Camada de abstração de reconhecimento de placa (LPR/OCR).
* Troque a implementação interna sem alterar o restante da aplicação.
*/
async function recognizePlateFromImage(imageDataUrl) {
	const apiKey = process.env["OPENAI_API_KEY"];
	if (!apiKey) throw new Error("Serviço de reconhecimento indisponível.");
	let res;
	try {
		res = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json"
			},
			signal: AbortSignal.timeout(PLATE_READ_TIMEOUT_MS),
			body: JSON.stringify({
				model: process.env["OPENAI_VISION_MODEL"] ?? "gpt-4.1-mini",
				temperature: 0,
				max_tokens: 60,
				response_format: { type: "json_object" },
				messages: [{
					role: "system",
					content: "Você lê placas de veículos brasileiros em fotos (padrão antigo ABC1234 ou Mercosul ABC1D23). Responda SOMENTE com JSON no formato {\"plate\":\"ABC1D23\",\"confidence\":0.0-1.0}, sem espaços nem hífen na placa. Se não houver placa legível, responda {\"plate\":\"\",\"confidence\":0}."
				}, {
					role: "user",
					content: [{
						type: "text",
						text: "Qual é a placa deste veículo?"
					}, {
						type: "image_url",
						image_url: {
							url: imageDataUrl,
							detail: "high"
						}
					}]
				}]
			})
		});
	} catch (error) {
		if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) throw new Error("A leitura demorou demais. Digite a placa manualmente.");
		console.error("[LPR] falha de rede", error);
		throw new Error("Não foi possível ler a placa. Digite manualmente.");
	}
	if (res.status === 429) throw new Error("Muitas leituras seguidas. Aguarde alguns segundos.");
	if (!res.ok) {
		console.error("[LPR] gateway error", res.status, await res.text());
		throw new Error("Não foi possível ler a placa. Digite manualmente.");
	}
	const json = await res.json();
	return {
		...parsePlateResponse(json.choices?.[0]?.message?.content ?? ""),
		simulated: false
	};
}
async function loadOrder(sb, tenantId, orderId) {
	const { data: order, error } = await sb.from("service_orders").select("*, customers(id, nome, telefone), vehicles(id, placa, marca, modelo, cor, ano), service_order_items(*), payments(*), order_photos(*)").eq("tenant_id", tenantId).eq("id", orderId).maybeSingle();
	if (error) throw new Error(error.message);
	if (!order) throw new Error("Atendimento não encontrado.");
	return order;
}
async function vehicleSummary(sb, tenantId, plateInput) {
	const placa = normalizePlate(plateInput);
	const { data: vehicle, error } = await sb.from("vehicles").select("*, customers(id, nome, telefone, email)").eq("tenant_id", tenantId).eq("placa_normalizada", placa).maybeSingle();
	if (error) throw new Error(error.message);
	if (!vehicle) return {
		placa,
		vehicle: null,
		history: [],
		stats: null
	};
	const { data: history, error: histError } = await sb.from("service_orders").select("id, numero, status, total, created_at, service_order_items(nome, preco)").eq("tenant_id", tenantId).eq("vehicle_id", vehicle.id).order("created_at", { ascending: false }).limit(20);
	if (histError) throw new Error(histError.message);
	const orders = history ?? [];
	const paidStatuses = ["PAGO", "ENTREGUE"];
	const totalGasto = orders.filter((o) => paidStatuses.includes(o.status)).reduce((acc, o) => acc + Number(o.total), 0);
	const counts = /* @__PURE__ */ new Map();
	for (const o of orders) for (const item of o.service_order_items ?? []) counts.set(item.nome, (counts.get(item.nome) ?? 0) + 1);
	const topServices = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([nome, qtd]) => ({
		nome,
		qtd
	}));
	return {
		placa,
		vehicle,
		history: orders,
		stats: {
			total: orders.length,
			last: orders[0]?.created_at ?? null,
			totalGasto,
			topServices
		}
	};
}
async function dashboardStats(sb, tenantId) {
	const now = /* @__PURE__ */ new Date();
	const period = financialPeriod(now);
	const paymentWindowStart = new Date(Math.min(period.startWeek.getTime(), period.startMonth.getTime())).toISOString();
	const { data: payments, error: payError } = await sb.from("payments").select("order_id, valor, metodo, pago_em").eq("tenant_id", tenantId).gte("pago_em", paymentWindowStart).lt("pago_em", period.nextMonth.toISOString());
	if (payError) throw new Error(payError.message);
	const { data: orders, error: ordError } = await sb.from("service_orders").select("id, vehicle_id, status, created_at").eq("tenant_id", tenantId).gte("created_at", period.startMonth.toISOString()).lt("created_at", period.nextMonth.toISOString());
	if (ordError) throw new Error(ordError.message);
	const { count: activeOrders, error: activeError } = await sb.from("service_orders").select("id", {
		count: "exact",
		head: true
	}).eq("tenant_id", tenantId).in("status", [
		"AGUARDANDO",
		"EM_LAVAGEM",
		"EM_FINALIZACAO",
		"FINALIZADO",
		"AGUARDANDO_PAGAMENTO"
	]);
	if (activeError) throw new Error(activeError.message);
	const monthPaymentOrderIds = [...new Set((payments ?? []).filter((payment) => payment.pago_em >= period.startMonth.toISOString() && payment.pago_em < period.nextMonth.toISOString()).map((payment) => payment.order_id))];
	let paidItems = [];
	if (monthPaymentOrderIds.length) {
		const { data: items, error: itemError } = await sb.from("service_order_items").select("nome, preco, quantidade").eq("tenant_id", tenantId).in("order_id", monthPaymentOrderIds);
		if (itemError) throw new Error(itemError.message);
		paidItems = items ?? [];
	}
	return calculateFinancialStats({
		now,
		payments: payments ?? [],
		monthOrders: orders ?? [],
		activeOrders: activeOrders ?? 0,
		paidItems
	});
}
/** Pagamentos do intervalo [from, to) com a OS, a placa, o cliente e os serviços. */
async function listTenantPayments(sb, tenantId, from, to) {
	const { data, error } = await sb.from("payments").select("id, valor, metodo, pago_em, order_id, service_orders(numero, vehicles(placa), customers(nome), service_order_items(nome, preco, quantidade))").eq("tenant_id", tenantId).gte("pago_em", from).lt("pago_em", to).order("pago_em", { ascending: false }).limit(3e3);
	if (error) throw new Error(error.message);
	return (data ?? []).map((payment) => {
		const order = payment.service_orders;
		return {
			id: payment.id,
			valor: Number(payment.valor),
			metodo: payment.metodo,
			pago_em: payment.pago_em,
			orderId: payment.order_id,
			numero: order?.numero ?? null,
			placa: order?.vehicles?.placa ?? null,
			cliente: order?.customers?.nome ?? null,
			itens: (order?.service_order_items ?? []).map((item) => ({
				nome: item.nome,
				preco: Number(item.preco),
				quantidade: item.quantidade ?? 1
			}))
		};
	});
}
var tenantId = "demo-tenant";
var demoPublicTenants = [{
	id: tenantId,
	slug: "lavapro-demonstracao",
	nome: "LavaPro Demonstração",
	endereco: "Fortaleza - CE",
	logo_url: null
}, {
	id: "demo-tenant-norte",
	slug: "lava-jato-norte-demo",
	nome: "Lava-Jato Norte (demonstração)",
	endereco: "Fortaleza - CE",
	logo_url: null
}];
var now = () => (/* @__PURE__ */ new Date()).toISOString();
var defaultPixSettings = {
	pix_key: "contaali2p@gmail.com",
	pix_receiver_name: "Pedro Victor da Rocha",
	pix_city: "Fortaleza"
};
var defaultBusinessSettings = {
	business_hours: null,
	id: tenantId,
	slug: "lavapro-demonstracao",
	nome: "LavaPro Demonstração",
	telefone: "(85) 3333-2026",
	endereco: "Fortaleza - CE",
	horario: "Segunda a sábado, 08h às 18h",
	logo_url: null,
	public_listing: true
};
var demoPixSettingsPath = resolve(process.cwd(), ".data", "demo-pix-settings.json");
var demoBusinessSettingsPath = resolve(process.cwd(), ".data", "demo-business-settings.json");
function businessSlug(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "lava-jato-teste";
}
function loadDemoBusinessSettings() {
	try {
		const saved = JSON.parse(readFileSync(demoBusinessSettingsPath, "utf8"));
		if (saved.nome?.trim()) return {
			...defaultBusinessSettings,
			...saved,
			id: tenantId,
			slug: saved.slug || businessSlug(saved.nome)
		};
	} catch {}
	return defaultBusinessSettings;
}
function persistDemoBusinessSettings(settings) {
	mkdirSync(dirname(demoBusinessSettingsPath), { recursive: true });
	const temporaryPath = `${demoBusinessSettingsPath}.${process.pid}.tmp`;
	writeFileSync(temporaryPath, JSON.stringify(settings, null, 2), "utf8");
	renameSync(temporaryPath, demoBusinessSettingsPath);
}
function loadDemoPixSettings() {
	try {
		const saved = JSON.parse(readFileSync(demoPixSettingsPath, "utf8"));
		if (saved.pix_key && saved.pix_receiver_name && saved.pix_city) return {
			pix_key: saved.pix_key,
			pix_receiver_name: saved.pix_receiver_name,
			pix_city: saved.pix_city
		};
	} catch {}
	return defaultPixSettings;
}
function persistDemoPixSettings(settings) {
	mkdirSync(dirname(demoPixSettingsPath), { recursive: true });
	const temporaryPath = `${demoPixSettingsPath}.${process.pid}.tmp`;
	writeFileSync(temporaryPath, JSON.stringify(settings, null, 2), "utf8");
	renameSync(temporaryPath, demoPixSettingsPath);
}
var pixSettings = loadDemoPixSettings();
var businessSettings = loadDemoBusinessSettings();
var demoSubscriptionPath = resolve(process.cwd(), ".data", "demo-subscription.json");
function loadDemoSubscription() {
	try {
		const saved = JSON.parse(readFileSync(demoSubscriptionPath, "utf8"));
		if (saved.plan) return saved;
	} catch {}
	return {
		plan: "GRATIS",
		trial_ends_at: new Date(Date.now() + 2592e5).toISOString(),
		plan_expires_at: null
	};
}
var demoSubscription = loadDemoSubscription();
function demoSubscriptionFields() {
	return { ...demoSubscription };
}
function demoUpdateSubscription(fields) {
	demoSubscription = { ...fields };
	mkdirSync(dirname(demoSubscriptionPath), { recursive: true });
	writeFileSync(demoSubscriptionPath, JSON.stringify(demoSubscription, null, 2), "utf8");
	return demoSubscriptionFields();
}
var daysAgo = (days, hour) => {
	const date = /* @__PURE__ */ new Date();
	date.setDate(date.getDate() - days);
	date.setHours(hour, 0, 0, 0);
	return date.toISOString();
};
function isDemoServerMode() {
	return process.env["DEMO_MODE"] === "true" || process.env["VITE_DEMO_MODE"] === "true" || {
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SSR": true,
		"TSS_DEV_SERVER": "false",
		"TSS_DEV_SSR_STYLES_BASEPATH": "/",
		"TSS_DEV_SSR_STYLES_ENABLED": "true",
		"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
		"TSS_INLINE_CSS_ENABLED": "false",
		"TSS_ROUTER_BASEPATH": "",
		"TSS_SERVER_FN_BASE": "/_serverFn/"
	}["VITE_DEMO_MODE"] === "true";
}
var demoServices = [
	{
		id: "svc-1",
		tenant_id: tenantId,
		nome: "Lavagem simples (apenas externa)",
		categoria: "LAVAGEM",
		preco: 35,
		duracao_min: 30,
		descricao: "Lavagem apenas da parte externa e secagem",
		ativo: true,
		created_at: now(),
		updated_at: now()
	},
	{
		id: "svc-2",
		tenant_id: tenantId,
		nome: "Lavagem completa (externa e interna)",
		categoria: "LAVAGEM",
		preco: 60,
		duracao_min: 60,
		descricao: "Lavagem externa e limpeza da parte interna",
		ativo: true,
		created_at: now(),
		updated_at: now()
	},
	{
		id: "svc-4",
		tenant_id: tenantId,
		nome: "Polimento",
		categoria: "ADICIONAL",
		preco: 150,
		duracao_min: 180,
		descricao: "Polimento técnico da pintura",
		ativo: true,
		created_at: now(),
		updated_at: now()
	}
];
function demoCreateService(data) {
	const service = {
		id: `svc-${Date.now()}`,
		tenant_id: tenantId,
		nome: data.nome,
		preco: data.preco,
		duracao_min: data.duracao_min,
		descricao: data.descricao,
		categoria: data.categoria,
		ativo: true,
		created_at: now(),
		updated_at: now()
	};
	demoServices = [...demoServices, service];
	return service;
}
function demoUpdateService(data) {
	const current = demoServices.find((service) => service.id === data.id);
	if (!current) throw new Error("Serviço não encontrado.");
	const patch = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== void 0));
	const updated = {
		...current,
		...patch,
		updated_at: now()
	};
	demoServices = demoServices.map((service) => service.id === data.id ? updated : service);
	return updated;
}
function demoDeactivateService(id) {
	demoUpdateService({
		id,
		ativo: false
	});
	return { ok: true };
}
var vehicles = /* @__PURE__ */ new Map([["ABC1D23", {
	id: "vehicle-demo-1",
	tenant_id: tenantId,
	customer_id: "customer-demo-1",
	placa: "ABC1D23",
	placa_normalizada: "ABC1D23",
	marca: "Toyota",
	modelo: "Corolla",
	cor: "Prata",
	ano: 2023,
	customers: {
		id: "customer-demo-1",
		nome: "Marina Souza",
		telefone: "(85) 99999-1234",
		email: "marina@example.com"
	},
	created_at: now(),
	updated_at: now()
}], ["BRA2E19", {
	id: "vehicle-demo-2",
	tenant_id: tenantId,
	customer_id: "customer-demo-2",
	placa: "BRA2E19",
	placa_normalizada: "BRA2E19",
	marca: "Honda",
	modelo: "Civic",
	cor: "Preto",
	ano: 2022,
	customers: {
		id: "customer-demo-2",
		nome: "Carlos Lima",
		telefone: "(85) 98888-4321"
	},
	created_at: now(),
	updated_at: now()
}]]);
var orders = /* @__PURE__ */ new Map([
	["order-demo-099", {
		id: "order-demo-099",
		tenant_id: tenantId,
		numero: 99,
		status: "ENTREGUE",
		subtotal: 155,
		desconto: 5,
		acrescimo: 0,
		total: 150,
		created_at: daysAgo(2, 10),
		finished_at: daysAgo(2, 13),
		observacoes: null,
		customers: {
			id: "customer-demo-1",
			nome: "Marina Souza",
			telefone: "(85) 99999-1234"
		},
		vehicles: {
			id: "vehicle-demo-1",
			tenant_id: tenantId,
			customer_id: "customer-demo-1",
			placa: "ABC1D23",
			placa_normalizada: "ABC1D23",
			marca: "Toyota",
			modelo: "Corolla",
			cor: "Prata",
			ano: 2023,
			customers: {
				id: "customer-demo-1",
				nome: "Marina Souza",
				telefone: "(85) 99999-1234"
			},
			created_at: "2026-01-10T10:00:00.000Z",
			updated_at: "2026-09-18T16:10:00.000Z"
		},
		service_order_items: [{
			id: "item-demo-099-1",
			nome: "Lavagem completa",
			preco: 60,
			quantidade: 1
		}, {
			id: "item-demo-099-2",
			nome: "Higienização de bancos",
			preco: 95,
			quantidade: 1
		}],
		payments: [{
			id: "payment-demo-099",
			metodo: "PIX",
			valor: 150,
			pago_em: daysAgo(2, 13)
		}],
		order_photos: []
	}],
	["order-demo-087", {
		id: "order-demo-087",
		tenant_id: tenantId,
		numero: 87,
		status: "ENTREGUE",
		subtotal: 60,
		desconto: 0,
		acrescimo: 0,
		total: 60,
		created_at: daysAgo(10, 11),
		finished_at: daysAgo(10, 12),
		observacoes: null,
		customers: {
			id: "customer-demo-1",
			nome: "Marina Souza",
			telefone: "(85) 99999-1234"
		},
		vehicles: {
			id: "vehicle-demo-1",
			tenant_id: tenantId,
			customer_id: "customer-demo-1",
			placa: "ABC1D23",
			placa_normalizada: "ABC1D23",
			marca: "Toyota",
			modelo: "Corolla",
			cor: "Prata",
			ano: 2023,
			customers: {
				id: "customer-demo-1",
				nome: "Marina Souza",
				telefone: "(85) 99999-1234"
			},
			created_at: "2026-01-10T10:00:00.000Z",
			updated_at: "2026-08-02T15:20:00.000Z"
		},
		service_order_items: [{
			id: "item-demo-087-1",
			nome: "Lavagem completa",
			preco: 60,
			quantidade: 1
		}],
		payments: [{
			id: "payment-demo-087",
			metodo: "DEBITO",
			valor: 60,
			pago_em: daysAgo(10, 12)
		}],
		order_photos: []
	}],
	["order-demo-101", {
		id: "order-demo-101",
		tenant_id: tenantId,
		numero: 101,
		status: "EM_LAVAGEM",
		subtotal: 60,
		desconto: 0,
		acrescimo: 0,
		total: 60,
		created_at: now(),
		finished_at: null,
		observacoes: null,
		customers: {
			id: "customer-demo-1",
			nome: "Marina Souza",
			telefone: "(85) 99999-1234"
		},
		vehicles: {
			id: "vehicle-demo-1",
			tenant_id: tenantId,
			customer_id: "customer-demo-1",
			placa: "ABC1D23",
			placa_normalizada: "ABC1D23",
			marca: "Toyota",
			modelo: "Corolla",
			cor: "Prata",
			ano: 2023,
			customers: {
				id: "customer-demo-1",
				nome: "Marina Souza",
				telefone: "(85) 99999-1234"
			},
			created_at: now(),
			updated_at: now()
		},
		service_order_items: [{
			id: "item-demo-1",
			nome: "Lavagem completa",
			preco: 60,
			quantidade: 1
		}],
		payments: [],
		order_photos: []
	}],
	["order-demo-102", {
		id: "order-demo-102",
		tenant_id: tenantId,
		numero: 102,
		status: "AGUARDANDO_PAGAMENTO",
		subtotal: 150,
		desconto: 0,
		acrescimo: 0,
		total: 150,
		created_at: now(),
		finished_at: null,
		observacoes: null,
		customers: {
			id: "customer-demo-2",
			nome: "Carlos Lima",
			telefone: "(85) 98888-4321"
		},
		vehicles: {
			id: "vehicle-demo-2",
			tenant_id: tenantId,
			customer_id: "customer-demo-2",
			placa: "BRA2E19",
			placa_normalizada: "BRA2E19",
			marca: "Honda",
			modelo: "Civic",
			cor: "Preto",
			ano: 2022,
			customers: {
				id: "customer-demo-2",
				nome: "Carlos Lima",
				telefone: "(85) 98888-4321"
			},
			created_at: now(),
			updated_at: now()
		},
		service_order_items: [{
			id: "item-demo-2",
			nome: "Polimento",
			preco: 150,
			quantidade: 1
		}],
		payments: [],
		order_photos: []
	}]
]);
var HISTORY_CUSTOMERS = [
	[
		"Ana Beatriz Rocha",
		"(85) 98111-2233",
		"PNE4A12",
		"Fiat",
		"Argo",
		"Branco"
	],
	[
		"João Pedro Alves",
		"(85) 98222-3344",
		"HQK7C45",
		"Volkswagen",
		"T-Cross",
		"Cinza"
	],
	[
		"Fernanda Castro",
		"(85) 98333-4455",
		"OSD2B88",
		"Hyundai",
		"HB20",
		"Vermelho"
	],
	[
		"Ricardo Nogueira",
		"(85) 98444-5566",
		"RTA9F31",
		"Jeep",
		"Compass",
		"Preto"
	],
	[
		"Luciana Martins",
		"(85) 98555-6677",
		"QWE3G07",
		"Chevrolet",
		"Onix",
		"Prata"
	],
	[
		"Ângela Ribeiro",
		"(85) 98666-7788",
		"MNB5H66",
		"Renault",
		"Duster",
		"Branco"
	]
];
function seededRandom(seed) {
	return () => {
		seed = seed + 1831565813 | 0;
		let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
(function seedDemoHistory() {
	const random = seededRandom(2026);
	const pick = (options) => {
		let roll = random() * options.reduce((sum, [, weight]) => sum + weight, 0);
		for (const [value, weight] of options) {
			roll -= weight;
			if (roll <= 0) return value;
		}
		return options[0][0];
	};
	const allVehicles = [...HISTORY_CUSTOMERS.map(([nome, telefone, placa, marca, modelo, cor], index) => {
		const customer = {
			id: `customer-hist-${index}`,
			nome,
			telefone,
			email: null
		};
		const vehicle = {
			id: `vehicle-hist-${index}`,
			tenant_id: tenantId,
			customer_id: customer.id,
			placa,
			placa_normalizada: placa,
			marca,
			modelo,
			cor,
			ano: 2020 + index % 5,
			customers: customer,
			created_at: daysAgo(60, 9),
			updated_at: daysAgo(60, 9)
		};
		vehicles.set(placa, vehicle);
		return vehicle;
	}), ...vehicles.values()].filter((vehicle, index, list) => list.findIndex((v) => v.id === vehicle.id) === index);
	let numero = 1;
	for (let day = 45; day >= 1 && numero < 87; day--) {
		const weekday = new Date(daysAgo(day, 12)).getDay();
		const count = Math.floor(random() * 3) + (weekday === 6 ? 2 : weekday === 0 ? 0 : 1);
		for (let i = 0; i < count && numero < 87; i++) {
			const vehicle = allVehicles[Math.floor(random() * allVehicles.length)];
			const items = [];
			const wash = pick([[["Lavagem simples (apenas externa)", 35], 55], [["Lavagem completa (externa e interna)", 60], 45]]);
			items.push({
				id: `hist-${numero}-1`,
				nome: wash[0],
				preco: wash[1],
				quantidade: 1
			});
			if (random() < .35) {
				const extra = pick([
					[["Polimento", 150], 30],
					[["Higienização de bancos", 95], 40],
					[["Enceramento", 80], 30]
				]);
				items.push({
					id: `hist-${numero}-2`,
					nome: extra[0],
					preco: extra[1],
					quantidade: 1
				});
			}
			const total = items.reduce((sum, item) => sum + item.preco, 0);
			const hour = 8 + Math.floor(random() * 9);
			const id = `order-hist-${String(numero).padStart(3, "0")}`;
			orders.set(id, {
				id,
				tenant_id: tenantId,
				numero,
				status: "ENTREGUE",
				subtotal: total,
				desconto: 0,
				acrescimo: 0,
				total,
				created_at: daysAgo(day, hour),
				finished_at: daysAgo(day, hour + 1),
				observacoes: null,
				customers: vehicle.customers,
				vehicles: vehicle,
				service_order_items: items,
				payments: [{
					id: `payment-hist-${numero}`,
					metodo: pick([
						["PIX", 50],
						["CREDITO", 20],
						["DEBITO", 20],
						["DINHEIRO", 10]
					]),
					valor: total,
					pago_em: daysAgo(day, hour + 1)
				}],
				order_photos: []
			});
			numero++;
		}
	}
})();
/** Pagamentos do intervalo [from, to), no mesmo formato da consulta real. */
function demoListPayments(from, to) {
	const start = Date.parse(from);
	const end = Date.parse(to);
	return [...orders.values()].flatMap((order) => order.payments.map((payment) => ({
		id: payment.id,
		valor: Number(payment.valor),
		metodo: payment.metodo,
		pago_em: payment.pago_em,
		orderId: order.id,
		numero: order.numero,
		placa: order.vehicles.placa,
		cliente: order.customers?.nome ?? null,
		itens: order.service_order_items.map((item) => ({
			nome: item.nome,
			preco: Number(item.preco),
			quantidade: item.quantidade
		}))
	}))).filter((payment) => {
		const time = Date.parse(payment.pago_em);
		return time >= start && time < end;
	}).sort((a, b) => Date.parse(b.pago_em) - Date.parse(a.pago_em));
}
function demoSession() {
	return {
		membership: {
			tenantId,
			role: "OWNER"
		},
		tenant: {
			...businessSettings,
			...demoSubscription,
			public_listing: true,
			...pixSettings,
			created_at: now(),
			updated_at: now()
		}
	};
}
function demoHomeSummary() {
	const stats = demoFinancialSummary();
	return {
		emAndamento: stats.emAndamento,
		veiculosDia: stats.veiculosDia,
		faturamentoDia: stats.faturamentoDia
	};
}
function demoFinancialSummary() {
	const current = /* @__PURE__ */ new Date();
	const period = financialPeriod(current);
	const allOrders = [...orders.values()];
	const monthOrders = allOrders.filter((order) => Date.parse(order.created_at) >= period.startMonth.getTime() && Date.parse(order.created_at) < period.nextMonth.getTime());
	const activeOrders = allOrders.filter((order) => [
		"AGUARDANDO",
		"EM_LAVAGEM",
		"EM_FINALIZACAO",
		"FINALIZADO",
		"AGUARDANDO_PAGAMENTO"
	].includes(order.status)).length;
	const payments = allOrders.flatMap((order) => order.payments.map((payment) => ({
		...payment,
		order_id: order.id
	})));
	const paidOrderIds = new Set(payments.filter((payment) => Date.parse(payment.pago_em) >= period.startMonth.getTime() && Date.parse(payment.pago_em) < period.nextMonth.getTime()).map((payment) => payment.order_id));
	const paidItems = allOrders.filter((order) => paidOrderIds.has(order.id)).flatMap((order) => order.service_order_items);
	return calculateFinancialStats({
		now: current,
		payments,
		monthOrders: monthOrders.map((order) => ({
			id: order.id,
			vehicle_id: order.vehicles.id,
			status: order.status,
			created_at: order.created_at
		})),
		activeOrders,
		paidItems
	});
}
function demoActiveOrders() {
	return [...orders.values()].filter((order) => !["ENTREGUE", "CANCELADO"].includes(order.status)).map((order) => ({
		id: order.id,
		numero: order.numero,
		status: order.status,
		total: order.total,
		created_at: order.created_at,
		vehicles: { placa: order.vehicles.placa },
		customers: { nome: order.customers.nome }
	}));
}
function demoListVehicles() {
	return [...vehicles.values()].map((vehicle) => {
		const vehicleOrders = [...orders.values()].filter((order) => order.vehicles.id === vehicle.id).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
		const lastOrder = vehicleOrders[0];
		return {
			id: vehicle.id,
			placa: vehicle.placa,
			marca: vehicle.marca,
			modelo: vehicle.modelo,
			cor: vehicle.cor,
			created_at: vehicle.created_at,
			customers: vehicle.customers,
			totalAtendimentos: vehicleOrders.length,
			ultimoAtendimento: lastOrder ? {
				id: lastOrder.id,
				numero: lastOrder.numero,
				status: lastOrder.status,
				total: lastOrder.total,
				created_at: lastOrder.created_at,
				service_order_items: lastOrder.service_order_items
			} : null
		};
	}).sort((a, b) => {
		const dateA = a.ultimoAtendimento?.created_at ?? a.created_at;
		const dateB = b.ultimoAtendimento?.created_at ?? b.created_at;
		return Date.parse(dateB) - Date.parse(dateA);
	});
}
function demoVehicleSummary(plateInput) {
	const placa = normalizePlate(plateInput);
	const vehicle = vehicles.get(placa) ?? null;
	if (!vehicle) return {
		placa,
		vehicle: null,
		history: [],
		stats: null
	};
	const history = [...orders.values()].filter((order) => order.vehicles.id === vehicle.id).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).map((order) => ({
		id: order.id,
		numero: order.numero,
		status: order.status,
		total: order.total,
		created_at: order.created_at,
		service_order_items: order.service_order_items
	}));
	return {
		placa,
		vehicle,
		history,
		stats: {
			total: history.length,
			last: history[0]?.created_at ?? null,
			totalGasto: history.filter((order) => ["PAGO", "ENTREGUE"].includes(order.status)).reduce((sum, order) => sum + Number(order.total), 0),
			topServices: []
		}
	};
}
function demoSearchPublicTenants(queryInput) {
	const query = queryInput.trim().toLocaleLowerCase("pt-BR");
	if (query.length < 2) return [];
	return [businessSettings, demoPublicTenants[1]].filter((tenant) => tenant.nome.toLocaleLowerCase("pt-BR").includes(query) || tenant.slug.includes(query));
}
function demoClientPortal(tenantInput, plateInput, phoneInput) {
	if (tenantInput !== tenantId) throw new Error("Placa ou telefone não encontrados.");
	const placa = normalizePlate(plateInput);
	const phone = phoneInput.replace(/\D/g, "");
	const vehicle = vehicles.get(placa);
	const registeredPhone = vehicle?.customers.telefone?.replace(/\D/g, "") ?? "";
	if (!vehicle || phone !== registeredPhone) throw new Error("Placa ou telefone não encontrados.");
	const portal = demoPortalForVehicle(vehicle);
	if (portal.orders.length === 0) throw new Error("O acesso será liberado após a criação do primeiro atendimento.");
	return portal;
}
function demoClientPortalByVehicleId(vehicleId, tenantInput = tenantId) {
	const vehicle = [...vehicles.values()].find((item) => item.id === vehicleId && item.tenant_id === tenantInput);
	if (!vehicle) throw new Error("Acesso do cliente expirado.");
	return demoPortalForVehicle(vehicle);
}
function demoPortalForVehicle(vehicle) {
	const history = [...orders.values()].filter((order) => order.vehicles.id === vehicle.id).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).map((order) => ({
		id: order.id,
		numero: order.numero,
		status: order.status,
		total: order.total,
		created_at: order.created_at,
		finished_at: order.finished_at,
		service_order_items: order.service_order_items,
		payments: order.payments
	}));
	return {
		tenant: {
			...businessSettings,
			...pixSettings,
			...demoSubscription
		},
		customer: vehicle.customers,
		vehicle,
		orders: history,
		summary: {
			totalOrders: history.length,
			totalSpent: history.filter((order) => ["PAGO", "ENTREGUE"].includes(order.status)).reduce((sum, order) => sum + order.total, 0),
			lastVisit: history[0]?.created_at ?? null
		}
	};
}
function demoCreateBusiness(data) {
	const nome = data.nome?.trim();
	if (!nome || nome.length < 2) throw new Error("Informe o nome do lava-jato.");
	businessSettings = {
		business_hours: null,
		id: tenantId,
		slug: businessSlug(nome),
		nome,
		telefone: data.telefone?.trim() || null,
		endereco: data.endereco?.trim() || null,
		horario: null,
		logo_url: data.logo_url?.trim() || null,
		public_listing: true
	};
	persistDemoBusinessSettings(businessSettings);
	return businessSettings;
}
function demoUpdateBusinessProfile(data) {
	businessSettings = {
		...businessSettings,
		...data
	};
	persistDemoBusinessSettings(businessSettings);
	return businessSettings;
}
/** No demo o logo fica salvo como data URL nas configurações locais. */
function demoSetLogo(logoUrl) {
	businessSettings = {
		...businessSettings,
		logo_url: logoUrl
	};
	persistDemoBusinessSettings(businessSettings);
	return { logo_url: logoUrl };
}
function demoGetPixSettings() {
	return pixSettings;
}
function demoUpdatePixSettings(data) {
	const nextSettings = {
		pix_key: data.pix_key.trim(),
		pix_receiver_name: data.pix_receiver_name.trim(),
		pix_city: data.pix_city.trim()
	};
	persistDemoPixSettings(nextSettings);
	pixSettings = nextSettings;
	return pixSettings;
}
function demoQuickRegister(data) {
	const placa = normalizePlate(data.placa);
	if (placa.length < 6) throw new Error("Placa inválida.");
	if (!data.cliente_nome?.trim()) throw new Error("Informe o nome do cliente.");
	const phone = data.cliente_telefone?.replace(/\D/g, "") ?? "";
	if (phone.length < 10 || phone.length > 11) throw new Error("Informe um telefone válido com DDD.");
	if (vehicles.has(placa)) throw new Error("Este veículo já está cadastrado.");
	const customerId = `customer-demo-${Date.now()}`;
	const vehicle = {
		id: `vehicle-demo-${Date.now()}`,
		tenant_id: tenantId,
		customer_id: customerId,
		placa,
		placa_normalizada: placa,
		marca: data.marca || null,
		modelo: data.modelo || null,
		cor: data.cor || null,
		ano: null,
		customers: {
			id: customerId,
			nome: data.cliente_nome.trim(),
			telefone: phone,
			email: null
		},
		created_at: now(),
		updated_at: now()
	};
	vehicles.set(placa, vehicle);
	return {
		customerId,
		vehicle
	};
}
function demoCreateIntake(data) {
	const ids = [...new Set(data.service_ids ?? [])];
	const services = demoServices.filter((service) => service.ativo && ids.includes(service.id));
	if (!ids.length || services.length !== ids.length) throw new Error("Serviços inválidos.");
	assertCompatibleServices(services);
	const registration = demoQuickRegister(data);
	try {
		return {
			...demoCreateOrder({
				vehicle_id: registration.vehicle.id,
				service_ids: ids
			}),
			customerId: registration.customerId,
			vehicleId: registration.vehicle.id
		};
	} catch (error) {
		vehicles.delete(registration.vehicle.placa_normalizada);
		throw error;
	}
}
function demoOrdersThisMonth() {
	const monthStart = financialPeriod(/* @__PURE__ */ new Date()).startMonth.getTime();
	return [...orders.values()].filter((order) => !order.id.startsWith("order-hist-") && Date.parse(order.created_at) >= monthStart).length;
}
function demoAdminTenants() {
	return [{
		id: tenantId,
		nome: businessSettings.nome,
		slug: businessSettings.slug,
		telefone: businessSettings.telefone,
		created_at: daysAgo(30, 9),
		owner_email: "demo@lavapro.local",
		...demoSubscription
	}];
}
function demoCreateOrder(data) {
	const limit = resolveSubscription(demoSubscription).monthlyOrderLimit;
	if (limit !== null && demoOrdersThisMonth() >= limit) throw new Error(`O plano Grátis permite 30 atendimentos por mês. Assine um plano para continuar.`);
	const vehicle = [...vehicles.values()].find((item) => item.id === data.vehicle_id);
	if (!vehicle) throw new Error("Veículo não encontrado.");
	const ids = [...new Set(data.service_ids ?? [])];
	if (!ids.length) throw new Error("Selecione ao menos um serviço.");
	const selected = demoServices.filter((service) => ids.includes(service.id) && service.ativo);
	if (selected.length !== ids.length) throw new Error("Serviços inválidos.");
	assertCompatibleServices(selected);
	const id = `order-demo-${Date.now()}`;
	const total = selected.reduce((sum, service) => sum + service.preco, 0);
	orders.set(id, {
		id,
		tenant_id: tenantId,
		numero: 100 + orders.size + 1,
		status: "AGUARDANDO",
		subtotal: total,
		desconto: 0,
		acrescimo: 0,
		total,
		created_at: now(),
		finished_at: null,
		observacoes: null,
		customers: vehicle.customers,
		vehicles: vehicle,
		service_order_items: selected.map((service, index) => ({
			id: `${id}-item-${index}`,
			nome: service.nome,
			preco: service.preco,
			quantidade: 1
		})),
		payments: [],
		order_photos: []
	});
	return { orderId: id };
}
function demoGetOrder(id) {
	const order = orders.get(id);
	if (!order) throw new Error("Atendimento não encontrado.");
	return order;
}
function demoUpdateOrderStatus(id, status) {
	const order = demoGetOrder(id);
	assertOrderTransition(order.status, status, { canCancel: true });
	order.status = status;
	if (status === "AGUARDANDO_PAGAMENTO") order.finished_at = now();
	return { ok: true };
}
function demoRegisterPayment(id, metodo) {
	const order = demoGetOrder(id);
	assertOrderTransition(order.status, "PAGO", { viaPayment: true });
	if (order.payments.length) throw new Error("Esta ordem de serviço já possui pagamento registrado.");
	order.status = "PAGO";
	order.payments = [{
		id: `payment-demo-${Date.now()}`,
		metodo,
		valor: order.total,
		pago_em: now()
	}];
	return {
		ok: true,
		total: order.total
	};
}
function field(id, value) {
	return `${id}${String(value.length).padStart(2, "0")}${value}`;
}
function pixText(value, maxLength) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
function crc16(payload) {
	let crc = 65535;
	for (let index = 0; index < payload.length; index += 1) {
		crc ^= payload.charCodeAt(index) << 8;
		for (let bit = 0; bit < 8; bit += 1) {
			crc = (crc & 32768) !== 0 ? crc << 1 ^ 4129 : crc << 1;
			crc &= 65535;
		}
	}
	return crc.toString(16).toUpperCase().padStart(4, "0");
}
function buildPixPayload({ key, receiverName, city, amount, transactionId }) {
	const cleanKey = key.trim().slice(0, 77);
	if (!cleanKey) throw new Error("Chave PIX não configurada.");
	const cleanReceiverName = pixText(receiverName, 25);
	const cleanCity = pixText(city, 15);
	if (!cleanReceiverName || !cleanCity) throw new Error("Nome e cidade do recebedor são obrigatórios.");
	const merchantAccount = field("00", "br.gov.bcb.pix") + field("01", cleanKey);
	const additionalData = field("05", pixText(transactionId, 25) || "***");
	const base = field("00", "01") + field("26", merchantAccount) + field("52", "0000") + field("53", "986") + field("54", Math.max(0, amount).toFixed(2)) + field("58", "BR") + field("59", cleanReceiverName) + field("60", cleanCity) + field("62", additionalData) + "6304";
	return `${base}${crc16(base)}`;
}
function normalizeBusinessIdentity(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
}
function matchesBusinessIdentity(input, business) {
	const normalizedInput = normalizeBusinessIdentity(input);
	if (normalizedInput.length < 2) return false;
	return [business.nome, business.slug].filter((value) => Boolean(value)).some((value) => normalizeBusinessIdentity(value) === normalizedInput);
}
var EXTENSION = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp"
};
function logoExtension(contentType) {
	return EXTENSION[contentType];
}
/** Confere a assinatura do arquivo, não só o tipo declarado. */
function hasSignature(bytes, contentType) {
	const starts = (...values) => values.every((value, i) => bytes[i] === value);
	if (contentType === "image/png") return starts(137, 80, 78, 71, 13, 10, 26, 10);
	if (contentType === "image/jpeg") return starts(255, 216, 255);
	return starts(82, 73, 70, 70) && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80;
}
function base64ToBytes(base64) {
	if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(base64, "base64"));
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
/**
* Valida um logo enviado como data URL (PNG, JPEG ou WebP, até 1 MB) e devolve
* os bytes. Lança erro com mensagem amigável quando o arquivo não serve.
*/
function parseLogoDataUrl(dataUrl) {
	const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
	if (!match) throw new Error("Envie uma imagem PNG, JPG ou WebP.");
	const contentType = match[1];
	const base64 = match[2];
	if (base64.length > Math.ceil(4194304 / 3) + 4) throw new Error("A imagem do logo deve ter no máximo 1 MB.");
	const bytes = base64ToBytes(base64);
	if (bytes.length > 1048576) throw new Error("A imagem do logo deve ter no máximo 1 MB.");
	if (!hasSignature(bytes, contentType)) throw new Error("O arquivo enviado não é uma imagem válida.");
	return {
		contentType,
		bytes
	};
}
var UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function phoneDigits(value) {
	return (value ?? "").replace(/\D/g, "");
}
function assertDemoFeature(feature) {
	assertFeature(resolveSubscription(demoSubscriptionFields()), feature);
}
/** O portal só atende lava-jatos cujo plano inclui a área do cliente. */
function portalSubscription(tenant) {
	const subscription = resolveSubscription(tenant);
	if (!hasFeature(subscription, "area_cliente")) throw new Error("Este lava-jato não oferece a área do cliente no momento.");
	return subscription;
}
async function buildPortalPix(tenant, orders) {
	const order = orders.find((item) => item.status === "AGUARDANDO_PAGAMENTO");
	if (!order || !tenant?.pix_key?.trim() || !tenant.pix_receiver_name?.trim() || !tenant.pix_city?.trim()) return null;
	const copiaECola = buildPixPayload({
		key: tenant.pix_key,
		receiverName: tenant.pix_receiver_name,
		city: tenant.pix_city,
		amount: Number(order.total),
		transactionId: `OS${order.numero}`
	});
	const { toDataURL } = await import("../_libs/qrcode.mjs").then((n) => /* @__PURE__ */ __toESM(n.require_lib()));
	const qrCodeDataUrl = await toDataURL(copiaECola, {
		width: 320,
		margin: 2,
		errorCorrectionLevel: "M"
	});
	return {
		orderId: order.numero,
		amount: Number(order.total),
		key: tenant.pix_key,
		receiverName: tenant.pix_receiver_name,
		copiaECola,
		qrCodeDataUrl
	};
}
var searchPublicTenants_createServerFn_handler = createServerRpc({
	id: "12e09bc04e62efbeaba16593cb5411b0df194df8778615c26456e8017698c766",
	name: "searchPublicTenants",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => searchPublicTenants.__executeServer(opts));
var searchPublicTenants = createServerFn({ method: "GET" }).validator((data) => data).handler(searchPublicTenants_createServerFn_handler, async ({ data }) => {
	const query = data.query.trim().slice(0, 60);
	if (query.length < 2) return [];
	if (isDemoServerMode()) {
		const demoPortalEnabled = hasFeature(resolveSubscription(demoSubscriptionFields()), "area_cliente");
		return demoSearchPublicTenants(query).filter((tenant) => demoPortalEnabled || tenant.id !== "demo-tenant");
	}
	const { supabaseAdmin } = await import("./client.server-BPFcxTxD.mjs");
	const safeQuery = query.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
	if (safeQuery.length < 2) return [];
	const { data: tenants, error } = await supabaseAdmin.from("tenants").select("id, slug, nome, endereco, logo_url, plan, trial_ends_at, plan_expires_at").eq("public_listing", true).or(`nome.ilike.%${safeQuery}%,slug.ilike.%${safeQuery.toLowerCase()}%`).order("nome", { ascending: true }).limit(40);
	if (error) throw new Error("Não foi possível buscar os lava-jatos.");
	return (tenants ?? []).filter((tenant) => hasFeature(resolveSubscription(tenant), "area_cliente")).slice(0, 12).map((tenant) => ({
		id: tenant.id,
		slug: tenant.slug,
		nome: tenant.nome,
		endereco: tenant.endereco,
		logo_url: hasFeature(resolveSubscription(tenant), "logo") ? tenant.logo_url : null
	}));
});
var clientPortalLogin_createServerFn_handler = createServerRpc({
	id: "012a2f41566f7c8e2a5ccb7a35261938fb42b7afbe3527032385bb11da2e0bbb",
	name: "clientPortalLogin",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => clientPortalLogin.__executeServer(opts));
var clientPortalLogin = createServerFn({ method: "POST" }).validator((data) => data).handler(clientPortalLogin_createServerFn_handler, async ({ data }) => {
	const security = await import("./client-portal.server-IBms2HPv.mjs");
	const { supabaseAdmin } = await import("./client.server-BPFcxTxD.mjs");
	let vehicle;
	let accessToken = data.accessToken?.trim() ?? "";
	if (accessToken) {
		const claims = security.verifyClientPortalToken(accessToken);
		if (isDemoServerMode()) {
			const portal = demoClientPortalByVehicleId(claims.vehicleId, claims.tenantId);
			const subscription = portalSubscription(portal.tenant);
			return {
				...portal,
				tenant: {
					id: portal.tenant.id,
					slug: portal.tenant.slug,
					nome: portal.tenant.nome,
					telefone: portal.tenant.telefone,
					endereco: portal.tenant.endereco,
					horario: portal.tenant.horario,
					logo_url: hasFeature(subscription, "logo") ? portal.tenant.logo_url : null,
					business_hours: portal.tenant.business_hours
				},
				pix: hasFeature(subscription, "pix") ? await buildPortalPix(portal.tenant, portal.orders) : null,
				accessToken
			};
		}
		const { data: tokenVehicle, error } = await supabaseAdmin.from("vehicles").select("*, customers(id, nome, telefone, email)").eq("id", claims.vehicleId).eq("tenant_id", claims.tenantId).maybeSingle();
		if (error || !tokenVehicle) throw new Error("Acesso do cliente expirado.");
		vehicle = tokenVehicle;
	} else {
		const tenantId = data.tenantId?.trim() ?? "";
		const placa = normalizePlate(data.placa ?? "");
		const telefone = phoneDigits(data.telefone);
		if (!tenantId) throw new Error("Escolha o lava-jato onde o serviço foi realizado.");
		const attemptRules = security.portalAttemptRules(security.requestClientIp(getRequest()?.headers), tenantId, placa, telefone);
		await security.assertPortalAttemptsAllowed(attemptRules);
		if (placa.length !== 7 || telefone.length < 10 || telefone.length > 11) {
			await security.recordPortalAttemptFailure(attemptRules);
			throw new Error("Informe a placa e o telefone usados no cadastro.");
		}
		if (isDemoServerMode()) {
			const subscription = portalSubscription(demoSubscriptionFields());
			try {
				const portal = demoClientPortal(tenantId, placa, telefone);
				await security.clearPortalAttemptFailures(attemptRules);
				accessToken = security.issueClientPortalToken(portal.vehicle.id, portal.vehicle.tenant_id);
				return {
					...portal,
					tenant: {
						id: portal.tenant.id,
						slug: portal.tenant.slug,
						nome: portal.tenant.nome,
						telefone: portal.tenant.telefone,
						endereco: portal.tenant.endereco,
						horario: portal.tenant.horario,
						logo_url: hasFeature(subscription, "logo") ? portal.tenant.logo_url : null,
						business_hours: portal.tenant.business_hours
					},
					pix: hasFeature(subscription, "pix") ? await buildPortalPix(portal.tenant, portal.orders) : null,
					accessToken
				};
			} catch {
				await security.recordPortalAttemptFailure(attemptRules);
				throw new Error("Placa ou telefone não encontrados.");
			}
		}
		if (!UUID_PATTERN.test(tenantId)) {
			await security.recordPortalAttemptFailure(attemptRules);
			throw new Error("Placa ou telefone não encontrados.");
		}
		const { data: candidates, error: vehicleError } = await supabaseAdmin.from("vehicles").select("*, customers(id, nome, telefone, email)").eq("tenant_id", tenantId).eq("placa_normalizada", placa).limit(20);
		if (vehicleError) throw new Error("Não foi possível consultar seus atendimentos.");
		const matches = (candidates ?? []).filter((candidate) => phoneDigits(candidate.customers?.telefone) === telefone);
		if (matches.length !== 1) {
			await security.recordPortalAttemptFailure(attemptRules);
			throw new Error(matches.length > 1 ? "Existe mais de um cadastro com esses dados. Procure o lava-jato." : "Placa ou telefone não encontrados.");
		}
		vehicle = matches[0];
		const { count: orderCount, error: orderAccessError } = await supabaseAdmin.from("service_orders").select("id", {
			count: "exact",
			head: true
		}).eq("tenant_id", tenantId).eq("vehicle_id", vehicle.id);
		if (orderAccessError) throw new Error("Não foi possível consultar seus atendimentos.");
		if (!orderCount) {
			await security.recordPortalAttemptFailure(attemptRules);
			throw new Error("Placa ou telefone não encontrados.");
		}
		await security.clearPortalAttemptFailures(attemptRules);
		accessToken = security.issueClientPortalToken(vehicle.id, vehicle.tenant_id);
	}
	const [{ data: tenant, error: tenantError }, { data: orders, error: ordersError }] = await Promise.all([supabaseAdmin.from("tenants").select("id, slug, nome, telefone, endereco, horario, business_hours, logo_url, pix_key, pix_receiver_name, pix_city, plan, trial_ends_at, plan_expires_at").eq("id", vehicle.tenant_id).single(), supabaseAdmin.from("service_orders").select("id, numero, status, total, created_at, finished_at, service_order_items(id, nome, preco, quantidade), payments(id, metodo, valor, pago_em)").eq("tenant_id", vehicle.tenant_id).eq("vehicle_id", vehicle.id).order("created_at", { ascending: false }).limit(30)]);
	if (tenantError || ordersError) throw new Error("Não foi possível consultar seus atendimentos.");
	const subscription = portalSubscription(tenant);
	const history = orders ?? [];
	const pix = hasFeature(subscription, "pix") ? await buildPortalPix(tenant, history) : null;
	return {
		tenant: tenant ? {
			id: tenant.id,
			slug: tenant.slug,
			nome: tenant.nome,
			telefone: tenant.telefone,
			endereco: tenant.endereco,
			horario: tenant.horario,
			logo_url: hasFeature(subscription, "logo") ? tenant.logo_url : null,
			business_hours: tenant.business_hours
		} : null,
		customer: vehicle.customers ? { nome: vehicle.customers.nome } : null,
		vehicle: {
			id: vehicle.id,
			placa: vehicle.placa,
			marca: vehicle.marca,
			modelo: vehicle.modelo,
			cor: vehicle.cor
		},
		orders: history,
		summary: {
			totalOrders: history.length,
			totalSpent: history.filter((order) => ["PAGO", "ENTREGUE"].includes(order.status)).reduce((sum, order) => sum + Number(order.total), 0),
			lastVisit: history[0]?.created_at ?? null
		},
		pix,
		accessToken
	};
});
var getSession_createServerFn_handler = createServerRpc({
	id: "a86bf85bb2776fd132d5437b1c81b4336e7b4991925f565e8cab708b65c5329d",
	name: "getSession",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => getSession.__executeServer(opts));
var getSession = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getSession_createServerFn_handler, async ({ context }) => {
	if (isDemoServerMode()) return {
		...demoSession(),
		subscription: resolveSubscription(demoSubscriptionFields()),
		usage: { ordersThisMonth: demoOrdersThisMonth() },
		isPlatformAdmin: true,
		user: {
			id: "demo-user",
			email: "demo@lavapro.local"
		}
	};
	const isPlatformAdmin = await checkPlatformAdmin(context.userId);
	const membership = await getMembership(context.supabase, context.userId);
	if (!membership) return {
		membership: null,
		tenant: null,
		subscription: null,
		usage: null,
		isPlatformAdmin,
		user: {
			id: context.userId,
			email: typeof context.claims.email === "string" ? context.claims.email : null
		}
	};
	const { data: tenant, error } = await context.supabase.from("tenants").select("*").eq("id", membership.tenantId).maybeSingle();
	if (error) throw new Error(error.message);
	const subscription = resolveSubscription(tenant);
	return {
		membership,
		tenant,
		subscription,
		usage: { ordersThisMonth: subscription.monthlyOrderLimit === null ? null : await ordersThisMonth(context.supabase, membership.tenantId) },
		isPlatformAdmin,
		user: {
			id: context.userId,
			email: typeof context.claims.email === "string" ? context.claims.email : null
		}
	};
});
var updateTenantProfile_createServerFn_handler = createServerRpc({
	id: "6100bd8c4729c73c1daa91b0efe03cc77b864b89eaacd2ad3208fd9235afeeca",
	name: "updateTenantProfile",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => updateTenantProfile.__executeServer(opts));
var updateTenantProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(updateTenantProfile_createServerFn_handler, async ({ data, context }) => {
	const nome = data.nome.trim();
	const telefone = data.telefone?.trim() || null;
	const endereco = data.endereco?.trim() || null;
	const businessHours = validateBusinessHours(data.business_hours);
	const logoUrl = data.logo_url?.trim() || null;
	if (nome.length < 2 || nome.length > 80) throw new Error("Informe um nome entre 2 e 80 caracteres.");
	if (telefone && !/^\d{10,11}$/.test(phoneDigits(telefone))) throw new Error("Informe um telefone válido com DDD.");
	if (endereco && endereco.length > 180) throw new Error("O endereço deve ter no máximo 180 caracteres.");
	if (logoUrl) {
		let parsedUrl;
		try {
			parsedUrl = new URL(logoUrl);
		} catch {
			throw new Error("Informe um link válido para o logo.");
		}
		if (parsedUrl.protocol !== "https:") throw new Error("O link do logo deve começar com https://.");
	}
	const profile = {
		nome,
		telefone,
		endereco,
		business_hours: businessHours,
		...data.logo_url !== void 0 ? { logo_url: logoUrl } : {},
		public_listing: data.public_listing
	};
	if (isDemoServerMode()) return demoUpdateBusinessProfile({
		...profile,
		business_hours: businessHours
	});
	const { tenantId } = await requireManager(context.supabase, context.userId);
	const { data: tenant, error } = await context.supabase.from("tenants").update(profile).eq("id", tenantId).select("*").single();
	if (error) throw new Error("Não foi possível atualizar o perfil do lava-jato.");
	return tenant;
});
var getDemoOwnerLoginHint_createServerFn_handler = createServerRpc({
	id: "c71ad2c9b038ce32207de8175e668d6032786fb2718a701b631e9734bfeccd46",
	name: "getDemoOwnerLoginHint",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => getDemoOwnerLoginHint.__executeServer(opts));
var getDemoOwnerLoginHint = createServerFn({ method: "GET" }).handler(getDemoOwnerLoginHint_createServerFn_handler, () => {
	if (!isDemoServerMode()) return null;
	return { businessName: demoSession().tenant.nome };
});
var verifyOwnerBusiness_createServerFn_handler = createServerRpc({
	id: "54dbe4f3d1029313295d65b446b3d1e213373edd72e6ae5bbeebca474bf6adc3",
	name: "verifyOwnerBusiness",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => verifyOwnerBusiness.__executeServer(opts));
var verifyOwnerBusiness = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(verifyOwnerBusiness_createServerFn_handler, async ({ data, context }) => {
	const denyAccess = () => {
		throw new Error("Nome do lava-jato, e-mail ou senha incorretos.");
	};
	if (isDemoServerMode()) {
		const tenant = demoSession().tenant;
		if (!matchesBusinessIdentity(data.businessName, tenant)) denyAccess();
		return {
			ok: true,
			needsOnboarding: false
		};
	}
	const membership = await getMembership(context.supabase, context.userId);
	if (!membership) return {
		ok: true,
		needsOnboarding: true
	};
	const { data: tenant, error } = await context.supabase.from("tenants").select("nome, slug").eq("id", membership.tenantId).maybeSingle();
	if (error || !tenant || !matchesBusinessIdentity(data.businessName, tenant)) denyAccess();
	return {
		ok: true,
		needsOnboarding: false
	};
});
var createTenant_createServerFn_handler = createServerRpc({
	id: "77e016e64b53e1c0475e8be850fa459f0fa0e08dd440a136176187bbc381e417",
	name: "createTenant",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => createTenant.__executeServer(opts));
var createTenant = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createTenant_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) return { tenantId: demoCreateBusiness(data).id };
	const sb = context.supabase;
	if (await getMembership(sb, context.userId)) throw new Error("Você já possui um lava-jato vinculado.");
	const nome = (data.nome ?? "").trim();
	if (nome.length < 2) throw new Error("Informe o nome do lava-jato.");
	const tenantId = crypto.randomUUID();
	const { error } = await sb.rpc("create_tenant_atomic", {
		p_tenant_id: tenantId,
		p_nome: nome,
		p_telefone: data.telefone?.trim() || null,
		p_endereco: data.endereco?.trim() || null,
		p_logo_url: data.logo_url?.trim() || null
	});
	if (error) throw new Error(error.message);
	return { tenantId };
});
var listServices_createServerFn_handler = createServerRpc({
	id: "fe7ec4d3613fec8ddf9e5e92b5230239c269b721d52062fb77b6e3669d43235e",
	name: "listServices",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => listServices.__executeServer(opts));
var listServices = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listServices_createServerFn_handler, async ({ context }) => {
	if (isDemoServerMode()) return demoServices;
	const { tenantId } = await requireMembership(context.supabase, context.userId);
	const { data, error } = await context.supabase.from("services").select("*").eq("tenant_id", tenantId).order("preco", { ascending: true });
	if (error) throw new Error(error.message);
	return data ?? [];
});
var createService_createServerFn_handler = createServerRpc({
	id: "ad1c7eb6b7a0bbd4d9674ec55ec26f88ce1ebb7595c5fa0f45590d91a3ab93e4",
	name: "createService",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => createService.__executeServer(opts));
var createService = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createService_createServerFn_handler, async ({ data, context }) => {
	const nome = data.nome.trim();
	const preco = Number(data.preco);
	const duracao = data.duracao_min == null ? null : Number(data.duracao_min);
	const descricao = data.descricao?.trim() || null;
	if (nome.length < 2 || nome.length > 80) throw new Error("Informe um nome entre 2 e 80 caracteres.");
	if (!Number.isFinite(preco) || preco < 0 || preco > 1e5) throw new Error("Informe um preço válido.");
	if (duracao !== null && (!Number.isInteger(duracao) || duracao < 1 || duracao > 1440)) throw new Error("A duração deve ficar entre 1 e 1440 minutos.");
	if (descricao && descricao.length > 240) throw new Error("A descrição deve ter no máximo 240 caracteres.");
	if (isDemoServerMode()) return demoCreateService({
		nome,
		preco,
		duracao_min: duracao,
		descricao,
		categoria: data.categoria
	});
	const { tenantId } = await requireManager(context.supabase, context.userId);
	const { data: row, error } = await context.supabase.from("services").insert({
		tenant_id: tenantId,
		nome,
		preco,
		duracao_min: duracao,
		descricao,
		categoria: data.categoria
	}).select("*").single();
	if (error) throw new Error(error.message);
	return row;
});
var updateService_createServerFn_handler = createServerRpc({
	id: "aebf39534c344906f5daec8e89c0d851e8ea7b03ecdb9a9ffa4c4c9e9796c434",
	name: "updateService",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => updateService.__executeServer(opts));
var updateService = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(updateService_createServerFn_handler, async ({ data, context }) => {
	if (data.nome !== void 0 && (data.nome.trim().length < 2 || data.nome.trim().length > 80)) throw new Error("Informe um nome entre 2 e 80 caracteres.");
	if (data.preco !== void 0 && (!Number.isFinite(data.preco) || data.preco < 0 || data.preco > 1e5)) throw new Error("Informe um preço válido.");
	if (data.duracao_min !== void 0 && data.duracao_min !== null && (!Number.isInteger(data.duracao_min) || data.duracao_min < 1 || data.duracao_min > 1440)) throw new Error("A duração deve ficar entre 1 e 1440 minutos.");
	if (data.descricao && data.descricao.trim().length > 240) throw new Error("A descrição deve ter no máximo 240 caracteres.");
	if (isDemoServerMode()) return demoUpdateService(data);
	const { tenantId } = await requireManager(context.supabase, context.userId);
	const patch = {};
	if (data.nome !== void 0) patch.nome = data.nome.trim();
	if (data.preco !== void 0) patch.preco = Math.max(0, Number(data.preco) || 0);
	if (data.duracao_min !== void 0) patch.duracao_min = data.duracao_min;
	if (data.descricao !== void 0) patch.descricao = data.descricao?.trim() || null;
	if (data.categoria !== void 0) patch.categoria = data.categoria;
	if (data.ativo !== void 0) patch.ativo = data.ativo;
	const { data: row, error } = await context.supabase.from("services").update(patch).eq("id", data.id).eq("tenant_id", tenantId).select("*").single();
	if (error) throw new Error(error.message);
	return row;
});
var deactivateService_createServerFn_handler = createServerRpc({
	id: "722c8b36b0477ef2eae278b015f68f9c6bb464f234e82fd37281d37b4f731dc5",
	name: "deactivateService",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => deactivateService.__executeServer(opts));
var deactivateService = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(deactivateService_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) return demoDeactivateService(data.id);
	const { tenantId } = await requireManager(context.supabase, context.userId);
	const { error } = await context.supabase.from("services").update({ ativo: false }).eq("id", data.id).eq("tenant_id", tenantId);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var recognizePlate_createServerFn_handler = createServerRpc({
	id: "77f05fdaa7a03b39a2147333601e9ceb2097d89a77b929a4bc6a0f23d7a45459",
	name: "recognizePlate",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => recognizePlate.__executeServer(opts));
var recognizePlate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(recognizePlate_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) {
		assertDemoFeature("placa_foto");
		return {
			plate: "ABC1D23",
			confidence: .98,
			simulated: true
		};
	}
	const { tenantId } = await requireMembership(context.supabase, context.userId);
	await requireFeature(context.supabase, tenantId, "placa_foto");
	if (!data.image?.startsWith("data:image/")) throw new Error("Imagem inválida.");
	if (data.image.length > 8e6) throw new Error("Imagem muito grande. Tire outra foto.");
	return recognizePlateFromImage(data.image);
});
var findVehicleByPlate_createServerFn_handler = createServerRpc({
	id: "13adc082f700b296234983e1ff4ea19ec4d2df475450e3b9374c9e8fb29434d1",
	name: "findVehicleByPlate",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => findVehicleByPlate.__executeServer(opts));
var findVehicleByPlate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(findVehicleByPlate_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) return demoVehicleSummary(data.placa);
	const { tenantId } = await requireMembership(context.supabase, context.userId);
	return vehicleSummary(context.supabase, tenantId, data.placa);
});
var plateHistory_createServerFn_handler = createServerRpc({
	id: "2a46c79a30dd12c8c9a7f94964de23b285b419fb4abd36fd2f3418e4f01adc47",
	name: "plateHistory",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => plateHistory.__executeServer(opts));
var plateHistory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(plateHistory_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) return demoVehicleSummary(data.placa);
	const { tenantId } = await requireMembership(context.supabase, context.userId);
	return vehicleSummary(context.supabase, tenantId, data.placa);
});
var listVehicles_createServerFn_handler = createServerRpc({
	id: "8ede43f00b5994e1ef8907a16e98580674e7763d09cfaf55c53c29a378861833",
	name: "listVehicles",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => listVehicles.__executeServer(opts));
var listVehicles = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listVehicles_createServerFn_handler, async ({ context }) => {
	if (isDemoServerMode()) return demoListVehicles();
	const { tenantId } = await requireMembership(context.supabase, context.userId);
	const { data: vehicles, error: vehicleError } = await context.supabase.from("vehicles").select("id, placa, marca, modelo, cor, created_at, customers(id, nome, telefone)").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(200);
	if (vehicleError) throw new Error(vehicleError.message);
	const vehicleIds = (vehicles ?? []).map((vehicle) => vehicle.id);
	if (!vehicleIds.length) return [];
	const { data: orders, error: orderError } = await context.supabase.from("service_orders").select("id, vehicle_id, numero, status, total, created_at, service_order_items(nome)").eq("tenant_id", tenantId).in("vehicle_id", vehicleIds).order("created_at", { ascending: false });
	if (orderError) throw new Error(orderError.message);
	const ordersByVehicle = /* @__PURE__ */ new Map();
	for (const order of orders ?? []) {
		if (!order.vehicle_id) continue;
		const current = ordersByVehicle.get(order.vehicle_id) ?? [];
		current.push(order);
		ordersByVehicle.set(order.vehicle_id, current);
	}
	return (vehicles ?? []).map((vehicle) => {
		const vehicleOrders = ordersByVehicle.get(vehicle.id) ?? [];
		const lastOrder = vehicleOrders[0] ?? null;
		return {
			...vehicle,
			totalAtendimentos: vehicleOrders.length,
			ultimoAtendimento: lastOrder ? {
				id: lastOrder.id,
				numero: lastOrder.numero,
				status: lastOrder.status,
				total: Number(lastOrder.total),
				created_at: lastOrder.created_at,
				service_order_items: lastOrder.service_order_items ?? []
			} : null
		};
	}).sort((a, b) => {
		const dateA = a.ultimoAtendimento?.created_at ?? a.created_at;
		const dateB = b.ultimoAtendimento?.created_at ?? b.created_at;
		return Date.parse(dateB) - Date.parse(dateA);
	});
});
var createCustomer_createServerFn_handler = createServerRpc({
	id: "f7c6bcab37c4ea76c6626ec6026b1275a63eb31d11c10e4f59601d7be293ae22",
	name: "createCustomer",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => createCustomer.__executeServer(opts));
var createCustomer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createCustomer_createServerFn_handler, async ({ data, context }) => {
	const { tenantId } = await requireMembership(context.supabase, context.userId);
	const { data: row, error } = await context.supabase.from("customers").insert({
		tenant_id: tenantId,
		nome: data.nome.trim(),
		telefone: data.telefone?.trim() || null
	}).select("*").single();
	if (error) throw new Error(error.message);
	return row;
});
var createVehicle_createServerFn_handler = createServerRpc({
	id: "9a048251188dda049b95c676ea12c29ad4837e5714a73efe2273f35409045d9e",
	name: "createVehicle",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => createVehicle.__executeServer(opts));
var createVehicle = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createVehicle_createServerFn_handler, async ({ data, context }) => {
	const { tenantId } = await requireMembership(context.supabase, context.userId);
	const placa = normalizePlate(data.placa);
	if (placa.length < 6) throw new Error("Placa inválida.");
	const { data: row, error } = await context.supabase.from("vehicles").insert({
		tenant_id: tenantId,
		customer_id: data.customer_id ?? null,
		placa,
		placa_normalizada: placa,
		marca: data.marca?.trim() || null,
		modelo: data.modelo?.trim() || null,
		cor: data.cor?.trim() || null
	}).select("*").single();
	if (error) throw new Error(error.message);
	return row;
});
var quickRegister_createServerFn_handler = createServerRpc({
	id: "b3f5f0a6e30e9a3219e9dc9e4a51312a5271bea1b2e8c807da16c863e79f91cb",
	name: "quickRegister",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => quickRegister.__executeServer(opts));
var quickRegister = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(quickRegister_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) return demoQuickRegister(data);
	const sb = context.supabase;
	const { tenantId } = await requireMembership(sb, context.userId);
	const placa = normalizePlate(data.placa);
	if (placa.length < 6) throw new Error("Placa inválida.");
	if (!data.cliente_nome?.trim()) throw new Error("Informe o nome do cliente.");
	const telefone = phoneDigits(data.cliente_telefone);
	if (telefone.length < 10 || telefone.length > 11) throw new Error("Informe um telefone válido com DDD.");
	const { data: result, error } = await sb.rpc("quick_register_atomic", {
		p_placa: placa,
		p_cliente_nome: data.cliente_nome.trim(),
		p_cliente_telefone: telefone,
		p_marca: data.marca?.trim() || null,
		p_modelo: data.modelo?.trim() || null,
		p_cor: data.cor?.trim() || null
	});
	if (error) throw new Error(error.message);
	return result;
});
var createOrder_createServerFn_handler = createServerRpc({
	id: "fe1eb8f88d4afd2b18a892673c563031d8de7036b06080eb227e849b23ec9e06",
	name: "createOrder",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => createOrder.__executeServer(opts));
var createOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createOrder_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) return demoCreateOrder(data);
	const sb = context.supabase;
	const { tenantId } = await requireMembership(sb, context.userId);
	const ids = [...new Set(data.service_ids ?? [])];
	if (ids.length === 0) throw new Error("Selecione ao menos um serviço.");
	const { data: selectedServices, error: servicesError } = await sb.from("services").select("id, nome, categoria").eq("tenant_id", tenantId).eq("ativo", true).in("id", ids);
	if (servicesError) throw new Error(servicesError.message);
	if ((selectedServices ?? []).length !== ids.length) throw new Error("Serviços inválidos.");
	assertCompatibleServices(selectedServices ?? []);
	const { data: orderId, error } = await sb.rpc("create_order_atomic", {
		p_vehicle_id: data.vehicle_id,
		p_service_ids: ids,
		p_observacoes: data.observacoes?.trim() || null
	});
	if (error) throw new Error(error.message);
	return { orderId };
});
var createNewCustomerOrder_createServerFn_handler = createServerRpc({
	id: "bfb9f9dcdf8847228c53b61ea0eafcf315e9cfd060878669916a07cb94dd1409",
	name: "createNewCustomerOrder",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => createNewCustomerOrder.__executeServer(opts));
var createNewCustomerOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createNewCustomerOrder_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) return demoCreateIntake(data);
	const sb = context.supabase;
	const { tenantId } = await requireMembership(sb, context.userId);
	const placa = normalizePlate(data.placa);
	const telefone = phoneDigits(data.cliente_telefone);
	const ids = [...new Set(data.service_ids ?? [])];
	if (placa.length !== 7) throw new Error("Placa inválida.");
	if (data.cliente_nome.trim().length < 2) throw new Error("Informe o nome do cliente.");
	if (telefone.length < 10 || telefone.length > 11) throw new Error("Informe um telefone válido com DDD.");
	if (!ids.length) throw new Error("Selecione ao menos um serviço.");
	const { data: selectedServices, error: servicesError } = await sb.from("services").select("id, nome, categoria").eq("tenant_id", tenantId).eq("ativo", true).in("id", ids);
	if (servicesError) throw new Error(servicesError.message);
	if ((selectedServices ?? []).length !== ids.length) throw new Error("Serviços inválidos.");
	assertCompatibleServices(selectedServices ?? []);
	const { data: result, error } = await sb.rpc("create_intake_atomic", {
		p_placa: placa,
		p_cliente_nome: data.cliente_nome.trim(),
		p_cliente_telefone: telefone,
		p_marca: data.marca?.trim() || null,
		p_modelo: data.modelo?.trim() || null,
		p_cor: data.cor?.trim() || null,
		p_service_ids: ids,
		p_observacoes: data.observacoes?.trim() || null
	});
	if (error) throw new Error(error.message);
	const payload = result;
	if (!payload?.orderId) throw new Error("Não foi possível criar o atendimento.");
	return payload;
});
var getOrder_createServerFn_handler = createServerRpc({
	id: "84c80ec41077e95228a77d0055d0ab509c3884588b920d82e831ca8d45b07f17",
	name: "getOrder",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => getOrder.__executeServer(opts));
var getOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(getOrder_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) return demoGetOrder(data.id);
	const { tenantId } = await requireMembership(context.supabase, context.userId);
	return loadOrder(context.supabase, tenantId, data.id);
});
var updateOrderStatus_createServerFn_handler = createServerRpc({
	id: "a2d38cf6203cff30b9968419155917eede68ca9517b153ca063e4a47210bce3c",
	name: "updateOrderStatus",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => updateOrderStatus.__executeServer(opts));
var updateOrderStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(updateOrderStatus_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) return demoUpdateOrderStatus(data.order_id, data.status);
	const sb = context.supabase;
	const membership = await requireMembership(sb, context.userId);
	if (data.status === "CANCELADO" && membership.role === "EMPLOYEE") throw new Error("Apenas proprietário ou gerente podem cancelar.");
	const { data: current, error: curErr } = await sb.from("service_orders").select("status").eq("id", data.order_id).eq("tenant_id", membership.tenantId).maybeSingle();
	if (curErr) throw new Error(curErr.message);
	if (!current) throw new Error("Atendimento não encontrado.");
	assertOrderTransition(current.status, data.status, { canCancel: membership.role === "OWNER" || membership.role === "MANAGER" });
	const patch = { status: data.status };
	if (data.status === "AGUARDANDO_PAGAMENTO") patch.finished_at = (/* @__PURE__ */ new Date()).toISOString();
	const { error } = await sb.from("service_orders").update(patch).eq("id", data.order_id).eq("tenant_id", membership.tenantId);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var registerPayment_createServerFn_handler = createServerRpc({
	id: "da13fcd18830983470119b81ef07bca54f157607047e18a9adc7863cc36bb08e",
	name: "registerPayment",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => registerPayment.__executeServer(opts));
var registerPayment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(registerPayment_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) return demoRegisterPayment(data.order_id, data.metodo);
	const sb = context.supabase;
	await requireMembership(sb, context.userId);
	const { data: total, error } = await sb.rpc("register_order_payment_atomic", {
		p_order_id: data.order_id,
		p_metodo: data.metodo
	});
	if (error) throw new Error(error.message);
	return {
		ok: true,
		total: Number(total)
	};
});
var homeSummary_createServerFn_handler = createServerRpc({
	id: "b3dcdc04aee1c1e1e9091394e3104a64e3485e2c61e4790e78d6f84f0e8c2b4c",
	name: "homeSummary",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => homeSummary.__executeServer(opts));
var homeSummary = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(homeSummary_createServerFn_handler, async ({ context }) => {
	if (isDemoServerMode()) return demoHomeSummary();
	const { tenantId } = await requireMembership(context.supabase, context.userId);
	const stats = await dashboardStats(context.supabase, tenantId);
	return {
		emAndamento: stats.emAndamento,
		veiculosDia: stats.veiculosDia,
		faturamentoDia: stats.faturamentoDia
	};
});
var financialSummary_createServerFn_handler = createServerRpc({
	id: "0a59b034cee327026b8d544de7fbd33f56191bdd62a65132abd95c10f3630c0b",
	name: "financialSummary",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => financialSummary.__executeServer(opts));
var financialSummary = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(financialSummary_createServerFn_handler, async ({ context }) => {
	if (isDemoServerMode()) {
		assertDemoFeature("financeiro");
		return demoFinancialSummary();
	}
	const { tenantId } = await requireManager(context.supabase, context.userId);
	await requireFeature(context.supabase, tenantId, "financeiro");
	return dashboardStats(context.supabase, tenantId);
});
var getPixSettings_createServerFn_handler = createServerRpc({
	id: "df621c5b0f43da658c627439717697dd8a79e326edc647677edc462724d018d7",
	name: "getPixSettings",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => getPixSettings.__executeServer(opts));
var getPixSettings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getPixSettings_createServerFn_handler, async ({ context }) => {
	if (isDemoServerMode()) {
		assertDemoFeature("pix");
		return demoGetPixSettings();
	}
	const { tenantId } = await requireManager(context.supabase, context.userId);
	await requireFeature(context.supabase, tenantId, "pix");
	const { data, error } = await context.supabase.from("tenants").select("pix_key, pix_receiver_name, pix_city").eq("id", tenantId).single();
	if (error) throw new Error(error.message);
	return data;
});
var updatePixSettings_createServerFn_handler = createServerRpc({
	id: "7515b9ad53fa3915198ff658728aad817b83dd0ea4ec26c345a586063feea9c5",
	name: "updatePixSettings",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => updatePixSettings.__executeServer(opts));
var updatePixSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(updatePixSettings_createServerFn_handler, async ({ data, context }) => {
	const settings = {
		pix_key: data.pix_key?.trim() ?? "",
		pix_receiver_name: data.pix_receiver_name?.trim() ?? "",
		pix_city: data.pix_city?.trim() ?? ""
	};
	if (!settings.pix_key || settings.pix_key.length > 77) throw new Error("Informe uma chave PIX válida.");
	if (settings.pix_receiver_name.length < 2) throw new Error("Informe o nome do recebedor.");
	if (settings.pix_city.length < 2) throw new Error("Informe a cidade do recebedor.");
	buildPixPayload({
		key: settings.pix_key,
		receiverName: settings.pix_receiver_name,
		city: settings.pix_city,
		amount: 0,
		transactionId: "VALIDACAO"
	});
	if (isDemoServerMode()) {
		assertDemoFeature("pix");
		return demoUpdatePixSettings(settings);
	}
	const { tenantId } = await requireManager(context.supabase, context.userId);
	await requireFeature(context.supabase, tenantId, "pix");
	const { data: saved, error } = await context.supabase.from("tenants").update(settings).eq("id", tenantId).select("pix_key, pix_receiver_name, pix_city").single();
	if (error) throw new Error(error.message);
	return saved;
});
var listTeam_createServerFn_handler = createServerRpc({
	id: "b21bc537b922faac3a211c047e0e6c62831739a74d44df378e9472c0abc654b3",
	name: "listTeam",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => listTeam.__executeServer(opts));
var listTeam = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listTeam_createServerFn_handler, async ({ context }) => {
	const { tenantId } = await requireManager(context.supabase, context.userId);
	const { data, error } = await context.supabase.from("tenant_members").select("id, user_id, role, created_at").eq("tenant_id", tenantId);
	if (error) throw new Error(error.message);
	return data ?? [];
});
var listActiveOrders_createServerFn_handler = createServerRpc({
	id: "e2f29458b6adf3aa9f581bde8c583d7970320faa6ae393e669b04dbf74ffec6f",
	name: "listActiveOrders",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => listActiveOrders.__executeServer(opts));
var listActiveOrders = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listActiveOrders_createServerFn_handler, async ({ context }) => {
	if (isDemoServerMode()) return demoActiveOrders();
	const { tenantId } = await requireMembership(context.supabase, context.userId);
	const { data, error } = await context.supabase.from("service_orders").select("id, numero, status, total, created_at, vehicles(placa), customers(nome)").eq("tenant_id", tenantId).not("status", "in", "(ENTREGUE,CANCELADO)").order("created_at", { ascending: false }).limit(30);
	if (error) throw new Error(error.message);
	return data ?? [];
});
async function checkPlatformAdmin(userId) {
	try {
		const { supabaseAdmin } = await import("./client.server-BPFcxTxD.mjs");
		const { data, error } = await supabaseAdmin.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
		return !error && Boolean(data);
	} catch {
		return false;
	}
}
async function requirePlatformAdmin(userId) {
	if (!await checkPlatformAdmin(userId)) throw new Error("Acesso restrito à administração do LavaPro.");
}
var adminListTenants_createServerFn_handler = createServerRpc({
	id: "476fcff616171cb2127c8ed6e620c1c99b3b944fcb59a2141b50ac171dabcb33",
	name: "adminListTenants",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => adminListTenants.__executeServer(opts));
var adminListTenants = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(adminListTenants_createServerFn_handler, async ({ context }) => {
	if (isDemoServerMode()) return demoAdminTenants().map((tenant) => ({
		...tenant,
		subscription: resolveSubscription(tenant)
	}));
	await requirePlatformAdmin(context.userId);
	const { supabaseAdmin } = await import("./client.server-BPFcxTxD.mjs");
	const [{ data: tenants, error }, { data: owners, error: ownersError }, usersResult] = await Promise.all([
		supabaseAdmin.from("tenants").select("id, nome, slug, telefone, created_at, plan, trial_ends_at, plan_expires_at").order("created_at", { ascending: false }).limit(500),
		supabaseAdmin.from("tenant_members").select("tenant_id, user_id").eq("role", "OWNER"),
		supabaseAdmin.auth.admin.listUsers({ perPage: 1e3 })
	]);
	if (error || ownersError) throw new Error("Não foi possível listar as empresas.");
	const emailByUser = new Map((usersResult.data?.users ?? []).map((user) => [user.id, user.email ?? null]));
	const ownerByTenant = new Map((owners ?? []).map((owner) => [owner.tenant_id, emailByUser.get(owner.user_id) ?? null]));
	return (tenants ?? []).map((tenant) => ({
		...tenant,
		owner_email: ownerByTenant.get(tenant.id) ?? null,
		subscription: resolveSubscription(tenant)
	}));
});
var adminUpdateSubscription_createServerFn_handler = createServerRpc({
	id: "cf391fcfacfc3e208434adece91eb513668678f0371f7901579e84e991453d37",
	name: "adminUpdateSubscription",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => adminUpdateSubscription.__executeServer(opts));
var adminUpdateSubscription = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(adminUpdateSubscription_createServerFn_handler, async ({ data, context }) => {
	if (isDemoServerMode()) return demoUpdateSubscription(applyAdminSubscriptionAction(demoSubscriptionFields(), data.change));
	await requirePlatformAdmin(context.userId);
	const { supabaseAdmin } = await import("./client.server-BPFcxTxD.mjs");
	const { data: current, error } = await supabaseAdmin.from("tenants").select("plan, trial_ends_at, plan_expires_at").eq("id", data.tenantId).single();
	if (error || !current) throw new Error("Empresa não encontrada.");
	const { data: updated, error: updateError } = await supabaseAdmin.from("tenants").update(applyAdminSubscriptionAction(current, data.change)).eq("id", data.tenantId).select("plan, trial_ends_at, plan_expires_at").single();
	if (updateError) throw new Error("Não foi possível atualizar o plano.");
	return updated;
});
var MAX_PAYMENT_RANGE_DAYS = 400;
/** Pagamentos de um intervalo, com OS, placa, cliente e serviços (financeiro). */
var listPayments_createServerFn_handler = createServerRpc({
	id: "78503e5ceda77076c7ee689b158411447fce94b4296be352bc09a58cbc0b91c3",
	name: "listPayments",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => listPayments.__executeServer(opts));
var listPayments = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(listPayments_createServerFn_handler, async ({ data, context }) => {
	const from = new Date(data.from);
	const to = new Date(data.to);
	if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) throw new Error("Período inválido.");
	if ((to.getTime() - from.getTime()) / 864e5 > MAX_PAYMENT_RANGE_DAYS) throw new Error(`Escolha um período de até ${MAX_PAYMENT_RANGE_DAYS} dias.`);
	if (isDemoServerMode()) {
		assertDemoFeature("financeiro");
		return demoListPayments(from.toISOString(), to.toISOString());
	}
	const { tenantId } = await requireManager(context.supabase, context.userId);
	await requireFeature(context.supabase, tenantId, "financeiro");
	return listTenantPayments(context.supabase, tenantId, from.toISOString(), to.toISOString());
});
var setTenantLogo_createServerFn_handler = createServerRpc({
	id: "6957b5a111c4240a5b246e068d045abb6c5faf549c1d203cbfee30902485bf7e",
	name: "setTenantLogo",
	filename: "src/lib/lavajato.functions.ts"
}, (opts) => setTenantLogo.__executeServer(opts));
var setTenantLogo = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(setTenantLogo_createServerFn_handler, async ({ data, context }) => {
	const logo = data.image === null ? null : parseLogoDataUrl(String(data.image));
	if (isDemoServerMode()) {
		if (logo) assertDemoFeature("logo");
		return demoSetLogo(logo ? String(data.image) : null);
	}
	const { tenantId } = await requireManager(context.supabase, context.userId);
	if (logo) await requireFeature(context.supabase, tenantId, "logo");
	const { supabaseAdmin } = await import("./client.server-BPFcxTxD.mjs");
	const bucket = supabaseAdmin.storage.from("logos");
	let logoUrl = null;
	let keep = null;
	if (logo) {
		keep = `logo-${Date.now()}.${logoExtension(logo.contentType)}`;
		const { error } = await bucket.upload(`${tenantId}/${keep}`, logo.bytes, {
			contentType: logo.contentType,
			cacheControl: "31536000",
			upsert: false
		});
		if (error) throw new Error("Não foi possível enviar o logo. Tente novamente.");
		logoUrl = bucket.getPublicUrl(`${tenantId}/${keep}`).data.publicUrl;
	}
	const { error: updateError } = await context.supabase.from("tenants").update({ logo_url: logoUrl }).eq("id", tenantId);
	if (updateError) throw new Error("Não foi possível salvar o logo.");
	const { data: files } = await bucket.list(tenantId);
	const old = (files ?? []).filter((file) => file.name !== keep).map((file) => `${tenantId}/${file.name}`);
	if (old.length) await bucket.remove(old);
	return { logo_url: logoUrl };
});
//#endregion
export { adminListTenants_createServerFn_handler, adminUpdateSubscription_createServerFn_handler, clientPortalLogin_createServerFn_handler, createCustomer_createServerFn_handler, createNewCustomerOrder_createServerFn_handler, createOrder_createServerFn_handler, createService_createServerFn_handler, createTenant_createServerFn_handler, createVehicle_createServerFn_handler, deactivateService_createServerFn_handler, financialSummary_createServerFn_handler, findVehicleByPlate_createServerFn_handler, getDemoOwnerLoginHint_createServerFn_handler, getOrder_createServerFn_handler, getPixSettings_createServerFn_handler, getSession_createServerFn_handler, homeSummary_createServerFn_handler, listActiveOrders_createServerFn_handler, listPayments_createServerFn_handler, listServices_createServerFn_handler, listTeam_createServerFn_handler, listVehicles_createServerFn_handler, plateHistory_createServerFn_handler, quickRegister_createServerFn_handler, recognizePlate_createServerFn_handler, registerPayment_createServerFn_handler, searchPublicTenants_createServerFn_handler, setTenantLogo_createServerFn_handler, updateOrderStatus_createServerFn_handler, updatePixSettings_createServerFn_handler, updateService_createServerFn_handler, updateTenantProfile_createServerFn_handler, verifyOwnerBusiness_createServerFn_handler };
