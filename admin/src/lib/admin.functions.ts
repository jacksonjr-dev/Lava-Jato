import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireAdmin } from "@/integrations/supabase/auth";
import { PAYMENT_METHODS, type PaymentInput } from "./billing";
import { assertOwner } from "./team";
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
  .handler(async ({ context }) => ({ email: context.adminEmail, role: context.adminRole }));

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

export const getMetrics = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () =>
    isDemo()
      ? (await import("./demo.server")).demoGetMetrics()
      : (await import("./admin.server")).getMetrics(),
  );

function validActivation(activate: NonNullable<PaymentInput["activate"]>) {
  const action = validAction({ action: "ATIVAR", plan: activate.plan, months: activate.months });
  if (action.action !== "ATIVAR") throw new Error("Ação inválida.");
  return { plan: action.plan, months: action.months };
}

/** Só confere a forma da entrada; as regras de negócio ficam em validatePayment. */
function validPaymentInput(input: PaymentInput): PaymentInput {
  const activate = input?.activate;
  if (
    !input ||
    typeof input.amount !== "number" ||
    !(PAYMENT_METHODS as readonly string[]).includes(input.method) ||
    typeof input.paidOn !== "string" ||
    typeof input.note !== "string"
  ) {
    throw new Error("Pagamento inválido.");
  }
  return {
    amount: input.amount,
    method: input.method,
    paidOn: input.paidOn,
    note: input.note.slice(0, 300),
    activate: activate ? validActivation(activate) : null,
  };
}

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: { id: string; payment: PaymentInput }) => ({
    id: validId(data?.id),
    payment: validPaymentInput(data?.payment),
  }))
  .handler(async ({ data, context }) =>
    isDemo()
      ? (await import("./demo.server")).demoRecordPayment(data.id, data.payment)
      : (await import("./admin.server")).recordPayment(data.id, data.payment, context),
  );

export const addNote = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: { id: string; body: string }) => ({
    id: validId(data?.id),
    body: String(data?.body ?? "").slice(0, 1000),
  }))
  .handler(async ({ data, context }) =>
    isDemo()
      ? (await import("./demo.server")).demoAddNote(data.id, data.body)
      : (await import("./admin.server")).addNote(data.id, data.body, context),
  );

export const getFinanceData = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { payments, companies } = isDemo()
      ? (await import("./demo.server")).demoGetFinanceData()
      : await (await import("./admin.server")).getFinanceData();
    return { payments, companies: companies.map((row) => withSubscription(row)) };
  });

export const setSuspension = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: { id: string; suspend: boolean; reason: string }) => ({
    id: validId(data?.id),
    suspend: data?.suspend === true,
    reason: String(data?.reason ?? "").slice(0, 300),
  }))
  .handler(async ({ data, context }) =>
    isDemo()
      ? (await import("./demo.server")).demoSetSuspension(data.id, data.suspend, data.reason)
      : (await import("./admin.server")).setSuspension(data.id, data.suspend, data.reason, context),
  );

export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    assertOwner(context.adminRole);
    return isDemo()
      ? (await import("./demo.server")).demoListTeam()
      : (await import("./admin.server")).listTeam();
  });

export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: { nome: string; email: string }) => ({
    nome: String(data?.nome ?? "").slice(0, 120),
    email: String(data?.email ?? "").slice(0, 254),
  }))
  .handler(async ({ data, context }) => {
    assertOwner(context.adminRole);
    if (isDemo()) return (await import("./demo.server")).demoInviteAdmin(data);
    // O link do e-mail volta para a página de criar senha deste mesmo painel.
    const origin = new URL(getRequest().url).origin;
    return (await import("./admin.server")).inviteAdmin(data, context, `${origin}/convite`);
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: { userId: string }) => {
    const userId = String(data?.userId ?? "");
    if (!(isDemo() ? /^demo-admin(-\d+)?$/.test(userId) : UUID.test(userId))) {
      throw new Error("Administrador não encontrado.");
    }
    return { userId };
  })
  .handler(async ({ data, context }) => {
    assertOwner(context.adminRole);
    return isDemo()
      ? (await import("./demo.server")).demoRemoveAdmin(data.userId)
      : (await import("./admin.server")).removeAdmin(data.userId, context);
  });
