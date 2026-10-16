import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { normalizePlate } from "./plate";
import type { Database } from "@/integrations/supabase/types";
import { assertOrderTransition } from "./order-flow";
import { calculateFinancialStats, financialPeriod } from "./financial";
import { assertCompatibleServices } from "./service-selection";
import type { BusinessHours } from "./business-hours";
import type { PaymentRow } from "./finance-analytics";
import { FREE_MONTHLY_ORDER_LIMIT, TRIAL_DAYS, resolveSubscription, type PlanId } from "./plans";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

type DemoCustomer = {
  id: string;
  nome: string;
  telefone: string | null;
  email?: string | null;
};

type DemoVehicle = {
  id: string;
  tenant_id: string;
  customer_id: string;
  placa: string;
  placa_normalizada: string;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  ano: number | null;
  customers: DemoCustomer;
  created_at: string;
  updated_at: string;
};

type DemoOrderItem = { id: string; nome: string; preco: number; quantidade: number };
type DemoPayment = {
  id: string;
  metodo: PaymentMethod;
  valor: number;
  pago_em: string;
};

type DemoOrder = {
  id: string;
  tenant_id: string;
  numero: number;
  status: OrderStatus;
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  created_at: string;
  finished_at: string | null;
  observacoes: string | null;
  customers: DemoCustomer;
  vehicles: DemoVehicle;
  service_order_items: DemoOrderItem[];
  payments: DemoPayment[];
  order_photos: Array<{ id: string }>;
};

const tenantId = "demo-tenant";
export const demoPublicTenants = [
  {
    id: tenantId,
    slug: "lavapro-demonstracao",
    nome: "LavaPro Demonstração",
    endereco: "Fortaleza - CE",
    logo_url: null,
  },
  {
    id: "demo-tenant-norte",
    slug: "lava-jato-norte-demo",
    nome: "Lava-Jato Norte (demonstração)",
    endereco: "Fortaleza - CE",
    logo_url: null,
  },
] as const;
const now = () => new Date().toISOString();
type DemoBusinessSettings = {
  business_hours: BusinessHours | null;
  id: string;
  slug: string;
  nome: string;
  telefone: string | null;
  endereco: string | null;
  horario: string | null;
  logo_url: string | null;
  public_listing: boolean;
};
type DemoPixSettings = {
  pix_key: string;
  pix_receiver_name: string;
  pix_city: string;
};

const defaultPixSettings: DemoPixSettings = {
  pix_key: "contaali2p@gmail.com",
  pix_receiver_name: "Pedro Victor da Rocha",
  pix_city: "Fortaleza",
};
const defaultBusinessSettings: DemoBusinessSettings = {
  business_hours: null,
  id: tenantId,
  slug: "lavapro-demonstracao",
  nome: "LavaPro Demonstração",
  telefone: "(85) 3333-2026",
  endereco: "Fortaleza - CE",
  horario: "Segunda a sábado, 08h às 18h",
  logo_url: null,
  public_listing: true,
};
const demoPixSettingsPath = resolve(process.cwd(), ".data", "demo-pix-settings.json");
const demoBusinessSettingsPath = resolve(process.cwd(), ".data", "demo-business-settings.json");

function businessSlug(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "lava-jato-teste"
  );
}

function loadDemoBusinessSettings(): DemoBusinessSettings {
  try {
    const saved = JSON.parse(
      readFileSync(demoBusinessSettingsPath, "utf8"),
    ) as Partial<DemoBusinessSettings>;
    if (saved.nome?.trim()) {
      return {
        ...defaultBusinessSettings,
        ...saved,
        id: tenantId,
        slug: saved.slug || businessSlug(saved.nome),
      };
    }
  } catch {
    // O primeiro cadastro usa a empresa padrão até o onboarding ser concluído.
  }
  return defaultBusinessSettings;
}

function persistDemoBusinessSettings(settings: DemoBusinessSettings): void {
  mkdirSync(dirname(demoBusinessSettingsPath), { recursive: true });
  const temporaryPath = `${demoBusinessSettingsPath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(settings, null, 2), "utf8");
  renameSync(temporaryPath, demoBusinessSettingsPath);
}

function loadDemoPixSettings(): DemoPixSettings {
  try {
    const saved = JSON.parse(readFileSync(demoPixSettingsPath, "utf8")) as Partial<DemoPixSettings>;
    if (saved.pix_key && saved.pix_receiver_name && saved.pix_city) {
      return {
        pix_key: saved.pix_key,
        pix_receiver_name: saved.pix_receiver_name,
        pix_city: saved.pix_city,
      };
    }
  } catch {
    // O primeiro acesso usa a configuração padrão; o arquivo nasce no primeiro salvamento.
  }
  return defaultPixSettings;
}

function persistDemoPixSettings(settings: DemoPixSettings): void {
  mkdirSync(dirname(demoPixSettingsPath), { recursive: true });
  const temporaryPath = `${demoPixSettingsPath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(settings, null, 2), "utf8");
  renameSync(temporaryPath, demoPixSettingsPath);
}

let pixSettings = loadDemoPixSettings();
let businessSettings = loadDemoBusinessSettings();

type DemoSubscription = {
  plan: PlanId;
  trial_ends_at: string | null;
  plan_expires_at: string | null;
};
const demoSubscriptionPath = resolve(process.cwd(), ".data", "demo-subscription.json");

function loadDemoSubscription(): DemoSubscription {
  try {
    const saved = JSON.parse(readFileSync(demoSubscriptionPath, "utf8")) as DemoSubscription;
    if (saved.plan) return saved;
  } catch {
    // Sem arquivo: a empresa de demonstração começa no período de teste.
  }
  return {
    plan: "GRATIS",
    trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString(),
    plan_expires_at: null,
  };
}

let demoSubscription = loadDemoSubscription();

export function demoSubscriptionFields(): DemoSubscription {
  return { ...demoSubscription };
}

export function demoUpdateSubscription(fields: DemoSubscription): DemoSubscription {
  demoSubscription = { ...fields };
  mkdirSync(dirname(demoSubscriptionPath), { recursive: true });
  writeFileSync(demoSubscriptionPath, JSON.stringify(demoSubscription, null, 2), "utf8");
  return demoSubscriptionFields();
}
const daysAgo = (days: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export function isDemoServerMode(): boolean {
  return (
    process.env["DEMO_MODE"] === "true" ||
    process.env["VITE_DEMO_MODE"] === "true" ||
    import.meta.env["VITE_DEMO_MODE"] === "true"
  );
}

export let demoServices: DemoService[] = [
  {
    id: "svc-1",
    tenant_id: tenantId,
    nome: "Lavagem simples (apenas externa)",
    categoria: "LAVAGEM",
    preco: 35,
    duracao_min: 30,
    descricao: "Lavagem apenas da parte externa e secagem",
    ativo: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "svc-2",
    tenant_id: tenantId,
    nome: "Lavagem completa (externa e interna)",
    categoria: "LAVAGEM",
    preco: 60,
    duracao_min: 60,
    descricao: "Lavagem externa e limpeza da parte interna",
    ativo: true,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "svc-4",
    tenant_id: tenantId,
    nome: "Polimento",
    categoria: "ADICIONAL",
    preco: 150,
    duracao_min: 180,
    descricao: "Polimento técnico da pintura",
    ativo: true,
    created_at: now(),
    updated_at: now(),
  },
];

type DemoService = Database["public"]["Tables"]["services"]["Row"];

export function demoCreateService(data: {
  nome: string;
  preco: number;
  duracao_min: number | null;
  descricao: string | null;
  categoria: "LAVAGEM" | "ADICIONAL";
}) {
  const service: DemoService = {
    id: `svc-${Date.now()}`,
    tenant_id: tenantId,
    nome: data.nome,
    preco: data.preco,
    duracao_min: data.duracao_min,
    descricao: data.descricao,
    categoria: data.categoria,
    ativo: true,
    created_at: now(),
    updated_at: now(),
  };
  demoServices = [...demoServices, service];
  return service;
}

export function demoUpdateService(
  data: { id: string } & {
    [K in "nome" | "preco" | "duracao_min" | "descricao" | "categoria" | "ativo"]?:
      DemoService[K] | undefined;
  },
) {
  const current = demoServices.find((service) => service.id === data.id);
  if (!current) throw new Error("Serviço não encontrado.");
  const patch = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<DemoService>;
  const updated: DemoService = { ...current, ...patch, updated_at: now() };
  demoServices = demoServices.map((service) => (service.id === data.id ? updated : service));
  return updated;
}

export function demoDeactivateService(id: string) {
  demoUpdateService({ id, ativo: false });
  return { ok: true };
}

const vehicles = new Map<string, DemoVehicle>([
  [
    "ABC1D23",
    {
      id: "vehicle-demo-1",
      tenant_id: tenantId,
      customer_id: "customer-demo-1",
      placa: "ABC1D23",
      placa_normalizada: "ABC1D23",
      marca: "Toyota",
      modelo: "Corolla",
      cor: "Prata",
      ano: 2023,
      customers: {
        id: "customer-demo-1",
        nome: "Marina Souza",
        telefone: "(85) 99999-1234",
        email: "marina@example.com",
      },
      created_at: now(),
      updated_at: now(),
    },
  ],
  [
    "BRA2E19",
    {
      id: "vehicle-demo-2",
      tenant_id: tenantId,
      customer_id: "customer-demo-2",
      placa: "BRA2E19",
      placa_normalizada: "BRA2E19",
      marca: "Honda",
      modelo: "Civic",
      cor: "Preto",
      ano: 2022,
      customers: {
        id: "customer-demo-2",
        nome: "Carlos Lima",
        telefone: "(85) 98888-4321",
      },
      created_at: now(),
      updated_at: now(),
    },
  ],
]);

const orders = new Map<string, DemoOrder>([
  [
    "order-demo-099",
    {
      id: "order-demo-099",
      tenant_id: tenantId,
      numero: 99,
      status: "ENTREGUE" as OrderStatus,
      subtotal: 155,
      desconto: 5,
      acrescimo: 0,
      total: 150,
      created_at: daysAgo(2, 10),
      finished_at: daysAgo(2, 13),
      observacoes: null,
      customers: { id: "customer-demo-1", nome: "Marina Souza", telefone: "(85) 99999-1234" },
      vehicles: {
        id: "vehicle-demo-1",
        tenant_id: tenantId,
        customer_id: "customer-demo-1",
        placa: "ABC1D23",
        placa_normalizada: "ABC1D23",
        marca: "Toyota",
        modelo: "Corolla",
        cor: "Prata",
        ano: 2023,
        customers: {
          id: "customer-demo-1",
          nome: "Marina Souza",
          telefone: "(85) 99999-1234",
        },
        created_at: "2026-01-10T10:00:00.000Z",
        updated_at: "2026-09-18T16:10:00.000Z",
      },
      service_order_items: [
        { id: "item-demo-099-1", nome: "Lavagem completa", preco: 60, quantidade: 1 },
        { id: "item-demo-099-2", nome: "Higienização de bancos", preco: 95, quantidade: 1 },
      ],
      payments: [
        {
          id: "payment-demo-099",
          metodo: "PIX" as PaymentMethod,
          valor: 150,
          pago_em: daysAgo(2, 13),
        },
      ],
      order_photos: [],
    },
  ],
  [
    "order-demo-087",
    {
      id: "order-demo-087",
      tenant_id: tenantId,
      numero: 87,
      status: "ENTREGUE" as OrderStatus,
      subtotal: 60,
      desconto: 0,
      acrescimo: 0,
      total: 60,
      created_at: daysAgo(10, 11),
      finished_at: daysAgo(10, 12),
      observacoes: null,
      customers: { id: "customer-demo-1", nome: "Marina Souza", telefone: "(85) 99999-1234" },
      vehicles: {
        id: "vehicle-demo-1",
        tenant_id: tenantId,
        customer_id: "customer-demo-1",
        placa: "ABC1D23",
        placa_normalizada: "ABC1D23",
        marca: "Toyota",
        modelo: "Corolla",
        cor: "Prata",
        ano: 2023,
        customers: {
          id: "customer-demo-1",
          nome: "Marina Souza",
          telefone: "(85) 99999-1234",
        },
        created_at: "2026-01-10T10:00:00.000Z",
        updated_at: "2026-08-02T15:20:00.000Z",
      },
      service_order_items: [
        { id: "item-demo-087-1", nome: "Lavagem completa", preco: 60, quantidade: 1 },
      ],
      payments: [
        {
          id: "payment-demo-087",
          metodo: "DEBITO" as PaymentMethod,
          valor: 60,
          pago_em: daysAgo(10, 12),
        },
      ],
      order_photos: [],
    },
  ],
  [
    "order-demo-101",
    {
      id: "order-demo-101",
      tenant_id: tenantId,
      numero: 101,
      status: "EM_LAVAGEM" as OrderStatus,
      subtotal: 60,
      desconto: 0,
      acrescimo: 0,
      total: 60,
      created_at: now(),
      finished_at: null,
      observacoes: null,
      customers: { id: "customer-demo-1", nome: "Marina Souza", telefone: "(85) 99999-1234" },
      vehicles: {
        id: "vehicle-demo-1",
        tenant_id: tenantId,
        customer_id: "customer-demo-1",
        placa: "ABC1D23",
        placa_normalizada: "ABC1D23",
        marca: "Toyota",
        modelo: "Corolla",
        cor: "Prata",
        ano: 2023,
        customers: {
          id: "customer-demo-1",
          nome: "Marina Souza",
          telefone: "(85) 99999-1234",
        },
        created_at: now(),
        updated_at: now(),
      },
      service_order_items: [
        { id: "item-demo-1", nome: "Lavagem completa", preco: 60, quantidade: 1 },
      ],
      payments: [],
      order_photos: [],
    },
  ],
  [
    "order-demo-102",
    {
      id: "order-demo-102",
      tenant_id: tenantId,
      numero: 102,
      status: "AGUARDANDO_PAGAMENTO" as OrderStatus,
      subtotal: 150,
      desconto: 0,
      acrescimo: 0,
      total: 150,
      created_at: now(),
      finished_at: null,
      observacoes: null,
      customers: { id: "customer-demo-2", nome: "Carlos Lima", telefone: "(85) 98888-4321" },
      vehicles: {
        id: "vehicle-demo-2",
        tenant_id: tenantId,
        customer_id: "customer-demo-2",
        placa: "BRA2E19",
        placa_normalizada: "BRA2E19",
        marca: "Honda",
        modelo: "Civic",
        cor: "Preto",
        ano: 2022,
        customers: {
          id: "customer-demo-2",
          nome: "Carlos Lima",
          telefone: "(85) 98888-4321",
        },
        created_at: now(),
        updated_at: now(),
      },
      service_order_items: [{ id: "item-demo-2", nome: "Polimento", preco: 150, quantidade: 1 }],
      payments: [],
      order_photos: [],
    },
  ],
]);

// Histórico fictício (~45 dias) para o financeiro e os filtros terem volume.
// Gerado de forma determinística: é igual a cada vez que o servidor sobe.
const HISTORY_CUSTOMERS: Array<[string, string, string, string, string, string]> = [
  ["Ana Beatriz Rocha", "(85) 98111-2233", "PNE4A12", "Fiat", "Argo", "Branco"],
  ["João Pedro Alves", "(85) 98222-3344", "HQK7C45", "Volkswagen", "T-Cross", "Cinza"],
  ["Fernanda Castro", "(85) 98333-4455", "OSD2B88", "Hyundai", "HB20", "Vermelho"],
  ["Ricardo Nogueira", "(85) 98444-5566", "RTA9F31", "Jeep", "Compass", "Preto"],
  ["Luciana Martins", "(85) 98555-6677", "QWE3G07", "Chevrolet", "Onix", "Prata"],
  ["Ângela Ribeiro", "(85) 98666-7788", "MNB5H66", "Renault", "Duster", "Branco"],
];

function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

(function seedDemoHistory() {
  const random = seededRandom(2026);
  const pick = <T>(options: Array<[T, number]>): T => {
    let roll = random() * options.reduce((sum, [, weight]) => sum + weight, 0);
    for (const [value, weight] of options) {
      roll -= weight;
      if (roll <= 0) return value;
    }
    return options[0]![0];
  };
  const historyVehicles: DemoVehicle[] = HISTORY_CUSTOMERS.map(
    ([nome, telefone, placa, marca, modelo, cor], index) => {
      const customer = { id: `customer-hist-${index}`, nome, telefone, email: null };
      const vehicle: DemoVehicle = {
        id: `vehicle-hist-${index}`,
        tenant_id: tenantId,
        customer_id: customer.id,
        placa,
        placa_normalizada: placa,
        marca,
        modelo,
        cor,
        ano: 2020 + (index % 5),
        customers: customer,
        created_at: daysAgo(60, 9),
        updated_at: daysAgo(60, 9),
      };
      vehicles.set(placa, vehicle);
      return vehicle;
    },
  );
  const allVehicles = [...historyVehicles, ...vehicles.values()].filter(
    (vehicle, index, list) => list.findIndex((v) => v.id === vehicle.id) === index,
  );

  let numero = 1;
  for (let day = 45; day >= 1 && numero < 87; day--) {
    const weekday = new Date(daysAgo(day, 12)).getDay();
    const count = Math.floor(random() * 3) + (weekday === 6 ? 2 : weekday === 0 ? 0 : 1);
    for (let i = 0; i < count && numero < 87; i++) {
      const vehicle = allVehicles[Math.floor(random() * allVehicles.length)]!;
      const items: DemoOrderItem[] = [];
      const wash = pick<[string, number]>([
        [["Lavagem simples (apenas externa)", 35], 55],
        [["Lavagem completa (externa e interna)", 60], 45],
      ]);
      items.push({ id: `hist-${numero}-1`, nome: wash[0], preco: wash[1], quantidade: 1 });
      if (random() < 0.35) {
        const extra = pick<[string, number]>([
          [["Polimento", 150], 30],
          [["Higienização de bancos", 95], 40],
          [["Enceramento", 80], 30],
        ]);
        items.push({ id: `hist-${numero}-2`, nome: extra[0], preco: extra[1], quantidade: 1 });
      }
      const total = items.reduce((sum, item) => sum + item.preco, 0);
      const hour = 8 + Math.floor(random() * 9);
      const id = `order-hist-${String(numero).padStart(3, "0")}`;
      orders.set(id, {
        id,
        tenant_id: tenantId,
        numero,
        status: "ENTREGUE" as OrderStatus,
        subtotal: total,
        desconto: 0,
        acrescimo: 0,
        total,
        created_at: daysAgo(day, hour),
        finished_at: daysAgo(day, hour + 1),
        observacoes: null,
        customers: vehicle.customers,
        vehicles: vehicle,
        service_order_items: items,
        payments: [
          {
            id: `payment-hist-${numero}`,
            metodo: pick<PaymentMethod>([
              ["PIX", 50],
              ["CREDITO", 20],
              ["DEBITO", 20],
              ["DINHEIRO", 10],
            ]),
            valor: total,
            pago_em: daysAgo(day, hour + 1),
          },
        ],
        order_photos: [],
      });
      numero++;
    }
  }
})();

/** Pagamentos do intervalo [from, to), no mesmo formato da consulta real. */
export function demoListPayments(from: string, to: string): PaymentRow[] {
  const start = Date.parse(from);
  const end = Date.parse(to);
  return [...orders.values()]
    .flatMap((order) =>
      order.payments.map((payment) => ({
        id: payment.id,
        valor: Number(payment.valor),
        metodo: payment.metodo,
        pago_em: payment.pago_em,
        orderId: order.id,
        numero: order.numero,
        placa: order.vehicles.placa,
        cliente: order.customers?.nome ?? null,
        itens: order.service_order_items.map((item) => ({
          nome: item.nome,
          preco: Number(item.preco),
          quantidade: item.quantidade,
        })),
      })),
    )
    .filter((payment) => {
      const time = Date.parse(payment.pago_em);
      return time >= start && time < end;
    })
    .sort((a, b) => Date.parse(b.pago_em) - Date.parse(a.pago_em));
}

export function demoSession() {
  return {
    membership: { tenantId, role: "OWNER" as const },
    tenant: {
      ...businessSettings,
      ...demoSubscription,
      public_listing: true,
      ...pixSettings,
      created_at: now(),
      updated_at: now(),
    },
  };
}

export function demoHomeSummary() {
  const stats = demoFinancialSummary();
  return {
    emAndamento: stats.emAndamento,
    veiculosDia: stats.veiculosDia,
    faturamentoDia: stats.faturamentoDia,
  };
}

export function demoFinancialSummary() {
  const current = new Date();
  const period = financialPeriod(current);
  const allOrders = [...orders.values()];
  const monthOrders = allOrders.filter(
    (order) =>
      Date.parse(order.created_at) >= period.startMonth.getTime() &&
      Date.parse(order.created_at) < period.nextMonth.getTime(),
  );
  const activeOrders = allOrders.filter((order) =>
    ["AGUARDANDO", "EM_LAVAGEM", "EM_FINALIZACAO", "FINALIZADO", "AGUARDANDO_PAGAMENTO"].includes(
      order.status,
    ),
  ).length;
  const payments = allOrders.flatMap((order) =>
    order.payments.map((payment) => ({ ...payment, order_id: order.id })),
  );
  const paidOrderIds = new Set(
    payments
      .filter(
        (payment) =>
          Date.parse(payment.pago_em) >= period.startMonth.getTime() &&
          Date.parse(payment.pago_em) < period.nextMonth.getTime(),
      )
      .map((payment) => payment.order_id),
  );
  const paidItems = allOrders
    .filter((order) => paidOrderIds.has(order.id))
    .flatMap((order) => order.service_order_items);

  return calculateFinancialStats({
    now: current,
    payments,
    monthOrders: monthOrders.map((order) => ({
      id: order.id,
      vehicle_id: order.vehicles.id,
      status: order.status,
      created_at: order.created_at,
    })),
    activeOrders,
    paidItems,
  });
}

export function demoActiveOrders() {
  return [...orders.values()]
    .filter((order) => !["ENTREGUE", "CANCELADO"].includes(order.status))
    .map((order) => ({
      id: order.id,
      numero: order.numero,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
      vehicles: { placa: order.vehicles.placa },
      customers: { nome: order.customers.nome },
    }));
}

export function demoListVehicles() {
  return [...vehicles.values()]
    .map((vehicle) => {
      const vehicleOrders = [...orders.values()]
        .filter((order) => order.vehicles.id === vehicle.id)
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      const lastOrder = vehicleOrders[0];
      return {
        id: vehicle.id,
        placa: vehicle.placa,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        cor: vehicle.cor,
        created_at: vehicle.created_at,
        customers: vehicle.customers,
        totalAtendimentos: vehicleOrders.length,
        ultimoAtendimento: lastOrder
          ? {
              id: lastOrder.id,
              numero: lastOrder.numero,
              status: lastOrder.status,
              total: lastOrder.total,
              created_at: lastOrder.created_at,
              service_order_items: lastOrder.service_order_items,
            }
          : null,
      };
    })
    .sort((a, b) => {
      const dateA = a.ultimoAtendimento?.created_at ?? a.created_at;
      const dateB = b.ultimoAtendimento?.created_at ?? b.created_at;
      return Date.parse(dateB) - Date.parse(dateA);
    });
}

export function demoVehicleSummary(plateInput: string) {
  const placa = normalizePlate(plateInput);
  const vehicle = vehicles.get(placa) ?? null;
  if (!vehicle) return { placa, vehicle: null, history: [], stats: null };
  const history = [...orders.values()]
    .filter((order) => order.vehicles.id === vehicle.id)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .map((order) => ({
      id: order.id,
      numero: order.numero,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
      service_order_items: order.service_order_items,
    }));
  return {
    placa,
    vehicle,
    history,
    stats: {
      total: history.length,
      last: history[0]?.created_at ?? null,
      totalGasto: history
        .filter((order) => ["PAGO", "ENTREGUE"].includes(order.status))
        .reduce((sum, order) => sum + Number(order.total), 0),
      topServices: [],
    },
  };
}

export function demoSearchPublicTenants(queryInput: string) {
  const query = queryInput.trim().toLocaleLowerCase("pt-BR");
  if (query.length < 2) return [];
  const publicTenants = [businessSettings, demoPublicTenants[1]];
  return publicTenants.filter(
    (tenant) =>
      tenant.nome.toLocaleLowerCase("pt-BR").includes(query) || tenant.slug.includes(query),
  );
}

export function demoClientPortal(tenantInput: string, plateInput: string, phoneInput: string) {
  if (tenantInput !== tenantId) throw new Error("Placa ou telefone não encontrados.");
  const placa = normalizePlate(plateInput);
  const phone = phoneInput.replace(/\D/g, "");
  const vehicle = vehicles.get(placa);
  const registeredPhone = vehicle?.customers.telefone?.replace(/\D/g, "") ?? "";
  if (!vehicle || phone !== registeredPhone) {
    throw new Error("Placa ou telefone não encontrados.");
  }

  const portal = demoPortalForVehicle(vehicle);
  if (portal.orders.length === 0) {
    throw new Error("O acesso será liberado após a criação do primeiro atendimento.");
  }
  return portal;
}

export function demoClientPortalByVehicleId(vehicleId: string, tenantInput = tenantId) {
  const vehicle = [...vehicles.values()].find(
    (item) => item.id === vehicleId && item.tenant_id === tenantInput,
  );
  if (!vehicle) throw new Error("Acesso do cliente expirado.");
  return demoPortalForVehicle(vehicle);
}

function demoPortalForVehicle(vehicle: DemoVehicle) {
  const history = [...orders.values()]
    .filter((order) => order.vehicles.id === vehicle.id)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .map((order) => ({
      id: order.id,
      numero: order.numero,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
      finished_at: order.finished_at,
      service_order_items: order.service_order_items,
      payments: order.payments,
    }));

  return {
    tenant: {
      ...businessSettings,
      ...pixSettings,
      ...demoSubscription,
    },
    customer: vehicle.customers,
    vehicle,
    orders: history,
    summary: {
      totalOrders: history.length,
      totalSpent: history
        .filter((order) => ["PAGO", "ENTREGUE"].includes(order.status))
        .reduce((sum, order) => sum + order.total, 0),
      lastVisit: history[0]?.created_at ?? null,
    },
  };
}

export function demoCreateBusiness(data: {
  nome: string;
  telefone?: string;
  endereco?: string;
  logo_url?: string;
}) {
  const nome = data.nome?.trim();
  if (!nome || nome.length < 2) throw new Error("Informe o nome do lava-jato.");
  businessSettings = {
    business_hours: null,
    id: tenantId,
    slug: businessSlug(nome),
    nome,
    telefone: data.telefone?.trim() || null,
    endereco: data.endereco?.trim() || null,
    horario: null,
    logo_url: data.logo_url?.trim() || null,
    public_listing: true,
  };
  persistDemoBusinessSettings(businessSettings);
  return businessSettings;
}

export function demoUpdateBusinessProfile(data: {
  business_hours: BusinessHours;
  nome: string;
  telefone: string | null;
  endereco: string | null;
  logo_url: string | null;
  public_listing: boolean;
}) {
  businessSettings = {
    ...businessSettings,
    ...data,
  };
  persistDemoBusinessSettings(businessSettings);
  return businessSettings;
}

export function demoGetPixSettings() {
  return pixSettings;
}

export function demoUpdatePixSettings(data: {
  pix_key: string;
  pix_receiver_name: string;
  pix_city: string;
}) {
  const nextSettings = {
    pix_key: data.pix_key.trim(),
    pix_receiver_name: data.pix_receiver_name.trim(),
    pix_city: data.pix_city.trim(),
  };
  persistDemoPixSettings(nextSettings);
  pixSettings = nextSettings;
  return pixSettings;
}

export function demoQuickRegister(data: {
  placa: string;
  cliente_nome: string;
  cliente_telefone?: string;
  marca?: string;
  modelo?: string;
  cor?: string;
}) {
  const placa = normalizePlate(data.placa);
  if (placa.length < 6) throw new Error("Placa inválida.");
  if (!data.cliente_nome?.trim()) throw new Error("Informe o nome do cliente.");
  const phone = data.cliente_telefone?.replace(/\D/g, "") ?? "";
  if (phone.length < 10 || phone.length > 11) {
    throw new Error("Informe um telefone válido com DDD.");
  }
  if (vehicles.has(placa)) throw new Error("Este veículo já está cadastrado.");
  const customerId = `customer-demo-${Date.now()}`;
  const vehicle = {
    id: `vehicle-demo-${Date.now()}`,
    tenant_id: tenantId,
    customer_id: customerId,
    placa,
    placa_normalizada: placa,
    marca: data.marca || null,
    modelo: data.modelo || null,
    cor: data.cor || null,
    ano: null,
    customers: {
      id: customerId,
      nome: data.cliente_nome.trim(),
      telefone: phone,
      email: null,
    },
    created_at: now(),
    updated_at: now(),
  };
  vehicles.set(placa, vehicle);
  return { customerId, vehicle };
}

export function demoCreateIntake(data: {
  placa: string;
  cliente_nome: string;
  cliente_telefone: string;
  marca?: string;
  modelo?: string;
  cor?: string;
  service_ids: string[];
  observacoes?: string;
}) {
  const ids = [...new Set(data.service_ids ?? [])];
  const services = demoServices.filter((service) => service.ativo && ids.includes(service.id));
  if (!ids.length || services.length !== ids.length) throw new Error("Serviços inválidos.");
  assertCompatibleServices(services);

  const registration = demoQuickRegister(data);
  try {
    const order = demoCreateOrder({
      vehicle_id: registration.vehicle.id,
      service_ids: ids,
    });
    return { ...order, customerId: registration.customerId, vehicleId: registration.vehicle.id };
  } catch (error) {
    vehicles.delete(registration.vehicle.placa_normalizada);
    throw error;
  }
}

export function demoOrdersThisMonth(): number {
  const monthStart = financialPeriod(new Date()).startMonth.getTime();
  // O histórico fictício não conta para o limite do plano Grátis no demo.
  return [...orders.values()].filter(
    (order) => !order.id.startsWith("order-hist-") && Date.parse(order.created_at) >= monthStart,
  ).length;
}

export function demoAdminTenants() {
  return [
    {
      id: tenantId,
      nome: businessSettings.nome,
      slug: businessSettings.slug,
      telefone: businessSettings.telefone,
      created_at: daysAgo(30, 9),
      owner_email: "demo@lavapro.local",
      ...demoSubscription,
    },
  ];
}

export function demoCreateOrder(data: { vehicle_id: string; service_ids: string[] }) {
  const limit = resolveSubscription(demoSubscription).monthlyOrderLimit;
  if (limit !== null && demoOrdersThisMonth() >= limit) {
    throw new Error(
      `O plano Grátis permite ${FREE_MONTHLY_ORDER_LIMIT} atendimentos por mês. Assine um plano para continuar.`,
    );
  }
  const vehicle = [...vehicles.values()].find((item) => item.id === data.vehicle_id);
  if (!vehicle) throw new Error("Veículo não encontrado.");
  const ids = [...new Set(data.service_ids ?? [])];
  if (!ids.length) throw new Error("Selecione ao menos um serviço.");
  const selected = demoServices.filter((service) => ids.includes(service.id) && service.ativo);
  if (selected.length !== ids.length) throw new Error("Serviços inválidos.");
  assertCompatibleServices(selected);
  const id = `order-demo-${Date.now()}`;
  const total = selected.reduce((sum, service) => sum + service.preco, 0);
  orders.set(id, {
    id,
    tenant_id: tenantId,
    numero: 100 + orders.size + 1,
    status: "AGUARDANDO" as OrderStatus,
    subtotal: total,
    desconto: 0,
    acrescimo: 0,
    total,
    created_at: now(),
    finished_at: null,
    observacoes: null,
    customers: vehicle.customers,
    vehicles: vehicle,
    service_order_items: selected.map((service, index) => ({
      id: `${id}-item-${index}`,
      nome: service.nome,
      preco: service.preco,
      quantidade: 1,
    })),
    payments: [],
    order_photos: [],
  });
  return { orderId: id };
}

export function demoGetOrder(id: string) {
  const order = orders.get(id);
  if (!order) throw new Error("Atendimento não encontrado.");
  return order;
}

export function demoUpdateOrderStatus(id: string, status: OrderStatus) {
  const order = demoGetOrder(id);
  assertOrderTransition(order.status, status, { canCancel: true });
  order.status = status;
  if (status === "AGUARDANDO_PAGAMENTO") order.finished_at = now();
  return { ok: true };
}

export function demoRegisterPayment(id: string, metodo: PaymentMethod) {
  const order = demoGetOrder(id);
  assertOrderTransition(order.status, "PAGO", { viaPayment: true });
  if (order.payments.length) {
    throw new Error("Esta ordem de serviço já possui pagamento registrado.");
  }
  order.status = "PAGO";
  order.payments = [
    { id: `payment-demo-${Date.now()}`, metodo, valor: order.total, pago_em: now() },
  ];
  return { ok: true, total: order.total };
}
