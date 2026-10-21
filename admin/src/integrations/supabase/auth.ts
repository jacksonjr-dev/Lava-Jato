import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { supabase } from "./client";
import { isAdminDemo } from "@/lib/demo-flag";

/** Navegador: envia o token da sessão do painel em cada chamada ao servidor. */
export const attachAdminToken = createMiddleware({ type: "function" }).client(async ({ next }) => {
  if (isAdminDemo()) return next();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});

/**
 * Servidor: só atende quem (1) tem sessão válida, (2) passou pela verificação
 * em duas etapas (aal2) e (3) está em platform_admins.
 */
export const requireAdmin = createMiddleware({ type: "function" }).server(async ({ next }) => {
  if (process.env["ADMIN_DEMO_MODE"] === "true") {
    return next({
      context: {
        adminUserId: "demo-admin" as string | null,
        adminEmail: "admin@lavapro.local" as string | null,
        adminRole: "DONO" as string,
      },
    });
  }
  const header = getRequest()?.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token.split(".").length !== 3) throw new Error("Não autorizado.");

  const { createAuthClient, createAdminClient } = await import("./client.server");
  const { data, error } = await createAuthClient(token).auth.getClaims(token);
  const claims = data?.claims;
  if (error || !claims?.sub) throw new Error("Sessão expirada. Entre novamente.");
  if (claims["aal"] !== "aal2") {
    throw new Error("Confirme o código do autenticador para continuar.");
  }

  const { data: admin } = await createAdminClient()
    .from("platform_admins")
    .select("user_id, role")
    .eq("user_id", claims.sub)
    .maybeSingle();
  if (!admin) throw new Error("Acesso restrito à administração do LavaPro.");

  return next({
    context: {
      adminUserId: claims.sub as string | null,
      adminEmail: typeof claims["email"] === "string" ? (claims["email"] as string | null) : null,
      adminRole: admin.role,
    },
  });
});
