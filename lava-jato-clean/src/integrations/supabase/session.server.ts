// Sessão do dono do lava-jato guardada em cookies httpOnly. O navegador nunca recebe
// os tokens do Supabase nem carrega a biblioteca dele: entrar, sair e renovar a
// sessão acontecem só aqui no servidor.
import { createClient, type JwtPayload, type SupabaseClient } from "@supabase/supabase-js";
import { deleteCookie, getCookie, getRequest, setCookie } from "@tanstack/react-start/server";
import { requestClientIp } from "@/lib/client-portal.server";
import type { Database } from "./types";

const ACCESS_COOKIE = "lp_at";
const REFRESH_COOKIE = "lp_rt";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;
// Recuperação de senha: se a senha nova for recusada, a pessoa tenta de novo sem
// precisar de outro link (o do e-mail só vale uma vez).
const RECOVERY_COOKIE = "lp_rec";
const RECOVERY_MAX_AGE = 60 * 10;

export type ActiveSession = {
  accessToken: string;
  userId: string;
  email: string | null;
  claims: JwtPayload;
};

type SessionTokens = { access_token: string; refresh_token: string; expires_in: number };

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string, clientIp: string | null): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    // Todo login sai do mesmo servidor; o IP real deixa o Supabase limitar por pessoa.
    if (clientIp) headers.set("Sb-Forwarded-For", clientIp);
    return fetch(input, { ...init, headers });
  };
}

function supabaseEnv(): { url: string; key: string } {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!key ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Configure them in your server environment.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }
  return { url, key };
}

function clientIp(): string | null {
  const ip = requestClientIp(getRequest()?.headers);
  return ip === "desconhecido" ? null : ip;
}

/** Cliente com a chave pública; com token, as consultas passam pelo RLS como o dono. */
export function createUserClient(accessToken?: string): SupabaseClient<Database> {
  const { url, key } = supabaseEnv();
  return createClient<Database>(url, key, {
    global: {
      fetch: createSupabaseFetch(key, clientIp()),
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Endereço do site que recebeu a requisição, para os links enviados por e-mail. */
export function requestOrigin(): string {
  return new URL(getRequest().url).origin;
}

export function sessionCookieOptions(maxAge: number) {
  return { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge };
}

/** O cookie do token some um minuto antes de ele vencer, forçando a renovação a tempo. */
export function accessCookieMaxAge(expiresIn: number): number {
  return Math.max(60, Math.floor(expiresIn) - 60);
}

export function saveSession(session: SessionTokens): void {
  setCookie(
    ACCESS_COOKIE,
    session.access_token,
    sessionCookieOptions(accessCookieMaxAge(session.expires_in)),
  );
  setCookie(REFRESH_COOKIE, session.refresh_token, sessionCookieOptions(REFRESH_MAX_AGE));
}

export function saveRecovery(refreshToken: string): void {
  setCookie(RECOVERY_COOKIE, refreshToken, sessionCookieOptions(RECOVERY_MAX_AGE));
}

export function takeRecovery(): string | undefined {
  const value = getCookie(RECOVERY_COOKIE);
  if (value) deleteCookie(RECOVERY_COOKIE, sessionCookieOptions(0));
  return value;
}

export function clearSession(): void {
  deleteCookie(ACCESS_COOKIE, sessionCookieOptions(0));
  deleteCookie(REFRESH_COOKIE, sessionCookieOptions(0));
}

/** A sessão nasceu do link "Esqueci minha senha"? (o Supabase marca em `amr`). */
export function isRecoverySession(accessToken: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { amr?: Array<{ method?: string }> };
    return Array.isArray(payload.amr) && payload.amr.some((item) => item.method === "recovery");
  } catch {
    return false;
  }
}

async function verifyAccessToken(token: string): Promise<ActiveSession | null> {
  if (token.split(".").length !== 3) return null;
  const { data, error } = await createUserClient(token).auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { accessToken: token, userId: data.claims.sub, email, claims: data.claims };
}

/** Troca o refresh token por uma sessão nova e grava nos cookies. */
export async function refreshWith(refreshToken: string): Promise<ActiveSession | null> {
  const { data, error } = await createUserClient().auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session) return null;
  saveSession(data.session);
  return verifyAccessToken(data.session.access_token);
}

/** Sessão atual pelos cookies, renovando o token vencido; null quando ninguém entrou. */
export async function readSession(): Promise<ActiveSession | null> {
  const access = getCookie(ACCESS_COOKIE);
  if (access) {
    const session = await verifyAccessToken(access);
    if (session) return session;
  }
  const refresh = getCookie(REFRESH_COOKIE);
  if (!refresh) return null;
  const session = await refreshWith(refresh);
  if (!session) clearSession();
  return session;
}
