/** Chave pública do Cloudflare Turnstile; sem ela não há verificação anti-robô. */
export function turnstileSiteKey(): string | null {
  return (import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined) || null;
}

/** Senha mínima para contas novas (o Supabase também deve exigir no painel). */
export const MIN_PASSWORD_LENGTH = 8;

/** Mensagens do Supabase Auth em português. */
export function authErrorMessage(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Nome do lava-jato, e-mail ou senha incorretos.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Confirme seu e-mail antes de entrar: abra o link que enviamos para você.";
  }
  if (/captcha/i.test(message)) {
    return "Não foi possível confirmar que você não é um robô. Aguarde a verificação e tente de novo.";
  }
  if (/already registered|already exists/i.test(message)) {
    return "Este e-mail já tem conta. Entre ou recupere a senha.";
  }
  if (/password should be at least|weak password/i.test(message)) {
    return `Use uma senha com pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (/rate limit|too many requests|security purposes/i.test(message)) {
    return "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.";
  }
  if (message === "Failed to fetch") {
    return "Não foi possível conectar ao serviço de cadastro. Verifique sua internet.";
  }
  return message;
}
