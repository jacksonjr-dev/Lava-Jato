import { __toESM } from "../_runtime.mjs";
import { __exportAll } from "./rolldown-runtime-BLEs9rMG.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, redirect, useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { PAYMENT_METHODS } from "./plate-C5WvEduv.mjs";
import { supabase } from "./client-C55mx54i.mjs";
import { QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Toaster } from "../_libs/sonner.mjs";
import { LazyMotion, MotionConfig, animate, domMax, useInView, useReducedMotion } from "../_libs/framer-motion+[...].mjs";
import { m } from "../_libs/motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/finance-analytics-Z5ve8__x.js
var FINANCE_PERIODS = [
	"7d",
	"30d",
	"mes",
	"mes_anterior",
	"personalizado"
];
var FINANCE_PERIOD_LABEL = {
	"7d": "7 dias",
	"30d": "30 dias",
	mes: "Mês atual",
	mes_anterior: "Mês anterior",
	personalizado: "Período"
};
var DAY_MS = 864e5;
function startOfDay(date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function addDays(date, days) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}
/** Converte "aaaa-mm-dd" em data local (meia-noite). */
function parseDay(value) {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const [y, m, d] = value.split("-").map(Number);
	return new Date(y, m - 1, d);
}
function formatDay(date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
/**
* Intervalo [from, to) do período, em horário local. `to` é exclusivo.
* Período personalizado usa as datas "de" e "até" (inclusivas).
*/
function periodRange(period, now = /* @__PURE__ */ new Date(), custom) {
	const tomorrow = addDays(startOfDay(now), 1);
	switch (period) {
		case "7d": return {
			from: addDays(tomorrow, -7),
			to: tomorrow
		};
		case "30d": return {
			from: addDays(tomorrow, -30),
			to: tomorrow
		};
		case "mes": return {
			from: new Date(now.getFullYear(), now.getMonth(), 1),
			to: tomorrow
		};
		case "mes_anterior": return {
			from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
			to: new Date(now.getFullYear(), now.getMonth(), 1)
		};
		case "personalizado": {
			const from = parseDay(custom?.de) ?? addDays(tomorrow, -30);
			const to = addDays(parseDay(custom?.ate) ?? startOfDay(now), 1);
			return from < to ? {
				from,
				to
			} : {
				from: addDays(to, -1),
				to
			};
		}
	}
}
/** Período imediatamente anterior, com a mesma duração (para comparar). */
function previousRange(range) {
	const days = Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS);
	return {
		from: addDays(range.from, -days),
		to: range.from
	};
}
function monthName(year, month) {
	return new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long" });
}
/**
* Intervalo usado na comparação de cada período: no mês atual, os mesmos dias
* do mês anterior; no mês anterior, o mês completo antes dele; nos demais, o
* período imediatamente anterior com a mesma duração.
*/
function comparisonRange(period, range) {
	const y = range.from.getFullYear();
	const m = range.from.getMonth();
	if (period === "mes") {
		const days = Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS);
		const from = new Date(y, m - 1, 1);
		const end = addDays(from, days);
		const monthEnd = new Date(y, m, 1);
		return {
			from,
			to: end < monthEnd ? end : monthEnd
		};
	}
	if (period === "mes_anterior") return {
		from: new Date(y, m - 1, 1),
		to: new Date(y, m, 1)
	};
	return previousRange(range);
}
/** Texto da comparação, ex.: "em relação ao mesmo período de setembro". */
function comparisonLabel(period, range) {
	const y = range.from.getFullYear();
	const m = range.from.getMonth();
	switch (period) {
		case "7d": return "em relação aos 7 dias anteriores";
		case "30d": return "em relação ao mês anterior";
		case "mes": return `em relação ao mesmo período de ${monthName(y, m - 1)}`;
		case "mes_anterior": return `em relação a ${monthName(y, m - 1)}`;
		case "personalizado": return "em relação ao período anterior";
	}
}
function inRange(payment, range) {
	const time = new Date(payment.pago_em).getTime();
	return time >= range.from.getTime() && time < range.to.getTime();
}
function paymentsInRange(payments, range) {
	return payments.filter((payment) => inRange(payment, range));
}
function totals(payments) {
	const receita = payments.reduce((sum, payment) => sum + Number(payment.valor), 0);
	return {
		receita,
		pagamentos: payments.length,
		ticketMedio: payments.length ? receita / payments.length : 0
	};
}
/** Variação percentual; null quando não há base de comparação. */
function variation(current, previous) {
	if (previous <= 0) return current > 0 ? null : 0;
	return (current - previous) / previous * 100;
}
/** Receita por dia do intervalo, incluindo os dias sem pagamento. */
function revenueByDay(payments, range) {
	const days = [];
	for (let date = startOfDay(range.from); date < range.to; date = addDays(date, 1)) days.push({
		day: formatDay(date),
		date,
		receita: 0,
		pagamentos: 0
	});
	const index = new Map(days.map((entry) => [entry.day, entry]));
	for (const payment of payments) {
		const entry = index.get(formatDay(new Date(payment.pago_em)));
		if (!entry) continue;
		entry.receita += Number(payment.valor);
		entry.pagamentos += 1;
	}
	return days;
}
function revenueByMethod(payments) {
	const total = payments.reduce((sum, payment) => sum + Number(payment.valor), 0);
	const map = /* @__PURE__ */ new Map();
	for (const payment of payments) {
		const entry = map.get(payment.metodo) ?? {
			metodo: payment.metodo,
			receita: 0,
			pagamentos: 0,
			share: 0
		};
		entry.receita += Number(payment.valor);
		entry.pagamentos += 1;
		map.set(payment.metodo, entry);
	}
	return [...map.values()].map((entry) => ({
		...entry,
		share: total ? entry.receita / total : 0
	})).sort((a, b) => b.receita - a.receita);
}
/** Ranking dos serviços pelos itens das OS pagas no período. */
function serviceStats(payments, by) {
	const map = /* @__PURE__ */ new Map();
	for (const payment of payments) for (const item of payment.itens) {
		const quantity = Number(item.quantidade) || 1;
		const entry = map.get(item.nome) ?? {
			usos: 0,
			receita: 0
		};
		entry.usos += quantity;
		entry.receita += Number(item.preco) * quantity;
		map.set(item.nome, entry);
	}
	const totalUses = [...map.values()].reduce((sum, entry) => sum + entry.usos, 0);
	const totalRevenue = [...map.values()].reduce((sum, entry) => sum + entry.receita, 0);
	return [...map.entries()].map(([nome, entry]) => ({
		nome,
		usos: entry.usos,
		receita: entry.receita,
		shareUsos: totalUses ? entry.usos / totalUses : 0,
		shareReceita: totalRevenue ? entry.receita / totalRevenue : 0,
		ticket: entry.usos ? entry.receita / entry.usos : 0
	})).sort((a, b) => by === "usos" ? b.usos - a.usos || b.receita - a.receita : b.receita - a.receita);
}
/** Busca por placa, cliente ou nº da OS (sem acentos). */
function matchesPaymentSearch(payment, query) {
	const fold = (value) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
	const terms = fold(query).trim().split(/\s+/).filter(Boolean);
	if (!terms.length) return true;
	const haystack = fold([
		payment.placa,
		payment.cliente,
		payment.numero != null ? `#${payment.numero} ${payment.numero}` : ""
	].filter(Boolean).join(" "));
	return terms.every((term) => haystack.includes(term.replace(/^#/, "")) || haystack.includes(term));
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-BJH1rJwZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-De7TX2nl.css";
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
/**
* Animações do LavaPro (Motion). LazyMotion + `m` carregam só os recursos
* usados; `reducedMotion="user"` respeita a preferência do sistema.
*/
function MotionProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyMotion, {
		features: domMax,
		strict: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MotionConfig, {
			reducedMotion: "user",
			transition: {
				type: "spring",
				stiffness: 380,
				damping: 32
			},
			children
		})
	});
}
var springSoft = {
	type: "spring",
	stiffness: 260,
	damping: 28
};
var staggerContainer = {
	hidden: {},
	show: { transition: {
		staggerChildren: .06,
		delayChildren: .04
	} }
};
var staggerChild = {
	hidden: {
		opacity: 0,
		y: 14
	},
	show: {
		opacity: 1,
		y: 0,
		transition: springSoft
	}
};
/** Revela os filhos em sequência quando entram na tela. */
function Stagger({ children, className, as = "div" }) {
	const Component = m[as];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Component, {
		className,
		variants: staggerContainer,
		initial: "hidden",
		whileInView: "show",
		viewport: {
			once: true,
			margin: "0px 0px -8% 0px"
		},
		children
	});
}
function StaggerItem({ children, className, as = "div" }) {
	const Component = m[as];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Component, {
		className,
		variants: staggerChild,
		children
	});
}
/** Seção que sobe e aparece ao entrar na tela. */
function Reveal({ children, className, delay = 0 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
		className,
		initial: {
			opacity: 0,
			y: 24
		},
		whileInView: {
			opacity: 1,
			y: 0
		},
		viewport: {
			once: true,
			margin: "0px 0px -10% 0px"
		},
		transition: {
			...springSoft,
			delay
		},
		children
	});
}
/** Número que "corre" até o valor quando aparece na tela ou muda. */
function CountUp({ value, format = (n) => String(Math.round(n)), className }) {
	const ref = (0, import_react.useRef)(null);
	const previous = (0, import_react.useRef)(0);
	const inView = useInView(ref, { once: true });
	const reduce = useReducedMotion();
	const formatRef = (0, import_react.useRef)(format);
	formatRef.current = format;
	const [initialText] = (0, import_react.useState)(() => format(0));
	(0, import_react.useEffect)(() => {
		const node = ref.current;
		if (!node) return;
		if (reduce) {
			node.textContent = formatRef.current(value);
			previous.current = value;
			return;
		}
		if (!inView) return;
		const controls = animate(previous.current, value, {
			duration: .9,
			ease: [
				.16,
				1,
				.3,
				1
			],
			onUpdate: (latest) => {
				node.textContent = formatRef.current(latest);
			}
		});
		previous.current = value;
		return () => controls.stop();
	}, [
		value,
		inView,
		reduce
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		ref,
		className,
		"aria-label": format(value),
		children: initialText
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$15 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "LavaPro — Gestão de lava-jato" },
			{
				name: "description",
				content: "Atendimento de lava-jato pela placa: reconhecimento, OS, status e pagamento."
			},
			{
				property: "og:title",
				content: "LavaPro — Gestão de lava-jato"
			},
			{
				property: "og:description",
				content: "Atendimento de lava-jato pela placa: reconhecimento, OS, status e pagamento."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@600;700;800&family=JetBrains+Mono:wght@700&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.svg?v=lavapro-1",
				type: "image/svg+xml"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "pt-BR",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$15.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MotionProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
			position: "top-center",
			richColors: true
		})]
	});
}
var $$splitComponentImporter$14 = () => import("./routes-DeASbLey.mjs");
var Route$14 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "LavaPro — Sistema de gestão para lava-jato" },
		{
			name: "description",
			content: "Atendimento pela placa, ordens de serviço, PIX, financeiro e acompanhamento em tempo real para o cliente. Tudo em um só sistema para o seu lava-jato."
		},
		{
			property: "og:title",
			content: "LavaPro — Sistema de gestão para lava-jato"
		},
		{
			property: "og:description",
			content: "Do pátio até a entrega: organize o atendimento, o caixa e a experiência do cliente."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var DEMO_SESSION_KEY = "lavapro-demo-session";
var DEMO_PROFILE_KEY = "lavapro-demo-profile";
var DEMO_BUSINESS_KEY = "lavapro-demo-business";
function isDemoEnabled() {
	return {
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
function hasDemoSession() {
	if (!isDemoEnabled()) return false;
	return [
		"active",
		"access",
		"signup",
		"business"
	].includes(localStorage.getItem("lavapro-demo-session") ?? "");
}
function startDemoSession(email, password) {
	if (!isDemoEnabled() || email !== "demo@lavapro.local" || password !== "LavaPro@2026") return false;
	localStorage.setItem(DEMO_SESSION_KEY, "access");
	localStorage.removeItem(DEMO_PROFILE_KEY);
	localStorage.removeItem(DEMO_BUSINESS_KEY);
	return true;
}
function startDemoBusinessSignup(nome, email) {
	if (!isDemoEnabled()) return;
	localStorage.setItem(DEMO_SESSION_KEY, "signup");
	localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify({
		nome: nome.trim(),
		email: email.trim()
	}));
	localStorage.removeItem(DEMO_BUSINESS_KEY);
}
function isDemoOnboardingPending() {
	return isDemoEnabled() && localStorage.getItem("lavapro-demo-session") === "signup" && !localStorage.getItem(DEMO_BUSINESS_KEY);
}
function completeDemoBusinessRegistration(data) {
	const business = {
		id: "demo-tenant",
		...data
	};
	localStorage.setItem(DEMO_BUSINESS_KEY, JSON.stringify(business));
	localStorage.setItem(DEMO_SESSION_KEY, "business");
	return business;
}
function getDemoBusiness() {
	if (!isDemoEnabled()) return null;
	const saved = localStorage.getItem(DEMO_BUSINESS_KEY);
	if (!saved) return null;
	try {
		const parsed = JSON.parse(saved);
		if (!parsed.nome) return null;
		return {
			id: "demo-tenant",
			slug: parsed.slug || parsed.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
			nome: parsed.nome,
			telefone: parsed.telefone ?? "",
			endereco: parsed.endereco ?? "",
			logo_url: parsed.logo_url ?? null
		};
	} catch {
		localStorage.removeItem(DEMO_BUSINESS_KEY);
		return null;
	}
}
function endDemoSession() {
	localStorage.removeItem(DEMO_SESSION_KEY);
	localStorage.removeItem(DEMO_PROFILE_KEY);
	localStorage.removeItem(DEMO_BUSINESS_KEY);
}
var $$splitComponentImporter$13 = () => import("./route-Di7iQBCH.mjs");
var Route$13 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		if (hasDemoSession()) return { user: {
			id: "demo-user",
			email: "demo@lavapro.local"
		} };
		if (isDemoEnabled()) throw redirect({ to: "/auth" });
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/auth" });
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./auth-uDTUFabD.mjs");
var Route$12 = createFileRoute("/auth")({
	ssr: false,
	head: () => ({ meta: [
		{ title: "Entrar — LavaPro" },
		{
			name: "description",
			content: "Acesse o painel do seu lava-jato."
		},
		{
			property: "og:title",
			content: "Entrar — LavaPro"
		},
		{
			property: "og:description",
			content: "Acesse o painel do seu lava-jato."
		}
	] }),
	validateSearch: (search) => search["modo"] === "cadastro" ? { modo: "cadastro" } : {},
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./cliente-CJGqkVVn.mjs");
var Route$11 = createFileRoute("/cliente")({
	ssr: false,
	head: () => ({ meta: [{ title: "Área do cliente — LavaPro" }, {
		name: "description",
		content: "Acompanhe o status e o histórico de serviços do seu veículo."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./admin-BY3xbH24.mjs");
var Route$10 = createFileRoute("/_authenticated/admin")({
	head: () => ({ meta: [{ title: "Administração — LavaPro" }] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./financeiro-B23RMa7k.mjs");
var Route$9 = createFileRoute("/_authenticated/financeiro")({
	head: () => ({ meta: [{ title: "Financeiro — LavaPro" }, {
		name: "description",
		content: "Faturamento, pagamentos e desempenho do lava-jato."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./home-CmodE6jn.mjs");
var Route$8 = createFileRoute("/_authenticated/home")({
	head: () => ({ meta: [
		{ title: "Início — LavaPro" },
		{
			name: "description",
			content: "Inicie um novo atendimento em segundos."
		},
		{
			property: "og:title",
			content: "Início — LavaPro"
		},
		{
			property: "og:description",
			content: "Inicie um novo atendimento em segundos."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./onboarding-CplDcY68.mjs");
var Route$7 = createFileRoute("/_authenticated/onboarding")({
	head: () => ({ meta: [
		{ title: "Cadastrar lava-jato — LavaPro" },
		{
			name: "description",
			content: "Cadastre seu lava-jato para começar a atender."
		},
		{
			property: "og:title",
			content: "Cadastrar lava-jato — LavaPro"
		},
		{
			property: "og:description",
			content: "Cadastre seu lava-jato para começar a atender."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./perfil-iq-okhQt.mjs");
var Route$6 = createFileRoute("/_authenticated/perfil")({
	head: () => ({ meta: [{ title: "Perfil do lava-jato — LavaPro" }, {
		name: "description",
		content: "Dados públicos e operacionais do seu lava-jato."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./planos-Bs3ZiEel.mjs");
var Route$5 = createFileRoute("/_authenticated/planos")({
	head: () => ({ meta: [{ title: "Planos — LavaPro" }, {
		name: "description",
		content: "Plano atual e opções de assinatura do LavaPro."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./servicos-Cj3vuGoN.mjs");
var Route$4 = createFileRoute("/_authenticated/servicos")({
	head: () => ({ meta: [{ title: "Catálogo de serviços — LavaPro" }, {
		name: "description",
		content: "Configure os serviços e preços específicos do seu lava-jato."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var PERIODS = [
	"todos",
	"hoje",
	"7d",
	"30d",
	"personalizado"
];
var SITUATIONS = [
	"todos",
	"servico",
	"pronto",
	"pago",
	"entregue",
	"sem"
];
var SORTS = [
	"recentes",
	"visitas",
	"cliente",
	"placa"
];
var PERIOD_LABEL = {
	todos: "Todos",
	hoje: "Hoje",
	"7d": "7 dias",
	"30d": "30 dias",
	personalizado: "Período"
};
var SITUATION_LABEL = {
	todos: "Todas",
	servico: "Em serviço",
	pronto: "Pronto para retirada",
	pago: "Pago",
	entregue: "Entregue",
	sem: "Sem atendimento"
};
var SORT_LABEL = {
	recentes: "Mais recentes",
	visitas: "Mais visitas",
	cliente: "Cliente (A–Z)",
	placa: "Placa (A–Z)"
};
var SITUATION_STATUSES = {
	servico: [
		"AGUARDANDO",
		"EM_LAVAGEM",
		"EM_FINALIZACAO"
	],
	pronto: ["AGUARDANDO_PAGAMENTO", "FINALIZADO"],
	pago: ["PAGO"],
	entregue: ["ENTREGUE"]
};
var DEFAULT_FILTERS = {
	q: "",
	periodo: "todos",
	situacao: "todos",
	ordem: "recentes"
};
/** Minúsculas e sem acentos, para comparar textos. */
function fold(value) {
	return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
function lastVisit(vehicle) {
	return vehicle.ultimoAtendimento?.created_at ?? vehicle.created_at;
}
function startOfLocalDay(date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
function matchesText(vehicle, query) {
	const terms = fold(query).split(/\s+/).filter(Boolean);
	if (!terms.length) return true;
	const text = fold([
		vehicle.placa,
		vehicle.customers?.nome,
		vehicle.marca,
		vehicle.modelo,
		vehicle.cor,
		vehicle.customers?.telefone
	].filter(Boolean).join(" "));
	const compactPlate = vehicle.placa.toLowerCase();
	const phoneDigits = (vehicle.customers?.telefone ?? "").replace(/\D/g, "");
	return terms.every((term) => {
		const plateTerm = term.replace(/[^a-z0-9]/g, "");
		const digits = term.replace(/\D/g, "");
		return text.includes(term) || plateTerm.length > 0 && compactPlate.includes(plateTerm) || digits.length >= 4 && phoneDigits.includes(digits);
	});
}
function matchesPeriod(vehicle, filters, now) {
	if (filters.periodo === "todos") return true;
	const visit = new Date(lastVisit(vehicle)).getTime();
	const today = startOfLocalDay(now);
	if (filters.periodo === "hoje") return visit >= today;
	if (filters.periodo === "7d") return visit >= today - 5184e5;
	if (filters.periodo === "30d") return visit >= today - 25056e5;
	const from = filters.de ? (/* @__PURE__ */ new Date(`${filters.de}T00:00:00`)).getTime() : -Infinity;
	const to = filters.ate ? (/* @__PURE__ */ new Date(`${filters.ate}T00:00:00`)).getTime() + 864e5 : Infinity;
	return visit >= from && visit < to;
}
function matchesSituation(vehicle, situation) {
	if (situation === "todos") return true;
	const status = vehicle.ultimoAtendimento?.status;
	if (situation === "sem") return !status;
	return Boolean(status && SITUATION_STATUSES[situation].includes(status));
}
function filterVehicles(vehicles, filters, now = /* @__PURE__ */ new Date()) {
	const result = vehicles.filter((vehicle) => matchesText(vehicle, filters.q) && matchesPeriod(vehicle, filters, now) && matchesSituation(vehicle, filters.situacao));
	const byName = (a, b) => (a.customers?.nome ?? "").localeCompare(b.customers?.nome ?? "", "pt-BR");
	const sorters = {
		recentes: (a, b) => Date.parse(lastVisit(b)) - Date.parse(lastVisit(a)),
		visitas: (a, b) => b.totalAtendimentos - a.totalAtendimentos || byName(a, b),
		cliente: byName,
		placa: (a, b) => a.placa.localeCompare(b.placa)
	};
	return result.sort(sorters[filters.ordem]);
}
/** Quantos filtros diferem do padrão (para o selo "Filtros (n)"). */
function activeFilterCount(filters) {
	return Number(filters.periodo !== "todos") + Number(filters.situacao !== "todos") + Number(filters.ordem !== "recentes");
}
function pick(value, options, fallback) {
	return typeof value === "string" && options.includes(value) ? value : fallback;
}
var DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Lê os filtros da URL, ignorando valores inválidos. */
function parseVehicleFilters(search) {
	const de = typeof search["de"] === "string" && DATE_PATTERN.test(search["de"]) ? search["de"] : void 0;
	const ate = typeof search["ate"] === "string" && DATE_PATTERN.test(search["ate"]) ? search["ate"] : void 0;
	return {
		q: typeof search["q"] === "string" ? search["q"].slice(0, 60) : "",
		periodo: pick(search["periodo"], PERIODS, "todos"),
		situacao: pick(search["situacao"], SITUATIONS, "todos"),
		ordem: pick(search["ordem"], SORTS, "recentes"),
		...de ? { de } : {},
		...ate ? { ate } : {}
	};
}
/** Só os filtros diferentes do padrão vão para a URL. */
function compactFilters(filters) {
	const out = {};
	if (filters.q) out.q = filters.q;
	if (filters.periodo !== DEFAULT_FILTERS.periodo) out.periodo = filters.periodo;
	if (filters.situacao !== DEFAULT_FILTERS.situacao) out.situacao = filters.situacao;
	if (filters.ordem !== DEFAULT_FILTERS.ordem) out.ordem = filters.ordem;
	if (filters.periodo === "personalizado") {
		if (filters.de) out.de = filters.de;
		if (filters.ate) out.ate = filters.ate;
	}
	return out;
}
var $$splitComponentImporter$3 = () => import("./veiculos-CZHXQxQK.mjs");
var Route$3 = createFileRoute("/_authenticated/veiculos")({
	head: () => ({ meta: [{ title: "Veículos — LavaPro" }, {
		name: "description",
		content: "Consulte os veículos cadastrados e o histórico de atendimentos."
	}] }),
	validateSearch: (search) => compactFilters(parseVehicleFilters(search)),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
/** Só os filtros diferentes do padrão vão para a URL. */
var $$splitComponentImporter$2 = () => import("./atendimento.novo-DXzrMIlI.mjs");
var Route$2 = createFileRoute("/_authenticated/atendimento/novo")({
	head: () => ({ meta: [
		{ title: "Novo atendimento — LavaPro" },
		{
			name: "description",
			content: "Aponte a câmera para a placa e inicie o atendimento."
		},
		{
			property: "og:title",
			content: "Novo atendimento — LavaPro"
		},
		{
			property: "og:description",
			content: "Aponte a câmera para a placa e inicie o atendimento."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./financeiro_.pagamentos-DrUACblO.mjs");
var Route$1 = createFileRoute("/_authenticated/financeiro_/pagamentos")({
	head: () => ({ meta: [{ title: "Pagamentos — LavaPro" }] }),
	validateSearch: (search) => {
		const out = {};
		const periodo = search["periodo"];
		if (typeof periodo === "string" && FINANCE_PERIODS.includes(periodo)) out.periodo = periodo;
		for (const key of ["de", "ate"]) {
			const value = search[key];
			if (typeof value === "string" && parseDay(value)) out[key] = value;
		}
		const metodo = search["metodo"];
		if (typeof metodo === "string" && PAYMENT_METHODS.includes(metodo)) out.metodo = metodo;
		if (typeof search["q"] === "string" && search["q"]) out.q = search["q"].slice(0, 60);
		return out;
	},
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./os._id-DzpZnwBI.mjs");
var Route = createFileRoute("/_authenticated/os/$id")({
	head: () => ({ meta: [
		{ title: "Ordem de serviço — LavaPro" },
		{
			name: "description",
			content: "Acompanhe o status, o pagamento e a entrega do veículo."
		},
		{
			property: "og:title",
			content: "Ordem de serviço — LavaPro"
		},
		{
			property: "og:description",
			content: "Acompanhe o status, o pagamento e a entrega do veículo."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$14.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$15
});
var AuthenticatedRouteRoute = Route$13.update({
	id: "/_authenticated",
	getParentRoute: () => Route$15
});
var AuthRoute = Route$12.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$15
});
var ClienteRoute = Route$11.update({
	id: "/cliente",
	path: "/cliente",
	getParentRoute: () => Route$15
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAdminRoute: Route$10.update({
		id: "/admin",
		path: "/admin",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedFinanceiroRoute: Route$9.update({
		id: "/financeiro",
		path: "/financeiro",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedHomeRoute: Route$8.update({
		id: "/home",
		path: "/home",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedOnboardingRoute: Route$7.update({
		id: "/onboarding",
		path: "/onboarding",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedPerfilRoute: Route$6.update({
		id: "/perfil",
		path: "/perfil",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedPlanosRoute: Route$5.update({
		id: "/planos",
		path: "/planos",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedServicosRoute: Route$4.update({
		id: "/servicos",
		path: "/servicos",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedVeiculosRoute: Route$3.update({
		id: "/veiculos",
		path: "/veiculos",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAtendimentoNovoRoute: Route$2.update({
		id: "/atendimento/novo",
		path: "/atendimento/novo",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedFinanceiroPagamentosRoute: Route$1.update({
		id: "/financeiro_/pagamentos",
		path: "/financeiro/pagamentos",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedOsIdRoute: Route.update({
		id: "/os/$id",
		path: "/os/$id",
		getParentRoute: () => AuthenticatedRouteRoute
	})
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AuthRoute,
	ClienteRoute
};
var routeTree = Route$15._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { CountUp, DEFAULT_FILTERS, FINANCE_PERIODS, FINANCE_PERIOD_LABEL, PERIODS, PERIOD_LABEL, Reveal, Route, Route$1, Route$12, Route$3, SITUATIONS, SITUATION_LABEL, SORTS, SORT_LABEL, Stagger, StaggerItem, activeFilterCount, compactFilters, comparisonLabel, comparisonRange, completeDemoBusinessRegistration, endDemoSession, filterVehicles, formatDay, getDemoBusiness, hasDemoSession, isDemoEnabled, isDemoOnboardingPending, matchesPaymentSearch, paymentsInRange, periodRange, revenueByDay, revenueByMethod, router_exports, serviceStats, startDemoBusinessSignup, startDemoSession, totals, variation };
