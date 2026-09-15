import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { normalizePlate } from "./plate";

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

export const DEFAULT_SERVICES = [
  { nome: "Lavagem simples", preco: 35, duracao_min: 30 },
  { nome: "Lavagem completa", preco: 60, duracao_min: 60 },
  { nome: "Lavagem premium", preco: 90, duracao_min: 90 },
  { nome: "Higienização interna", preco: 120, duracao_min: 120 },
  { nome: "Polimento", preco: 150, duracao_min: 180 },
  { nome: "Enceramento", preco: 80, duracao_min: 60 },
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

export async function recalcOrder(sb: DB, orderId: string) {
  const { data: items, error: itemsError } = await sb
    .from("service_order_items")
    .select("preco, quantidade")
    .eq("order_id", orderId);
  if (itemsError) throw new Error(itemsError.message);

  const subtotal = (items ?? []).reduce(
    (acc, i) => acc + Number(i.preco) * (i.quantidade ?? 1),
    0,
  );

  const { data: order, error: orderError } = await sb
    .from("service_orders")
    .select("desconto, acrescimo")
    .eq("id", orderId)
    .single();
  if (orderError) throw new Error(orderError.message);

  const total = Math.max(0, subtotal - Number(order.desconto) + Number(order.acrescimo));
  const { error } = await sb
    .from("service_orders")
    .update({ subtotal, total })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
  return { subtotal, total };
}

export async function loadOrder(sb: DB, orderId: string) {
  const { data: order, error } = await sb
    .from("service_orders")
    .select(
      "*, customers(id, nome, telefone), vehicles(id, placa, marca, modelo, cor, ano), service_order_items(*), payments(*), order_photos(*)",
    )
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
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startWeek = new Date(now.getTime() - 6 * 86400000).toISOString();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: payments, error: payError } = await sb
    .from("payments")
    .select("valor, metodo, pago_em")
    .eq("tenant_id", tenantId)
    .gte("pago_em", startMonth);
  if (payError) throw new Error(payError.message);

  const sum = (from: string) =>
    (payments ?? [])
      .filter((p) => p.pago_em >= from)
      .reduce((acc, p) => acc + Number(p.valor), 0);

  const byMethod = new Map<string, number>();
  for (const p of payments ?? []) {
    byMethod.set(p.metodo, (byMethod.get(p.metodo) ?? 0) + Number(p.valor));
  }

  const { data: orders, error: ordError } = await sb
    .from("service_orders")
    .select("id, status, total, created_at, service_order_items(nome, preco, quantidade)")
    .eq("tenant_id", tenantId)
    .gte("created_at", startMonth);
  if (ordError) throw new Error(ordError.message);

  const list = orders ?? [];
  const finalizados = list.filter((o) => ["PAGO", "ENTREGUE"].includes(o.status));
  const emAndamento = list.filter((o) =>
    ["AGUARDANDO", "EM_LAVAGEM", "EM_FINALIZACAO", "FINALIZADO", "AGUARDANDO_PAGAMENTO"].includes(
      o.status,
    ),
  ).length;

  const veiculosDia = list.filter((o) => o.created_at >= startDay).length;
  const ticket = finalizados.length
    ? finalizados.reduce((a, o) => a + Number(o.total), 0) / finalizados.length
    : 0;

  const serviceCount = new Map<string, { qtd: number; valor: number }>();
  for (const o of list) {
    for (const i of o.service_order_items ?? []) {
      const cur = serviceCount.get(i.nome) ?? { qtd: 0, valor: 0 };
      cur.qtd += i.quantidade ?? 1;
      cur.valor += Number(i.preco) * (i.quantidade ?? 1);
      serviceCount.set(i.nome, cur);
    }
  }

  const last7 = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - idx));
    const next = new Date(d.getTime() + 86400000);
    const valor = (payments ?? [])
      .filter((p) => p.pago_em >= d.toISOString() && p.pago_em < next.toISOString())
      .reduce((acc, p) => acc + Number(p.valor), 0);
    return { dia: d.toLocaleDateString("pt-BR", { weekday: "short" }), valor };
  });

  return {
    faturamentoDia: sum(startDay),
    faturamentoSemana: sum(startWeek),
    faturamentoMes: sum(startMonth),
    veiculosDia,
    veiculosMes: list.length,
    ticketMedio: ticket,
    emAndamento,
    finalizados: finalizados.length,
    porMetodo: [...byMethod.entries()].map(([metodo, valor]) => ({ metodo, valor })),
    topServicos: [...serviceCount.entries()]
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5),
    last7,
  };
}
