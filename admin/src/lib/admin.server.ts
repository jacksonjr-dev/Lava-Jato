import { financialPeriod } from "@core/lib/financial";
import { createAdminClient } from "@/integrations/supabase/client.server";
import {
  planChange,
  withSubscription,
  type CompanyDetail,
  type CompanyRow,
  type PanelAction,
  type SubscriptionEvent,
} from "./companies";

type Admin = { adminUserId: string | null; adminEmail: string | null };

const TENANT_COLUMNS =
  "id, nome, slug, telefone, logo_url, created_at, plan, trial_ends_at, plan_expires_at";

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
  const [emails, members, month, total, events] = await Promise.all([
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
