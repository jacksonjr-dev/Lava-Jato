import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DEFAULT_SERVICES,
  dashboardStats,
  getMembership,
  loadOrder,
  recalcOrder,
  recognizePlateFromImage,
  requireManager,
  requireMembership,
  vehicleSummary,
} from "./lavajato.server";
import { normalizePlate } from "./plate";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export const getSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const membership = await getMembership(context.supabase, context.userId);
    if (!membership) return { membership: null, tenant: null };
    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("id", membership.tenantId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { membership, tenant };
  });

export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { nome: string; telefone?: string; endereco?: string; logo_url?: string }) => data)
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const existing = await getMembership(sb, context.userId);
    if (existing) throw new Error("Você já possui um lava-jato vinculado.");
    const nome = (data.nome ?? "").trim();
    if (nome.length < 2) throw new Error("Informe o nome do lava-jato.");

    // The tenant SELECT policy only matches after the membership exists, so the
    // id is generated here instead of read back from the insert.
    const tenantId = crypto.randomUUID();

    const { error } = await sb.from("tenants").insert({
      id: tenantId,
      nome,
      telefone: data.telefone?.trim() || null,
      endereco: data.endereco?.trim() || null,
      logo_url: data.logo_url?.trim() || null,
    });
    if (error) throw new Error(error.message);

    const { error: memberError } = await sb
      .from("tenant_members")
      .insert({ tenant_id: tenantId, user_id: context.userId, role: "OWNER" });
    if (memberError) throw new Error(memberError.message);

    const { error: svcError } = await sb
      .from("services")
      .insert(DEFAULT_SERVICES.map((s) => ({ ...s, tenant_id: tenantId })));
    if (svcError) throw new Error(svcError.message);

    return { tenantId };
  });

export const listServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("services")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("preco", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { nome: string; preco: number; duracao_min?: number; descricao?: string }) => data)
  .handler(async ({ data, context }) => {
    const { tenantId } = await requireManager(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("services")
      .insert({
        tenant_id: tenantId,
        nome: data.nome.trim(),
        preco: Math.max(0, Number(data.preco) || 0),
        duracao_min: data.duracao_min ?? null,
        descricao: data.descricao?.trim() || null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; nome?: string; preco?: number; duracao_min?: number | null; ativo?: boolean }) => data)
  .handler(async ({ data, context }) => {
    const { tenantId } = await requireManager(context.supabase, context.userId);
    const patch: Database["public"]["Tables"]["services"]["Update"] = {};
    if (data.nome !== undefined) patch.nome = data.nome.trim();
    if (data.preco !== undefined) patch.preco = Math.max(0, Number(data.preco) || 0);
    if (data.duracao_min !== undefined) patch.duracao_min = data.duracao_min;
    if (data.ativo !== undefined) patch.ativo = data.ativo;
    const { data: row, error } = await context.supabase
      .from("services")
      .update(patch)
      .eq("id", data.id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deactivateService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { tenantId } = await requireManager(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("services")
      .update({ ativo: false })
      .eq("id", data.id)
      .eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recognizePlate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { image: string }) => data)
  .handler(async ({ data, context }) => {
    await requireMembership(context.supabase, context.userId);
    if (!data.image?.startsWith("data:image/")) throw new Error("Imagem inválida.");
    return recognizePlateFromImage(data.image);
  });

export const findVehicleByPlate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { placa: string }) => data)
  .handler(async ({ data, context }) => {
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    return vehicleSummary(context.supabase, tenantId, data.placa);
  });

export const plateHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { placa: string }) => data)
  .handler(async ({ data, context }) => {
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    return vehicleSummary(context.supabase, tenantId, data.placa);
  });

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { nome: string; telefone?: string }) => data)
  .handler(async ({ data, context }) => {
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("customers")
      .insert({ tenant_id: tenantId, nome: data.nome.trim(), telefone: data.telefone?.trim() || null })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { placa: string; customer_id?: string; marca?: string; modelo?: string; cor?: string }) => data,
  )
  .handler(async ({ data, context }) => {
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    const placa = normalizePlate(data.placa);
    if (placa.length < 6) throw new Error("Placa inválida.");
    const { data: row, error } = await context.supabase
      .from("vehicles")
      .insert({
        tenant_id: tenantId,
        customer_id: data.customer_id ?? null,
        placa,
        placa_normalizada: placa,
        marca: data.marca?.trim() || null,
        modelo: data.modelo?.trim() || null,
        cor: data.cor?.trim() || null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const quickRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      placa: string;
      cliente_nome: string;
      cliente_telefone?: string;
      marca?: string;
      modelo?: string;
      cor?: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { tenantId } = await requireMembership(sb, context.userId);
    const placa = normalizePlate(data.placa);
    if (placa.length < 6) throw new Error("Placa inválida.");
    if (!data.cliente_nome?.trim()) throw new Error("Informe o nome do cliente.");

    const { data: customer, error: cErr } = await sb
      .from("customers")
      .insert({
        tenant_id: tenantId,
        nome: data.cliente_nome.trim(),
        telefone: data.cliente_telefone?.trim() || null,
      })
      .select("id")
      .single();
    if (cErr) throw new Error(cErr.message);

    const { data: vehicle, error: vErr } = await sb
      .from("vehicles")
      .insert({
        tenant_id: tenantId,
        customer_id: customer.id,
        placa,
        placa_normalizada: placa,
        marca: data.marca?.trim() || null,
        modelo: data.modelo?.trim() || null,
        cor: data.cor?.trim() || null,
      })
      .select("*")
      .single();
    if (vErr) throw new Error(vErr.message);

    return { customerId: customer.id, vehicle };
  });

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { vehicle_id: string; service_ids: string[]; observacoes?: string }) => data)
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { tenantId } = await requireMembership(sb, context.userId);

    const { data: vehicle, error: vErr } = await sb
      .from("vehicles")
      .select("id, customer_id")
      .eq("id", data.vehicle_id)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (vErr) throw new Error(vErr.message);
    if (!vehicle) throw new Error("Veículo não encontrado.");

    const ids = [...new Set(data.service_ids ?? [])];
    if (ids.length === 0) throw new Error("Selecione ao menos um serviço.");

    const { data: services, error: sErr } = await sb
      .from("services")
      .select("id, nome, preco")
      .eq("tenant_id", tenantId)
      .eq("ativo", true)
      .in("id", ids);
    if (sErr) throw new Error(sErr.message);
    if (!services?.length) throw new Error("Serviços inválidos.");

    const { data: order, error: oErr } = await sb
      .from("service_orders")
      .insert({
        tenant_id: tenantId,
        vehicle_id: vehicle.id,
        customer_id: vehicle.customer_id,
        employee_id: context.userId,
        status: "AGUARDANDO",
        observacoes: data.observacoes?.trim() || null,
      })
      .select("*")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await sb.from("service_order_items").insert(
      services.map((s) => ({
        tenant_id: tenantId,
        order_id: order.id,
        service_id: s.id,
        nome: s.nome,
        preco: s.preco,
        quantidade: 1,
      })),
    );
    if (iErr) throw new Error(iErr.message);

    await recalcOrder(sb, order.id);
    return { orderId: order.id };
  });

export const getOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await requireMembership(context.supabase, context.userId);
    return loadOrder(context.supabase, data.id);
  });

export const addOrderItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { order_id: string; service_ids: string[] }) => data)
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { tenantId } = await requireMembership(sb, context.userId);
    const { data: order, error: oErr } = await sb
      .from("service_orders")
      .select("id, status")
      .eq("id", data.order_id)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!order) throw new Error("Atendimento não encontrado.");
    if (["PAGO", "ENTREGUE", "CANCELADO"].includes(order.status)) {
      throw new Error("Não é possível alterar um atendimento finalizado.");
    }

    const ids = [...new Set(data.service_ids ?? [])];
    if (!ids.length) throw new Error("Selecione ao menos um serviço.");
    const { data: services, error: sErr } = await sb
      .from("services")
      .select("id, nome, preco")
      .eq("tenant_id", tenantId)
      .eq("ativo", true)
      .in("id", ids);
    if (sErr) throw new Error(sErr.message);
    if (!services?.length) throw new Error("Serviços inválidos.");

    const { error } = await sb.from("service_order_items").insert(
      services.map((s) => ({
        tenant_id: tenantId,
        order_id: order.id,
        service_id: s.id,
        nome: s.nome,
        preco: s.preco,
        quantidade: 1,
      })),
    );
    if (error) throw new Error(error.message);
    return recalcOrder(sb, order.id);
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { order_id: string; status: OrderStatus }) => data)
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const membership = await requireMembership(sb, context.userId);
    if (data.status === "CANCELADO" && membership.role === "EMPLOYEE") {
      throw new Error("Apenas proprietário ou gerente podem cancelar.");
    }

    const { data: current, error: curErr } = await sb
      .from("service_orders")
      .select("status")
      .eq("id", data.order_id)
      .eq("tenant_id", membership.tenantId)
      .maybeSingle();
    if (curErr) throw new Error(curErr.message);
    if (!current) throw new Error("Atendimento não encontrado.");
    if (
      ["PAGO", "ENTREGUE"].includes(current.status) &&
      !["PAGO", "ENTREGUE"].includes(data.status)
    ) {
      throw new Error("Este atendimento já foi pago e não pode voltar de status.");
    }
    if (data.status === "PAGO" && current.status !== "PAGO") {
      throw new Error("Use o registro de pagamento para marcar como pago.");
    }

    const patch: Database["public"]["Tables"]["service_orders"]["Update"] = { status: data.status };
    if (["FINALIZADO", "PAGO", "ENTREGUE"].includes(data.status)) {
      patch.finished_at = new Date().toISOString();
    }
    const { error } = await sb
      .from("service_orders")
      .update(patch)
      .eq("id", data.order_id)
      .eq("tenant_id", membership.tenantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const registerPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { order_id: string; metodo: PaymentMethod }) => data)
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { tenantId } = await requireMembership(sb, context.userId);

    const { data: order, error: oErr } = await sb
      .from("service_orders")
      .select("id, status")
      .eq("id", data.order_id)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!order) throw new Error("Atendimento não encontrado.");
    if (order.status === "CANCELADO") throw new Error("Este atendimento foi cancelado.");
    if (["PAGO", "ENTREGUE"].includes(order.status)) {
      throw new Error("Esta ordem de serviço já possui pagamento registrado.");
    }

    const { count, error: cErr } = await sb
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("order_id", order.id);
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) {
      throw new Error("Esta ordem de serviço já possui pagamento registrado.");
    }

    const { subtotal: _s, total } = await recalcOrder(sb, data.order_id);
    void _s;

    const { error } = await sb.from("payments").insert({
      tenant_id: tenantId,
      order_id: order.id,
      valor: total,
      metodo: data.metodo,
      user_id: context.userId,
    });
    if (error) {
      if (error.code === "23505") {
        throw new Error("Esta ordem de serviço já possui pagamento registrado.");
      }
      throw new Error(error.message);
    }

    const { error: uErr } = await sb
      .from("service_orders")
      .update({ status: "PAGO", finished_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("tenant_id", tenantId);
    if (uErr) throw new Error(uErr.message);

    return { ok: true, total };
  });

export const homeSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    const stats = await dashboardStats(context.supabase, tenantId);
    return {
      emAndamento: stats.emAndamento,
      veiculosDia: stats.veiculosDia,
      faturamentoDia: stats.faturamentoDia,
    };
  });

export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { tenantId } = await requireManager(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("tenant_members")
      .select("id, user_id, role, created_at")
      .eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listActiveOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("service_orders")
      .select("id, numero, status, total, created_at, vehicles(placa), customers(nome)")
      .eq("tenant_id", tenantId)
      .not("status", "in", "(ENTREGUE,CANCELADO)")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
