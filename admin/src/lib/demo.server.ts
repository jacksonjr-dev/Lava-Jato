// Dados fictícios do painel (modo demonstração), salvos em .data/ para que as
// ações de plano continuem valendo depois de reiniciar o servidor.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  planChange,
  withSubscription,
  type CompanyDetail,
  type CompanyRow,
  type PanelAction,
  type SubscriptionEvent,
} from "./companies";

type DemoState = {
  companies: Array<CompanyRow & { members: number; ordersTotal: number }>;
  events: Array<SubscriptionEvent & { tenant_id: string }>;
};

const FILE = resolve(process.cwd(), ".data", "admin-demo.json");
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

function seed(): DemoState {
  const base: Array<[string, string, string, Partial<CompanyRow>, number]> = [
    [
      "LavaPro Demonstração",
      "demo@lavapro.local",
      "(85) 3333-2026",
      { plan: "MAX", plan_expires_at: day(24) },
      62,
    ],
    ["Lava Jato Água Viva", "ana.rocha@email.com", "(85) 98111-2233", { trial_ends_at: day(2) }, 9],
    [
      "Brilho Total Estética Automotiva",
      "contato@brilhototal.com",
      "(85) 98222-3344",
      { plan: "BASICO", plan_expires_at: day(17) },
      41,
    ],
    [
      "Auto Spa Aldeota",
      "ricardo@autospa.com",
      "(85) 98333-4455",
      { plan: "MAX", plan_expires_at: day(4) },
      88,
    ],
    [
      "Lava Rápido do Zé",
      "ze.lavarapido@email.com",
      "(85) 98444-5566",
      { plan: "BASICO", plan_expires_at: day(-1) },
      23,
    ],
    ["Espuma & Cia", "espuma.cia@email.com", "(85) 98555-6677", {}, 30],
    ["Car Wash Praia", "carwashpraia@email.com", "(85) 98666-7788", { trial_ends_at: day(6) }, 4],
    ["Lavagem Express Messejana", "express@lavagem.com", "(85) 98777-8899", {}, 12],
  ];
  const companies = base.map(([nome, email, telefone, sub, orders], index) => ({
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
    created_at: day(-(15 + index * 9)),
    ownerEmail: email,
    plan: "GRATIS",
    trial_ends_at: null,
    plan_expires_at: null,
    ordersThisMonth: orders,
    members: 1 + (index % 3),
    ordersTotal: orders * (2 + index),
    ...sub,
  }));
  return { companies, events: [] };
}

function load(): DemoState {
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as DemoState;
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
    admin_email: "admin@lavapro.local",
    created_at: new Date().toISOString(),
  });
  Object.assign(company, next);
  save(state);
  return demoGetCompany(id);
}
