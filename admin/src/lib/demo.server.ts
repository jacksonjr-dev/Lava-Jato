// Dados fictícios do painel (modo demonstração), salvos em .data/ para que as
// ações de plano continuem valendo depois de reiniciar o servidor.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
import {
  planChange,
  withSubscription,
  type CompanyDetail,
  type CompanyRow,
  type PanelAction,
  type SubscriptionEvent,
} from "./companies";

type DemoState = {
  version: number;
  companies: Array<CompanyRow & { members: number; ordersTotal: number }>;
  events: Array<SubscriptionEvent & { tenant_id: string }>;
  payments: PaymentRecord[];
  notes: NoteRecord[];
};

/** Muda quando o formato dos dados fictícios muda; arquivos antigos são recriados. */
const VERSION = 2;
const ADMIN_EMAIL = "admin@lavapro.local";

const FILE = resolve(process.cwd(), ".data", "admin-demo.json");
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

function seed(): DemoState {
  // [nome, e-mail, telefone, assinatura, atendimentos no mês, dias desde o cadastro]
  const base: Array<[string, string, string, Partial<CompanyRow>, number, number]> = [
    [
      "LavaPro Demonstração",
      "demo@lavapro.local",
      "(85) 3333-2026",
      { plan: "MAX", plan_expires_at: day(24) },
      62,
      170,
    ],
    [
      "Lava Jato Água Viva",
      "ana.rocha@email.com",
      "(85) 98111-2233",
      { trial_ends_at: day(2) },
      9,
      5,
    ],
    [
      "Brilho Total Estética Automotiva",
      "contato@brilhototal.com",
      "(85) 98222-3344",
      { plan: "BASICO", plan_expires_at: day(17) },
      41,
      120,
    ],
    [
      "Auto Spa Aldeota",
      "ricardo@autospa.com",
      "(85) 98333-4455",
      { plan: "MAX", plan_expires_at: day(4) },
      88,
      150,
    ],
    [
      "Lava Rápido do Zé",
      "ze.lavarapido@email.com",
      "(85) 98444-5566",
      { plan: "BASICO", plan_expires_at: day(-1) },
      23,
      80,
    ],
    ["Espuma & Cia", "espuma.cia@email.com", "(85) 98555-6677", {}, 30, 60],
    [
      "Car Wash Praia",
      "carwashpraia@email.com",
      "(85) 98666-7788",
      { trial_ends_at: day(6) },
      4,
      1,
    ],
    ["Lavagem Express Messejana", "express@lavagem.com", "(85) 98777-8899", {}, 12, 40],
  ];
  const companies = base.map(([nome, email, telefone, sub, orders, age], index) => ({
    id: `demo-${index + 1}`,
    nome,
    slug: nome
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    telefone,
    logo_url: null,
    created_at: day(-age),
    ownerEmail: email,
    plan: "GRATIS",
    trial_ends_at: null,
    plan_expires_at: null,
    ordersThisMonth: orders,
    members: 1 + (index % 3),
    ordersTotal: orders * (2 + index),
    ...sub,
  }));
  return { version: VERSION, companies, events: [], payments: seedPayments(), notes: seedNotes() };
}

function seedPayments(): PaymentRecord[] {
  // [empresa, valor, meses, forma, dias atrás]
  const rows: Array<[string, number, number, string, number]> = [
    ...[6, 36, 66, 96, 126, 156].map(
      (ago) => ["demo-1", 89.9, 1, "PIX", ago] as [string, number, number, string, number],
    ),
    ["demo-3", 49.9, 1, "PIX", 103],
    ["demo-3", 134.7, 3, "TRANSFERENCIA", 73],
    ...[26, 56, 86, 116, 146].map(
      (ago) => ["demo-4", 89.9, 1, "CARTAO", ago] as [string, number, number, string, number],
    ),
    ["demo-5", 49.9, 1, "BOLETO", 61],
    ["demo-5", 49.9, 1, "BOLETO", 31],
  ];
  return rows.map(([tenant, amount, months, method, ago], index) => ({
    id: `pay-${index + 1}`,
    tenant_id: tenant,
    amount,
    method,
    paid_at: day(-ago),
    plan: tenant === "demo-1" || tenant === "demo-4" ? "MAX" : "BASICO",
    months,
    note: null,
    admin_email: ADMIN_EMAIL,
    created_at: day(-ago),
  }));
}

function seedNotes(): NoteRecord[] {
  return [
    {
      id: "note-1",
      tenant_id: "demo-5",
      body: "Pediu o boleto da renovação para segunda-feira. Cobrar no WhatsApp se não pagar.",
      admin_email: ADMIN_EMAIL,
      created_at: day(-1),
    },
    {
      id: "note-2",
      tenant_id: "demo-2",
      body: "Gostou do teste; quer saber se o Max tem desconto no plano de 6 meses.",
      admin_email: ADMIN_EMAIL,
      created_at: day(-2),
    },
  ];
}

function load(): DemoState {
  try {
    const state = JSON.parse(readFileSync(FILE, "utf8")) as DemoState;
    if (state.version === VERSION) return state;
    throw new Error("formato antigo");
  } catch {
    const state = seed();
    save(state);
    return state;
  }
}

function save(state: DemoState) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(state, null, 2), "utf8");
}

export function demoListCompanies(): CompanyRow[] {
  return load().companies.map(({ members: _m, ordersTotal: _o, ...row }) => row);
}

export function demoGetCompany(id: string): CompanyDetail {
  const state = load();
  const company = state.companies.find((item) => item.id === id);
  if (!company) throw new Error("Empresa não encontrada.");
  const { members, ordersTotal, ...row } = company;
  return {
    ...withSubscription(row),
    members,
    ordersTotal,
    events: state.events
      .filter((event) => event.tenant_id === id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 20),
    payments: state.payments
      .filter((payment) => payment.tenant_id === id)
      .sort((a, b) => b.paid_at.localeCompare(a.paid_at))
      .slice(0, 20),
    notes: state.notes
      .filter((note) => note.tenant_id === id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}

export function demoChangeSubscription(
  id: string,
  action: PanelAction,
  reason: string,
): CompanyDetail {
  const state = load();
  const company = state.companies.find((item) => item.id === id);
  if (!company) throw new Error("Empresa não encontrada.");
  const { next, reason: cleanReason } = planChange(company, action, reason);
  state.events.push({
    id: `event-${Date.now()}`,
    tenant_id: id,
    action: action.action,
    from_plan: company.plan,
    to_plan: next.plan,
    to_trial_ends_at: next.trial_ends_at,
    to_expires_at: next.plan_expires_at,
    reason: cleanReason,
    admin_email: ADMIN_EMAIL,
    created_at: new Date().toISOString(),
  });
  Object.assign(company, next);
  save(state);
  return demoGetCompany(id);
}

export function demoRecordPayment(id: string, input: PaymentInput): CompanyDetail {
  const payment = validatePayment(input);
  const state = load();
  if (!state.companies.some((item) => item.id === id)) throw new Error("Empresa não encontrada.");
  const now = new Date().toISOString();
  state.payments.push({
    id: `pay-${Date.now()}`,
    tenant_id: id,
    amount: payment.amount,
    method: payment.method,
    paid_at: payment.paidAt,
    plan: payment.activate?.plan ?? null,
    months: payment.activate?.months ?? null,
    note: payment.note,
    admin_email: ADMIN_EMAIL,
    created_at: now,
  });
  save(state);
  if (payment.activate) {
    return demoChangeSubscription(
      id,
      { action: "ATIVAR", ...payment.activate },
      paymentReason(payment.amount, payment.method, payment.note),
    );
  }
  return demoGetCompany(id);
}

export function demoAddNote(id: string, body: string): CompanyDetail {
  const state = load();
  if (!state.companies.some((item) => item.id === id)) throw new Error("Empresa não encontrada.");
  state.notes.push({
    id: `note-${Date.now()}`,
    tenant_id: id,
    body: validateNote(body),
    admin_email: ADMIN_EMAIL,
    created_at: new Date().toISOString(),
  });
  save(state);
  return demoGetCompany(id);
}

export function demoGetMetrics(): BusinessMetrics {
  const state = load();
  return businessMetrics(
    demoListCompanies().map((row) => withSubscription(row)),
    state.payments,
    new Set(state.events.filter((event) => event.action === "ATIVAR").map((e) => e.tenant_id)),
  );
}

export function demoGetFinanceData(): { payments: FinancePayment[]; companies: CompanyRow[] } {
  const state = load();
  const names = new Map(state.companies.map((company) => [company.id, company.nome]));
  return {
    companies: demoListCompanies(),
    payments: state.payments.map((payment) => ({
      ...payment,
      tenantName: names.get(payment.tenant_id) ?? "Empresa removida",
    })),
  };
}
