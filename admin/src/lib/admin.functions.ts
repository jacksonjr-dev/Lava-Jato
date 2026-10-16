import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/integrations/supabase/auth";
import { withSubscription, type PanelAction } from "./companies";

const isDemo = () => process.env["ADMIN_DEMO_MODE"] === "true";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validId(id: unknown): string {
  if (typeof id !== "string" || !(isDemo() ? /^demo-\d+$/.test(id) : UUID.test(id))) {
    throw new Error("Empresa não encontrada.");
  }
  return id;
}

/** Confirma, no servidor, que a sessão é de um administrador (usado após o login). */
export const whoAmI = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => ({ email: context.adminEmail }));

export const listCompanies = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const rows = isDemo()
      ? (await import("./demo.server")).demoListCompanies()
      : await (await import("./admin.server")).listCompanies();
    return rows.map((row) => withSubscription(row));
  });

export const getCompany = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .validator((data: { id: string }) => ({ id: validId(data?.id) }))
  .handler(async ({ data }) =>
    isDemo()
      ? (await import("./demo.server")).demoGetCompany(data.id)
      : (await import("./admin.server")).getCompany(data.id),
  );

function validAction(action: PanelAction): PanelAction {
  if (action?.action === "GRATIS") return { action: "GRATIS" };
  if (action?.action === "ESTENDER_TESTE" && (action.days === 7 || action.days === 14)) {
    return { action: "ESTENDER_TESTE", days: action.days };
  }
  if (
    action?.action === "ATIVAR" &&
    (action.plan === "BASICO" || action.plan === "MAX") &&
    [1, 3, 6, 12].includes(action.months)
  ) {
    return { action: "ATIVAR", plan: action.plan, months: action.months };
  }
  throw new Error("Ação inválida.");
}

export const changeSubscription = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: { id: string; action: PanelAction; reason: string }) => ({
    id: validId(data?.id),
    action: validAction(data?.action),
    reason: String(data?.reason ?? ""),
  }))
  .handler(async ({ data, context }) =>
    isDemo()
      ? (await import("./demo.server")).demoChangeSubscription(data.id, data.action, data.reason)
      : (await import("./admin.server")).changeSubscription(
          data.id,
          data.action,
          data.reason,
          context,
        ),
  );
