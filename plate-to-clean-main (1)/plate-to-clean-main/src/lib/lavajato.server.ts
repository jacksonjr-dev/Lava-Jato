import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { normalizePlate } from "./plate";
import { calculateFinancialStats, financialPeriod } from "./financial";
import { assertFeature, resolveSubscription, type Feature, type Subscription } from "./plans";

export type DB = SupabaseClient<Database>;
export type Role = Database["public"]["Enums"]["app_role"];

export type Membership = { tenantId: string; role: Role };

export async function getMembership(sb: DB, userId: string): Promise<Membership | null> {
  const { data, error } = await sb
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { tenantId: data.tenant_id, role: data.role };
}

export async function requireMembership(sb: DB, userId: string): Promise<Membership> {
  const m = await getMembership(sb, userId);
  if (!m) throw new Error("Nenhum lava-jato vinculado a este usuário.");
  return m;
}

export async function requireManager(sb: DB, userId: string): Promise<Membership> {
  const m = await requireMembership(sb, userId);
  if (m.role !== "OWNER" && m.role !== "MANAGER") {
    throw new Error("Apenas proprietário ou gerente podem executar esta ação.");
  }
  return m;
}

export async function loadSubscription(sb: DB, tenantId: string): Promise<Subscription> {
  const { data, error } = await sb
    .from("tenants")
    .select("plan, trial_ends_at, plan_expires_at")
    .eq("id", tenantId)
    .single();
  if (error) throw new Error(error.message);
  return resolveSubscription(data);
}

export async function requireFeature(sb: DB, tenantId: string, feature: Feature) {
  const subscription = await loadSubscription(sb, tenantId);
  assertFeature(subscription, feature);
  return subscription;
}

export async function ordersThisMonth(sb: DB, tenantId: string): Promise<number> {
  const { count, error } = await sb
    .from("service_orders")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("created_at", financialPeriod(new Date()).startMonth.toISOString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export const DEFAULT_SERVICES = [
  { nome: "Lavagem simples (apenas externa)", preco: 35, duracao_min: 30 },
  { nome: "Lavagem completa (externa e interna)", preco: 60, duracao_min: 60 },
  { nome: "Polimento", preco: 150, duracao_min: 180 },
];

/**
 * Camada de abstração de reconhecimento de placa (LPR/OCR).
 * Troque a implementação interna sem alterar o restante da aplicação.
 */
export async function recognizePlateFromImage(
  imageDataUrl: string,
): Promise<{ plate: string; confidence: number }> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new Error("Serviço de reconhecimento indisponível.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env["OPENAI_VISION_MODEL"] ?? "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            'Você lê placas de veículos brasileiros em fotos. Responda SOMENTE com JSON no formato {"plate":"ABC1D23","confidence":0.0-1.0}. Se não conseguir ler, use {"plate":"","confidence":0}.',
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Qual é a placa deste veículo?" },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (res.status === 429) throw new Error("Muitas leituras seguidas. Aguarde alguns segundos.");
  if (!res.ok) {
    console.error("[LPR] gateway error", res.status, await res.text());
    throw new Error("Não foi possível ler a placa. Digite manualmente.");
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { plate: "", confidence: 0 };
  try {
    const parsed = JSON.parse(match[0]) as { plate?: string; confidence?: number };
    return {
      plate: normalizePlate(parsed.plate ?? ""),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0))),
    };
  } catch {
    return { plate: "", confidence: 0 };
  }
}

export async function loadOrder(sb: DB, tenantId: string, orderId: string) {
  const { data: order, error } = await sb
    .from("service_orders")
    .select(
      "*, customers(id, nome, telefone), vehicles(id, placa, marca, modelo, cor, ano), service_order_items(*), payments(*), order_photos(*)",
    )
    .eq("tenant_id", tenantId)
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Atendimento não encontrado.");
  return order;
}

export async function vehicleSummary(sb: DB, tenantId: string, plateInput: string) {
  const placa = normalizePlate(plateInput);
  const { data: vehicle, error } = await sb
    .from("vehicles")
    .select("*, customers(id, nome, telefone, email)")
    .eq("tenant_id", tenantId)
    .eq("placa_normalizada", placa)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!vehicle) return { placa, vehicle: null, history: [], stats: null };

  const { data: history, error: histError } = await sb
    .from("service_orders")
    .select("id, numero, status, total, created_at, service_order_items(nome, preco)")
    .eq("tenant_id", tenantId)
    .eq("vehicle_id", vehicle.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (histError) throw new Error(histError.message);

  const orders = history ?? [];
  const paidStatuses = ["PAGO", "ENTREGUE"];
  const totalGasto = orders
    .filter((o) => paidStatuses.includes(o.status))
    .reduce((acc, o) => acc + Number(o.total), 0);

  const counts = new Map<string, number>();
  for (const o of orders) {
    for (const item of o.service_order_items ?? []) {
      counts.set(item.nome, (counts.get(item.nome) ?? 0) + 1);
    }
  }
  const topServices = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nome, qtd]) => ({ nome, qtd }));

  return {
    placa,
    vehicle,
    history: orders,
    stats: {
      total: orders.length,
      last: orders[0]?.created_at ?? null,
      totalGasto,
      topServices,
    },
  };
}

export async function dashboardStats(sb: DB, tenantId: string) {
  const now = new Date();
  const period = financialPeriod(now);
  const paymentWindowStart = new Date(
    Math.min(period.startWeek.getTime(), period.startMonth.getTime()),
  ).toISOString();

  const { data: payments, error: payError } = await sb
    .from("payments")
    .select("order_id, valor, metodo, pago_em")
    .eq("tenant_id", tenantId)
    .gte("pago_em", paymentWindowStart)
    .lt("pago_em", period.nextMonth.toISOString());
  if (payError) throw new Error(payError.message);

  const { data: orders, error: ordError } = await sb
    .from("service_orders")
    .select("id, vehicle_id, status, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", period.startMonth.toISOString())
    .lt("created_at", period.nextMonth.toISOString());
  if (ordError) throw new Error(ordError.message);

  const activeStatuses: Database["public"]["Enums"]["order_status"][] = [
    "AGUARDANDO",
    "EM_LAVAGEM",
    "EM_FINALIZACAO",
    "FINALIZADO",
    "AGUARDANDO_PAGAMENTO",
  ];
  const { count: activeOrders, error: activeError } = await sb
    .from("service_orders")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .in("status", activeStatuses);
  if (activeError) throw new Error(activeError.message);

  const monthPaymentOrderIds = [
    ...new Set(
      (payments ?? [])
        .filter(
          (payment) =>
            payment.pago_em >= period.startMonth.toISOString() &&
            payment.pago_em < period.nextMonth.toISOString(),
        )
        .map((payment) => payment.order_id),
    ),
  ];
  let paidItems: Array<{ nome: string; preco: number; quantidade: number }> = [];
  if (monthPaymentOrderIds.length) {
    const { data: items, error: itemError } = await sb
      .from("service_order_items")
      .select("nome, preco, quantidade")
      .eq("tenant_id", tenantId)
      .in("order_id", monthPaymentOrderIds);
    if (itemError) throw new Error(itemError.message);
    paidItems = items ?? [];
  }

  return calculateFinancialStats({
    now,
    payments: payments ?? [],
    monthOrders: orders ?? [],
    activeOrders: activeOrders ?? 0,
    paidItems,
  });
}
