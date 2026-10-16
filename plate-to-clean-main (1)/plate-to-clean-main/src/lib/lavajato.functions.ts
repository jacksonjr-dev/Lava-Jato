import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  dashboardStats,
  getMembership,
  listTenantPayments,
  loadOrder,
  ordersThisMonth,
  recognizePlateFromImage,
  requireFeature,
  requireManager,
  requireMembership,
  vehicleSummary,
} from "./lavajato.server";
import { normalizePlate } from "./plate";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  demoActiveOrders,
  demoAdminTenants,
  demoClientPortal,
  demoClientPortalByVehicleId,
  demoCreateBusiness,
  demoCreateIntake,
  demoCreateOrder,
  demoCreateService,
  demoFinancialSummary,
  demoGetPixSettings,
  demoGetOrder,
  demoListPayments,
  demoListVehicles,
  demoOrdersThisMonth,
  demoHomeSummary,
  demoQuickRegister,
  demoRegisterPayment,
  demoServices,
  demoSearchPublicTenants,
  demoSession,
  demoSetLogo,
  demoSubscriptionFields,
  demoUpdateSubscription,
  demoUpdateOrderStatus,
  demoUpdateBusinessProfile,
  demoUpdateService,
  demoDeactivateService,
  demoUpdatePixSettings,
  demoVehicleSummary,
  isDemoServerMode,
} from "./demo-data.server";
import { buildPixPayload } from "./pix";
import { assertCompatibleServices } from "./service-selection";
import { assertOrderTransition } from "./order-flow";
import { validateBusinessHours, type BusinessHours } from "./business-hours";
import { matchesBusinessIdentity } from "./business-identity";
import { logoExtension, parseLogoDataUrl } from "./logo";
import {
  applyAdminSubscriptionAction,
  assertFeature,
  hasFeature,
  resolveSubscription,
  type AdminSubscriptionAction,
  type Feature,
  type SubscriptionFields,
} from "./plans";

export type { AdminSubscriptionAction } from "./plans";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function phoneDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function assertDemoFeature(feature: Feature): void {
  assertFeature(resolveSubscription(demoSubscriptionFields()), feature);
}

/** O portal só atende lava-jatos cujo plano inclui a área do cliente. */
function portalSubscription(tenant: SubscriptionFields | null) {
  const subscription = resolveSubscription(tenant);
  if (!hasFeature(subscription, "area_cliente")) {
    throw new Error("Este lava-jato não oferece a área do cliente no momento.");
  }
  return subscription;
}

async function buildPortalPix(
  tenant: {
    pix_key?: string | null;
    pix_receiver_name?: string | null;
    pix_city?: string | null;
  } | null,
  orders: Array<{ numero: number; status: string; total: number }>,
) {
  const order = orders.find((item) => item.status === "AGUARDANDO_PAGAMENTO");
  if (
    !order ||
    !tenant?.pix_key?.trim() ||
    !tenant.pix_receiver_name?.trim() ||
    !tenant.pix_city?.trim()
  ) {
    return null;
  }

  const copiaECola = buildPixPayload({
    key: tenant.pix_key,
    receiverName: tenant.pix_receiver_name,
    city: tenant.pix_city,
    amount: Number(order.total),
    transactionId: `OS${order.numero}`,
  });
  const { toDataURL } = await import("qrcode");
  const qrCodeDataUrl = await toDataURL(copiaECola, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  return {
    orderId: order.numero,
    amount: Number(order.total),
    key: tenant.pix_key,
    receiverName: tenant.pix_receiver_name,
    copiaECola,
    qrCodeDataUrl,
  };
}

export const searchPublicTenants = createServerFn({ method: "GET" })
  .validator((data: { query: string }) => data)
  .handler(async ({ data }) => {
    const query = data.query.trim().slice(0, 60);
    if (query.length < 2) return [];
    if (isDemoServerMode()) {
      const demoPortalEnabled = hasFeature(
        resolveSubscription(demoSubscriptionFields()),
        "area_cliente",
      );
      return demoSearchPublicTenants(query).filter(
        (tenant) => demoPortalEnabled || tenant.id !== "demo-tenant",
      );
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safeQuery = query
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (safeQuery.length < 2) return [];
    const { data: tenants, error } = await supabaseAdmin
      .from("tenants")
      .select("id, slug, nome, endereco, logo_url, plan, trial_ends_at, plan_expires_at")
      .eq("public_listing", true)
      .or(`nome.ilike.%${safeQuery}%,slug.ilike.%${safeQuery.toLowerCase()}%`)
      .order("nome", { ascending: true })
      .limit(40);
    if (error) throw new Error("Não foi possível buscar os lava-jatos.");
    return (tenants ?? [])
      .filter((tenant) => hasFeature(resolveSubscription(tenant), "area_cliente"))
      .slice(0, 12)
      .map((tenant) => ({
        id: tenant.id,
        slug: tenant.slug,
        nome: tenant.nome,
        endereco: tenant.endereco,
        logo_url: hasFeature(resolveSubscription(tenant), "logo") ? tenant.logo_url : null,
      }));
  });

export const clientPortalLogin = createServerFn({ method: "POST" })
  .validator(
    (data: {
      tenantId?: string | undefined;
      placa?: string | undefined;
      telefone?: string | undefined;
      accessToken?: string | undefined;
    }) => data,
  )
  .handler(async ({ data }) => {
    const security = await import("./client-portal.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let vehicle: Database["public"]["Tables"]["vehicles"]["Row"] & {
      customers: Pick<
        Database["public"]["Tables"]["customers"]["Row"],
        "id" | "nome" | "telefone" | "email"
      > | null;
    };
    let accessToken = data.accessToken?.trim() ?? "";

    if (accessToken) {
      const claims = security.verifyClientPortalToken(accessToken);
      if (isDemoServerMode()) {
        const portal = demoClientPortalByVehicleId(claims.vehicleId, claims.tenantId);
        const subscription = portalSubscription(portal.tenant);
        return {
          ...portal,
          tenant: {
            id: portal.tenant.id,
            slug: portal.tenant.slug,
            nome: portal.tenant.nome,
            telefone: portal.tenant.telefone,
            endereco: portal.tenant.endereco,
            horario: portal.tenant.horario,
            logo_url: hasFeature(subscription, "logo") ? portal.tenant.logo_url : null,
            business_hours: portal.tenant.business_hours,
          },
          pix: hasFeature(subscription, "pix")
            ? await buildPortalPix(portal.tenant, portal.orders)
            : null,
          accessToken,
        };
      }
      const { data: tokenVehicle, error } = await supabaseAdmin
        .from("vehicles")
        .select("*, customers(id, nome, telefone, email)")
        .eq("id", claims.vehicleId)
        .eq("tenant_id", claims.tenantId)
        .maybeSingle();
      if (error || !tokenVehicle) throw new Error("Acesso do cliente expirado.");
      vehicle = tokenVehicle;
    } else {
      const tenantId = data.tenantId?.trim() ?? "";
      const placa = normalizePlate(data.placa ?? "");
      const telefone = phoneDigits(data.telefone);
      if (!tenantId) throw new Error("Escolha o lava-jato onde o serviço foi realizado.");
      const attemptRules = security.portalAttemptRules(
        security.requestClientIp(getRequest()?.headers),
        tenantId,
        placa,
        telefone,
      );
      await security.assertPortalAttemptsAllowed(attemptRules);
      if (placa.length !== 7 || telefone.length < 10 || telefone.length > 11) {
        await security.recordPortalAttemptFailure(attemptRules);
        throw new Error("Informe a placa e o telefone usados no cadastro.");
      }

      if (isDemoServerMode()) {
        const subscription = portalSubscription(demoSubscriptionFields());
        try {
          const portal = demoClientPortal(tenantId, placa, telefone);
          await security.clearPortalAttemptFailures(attemptRules);
          accessToken = security.issueClientPortalToken(
            portal.vehicle.id,
            portal.vehicle.tenant_id,
          );
          return {
            ...portal,
            tenant: {
              id: portal.tenant.id,
              slug: portal.tenant.slug,
              nome: portal.tenant.nome,
              telefone: portal.tenant.telefone,
              endereco: portal.tenant.endereco,
              horario: portal.tenant.horario,
              logo_url: hasFeature(subscription, "logo") ? portal.tenant.logo_url : null,
              business_hours: portal.tenant.business_hours,
            },
            pix: hasFeature(subscription, "pix")
              ? await buildPortalPix(portal.tenant, portal.orders)
              : null,
            accessToken,
          };
        } catch {
          await security.recordPortalAttemptFailure(attemptRules);
          throw new Error("Placa ou telefone não encontrados.");
        }
      }

      if (!UUID_PATTERN.test(tenantId)) {
        await security.recordPortalAttemptFailure(attemptRules);
        throw new Error("Placa ou telefone não encontrados.");
      }

      const { data: candidates, error: vehicleError } = await supabaseAdmin
        .from("vehicles")
        .select("*, customers(id, nome, telefone, email)")
        .eq("tenant_id", tenantId)
        .eq("placa_normalizada", placa)
        .limit(20);
      if (vehicleError) throw new Error("Não foi possível consultar seus atendimentos.");

      const matches = (candidates ?? []).filter(
        (candidate) => phoneDigits(candidate.customers?.telefone) === telefone,
      );
      if (matches.length !== 1) {
        await security.recordPortalAttemptFailure(attemptRules);
        throw new Error(
          matches.length > 1
            ? "Existe mais de um cadastro com esses dados. Procure o lava-jato."
            : "Placa ou telefone não encontrados.",
        );
      }
      vehicle = matches[0]!;
      const { count: orderCount, error: orderAccessError } = await supabaseAdmin
        .from("service_orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("vehicle_id", vehicle.id);
      if (orderAccessError) throw new Error("Não foi possível consultar seus atendimentos.");
      if (!orderCount) {
        await security.recordPortalAttemptFailure(attemptRules);
        throw new Error("Placa ou telefone não encontrados.");
      }
      await security.clearPortalAttemptFailures(attemptRules);
      accessToken = security.issueClientPortalToken(vehicle.id, vehicle.tenant_id);
    }

    const [{ data: tenant, error: tenantError }, { data: orders, error: ordersError }] =
      await Promise.all([
        supabaseAdmin
          .from("tenants")
          .select(
            "id, slug, nome, telefone, endereco, horario, business_hours, logo_url, pix_key, pix_receiver_name, pix_city, plan, trial_ends_at, plan_expires_at",
          )
          .eq("id", vehicle.tenant_id)
          .single(),
        supabaseAdmin
          .from("service_orders")
          .select(
            "id, numero, status, total, created_at, finished_at, service_order_items(id, nome, preco, quantidade), payments(id, metodo, valor, pago_em)",
          )
          .eq("tenant_id", vehicle.tenant_id)
          .eq("vehicle_id", vehicle.id)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
    if (tenantError || ordersError) {
      throw new Error("Não foi possível consultar seus atendimentos.");
    }

    const subscription = portalSubscription(tenant);
    const history = orders ?? [];
    const pix = hasFeature(subscription, "pix") ? await buildPortalPix(tenant, history) : null;
    return {
      tenant: tenant
        ? {
            id: tenant.id,
            slug: tenant.slug,
            nome: tenant.nome,
            telefone: tenant.telefone,
            endereco: tenant.endereco,
            horario: tenant.horario,
            logo_url: hasFeature(subscription, "logo") ? tenant.logo_url : null,
            business_hours: tenant.business_hours,
          }
        : null,
      // Só o que a tela do cliente exibe; telefone e e-mail não voltam ao navegador.
      customer: vehicle.customers ? { nome: vehicle.customers.nome } : null,
      vehicle: {
        id: vehicle.id,
        placa: vehicle.placa,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        cor: vehicle.cor,
      },
      orders: history,
      summary: {
        totalOrders: history.length,
        totalSpent: history
          .filter((order) => ["PAGO", "ENTREGUE"].includes(order.status))
          .reduce((sum, order) => sum + Number(order.total), 0),
        lastVisit: history[0]?.created_at ?? null,
      },
      pix,
      accessToken,
    };
  });

export const getSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (isDemoServerMode()) {
      return {
        ...demoSession(),
        subscription: resolveSubscription(demoSubscriptionFields()),
        usage: { ordersThisMonth: demoOrdersThisMonth() },
        isPlatformAdmin: true,
        user: { id: "demo-user", email: "demo@lavapro.local" },
      };
    }
    const isPlatformAdmin = await checkPlatformAdmin(context.userId);
    const membership = await getMembership(context.supabase, context.userId);
    if (!membership) {
      return {
        membership: null,
        tenant: null,
        subscription: null,
        usage: null,
        isPlatformAdmin,
        user: {
          id: context.userId,
          email: typeof context.claims.email === "string" ? context.claims.email : null,
        },
      };
    }
    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("id", membership.tenantId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const subscription = resolveSubscription(tenant);
    return {
      membership,
      tenant,
      subscription,
      usage: {
        ordersThisMonth:
          subscription.monthlyOrderLimit === null
            ? null
            : await ordersThisMonth(context.supabase, membership.tenantId),
      },
      isPlatformAdmin,
      user: {
        id: context.userId,
        email: typeof context.claims.email === "string" ? context.claims.email : null,
      },
    };
  });

export const updateTenantProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      nome: string;
      telefone?: string;
      endereco?: string;
      business_hours: BusinessHours;
      logo_url?: string | undefined;
      public_listing: boolean;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const nome = data.nome.trim();
    const telefone = data.telefone?.trim() || null;
    const endereco = data.endereco?.trim() || null;
    const businessHours = validateBusinessHours(data.business_hours);
    const logoUrl = data.logo_url?.trim() || null;

    if (nome.length < 2 || nome.length > 80) {
      throw new Error("Informe um nome entre 2 e 80 caracteres.");
    }
    if (telefone && !/^\d{10,11}$/.test(phoneDigits(telefone))) {
      throw new Error("Informe um telefone válido com DDD.");
    }
    if (endereco && endereco.length > 180) {
      throw new Error("O endereço deve ter no máximo 180 caracteres.");
    }
    if (logoUrl) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(logoUrl);
      } catch {
        throw new Error("Informe um link válido para o logo.");
      }
      if (parsedUrl.protocol !== "https:") {
        throw new Error("O link do logo deve começar com https://.");
      }
    }

    const profile = {
      nome,
      telefone,
      endereco,
      business_hours: businessHours as unknown as Json,
      ...(data.logo_url !== undefined ? { logo_url: logoUrl } : {}),
      public_listing: data.public_listing,
    };

    if (isDemoServerMode()) {
      return demoUpdateBusinessProfile({ ...profile, business_hours: businessHours });
    }

    const { tenantId } = await requireManager(context.supabase, context.userId);
    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .update(profile)
      .eq("id", tenantId)
      .select("*")
      .single();
    if (error) throw new Error("Não foi possível atualizar o perfil do lava-jato.");
    return tenant;
  });

export const getDemoOwnerLoginHint = createServerFn({ method: "GET" }).handler(() => {
  if (!isDemoServerMode()) return null;
  return { businessName: demoSession().tenant.nome };
});

export const verifyOwnerBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { businessName: string }) => data)
  .handler(async ({ data, context }) => {
    const denyAccess = () => {
      throw new Error("Nome do lava-jato, e-mail ou senha incorretos.");
    };

    if (isDemoServerMode()) {
      const tenant = demoSession().tenant;
      if (!matchesBusinessIdentity(data.businessName, tenant)) denyAccess();
      return { ok: true, needsOnboarding: false };
    }

    const membership = await getMembership(context.supabase, context.userId);
    if (!membership) return { ok: true, needsOnboarding: true };

    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .select("nome, slug")
      .eq("id", membership!.tenantId)
      .maybeSingle();

    if (error || !tenant || !matchesBusinessIdentity(data.businessName, tenant)) denyAccess();
    return { ok: true, needsOnboarding: false };
  });

export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: { nome: string; telefone?: string; endereco?: string; logo_url?: string }) => data,
  )
  .handler(async ({ data, context }) => {
    if (isDemoServerMode()) {
      const tenant = demoCreateBusiness(data);
      return { tenantId: tenant.id };
    }
    const sb = context.supabase;
    const existing = await getMembership(sb, context.userId);
    if (existing) throw new Error("Você já possui um lava-jato vinculado.");
    const nome = (data.nome ?? "").trim();
    if (nome.length < 2) throw new Error("Informe o nome do lava-jato.");

    // The tenant SELECT policy only matches after the membership exists, so the
    // id is generated here instead of read back from the insert.
    const tenantId = crypto.randomUUID();

    const { error } = await sb.rpc("create_tenant_atomic", {
      p_tenant_id: tenantId,
      p_nome: nome,
      p_telefone: data.telefone?.trim() || null,
      p_endereco: data.endereco?.trim() || null,
      p_logo_url: data.logo_url?.trim() || null,
    });
    if (error) throw new Error(error.message);

    return { tenantId };
  });

export const listServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (isDemoServerMode()) return demoServices;
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
  .validator(
    (data: {
      nome: string;
      preco: number;
      duracao_min?: number | undefined;
      descricao?: string | undefined;
      categoria: "LAVAGEM" | "ADICIONAL";
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const nome = data.nome.trim();
    const preco = Number(data.preco);
    const duracao = data.duracao_min == null ? null : Number(data.duracao_min);
    const descricao = data.descricao?.trim() || null;
    if (nome.length < 2 || nome.length > 80) {
      throw new Error("Informe um nome entre 2 e 80 caracteres.");
    }
    if (!Number.isFinite(preco) || preco < 0 || preco > 100_000) {
      throw new Error("Informe um preço válido.");
    }
    if (duracao !== null && (!Number.isInteger(duracao) || duracao < 1 || duracao > 1440)) {
      throw new Error("A duração deve ficar entre 1 e 1440 minutos.");
    }
    if (descricao && descricao.length > 240) {
      throw new Error("A descrição deve ter no máximo 240 caracteres.");
    }
    if (isDemoServerMode()) {
      return demoCreateService({
        nome,
        preco,
        duracao_min: duracao,
        descricao,
        categoria: data.categoria,
      });
    }
    const { tenantId } = await requireManager(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("services")
      .insert({
        tenant_id: tenantId,
        nome,
        preco,
        duracao_min: duracao,
        descricao,
        categoria: data.categoria,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      id: string;
      nome?: string;
      preco?: number;
      duracao_min?: number | null;
      descricao?: string | null;
      categoria?: "LAVAGEM" | "ADICIONAL";
      ativo?: boolean;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    if (data.nome !== undefined && (data.nome.trim().length < 2 || data.nome.trim().length > 80)) {
      throw new Error("Informe um nome entre 2 e 80 caracteres.");
    }
    if (
      data.preco !== undefined &&
      (!Number.isFinite(data.preco) || data.preco < 0 || data.preco > 100_000)
    ) {
      throw new Error("Informe um preço válido.");
    }
    if (
      data.duracao_min !== undefined &&
      data.duracao_min !== null &&
      (!Number.isInteger(data.duracao_min) || data.duracao_min < 1 || data.duracao_min > 1440)
    ) {
      throw new Error("A duração deve ficar entre 1 e 1440 minutos.");
    }
    if (data.descricao && data.descricao.trim().length > 240) {
      throw new Error("A descrição deve ter no máximo 240 caracteres.");
    }
    if (isDemoServerMode()) return demoUpdateService(data);
    const { tenantId } = await requireManager(context.supabase, context.userId);
    const patch: Database["public"]["Tables"]["services"]["Update"] = {};
    if (data.nome !== undefined) patch.nome = data.nome.trim();
    if (data.preco !== undefined) patch.preco = Math.max(0, Number(data.preco) || 0);
    if (data.duracao_min !== undefined) patch.duracao_min = data.duracao_min;
    if (data.descricao !== undefined) patch.descricao = data.descricao?.trim() || null;
    if (data.categoria !== undefined) patch.categoria = data.categoria;
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
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    if (isDemoServerMode()) return demoDeactivateService(data.id);
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
  .validator((data: { image: string }) => data)
  .handler(async ({ data, context }) => {
    if (isDemoServerMode()) {
      assertDemoFeature("placa_foto");
      // Sem leitura real no modo demonstração: a placa é sempre a mesma.
      return { plate: "ABC1D23", confidence: 0.98, simulated: true };
    }
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    await requireFeature(context.supabase, tenantId, "placa_foto");
    if (!data.image?.startsWith("data:image/")) throw new Error("Imagem inválida.");
    // ~6 MB de imagem em base64; evita enviar arquivos enormes (e caros) à API de visão.
    if (data.image.length > 8_000_000) throw new Error("Imagem muito grande. Tire outra foto.");
    return recognizePlateFromImage(data.image);
  });

export const findVehicleByPlate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { placa: string }) => data)
  .handler(async ({ data, context }) => {
    if (isDemoServerMode()) return demoVehicleSummary(data.placa);
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    return vehicleSummary(context.supabase, tenantId, data.placa);
  });

export const plateHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { placa: string }) => data)
  .handler(async ({ data, context }) => {
    if (isDemoServerMode()) return demoVehicleSummary(data.placa);
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    return vehicleSummary(context.supabase, tenantId, data.placa);
  });

export const listVehicles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (isDemoServerMode()) return demoListVehicles();
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    const { data: vehicles, error: vehicleError } = await context.supabase
      .from("vehicles")
      .select("id, placa, marca, modelo, cor, created_at, customers(id, nome, telefone)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (vehicleError) throw new Error(vehicleError.message);

    const vehicleIds = (vehicles ?? []).map((vehicle) => vehicle.id);
    if (!vehicleIds.length) return [];

    const { data: orders, error: orderError } = await context.supabase
      .from("service_orders")
      .select("id, vehicle_id, numero, status, total, created_at, service_order_items(nome)")
      .eq("tenant_id", tenantId)
      .in("vehicle_id", vehicleIds)
      .order("created_at", { ascending: false });
    if (orderError) throw new Error(orderError.message);

    const ordersByVehicle = new Map<string, NonNullable<typeof orders>>();
    for (const order of orders ?? []) {
      if (!order.vehicle_id) continue;
      const current = ordersByVehicle.get(order.vehicle_id) ?? [];
      current.push(order);
      ordersByVehicle.set(order.vehicle_id, current);
    }

    return (vehicles ?? [])
      .map((vehicle) => {
        const vehicleOrders = ordersByVehicle.get(vehicle.id) ?? [];
        const lastOrder = vehicleOrders[0] ?? null;
        return {
          ...vehicle,
          totalAtendimentos: vehicleOrders.length,
          ultimoAtendimento: lastOrder
            ? {
                id: lastOrder.id,
                numero: lastOrder.numero,
                status: lastOrder.status,
                total: Number(lastOrder.total),
                created_at: lastOrder.created_at,
                service_order_items: lastOrder.service_order_items ?? [],
              }
            : null,
        };
      })
      .sort((a, b) => {
        const dateA = a.ultimoAtendimento?.created_at ?? a.created_at;
        const dateB = b.ultimoAtendimento?.created_at ?? b.created_at;
        return Date.parse(dateB) - Date.parse(dateA);
      });
  });

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { nome: string; telefone?: string }) => data)
  .handler(async ({ data, context }) => {
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        nome: data.nome.trim(),
        telefone: data.telefone?.trim() || null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      placa: string;
      customer_id?: string;
      marca?: string;
      modelo?: string;
      cor?: string;
    }) => data,
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
  .validator(
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
    if (isDemoServerMode()) return demoQuickRegister(data);
    const sb = context.supabase;
    const { tenantId } = await requireMembership(sb, context.userId);
    const placa = normalizePlate(data.placa);
    if (placa.length < 6) throw new Error("Placa inválida.");
    if (!data.cliente_nome?.trim()) throw new Error("Informe o nome do cliente.");
    const telefone = phoneDigits(data.cliente_telefone);
    if (telefone.length < 10 || telefone.length > 11) {
      throw new Error("Informe um telefone válido com DDD.");
    }

    const { data: result, error } = await sb.rpc("quick_register_atomic", {
      p_placa: placa,
      p_cliente_nome: data.cliente_nome.trim(),
      p_cliente_telefone: telefone,
      p_marca: data.marca?.trim() || null,
      p_modelo: data.modelo?.trim() || null,
      p_cor: data.cor?.trim() || null,
    });
    if (error) throw new Error(error.message);
    return result as unknown as {
      customerId: string;
      vehicle: Database["public"]["Tables"]["vehicles"]["Row"];
    };
  });

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { vehicle_id: string; service_ids: string[]; observacoes?: string }) => data)
  .handler(async ({ data, context }) => {
    if (isDemoServerMode()) return demoCreateOrder(data);
    const sb = context.supabase;
    const { tenantId } = await requireMembership(sb, context.userId);

    const ids = [...new Set(data.service_ids ?? [])];
    if (ids.length === 0) throw new Error("Selecione ao menos um serviço.");
    const { data: selectedServices, error: servicesError } = await sb
      .from("services")
      .select("id, nome, categoria")
      .eq("tenant_id", tenantId)
      .eq("ativo", true)
      .in("id", ids);
    if (servicesError) throw new Error(servicesError.message);
    if ((selectedServices ?? []).length !== ids.length) throw new Error("Serviços inválidos.");
    assertCompatibleServices(selectedServices ?? []);
    const { data: orderId, error } = await sb.rpc("create_order_atomic", {
      p_vehicle_id: data.vehicle_id,
      p_service_ids: ids,
      p_observacoes: data.observacoes?.trim() || null,
    });
    if (error) throw new Error(error.message);
    return { orderId };
  });

export const createNewCustomerOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      placa: string;
      cliente_nome: string;
      cliente_telefone: string;
      marca?: string;
      modelo?: string;
      cor?: string;
      service_ids: string[];
      observacoes?: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    if (isDemoServerMode()) return demoCreateIntake(data);
    const sb = context.supabase;
    const { tenantId } = await requireMembership(sb, context.userId);
    const placa = normalizePlate(data.placa);
    const telefone = phoneDigits(data.cliente_telefone);
    const ids = [...new Set(data.service_ids ?? [])];
    if (placa.length !== 7) throw new Error("Placa inválida.");
    if (data.cliente_nome.trim().length < 2) throw new Error("Informe o nome do cliente.");
    if (telefone.length < 10 || telefone.length > 11) {
      throw new Error("Informe um telefone válido com DDD.");
    }
    if (!ids.length) throw new Error("Selecione ao menos um serviço.");

    const { data: selectedServices, error: servicesError } = await sb
      .from("services")
      .select("id, nome, categoria")
      .eq("tenant_id", tenantId)
      .eq("ativo", true)
      .in("id", ids);
    if (servicesError) throw new Error(servicesError.message);
    if ((selectedServices ?? []).length !== ids.length) throw new Error("Serviços inválidos.");
    assertCompatibleServices(selectedServices ?? []);

    const { data: result, error } = await sb.rpc("create_intake_atomic", {
      p_placa: placa,
      p_cliente_nome: data.cliente_nome.trim(),
      p_cliente_telefone: telefone,
      p_marca: data.marca?.trim() || null,
      p_modelo: data.modelo?.trim() || null,
      p_cor: data.cor?.trim() || null,
      p_service_ids: ids,
      p_observacoes: data.observacoes?.trim() || null,
    });
    if (error) throw new Error(error.message);
    const payload = result as { orderId?: string } | null;
    if (!payload?.orderId) throw new Error("Não foi possível criar o atendimento.");
    return payload as { orderId: string; customerId: string; vehicleId: string };
  });

export const getOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    if (isDemoServerMode()) return demoGetOrder(data.id);
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    return loadOrder(context.supabase, tenantId, data.id);
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { order_id: string; status: OrderStatus }) => data)
  .handler(async ({ data, context }) => {
    if (isDemoServerMode()) return demoUpdateOrderStatus(data.order_id, data.status);
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
    assertOrderTransition(current.status, data.status, {
      canCancel: membership.role === "OWNER" || membership.role === "MANAGER",
    });

    const patch: Database["public"]["Tables"]["service_orders"]["Update"] = { status: data.status };
    if (data.status === "AGUARDANDO_PAGAMENTO") {
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
  .validator((data: { order_id: string; metodo: PaymentMethod }) => data)
  .handler(async ({ data, context }) => {
    if (isDemoServerMode()) return demoRegisterPayment(data.order_id, data.metodo);
    const sb = context.supabase;
    await requireMembership(sb, context.userId);
    const { data: total, error } = await sb.rpc("register_order_payment_atomic", {
      p_order_id: data.order_id,
      p_metodo: data.metodo,
    });
    if (error) throw new Error(error.message);
    return { ok: true, total: Number(total) };
  });

export const homeSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (isDemoServerMode()) return demoHomeSummary();
    const { tenantId } = await requireMembership(context.supabase, context.userId);
    const stats = await dashboardStats(context.supabase, tenantId);
    return {
      emAndamento: stats.emAndamento,
      veiculosDia: stats.veiculosDia,
      faturamentoDia: stats.faturamentoDia,
    };
  });

export const financialSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (isDemoServerMode()) {
      assertDemoFeature("financeiro");
      return demoFinancialSummary();
    }
    const { tenantId } = await requireManager(context.supabase, context.userId);
    await requireFeature(context.supabase, tenantId, "financeiro");
    return dashboardStats(context.supabase, tenantId);
  });

export const getPixSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (isDemoServerMode()) {
      assertDemoFeature("pix");
      return demoGetPixSettings();
    }
    const { tenantId } = await requireManager(context.supabase, context.userId);
    await requireFeature(context.supabase, tenantId, "pix");
    const { data, error } = await context.supabase
      .from("tenants")
      .select("pix_key, pix_receiver_name, pix_city")
      .eq("id", tenantId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const updatePixSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { pix_key: string; pix_receiver_name: string; pix_city: string }) => data)
  .handler(async ({ data, context }) => {
    const settings = {
      pix_key: data.pix_key?.trim() ?? "",
      pix_receiver_name: data.pix_receiver_name?.trim() ?? "",
      pix_city: data.pix_city?.trim() ?? "",
    };
    if (!settings.pix_key || settings.pix_key.length > 77) {
      throw new Error("Informe uma chave PIX válida.");
    }
    if (settings.pix_receiver_name.length < 2) {
      throw new Error("Informe o nome do recebedor.");
    }
    if (settings.pix_city.length < 2) {
      throw new Error("Informe a cidade do recebedor.");
    }

    // Validate the BR Code fields before persisting them.
    buildPixPayload({
      key: settings.pix_key,
      receiverName: settings.pix_receiver_name,
      city: settings.pix_city,
      amount: 0,
      transactionId: "VALIDACAO",
    });

    if (isDemoServerMode()) {
      assertDemoFeature("pix");
      return demoUpdatePixSettings(settings);
    }
    const { tenantId } = await requireManager(context.supabase, context.userId);
    await requireFeature(context.supabase, tenantId, "pix");
    const { data: saved, error } = await context.supabase
      .from("tenants")
      .update(settings)
      .eq("id", tenantId)
      .select("pix_key, pix_receiver_name, pix_city")
      .single();
    if (error) throw new Error(error.message);
    return saved;
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
    if (isDemoServerMode()) return demoActiveOrders();
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

async function checkPlatformAdmin(userId: string): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    return !error && Boolean(data);
  } catch {
    return false;
  }
}

async function requirePlatformAdmin(userId: string): Promise<void> {
  if (!(await checkPlatformAdmin(userId))) {
    throw new Error("Acesso restrito à administração do LavaPro.");
  }
}

export const adminListTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (isDemoServerMode()) {
      return demoAdminTenants().map((tenant) => ({
        ...tenant,
        subscription: resolveSubscription(tenant),
      }));
    }
    await requirePlatformAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: tenants, error }, { data: owners, error: ownersError }, usersResult] =
      await Promise.all([
        supabaseAdmin
          .from("tenants")
          .select("id, nome, slug, telefone, created_at, plan, trial_ends_at, plan_expires_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabaseAdmin.from("tenant_members").select("tenant_id, user_id").eq("role", "OWNER"),
        supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      ]);
    if (error || ownersError) throw new Error("Não foi possível listar as empresas.");
    const emailByUser = new Map(
      (usersResult.data?.users ?? []).map((user) => [user.id, user.email ?? null]),
    );
    const ownerByTenant = new Map(
      (owners ?? []).map((owner) => [owner.tenant_id, emailByUser.get(owner.user_id) ?? null]),
    );
    return (tenants ?? []).map((tenant) => ({
      ...tenant,
      owner_email: ownerByTenant.get(tenant.id) ?? null,
      subscription: resolveSubscription(tenant),
    }));
  });

export const adminUpdateSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { tenantId: string; change: AdminSubscriptionAction }) => data)
  .handler(async ({ data, context }) => {
    if (isDemoServerMode()) {
      return demoUpdateSubscription(
        applyAdminSubscriptionAction(demoSubscriptionFields(), data.change),
      );
    }
    await requirePlatformAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: current, error } = await supabaseAdmin
      .from("tenants")
      .select("plan, trial_ends_at, plan_expires_at")
      .eq("id", data.tenantId)
      .single();
    if (error || !current) throw new Error("Empresa não encontrada.");
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("tenants")
      .update(applyAdminSubscriptionAction(current, data.change))
      .eq("id", data.tenantId)
      .select("plan, trial_ends_at, plan_expires_at")
      .single();
    if (updateError) throw new Error("Não foi possível atualizar o plano.");
    return updated;
  });

const MAX_PAYMENT_RANGE_DAYS = 400;

/** Pagamentos de um intervalo, com OS, placa, cliente e serviços (financeiro). */
export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { from: string; to: string }) => data)
  .handler(async ({ data, context }) => {
    const from = new Date(data.from);
    const to = new Date(data.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      throw new Error("Período inválido.");
    }
    if ((to.getTime() - from.getTime()) / 86_400_000 > MAX_PAYMENT_RANGE_DAYS) {
      throw new Error(`Escolha um período de até ${MAX_PAYMENT_RANGE_DAYS} dias.`);
    }
    if (isDemoServerMode()) {
      assertDemoFeature("financeiro");
      return demoListPayments(from.toISOString(), to.toISOString());
    }
    const { tenantId } = await requireManager(context.supabase, context.userId);
    await requireFeature(context.supabase, tenantId, "financeiro");
    return listTenantPayments(context.supabase, tenantId, from.toISOString(), to.toISOString());
  });

/**
 * Envia (data URL) ou remove (null) o logo do lava-jato. A imagem é validada
 * no servidor e salva na pasta pública "logos", em uma subpasta da empresa.
 */
export const setTenantLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { image: string | null }) => data)
  .handler(async ({ data, context }) => {
    const logo = data.image === null ? null : parseLogoDataUrl(String(data.image));
    if (isDemoServerMode()) {
      if (logo) assertDemoFeature("logo");
      return demoSetLogo(logo ? String(data.image) : null);
    }

    const { tenantId } = await requireManager(context.supabase, context.userId);
    if (logo) await requireFeature(context.supabase, tenantId, "logo");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bucket = supabaseAdmin.storage.from("logos");
    let logoUrl: string | null = null;
    let keep: string | null = null;
    if (logo) {
      keep = `logo-${Date.now()}.${logoExtension(logo.contentType)}`;
      const { error } = await bucket.upload(`${tenantId}/${keep}`, logo.bytes, {
        contentType: logo.contentType,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw new Error("Não foi possível enviar o logo. Tente novamente.");
      logoUrl = bucket.getPublicUrl(`${tenantId}/${keep}`).data.publicUrl;
    }
    const { error: updateError } = await context.supabase
      .from("tenants")
      .update({ logo_url: logoUrl })
      .eq("id", tenantId);
    if (updateError) throw new Error("Não foi possível salvar o logo.");

    // Apaga os logos anteriores da empresa (o nome muda a cada envio para não ficar em cache).
    const { data: files } = await bucket.list(tenantId);
    const old = (files ?? [])
      .filter((file) => file.name !== keep)
      .map((file) => `${tenantId}/${file.name}`);
    if (old.length) await bucket.remove(old);
    return { logo_url: logoUrl };
  });
