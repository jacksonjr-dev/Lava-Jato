import { MIN_PASSWORD_LENGTH } from "./captcha";

// Validação do que o navegador manda para entrar, criar conta e confirmar o e-mail.
// Roda no servidor antes de qualquer chamada ao Supabase.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Credentials = { email: string; password: string; captchaToken?: string };
export type SignUpInput = Credentials & { nome: string };

function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") throw new Error("Dados inválidos.");
  return input as Record<string, unknown>;
}

export function parseEmail(value: unknown): string {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_PATTERN.test(email))
    throw new Error("Informe um e-mail válido.");
  return email;
}

function parseCaptcha(value: unknown): string | undefined {
  return typeof value === "string" && value && value.length <= 4096 ? value : undefined;
}

export function parseCredentials(input: unknown): Credentials {
  const data = record(input);
  const password = typeof data["password"] === "string" ? data["password"] : "";
  if (!password || password.length > 128) throw new Error("Informe a senha.");
  const captchaToken = parseCaptcha(data["captchaToken"]);
  return { email: parseEmail(data["email"]), password, ...(captchaToken ? { captchaToken } : {}) };
}

export function parseSignUp(input: unknown): SignUpInput {
  const credentials = parseCredentials(input);
  const data = record(input);
  const nome = typeof data["nome"] === "string" ? data["nome"].trim().replace(/\s+/g, " ") : "";
  if (nome.length < 2 || nome.length > 120) throw new Error("Informe o nome do responsável.");
  if (credentials.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Use uma senha com pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  return { ...credentials, nome };
}

export function parseResend(input: unknown): { email: string; captchaToken?: string } {
  const data = record(input);
  const captchaToken = parseCaptcha(data["captchaToken"]);
  return { email: parseEmail(data["email"]), ...(captchaToken ? { captchaToken } : {}) };
}

export function parseNewPassword(value: unknown): string {
  const password = typeof value === "string" ? value : "";
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
    throw new Error(`Use uma senha com pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  return password;
}

/** Nova senha + o token do link de recuperação (mesmos formatos do link de confirmação). */
export function parsePasswordReset(
  input: unknown,
): ({ tokenHash: string } | { refreshToken: string }) & { password: string } {
  const data = record(input);
  return { ...parseConfirmation(data), password: parseNewPassword(data["password"]) };
}

/** Link do e-mail de confirmação: ?token_hash=… (modelo novo) ou #refresh_token=… (padrão). */
export function parseConfirmation(
  input: unknown,
): { tokenHash: string } | { refreshToken: string } {
  const data = record(input);
  const tokenHash = data["tokenHash"];
  if (typeof tokenHash === "string" && /^[A-Za-z0-9_-]{8,512}$/.test(tokenHash)) {
    return { tokenHash };
  }
  const refreshToken = data["refreshToken"];
  if (typeof refreshToken === "string" && /^[A-Za-z0-9_-]{8,512}$/.test(refreshToken)) {
    return { refreshToken };
  }
  throw new Error("Link de confirmação inválido.");
}
