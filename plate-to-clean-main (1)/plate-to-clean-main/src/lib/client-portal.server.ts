import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 12 * 60 * 60;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const DEMO_TOKEN_SECRET = "lavapro-demo-client-portal-secret-2026";

type TokenPayload = {
  vehicleId: string;
  tenantId: string;
  exp: number;
};

type Attempt = { count: number; startedAt: number; lockedUntil: number };
const attempts = new Map<string, Attempt>();

function secret(): string {
  const value = process.env["CLIENT_PORTAL_SECRET"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!value || value.length < 32) {
    if (
      process.env["DEMO_MODE"] === "true" ||
      process.env["VITE_DEMO_MODE"] === "true" ||
      import.meta.env["VITE_DEMO_MODE"] === "true"
    ) {
      return DEMO_TOKEN_SECRET;
    }
    throw new Error("Configure CLIENT_PORTAL_SECRET com pelo menos 32 caracteres.");
  }
  return value;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}

export function issueClientPortalToken(vehicleId: string, tenantId: string): string {
  const payload: TokenPayload = {
    vehicleId,
    tenantId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifyClientPortalToken(token: string): TokenPayload {
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) throw new Error("Acesso do cliente expirado.");
  const expected = Buffer.from(sign(encoded));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new Error("Acesso do cliente expirado.");
  }
  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TokenPayload;
  } catch {
    throw new Error("Acesso do cliente expirado.");
  }
  if (!payload.vehicleId || !payload.tenantId || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("Acesso do cliente expirado.");
  }
  return payload;
}

export function portalAttemptKey(tenantId: string, plate: string, phone: string): string {
  return createHash("sha256").update(`${tenantId}:${plate}:${phone}`).digest("hex");
}

export function assertPortalRateLimit(key: string, now = Date.now()): void {
  const attempt = attempts.get(key);
  if (!attempt) return;
  if (attempt.lockedUntil > now) {
    throw new Error(RATE_LIMIT_MESSAGE);
  }
  if (now - attempt.startedAt >= ATTEMPT_WINDOW_MS) attempts.delete(key);
}

export function recordPortalFailure(
  key: string,
  now = Date.now(),
  maxAttempts = MAX_ATTEMPTS,
): void {
  const previous = attempts.get(key);
  const current =
    !previous || now - previous.startedAt >= ATTEMPT_WINDOW_MS
      ? { count: 0, startedAt: now, lockedUntil: 0 }
      : previous;
  current.count += 1;
  if (current.count >= maxAttempts) current.lockedUntil = now + ATTEMPT_WINDOW_MS;
  attempts.set(key, current);
}

export function clearPortalFailures(key: string): void {
  attempts.delete(key);
}

const RATE_LIMIT_MESSAGE = "Muitas tentativas. Aguarde 15 minutos e tente novamente.";

export type PortalAttemptRule = { key: string; maxAttempts: number };

/**
 * Regras aplicadas a cada login do portal: por IP (contra varredura de várias
 * placas), por placa (contra força bruta do telefone) e pela combinação exata.
 */
export function portalAttemptRules(
  ip: string,
  tenantId: string,
  plate: string,
  phone: string,
): PortalAttemptRule[] {
  return [
    { key: createHash("sha256").update(`ip:${ip}`).digest("hex"), maxAttempts: 20 },
    { key: portalAttemptKey(tenantId, plate, "*"), maxAttempts: 10 },
    { key: portalAttemptKey(tenantId, plate, phone), maxAttempts: MAX_ATTEMPTS },
  ];
}

export function requestClientIp(headers: Headers | undefined): string {
  // Na Vercel estes cabeçalhos são definidos pela borda e não pelo cliente.
  return (
    headers?.get("x-real-ip")?.trim() ||
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "desconhecido"
  );
}

function isMemoryRateLimit(): boolean {
  return (
    process.env["DEMO_MODE"] === "true" ||
    process.env["VITE_DEMO_MODE"] === "true" ||
    import.meta.env["VITE_DEMO_MODE"] === "true"
  );
}

/** Limite compartilhado entre instâncias (tabela portal_login_attempts). */
export async function assertPortalAttemptsAllowed(rules: PortalAttemptRule[]): Promise<void> {
  if (isMemoryRateLimit()) {
    for (const rule of rules) assertPortalRateLimit(rule.key);
    return;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("portal_locked_until", {
    p_keys: rules.map((rule) => rule.key),
  });
  if (error) {
    console.error("[portal] falha ao consultar limite de tentativas", error.message);
    throw new Error("Não foi possível consultar seus atendimentos.");
  }
  if (data) throw new Error(RATE_LIMIT_MESSAGE);
}

export async function recordPortalAttemptFailure(rules: PortalAttemptRule[]): Promise<void> {
  if (isMemoryRateLimit()) {
    for (const rule of rules) recordPortalFailure(rule.key, Date.now(), rule.maxAttempts);
    return;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const results = await Promise.all(
    rules.map((rule) =>
      supabaseAdmin.rpc("portal_record_failure", {
        p_key: rule.key,
        p_max_failures: rule.maxAttempts,
        p_window_seconds: ATTEMPT_WINDOW_MS / 1000,
      }),
    ),
  );
  for (const { error } of results) {
    if (error) console.error("[portal] falha ao registrar tentativa", error.message);
  }
}

/** Limpa apenas as chaves da placa; o contador por IP expira sozinho. */
export async function clearPortalAttemptFailures(rules: PortalAttemptRule[]): Promise<void> {
  const keys = rules.slice(1).map((rule) => rule.key);
  if (isMemoryRateLimit()) {
    for (const key of keys) clearPortalFailures(key);
    return;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("portal_login_attempts").delete().in("key", keys);
  if (error) console.error("[portal] falha ao limpar tentativas", error.message);
}
