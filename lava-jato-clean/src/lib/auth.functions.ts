import { createServerFn } from "@tanstack/react-start";
import { parseConfirmation, parseCredentials, parseResend, parseSignUp } from "./auth-input";

// Login do dono do lava-jato feito no servidor: a sessão fica em cookies httpOnly
// e o navegador não carrega a biblioteca do Supabase.

export const signInOwner = createServerFn({ method: "POST" })
  .validator(parseCredentials)
  .handler(async ({ data }) => {
    const { createUserClient, saveSession } =
      await import("@/integrations/supabase/session.server");
    const { data: result, error } = await createUserClient().auth.signInWithPassword({
      email: data.email,
      password: data.password,
      ...(data.captchaToken ? { options: { captchaToken: data.captchaToken } } : {}),
    });
    if (error || !result.session) throw new Error(error?.message ?? "Não foi possível entrar.");
    saveSession(result.session);
    return { ok: true };
  });

export const signUpOwner = createServerFn({ method: "POST" })
  .validator(parseSignUp)
  .handler(async ({ data }) => {
    const { createUserClient, requestOrigin, saveSession } =
      await import("@/integrations/supabase/session.server");
    const { data: result, error } = await createUserClient().auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${requestOrigin()}/confirmar-email`,
        data: { nome: data.nome },
        ...(data.captchaToken ? { captchaToken: data.captchaToken } : {}),
      },
    });
    if (error) throw new Error(error.message);
    // Com a confirmação de e-mail ligada, a conta só entra depois do link.
    if (!result.session) return { pendingConfirmation: true };
    saveSession(result.session);
    return { pendingConfirmation: false };
  });

export const resendConfirmation = createServerFn({ method: "POST" })
  .validator(parseResend)
  .handler(async ({ data }) => {
    const { createUserClient, requestOrigin } =
      await import("@/integrations/supabase/session.server");
    const { error } = await createUserClient().auth.resend({
      type: "signup",
      email: data.email,
      options: {
        emailRedirectTo: `${requestOrigin()}/confirmar-email`,
        ...(data.captchaToken ? { captchaToken: data.captchaToken } : {}),
      },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const confirmEmail = createServerFn({ method: "POST" })
  .validator(parseConfirmation)
  .handler(async ({ data }) => {
    const { createUserClient, refreshWith, saveSession } =
      await import("@/integrations/supabase/session.server");
    if ("refreshToken" in data) {
      // Modelo de e-mail padrão do Supabase: a sessão chega no # do link.
      if (!(await refreshWith(data.refreshToken))) throw new Error("Link de confirmação expirado.");
      return { ok: true };
    }
    const { data: result, error } = await createUserClient().auth.verifyOtp({
      token_hash: data.tokenHash,
      type: "email",
    });
    if (error || !result.session) throw new Error("Link de confirmação expirado.");
    saveSession(result.session);
    return { ok: true };
  });

export const signOutOwner = createServerFn({ method: "POST" }).handler(async () => {
  const { clearSession, createUserClient, readSession } =
    await import("@/integrations/supabase/session.server");
  const session = await readSession().catch(() => null);
  if (session) {
    // Encerra a sessão também no Supabase, não só apaga o cookie.
    await createUserClient()
      .auth.admin.signOut(session.accessToken, "local")
      .catch(() => undefined);
  }
  clearSession();
  return { ok: true };
});

export const currentOwner = createServerFn({ method: "GET" }).handler(async () => {
  if (process.env["DEMO_MODE"] === "true") return null;
  const { readSession } = await import("@/integrations/supabase/session.server");
  const session = await readSession();
  return session ? { id: session.userId, email: session.email } : null;
});
