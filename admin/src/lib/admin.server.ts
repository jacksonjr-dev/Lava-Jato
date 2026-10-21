import { financialPeriod } from "@core/lib/financial";
import { createAdminClient } from "@/integrations/supabase/client.server";
import {
  businessMetrics,
  paymentReason,
  validateNote,
  validatePayment,
  type BusinessMetrics,
  type NoteRecord,
  type PaymentInput,
  type PaymentRecord,
} from "./billing";
import type { FinancePayment } from "./finance";
import { assertCanRemove, validateInvite, type TeamEvent, type TeamMember } from "./team";
import {
  planChange,
  suspensionReason,
  withSubscription,
  type CompanyDetail,
  type CompanyRow,
  type PanelAction,
  type SubscriptionEvent,
} from "./companies";

type Admin = { adminUserId: string | null; adminEmail: string | null };

const PAYMENT_COLUMNS =
  "id, tenant_id, amount, method, paid_at, plan, months, note, admin_email, created_at";

const TENANT_COLUMNS =
  "id, nome, slug, telefone, logo_url, created_at, plan, trial_ends_at, plan_expires_at, suspended_at, suspended_reason";

async function ownerEmails(db: ReturnType<typeof createAdminClient>, tenantIds: string[]) {
  const [{ data: owners }, users] = await Promise.all([
    db
      .from("tenant_members")
      .select("tenant_id, user_id")
      .eq("role", "OWNER")
      .in("tenant_id", tenantIds),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const emailByUser = new Map(
    (users.data?.users ?? []).map((user) => [user.id, user.email ?? null]),
  );
  return new Map(
    (owners ?? []).map((owner) => [owner.tenant_id, emailByUser.get(owner.user_id) ?? null]),
  );
}

export async function listCompanies(): Promise<CompanyRow[]> {
  const db = createAdminClient();
  const { data: tenants, error } = await db
    .from("tenants")
    .select(TENANT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error("Não foi possível listar as empresas.");
  const ids = (tenants ?? []).map((tenant) => tenant.id);
  if (!ids.length) return [];

  const monthStart = financialPeriod(new Date()).startMonth.toISOString();
  const [emails, { data: orders }] = await Promise.all([
    ownerEmails(db, ids),
    db.from("service_orders").select("tenant_id").gte("created_at", monthStart).limit(100_000),
  ]);
  const ordersByTenant = new Map<string, number>();
  for (const order of orders ?? []) {
    ordersByTenant.set(order.tenant_id, (ordersByTenant.get(order.tenant_id) ?? 0) + 1);
  }
  return (tenants ?? []).map((tenant) => ({
    ...tenant,
    ownerEmail: emails.get(tenant.id) ?? null,
    ordersThisMonth: ordersByTenant.get(tenant.id) ?? 0,
  }));
}

export async function getCompany(id: string): Promise<CompanyDetail> {
  const db = createAdminClient();
  const { data: tenant, error } = await db
    .from("tenants")
    .select(TENANT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !tenant) throw new Error("Empresa não encontrada.");
  const monthStart = financialPeriod(new Date()).startMonth.toISOString();
  const [emails, members, month, total, events, payments, notes] = await Promise.all([
    ownerEmails(db, [id]),
    db.from("tenant_members").select("id", { count: "exact", head: true }).eq("tenant_id", id),
    db
      .from("service_orders")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", id)
      .gte("created_at", monthStart),
    db.from("service_orders").select("id", { count: "exact", head: true }).eq("tenant_id", id),
    db
      .from("subscription_events")
      .select(
        "id, action, from_plan, to_plan, to_trial_ends_at, to_expires_at, reason, admin_email, created_at",
      )
      .eq("tenant_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("subscription_payments")
      .select(PAYMENT_COLUMNS)
      .eq("tenant_id", id)
      .order("paid_at", { ascending: false })
      .limit(20),
    db
      .from("tenant_notes")
      .select("id, tenant_id, body, admin_email, created_at")
      .eq("tenant_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  return {
    ...withSubscription({
      ...tenant,
      ownerEmail: emails.get(id) ?? null,
      ordersThisMonth: month.count ?? 0,
    }),
    members: members.count ?? 0,
    ordersTotal: total.count ?? 0,
    events: (events.data ?? []) as SubscriptionEvent[],
    payments: (payments.data ?? []) as PaymentRecord[],
    notes: (notes.data ?? []) as NoteRecord[],
  };
}

export async function changeSubscription(
  id: string,
  action: PanelAction,
  reason: string,
  admin: Admin,
): Promise<CompanyDetail> {
  const db = createAdminClient();
  const { data: current, error } = await db
    .from("tenants")
    .select("plan, trial_ends_at, plan_expires_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !current) throw new Error("Empresa não encontrada.");
  const { next, reason: cleanReason } = planChange(current, action, reason);

  const { error: updateError } = await db.from("tenants").update(next).eq("id", id);
  if (updateError) throw new Error("Não foi possível alterar o plano.");
  const { error: eventError } = await db.from("subscription_events").insert({
    tenant_id: id,
    admin_user_id: admin.adminUserId,
    admin_email: admin.adminEmail,
    action: action.action,
    from_plan: current.plan,
    to_plan: next.plan,
    from_trial_ends_at: current.trial_ends_at,
    to_trial_ends_at: next.trial_ends_at,
    from_expires_at: current.plan_expires_at,
    to_expires_at: next.plan_expires_at,
    reason: cleanReason,
  });
  if (eventError) console.error("[admin] histórico não registrado", eventError.message);
  return getCompany(id);
}

export async function recordPayment(
  id: string,
  input: PaymentInput,
  admin: Admin,
): Promise<CompanyDetail> {
  const payment = validatePayment(input);
  const db = createAdminClient();
  const { error } = await db.from("subscription_payments").insert({
    tenant_id: id,
    amount: payment.amount,
    method: payment.method,
    paid_at: payment.paidAt,
    plan: payment.activate?.plan ?? null,
    months: payment.activate?.months ?? null,
    note: payment.note,
    admin_user_id: admin.adminUserId,
    admin_email: admin.adminEmail,
  });
  if (error) throw new Error("Não foi possível registrar o pagamento.");
  if (payment.activate) {
    return changeSubscription(
      id,
      { action: "ATIVAR", ...payment.activate },
      paymentReason(payment.amount, payment.method, payment.note),
      admin,
    );
  }
  return getCompany(id);
}

export async function addNote(id: string, body: string, admin: Admin): Promise<CompanyDetail> {
  const db = createAdminClient();
  const { error } = await db.from("tenant_notes").insert({
    tenant_id: id,
    body: validateNote(body),
    admin_user_id: admin.adminUserId,
    admin_email: admin.adminEmail,
  });
  if (error) throw new Error("Não foi possível salvar a nota.");
  return getCompany(id);
}

export async function getMetrics(): Promise<BusinessMetrics> {
  const db = createAdminClient();
  // 13 meses cobrem o último pagamento de quem pagou um plano anual.
  const since = new Date();
  since.setMonth(since.getMonth() - 13);
  const [rows, payments, activations] = await Promise.all([
    listCompanies(),
    db
      .from("subscription_payments")
      .select(PAYMENT_COLUMNS)
      .gte("paid_at", since.toISOString())
      .limit(10_000),
    db.from("subscription_events").select("tenant_id").eq("action", "ATIVAR").limit(10_000),
  ]);
  if (payments.error) throw new Error("Não foi possível carregar os pagamentos.");
  return businessMetrics(
    rows.map((row) => withSubscription(row)),
    (payments.data ?? []) as PaymentRecord[],
    new Set((activations.data ?? []).map((event) => event.tenant_id)),
  );
}

export async function getFinanceData(): Promise<{
  payments: FinancePayment[];
  companies: CompanyRow[];
}> {
  const db = createAdminClient();
  // 24 meses: o período de 12 meses é comparado com os 12 anteriores.
  const since = new Date();
  since.setMonth(since.getMonth() - 24, 1);
  const [companies, payments] = await Promise.all([
    listCompanies(),
    db
      .from("subscription_payments")
      .select(PAYMENT_COLUMNS)
      .gte("paid_at", since.toISOString())
      .order("paid_at", { ascending: false })
      .limit(20_000),
  ]);
  if (payments.error) throw new Error("Não foi possível carregar os pagamentos.");
  const names = new Map(companies.map((company) => [company.id, company.nome]));
  return {
    companies,
    payments: ((payments.data ?? []) as PaymentRecord[]).map((payment) => ({
      ...payment,
      tenantName: names.get(payment.tenant_id) ?? "Empresa removida",
    })),
  };
}

/** Suspende ou reativa a empresa; a trava de acesso fica no banco (app.current_tenant). */
export async function setSuspension(
  id: string,
  suspend: boolean,
  reason: string,
  admin: Admin,
): Promise<CompanyDetail> {
  const cleanReason = suspensionReason(reason);
  const db = createAdminClient();
  const { data: current, error } = await db
    .from("tenants")
    .select("plan, suspended_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !current) throw new Error("Empresa não encontrada.");
  if (Boolean(current.suspended_at) === suspend) {
    throw new Error(suspend ? "A empresa já está suspensa." : "A empresa já está ativa.");
  }
  const { error: updateError } = await db
    .from("tenants")
    .update({
      suspended_at: suspend ? new Date().toISOString() : null,
      suspended_reason: suspend ? cleanReason : null,
    })
    .eq("id", id);
  if (updateError) throw new Error("Não foi possível alterar o acesso da empresa.");
  const { error: eventError } = await db.from("subscription_events").insert({
    tenant_id: id,
    admin_user_id: admin.adminUserId,
    admin_email: admin.adminEmail,
    action: suspend ? "SUSPENDER" : "REATIVAR",
    from_plan: current.plan,
    to_plan: current.plan,
    reason: cleanReason,
  });
  if (eventError) console.error("[admin] histórico não registrado", eventError.message);
  return getCompany(id);
}

// ---------------------------------------------------------------------------
// Equipe do painel
// ---------------------------------------------------------------------------

export async function listTeam(): Promise<{ members: TeamMember[]; events: TeamEvent[] }> {
  const db = createAdminClient();
  const [{ data: admins, error }, users, { data: events }] = await Promise.all([
    db.from("platform_admins").select("user_id, nome, role, added_by, created_at"),
    db.auth.admin.listUsers({ perPage: 1000 }),
    db
      .from("platform_admin_events")
      .select("id, action, target_email, actor_email, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (error) throw new Error("Não foi possível carregar a equipe.");
  const byId = new Map((users.data?.users ?? []).map((user) => [user.id, user]));
  const members = (admins ?? []).map((admin) => {
    const user = byId.get(admin.user_id);
    return {
      userId: admin.user_id,
      nome: admin.nome,
      email: user?.email ?? "(usuário removido)",
      role: admin.role,
      since: admin.created_at,
      lastSignInAt: user?.last_sign_in_at ?? null,
      mfa: (user?.factors ?? []).some(
        (factor) => factor.factor_type === "totp" && factor.status === "verified",
      ),
      addedByEmail: admin.added_by ? (byId.get(admin.added_by)?.email ?? null) : null,
    };
  });
  members.sort((a, b) => a.since.localeCompare(b.since));
  return { members, events: (events ?? []) as TeamEvent[] };
}

/**
 * Convida um administrador. E-mail novo recebe o convite do Supabase (cria a senha
 * em /convite); quem já tem conta (ex.: também é dono de lava-jato) só ganha o acesso.
 */
export async function inviteAdmin(
  input: { nome: string; email: string },
  actor: Admin,
  redirectTo: string,
): Promise<{ invited: boolean }> {
  const { nome, email } = validateInvite(input);
  const db = createAdminClient();
  const users = await db.auth.admin.listUsers({ perPage: 1000 });
  let user = (users.data?.users ?? []).find((item) => item.email?.toLowerCase() === email);
  let invited = false;
  if (user) {
    const { data: already } = await db
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (already) throw new Error("Essa pessoa já faz parte da equipe.");
  } else {
    const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { nome },
    });
    if (error || !data.user) throw new Error("Não foi possível enviar o convite.");
    user = data.user;
    invited = true;
  }
  const { error: insertError } = await db
    .from("platform_admins")
    .insert({ user_id: user.id, nome, added_by: actor.adminUserId });
  if (insertError) throw new Error("Não foi possível liberar o acesso.");
  await db.from("platform_admin_events").insert({
    action: "ADICIONAR",
    target_user_id: user.id,
    target_email: email,
    actor_user_id: actor.adminUserId,
    actor_email: actor.adminEmail,
  });
  return { invited };
}

/** Remove o acesso ao painel. A conta continua existindo (pode ser dono de lava-jato). */
export async function removeAdmin(userId: string, actor: Admin): Promise<void> {
  const { members } = await listTeam();
  assertCanRemove(actor.adminUserId ?? "", userId, members);
  const target = members.find((member) => member.userId === userId)!;
  const db = createAdminClient();
  const { error } = await db.from("platform_admins").delete().eq("user_id", userId);
  if (error) throw new Error("Não foi possível remover o acesso.");
  // Sem o autenticador, quem voltar a ser convidado configura um novo do zero.
  const { data: factors } = await db.auth.admin.mfa.listFactors({ userId });
  for (const factor of factors?.factors ?? []) {
    await db.auth.admin.mfa.deleteFactor({ userId, id: factor.id });
  }
  await db.from("platform_admin_events").insert({
    action: "REMOVER",
    target_user_id: userId,
    target_email: target.email,
    actor_user_id: actor.adminUserId,
    actor_email: actor.adminEmail,
  });
}
