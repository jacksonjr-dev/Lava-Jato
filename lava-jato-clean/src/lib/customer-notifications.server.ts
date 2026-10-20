// Envio dos avisos ao cliente (só no servidor). Canal atual: notificação no
// celular (web push). Para automatizar outro canal (ex.: WhatsApp), basta
// acrescentar um envio em `notifyOrderReady` usando a mesma `CustomerMessage`.
import webpush from "web-push";
import { hasFeature, resolveSubscription } from "./plans";
import {
  readyMessage,
  validatePushSubscription,
  type CustomerMessage,
  type PushSubscriptionInput,
} from "./customer-notifications";

/** Limite de aparelhos com aviso ativado por veículo (os mais antigos saem). */
const MAX_DEVICES_PER_VEHICLE = 5;

type StoredSubscription = { endpoint: string; p256dh: string; auth: string };

type ReadyOrder = {
  tenantId: string;
  vehicleId: string;
  plate: string;
  tenantName: string;
  orderNumber: number;
  hasPix: boolean;
};

export function pushPublicKey(): string | null {
  return process.env["VAPID_PUBLIC_KEY"] || null;
}

let vapidReady = false;
function configureVapid(): boolean {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  if (!publicKey || !privateKey) return false;
  if (!vapidReady) {
    webpush.setVapidDetails(
      process.env["VAPID_SUBJECT"] || "https://lava-pro.vercel.app",
      publicKey,
      privateKey,
    );
    vapidReady = true;
  }
  return true;
}

/** Envia a mensagem para cada aparelho; devolve os endereços que expiraram (404/410). */
async function sendPush(
  subscriptions: StoredSubscription[],
  message: CustomerMessage,
): Promise<{ sent: number; expired: string[] }> {
  if (!subscriptions.length || !configureVapid()) return { sent: 0, expired: [] };
  const payload = JSON.stringify(message);
  const expired: string[] = [];
  let sent = 0;
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { TTL: 60 * 60 * 6, urgency: "high", topic: message.tag.slice(0, 32) },
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) expired.push(subscription.endpoint);
        else console.error("[aviso ao cliente] push falhou", status ?? error);
      }
    }),
  );
  return { sent, expired };
}

// ---------------------------------------------------------------------------
// Banco de verdade (Supabase, service role)
// ---------------------------------------------------------------------------

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export async function savePushSubscription(
  tenantId: string,
  vehicleId: string,
  input: unknown,
): Promise<void> {
  const subscription = validatePushSubscription(input);
  const db = await admin();
  const { error } = await db.from("portal_push_subscriptions").upsert(
    {
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw new Error("Não foi possível ativar o aviso. Tente novamente.");

  const { data: devices } = await db
    .from("portal_push_subscriptions")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });
  const extra = (devices ?? []).slice(MAX_DEVICES_PER_VEHICLE).map((device) => device.id);
  if (extra.length) await db.from("portal_push_subscriptions").delete().in("id", extra);
}

export async function removePushSubscription(
  tenantId: string,
  vehicleId: string,
  endpoint: string,
): Promise<void> {
  const db = await admin();
  await db
    .from("portal_push_subscriptions")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("vehicle_id", vehicleId)
    .eq("endpoint", endpoint);
}

/** Avisa o cliente de que o carro está pronto. Falhas não impedem a mudança de status. */
export async function notifyOrderReady(tenantId: string, orderId: string): Promise<void> {
  try {
    const db = await admin();
    const { data: order } = await db
      .from("service_orders")
      .select(
        "numero, vehicle_id, vehicles(placa), tenants(nome, pix_key, plan, trial_ends_at, plan_expires_at)",
      )
      .eq("id", orderId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (!order?.vehicle_id) return;
    const tenant = order.tenants as {
      nome: string;
      pix_key: string | null;
      plan: string;
      trial_ends_at: string | null;
      plan_expires_at: string | null;
    } | null;
    // Mesma regra da área do cliente: PIX só se o plano incluir e houver chave.
    const hasPix = !!tenant?.pix_key?.trim() && hasFeature(resolveSubscription(tenant), "pix");
    await deliverReady({
      tenantId,
      vehicleId: order.vehicle_id,
      plate: (order.vehicles as { placa: string } | null)?.placa ?? "",
      tenantName: tenant?.nome ?? "Lava-jato",
      orderNumber: order.numero,
      hasPix,
    });
  } catch (error) {
    console.error("[aviso ao cliente]", error);
  }
}

async function deliverReady(order: ReadyOrder) {
  const db = await admin();
  const { data: subscriptions } = await db
    .from("portal_push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("tenant_id", order.tenantId)
    .eq("vehicle_id", order.vehicleId);
  const { expired, sent } = await sendPush(subscriptions ?? [], readyMessage(order));
  if (expired.length) {
    await db.from("portal_push_subscriptions").delete().in("endpoint", expired);
  }
  if (sent) {
    await db
      .from("portal_push_subscriptions")
      .update({ last_sent_at: new Date().toISOString() })
      .eq("tenant_id", order.tenantId)
      .eq("vehicle_id", order.vehicleId);
  }
}

// ---------------------------------------------------------------------------
// Modo demonstração (memória do servidor)
// ---------------------------------------------------------------------------

const demoSubscriptions = new Map<string, StoredSubscription[]>();

export function demoSavePushSubscription(vehicleId: string, input: unknown): void {
  const subscription: PushSubscriptionInput = validatePushSubscription(input);
  const current = (demoSubscriptions.get(vehicleId) ?? []).filter(
    (item) => item.endpoint !== subscription.endpoint,
  );
  current.unshift({ endpoint: subscription.endpoint, ...subscription.keys });
  demoSubscriptions.set(vehicleId, current.slice(0, MAX_DEVICES_PER_VEHICLE));
}

export function demoRemovePushSubscription(vehicleId: string, endpoint: string): void {
  demoSubscriptions.set(
    vehicleId,
    (demoSubscriptions.get(vehicleId) ?? []).filter((item) => item.endpoint !== endpoint),
  );
}

export async function demoNotifyOrderReady(order: Omit<ReadyOrder, "tenantId">): Promise<void> {
  try {
    const subscriptions = demoSubscriptions.get(order.vehicleId) ?? [];
    const { expired } = await sendPush(subscriptions, readyMessage(order));
    if (expired.length) {
      demoSubscriptions.set(
        order.vehicleId,
        subscriptions.filter((item) => !expired.includes(item.endpoint)),
      );
    }
  } catch (error) {
    console.error("[aviso ao cliente]", error);
  }
}
