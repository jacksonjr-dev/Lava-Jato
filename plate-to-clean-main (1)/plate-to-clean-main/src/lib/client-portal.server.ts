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
      import.meta.env.VITE_DEMO_MODE === "true"
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
    throw new Error("Muitas tentativas. Aguarde 15 minutos e tente novamente.");
  }
  if (now - attempt.startedAt >= ATTEMPT_WINDOW_MS) attempts.delete(key);
}

export function recordPortalFailure(key: string, now = Date.now()): void {
  const previous = attempts.get(key);
  const current =
    !previous || now - previous.startedAt >= ATTEMPT_WINDOW_MS
      ? { count: 0, startedAt: now, lockedUntil: 0 }
      : previous;
  current.count += 1;
  if (current.count >= MAX_ATTEMPTS) current.lockedUntil = now + ATTEMPT_WINDOW_MS;
  attempts.set(key, current);
}

export function clearPortalFailures(key: string): void {
  attempts.delete(key);
}
