import { createHash, createHmac, timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/client-portal.server-IBms2HPv.js
var TOKEN_TTL_SECONDS = 43200;
var ATTEMPT_WINDOW_MS = 9e5;
var MAX_ATTEMPTS = 5;
var DEMO_TOKEN_SECRET = "lavapro-demo-client-portal-secret-2026";
var attempts = /* @__PURE__ */ new Map();
function secret() {
	const value = process.env["CLIENT_PORTAL_SECRET"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"];
	if (!value || value.length < 32) {
		if (process.env["DEMO_MODE"] === "true" || process.env["VITE_DEMO_MODE"] === "true" || {
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
		}["VITE_DEMO_MODE"] === "true") return DEMO_TOKEN_SECRET;
		throw new Error("Configure CLIENT_PORTAL_SECRET com pelo menos 32 caracteres.");
	}
	return value;
}
function encode(value) {
	return Buffer.from(value, "utf8").toString("base64url");
}
function sign(encodedPayload) {
	return createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}
function issueClientPortalToken(vehicleId, tenantId) {
	const payload = {
		vehicleId,
		tenantId,
		exp: Math.floor(Date.now() / 1e3) + TOKEN_TTL_SECONDS
	};
	const encoded = encode(JSON.stringify(payload));
	return `${encoded}.${sign(encoded)}`;
}
function verifyClientPortalToken(token) {
	const [encoded, signature, extra] = token.split(".");
	if (!encoded || !signature || extra) throw new Error("Acesso do cliente expirado.");
	const expected = Buffer.from(sign(encoded));
	const received = Buffer.from(signature);
	if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new Error("Acesso do cliente expirado.");
	let payload;
	try {
		payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
	} catch {
		throw new Error("Acesso do cliente expirado.");
	}
	if (!payload.vehicleId || !payload.tenantId || payload.exp <= Math.floor(Date.now() / 1e3)) throw new Error("Acesso do cliente expirado.");
	return payload;
}
function portalAttemptKey(tenantId, plate, phone) {
	return createHash("sha256").update(`${tenantId}:${plate}:${phone}`).digest("hex");
}
function assertPortalRateLimit(key, now = Date.now()) {
	const attempt = attempts.get(key);
	if (!attempt) return;
	if (attempt.lockedUntil > now) throw new Error(RATE_LIMIT_MESSAGE);
	if (now - attempt.startedAt >= ATTEMPT_WINDOW_MS) attempts.delete(key);
}
function recordPortalFailure(key, now = Date.now(), maxAttempts = MAX_ATTEMPTS) {
	const previous = attempts.get(key);
	const current = !previous || now - previous.startedAt >= ATTEMPT_WINDOW_MS ? {
		count: 0,
		startedAt: now,
		lockedUntil: 0
	} : previous;
	current.count += 1;
	if (current.count >= maxAttempts) current.lockedUntil = now + ATTEMPT_WINDOW_MS;
	attempts.set(key, current);
}
function clearPortalFailures(key) {
	attempts.delete(key);
}
var RATE_LIMIT_MESSAGE = "Muitas tentativas. Aguarde 15 minutos e tente novamente.";
/**
* Regras aplicadas a cada login do portal: por IP (contra varredura de várias
* placas), por placa (contra força bruta do telefone) e pela combinação exata.
*/
function portalAttemptRules(ip, tenantId, plate, phone) {
	return [
		{
			key: createHash("sha256").update(`ip:${ip}`).digest("hex"),
			maxAttempts: 20
		},
		{
			key: portalAttemptKey(tenantId, plate, "*"),
			maxAttempts: 10
		},
		{
			key: portalAttemptKey(tenantId, plate, phone),
			maxAttempts: MAX_ATTEMPTS
		}
	];
}
function requestClientIp(headers) {
	return headers?.get("x-real-ip")?.trim() || headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
}
function isMemoryRateLimit() {
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
/** Limite compartilhado entre instâncias (tabela portal_login_attempts). */
async function assertPortalAttemptsAllowed(rules) {
	if (isMemoryRateLimit()) {
		for (const rule of rules) assertPortalRateLimit(rule.key);
		return;
	}
	const { supabaseAdmin } = await import("./client.server-BPFcxTxD.mjs");
	const { data, error } = await supabaseAdmin.rpc("portal_locked_until", { p_keys: rules.map((rule) => rule.key) });
	if (error) {
		console.error("[portal] falha ao consultar limite de tentativas", error.message);
		throw new Error("Não foi possível consultar seus atendimentos.");
	}
	if (data) throw new Error(RATE_LIMIT_MESSAGE);
}
async function recordPortalAttemptFailure(rules) {
	if (isMemoryRateLimit()) {
		for (const rule of rules) recordPortalFailure(rule.key, Date.now(), rule.maxAttempts);
		return;
	}
	const { supabaseAdmin } = await import("./client.server-BPFcxTxD.mjs");
	const results = await Promise.all(rules.map((rule) => supabaseAdmin.rpc("portal_record_failure", {
		p_key: rule.key,
		p_max_failures: rule.maxAttempts,
		p_window_seconds: ATTEMPT_WINDOW_MS / 1e3
	})));
	for (const { error } of results) if (error) console.error("[portal] falha ao registrar tentativa", error.message);
}
/** Limpa apenas as chaves da placa; o contador por IP expira sozinho. */
async function clearPortalAttemptFailures(rules) {
	const keys = rules.slice(1).map((rule) => rule.key);
	if (isMemoryRateLimit()) {
		for (const key of keys) clearPortalFailures(key);
		return;
	}
	const { supabaseAdmin } = await import("./client.server-BPFcxTxD.mjs");
	const { error } = await supabaseAdmin.from("portal_login_attempts").delete().in("key", keys);
	if (error) console.error("[portal] falha ao limpar tentativas", error.message);
}
//#endregion
export { assertPortalAttemptsAllowed, clearPortalAttemptFailures, issueClientPortalToken, portalAttemptRules, recordPortalAttemptFailure, requestClientIp, verifyClientPortalToken };
