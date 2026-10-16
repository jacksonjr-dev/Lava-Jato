import type { OrderStatus } from "./plate";

export const PERIODS = ["todos", "hoje", "7d", "30d", "personalizado"] as const;
export type Period = (typeof PERIODS)[number];

export const SITUATIONS = ["todos", "servico", "pronto", "pago", "entregue", "sem"] as const;
export type Situation = (typeof SITUATIONS)[number];

export const SORTS = ["recentes", "visitas", "cliente", "placa"] as const;
export type Sort = (typeof SORTS)[number];

export const PERIOD_LABEL: Record<Period, string> = {
  todos: "Todos",
  hoje: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  personalizado: "Período",
};

export const SITUATION_LABEL: Record<Situation, string> = {
  todos: "Todas",
  servico: "Em serviço",
  pronto: "Pronto para retirada",
  pago: "Pago",
  entregue: "Entregue",
  sem: "Sem atendimento",
};

export const SORT_LABEL: Record<Sort, string> = {
  recentes: "Mais recentes",
  visitas: "Mais visitas",
  cliente: "Cliente (A–Z)",
  placa: "Placa (A–Z)",
};

const SITUATION_STATUSES: Record<Exclude<Situation, "todos" | "sem">, OrderStatus[]> = {
  servico: ["AGUARDANDO", "EM_LAVAGEM", "EM_FINALIZACAO"],
  pronto: ["AGUARDANDO_PAGAMENTO", "FINALIZADO"],
  pago: ["PAGO"],
  entregue: ["ENTREGUE"],
};

export type VehicleFilters = {
  q: string;
  periodo: Period;
  situacao: Situation;
  ordem: Sort;
  /** yyyy-mm-dd, usados quando periodo = "personalizado". */
  de?: string | undefined;
  ate?: string | undefined;
};

export const DEFAULT_FILTERS: VehicleFilters = {
  q: "",
  periodo: "todos",
  situacao: "todos",
  ordem: "recentes",
};

export type FilterableVehicle = {
  placa: string;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  created_at: string;
  customers: { nome: string; telefone: string | null } | null;
  totalAtendimentos: number;
  ultimoAtendimento: { status: string; created_at: string } | null;
};

/** Minúsculas e sem acentos, para comparar textos. */
export function fold(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function lastVisit(vehicle: FilterableVehicle): string {
  return vehicle.ultimoAtendimento?.created_at ?? vehicle.created_at;
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function matchesText(vehicle: FilterableVehicle, query: string): boolean {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const text = fold(
    [
      vehicle.placa,
      vehicle.customers?.nome,
      vehicle.marca,
      vehicle.modelo,
      vehicle.cor,
      vehicle.customers?.telefone,
    ]
      .filter(Boolean)
      .join(" "),
  );
  const compactPlate = vehicle.placa.toLowerCase();
  const phoneDigits = (vehicle.customers?.telefone ?? "").replace(/\D/g, "");
  // Cada palavra digitada precisa aparecer em algum campo (placa aceita com ou sem hífen).
  return terms.every((term) => {
    const plateTerm = term.replace(/[^a-z0-9]/g, "");
    const digits = term.replace(/\D/g, "");
    return (
      text.includes(term) ||
      (plateTerm.length > 0 && compactPlate.includes(plateTerm)) ||
      (digits.length >= 4 && phoneDigits.includes(digits))
    );
  });
}

function matchesPeriod(vehicle: FilterableVehicle, filters: VehicleFilters, now: Date): boolean {
  if (filters.periodo === "todos") return true;
  const visit = new Date(lastVisit(vehicle)).getTime();
  const today = startOfLocalDay(now);
  if (filters.periodo === "hoje") return visit >= today;
  if (filters.periodo === "7d") return visit >= today - 6 * 86_400_000;
  if (filters.periodo === "30d") return visit >= today - 29 * 86_400_000;
  const from = filters.de ? new Date(`${filters.de}T00:00:00`).getTime() : -Infinity;
  const to = filters.ate ? new Date(`${filters.ate}T00:00:00`).getTime() + 86_400_000 : Infinity;
  return visit >= from && visit < to;
}

function matchesSituation(vehicle: FilterableVehicle, situation: Situation): boolean {
  if (situation === "todos") return true;
  const status = vehicle.ultimoAtendimento?.status as OrderStatus | undefined;
  if (situation === "sem") return !status;
  return Boolean(status && SITUATION_STATUSES[situation].includes(status));
}

export function filterVehicles<T extends FilterableVehicle>(
  vehicles: T[],
  filters: VehicleFilters,
  now = new Date(),
): T[] {
  const result = vehicles.filter(
    (vehicle) =>
      matchesText(vehicle, filters.q) &&
      matchesPeriod(vehicle, filters, now) &&
      matchesSituation(vehicle, filters.situacao),
  );
  const byName = (a: T, b: T) =>
    (a.customers?.nome ?? "").localeCompare(b.customers?.nome ?? "", "pt-BR");
  const sorters: Record<Sort, (a: T, b: T) => number> = {
    recentes: (a, b) => Date.parse(lastVisit(b)) - Date.parse(lastVisit(a)),
    visitas: (a, b) => b.totalAtendimentos - a.totalAtendimentos || byName(a, b),
    cliente: byName,
    placa: (a, b) => a.placa.localeCompare(b.placa),
  };
  return result.sort(sorters[filters.ordem]);
}

/** Quantos filtros diferem do padrão (para o selo "Filtros (n)"). */
export function activeFilterCount(filters: VehicleFilters): number {
  return (
    Number(filters.periodo !== "todos") +
    Number(filters.situacao !== "todos") +
    Number(filters.ordem !== "recentes")
  );
}

function pick<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Lê os filtros da URL, ignorando valores inválidos. */
export function parseVehicleFilters(search: Record<string, unknown>): VehicleFilters {
  const de =
    typeof search["de"] === "string" && DATE_PATTERN.test(search["de"]) ? search["de"] : undefined;
  const ate =
    typeof search["ate"] === "string" && DATE_PATTERN.test(search["ate"])
      ? search["ate"]
      : undefined;
  return {
    q: typeof search["q"] === "string" ? search["q"].slice(0, 60) : "",
    periodo: pick(search["periodo"], PERIODS, "todos"),
    situacao: pick(search["situacao"], SITUATIONS, "todos"),
    ordem: pick(search["ordem"], SORTS, "recentes"),
    ...(de ? { de } : {}),
    ...(ate ? { ate } : {}),
  };
}
