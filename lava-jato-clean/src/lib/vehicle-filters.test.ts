import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  activeFilterCount,
  filterVehicles,
  parseVehicleFilters,
  type FilterableVehicle,
} from "./vehicle-filters";

const NOW = new Date(2026, 9, 16, 15, 0, 0);
const daysAgo = (days: number) => new Date(2026, 9, 16 - days, 10, 0, 0).toISOString();

const vehicle = (
  placa: string,
  nome: string,
  overrides: Partial<FilterableVehicle> = {},
): FilterableVehicle => ({
  placa,
  marca: "Toyota",
  modelo: "Corolla",
  cor: "Prata",
  created_at: daysAgo(60),
  customers: { nome, telefone: "85999991234" },
  totalAtendimentos: 1,
  ultimoAtendimento: { status: "ENTREGUE", created_at: daysAgo(1) },
  ...overrides,
});

const fleet = [
  vehicle("ABC1D23", "Marina Souza", {
    totalAtendimentos: 3,
    ultimoAtendimento: { status: "EM_LAVAGEM", created_at: daysAgo(0) },
  }),
  vehicle("BRA2E19", "Carlos Lima", {
    marca: "Honda",
    modelo: "Civic",
    cor: "Preto",
    customers: { nome: "Carlos Lima", telefone: "(85) 98888-4321" },
    ultimoAtendimento: { status: "AGUARDANDO_PAGAMENTO", created_at: daysAgo(5) },
  }),
  vehicle("XYZ9Z99", "Ângela Ribeiro", {
    totalAtendimentos: 0,
    ultimoAtendimento: null,
    created_at: daysAgo(40),
  }),
];

const plates = (filters: Partial<typeof DEFAULT_FILTERS>) =>
  filterVehicles(fleet, { ...DEFAULT_FILTERS, ...filters }, NOW).map((v) => v.placa);

describe("filtros de veículos", () => {
  it("busca por nome do cliente, com espaço e sem acento", () => {
    expect(plates({ q: "marina souza" })).toEqual(["ABC1D23"]);
    expect(plates({ q: "angela" })).toEqual(["XYZ9Z99"]);
  });

  it("busca por placa com ou sem hífen e por parte dela", () => {
    expect(plates({ q: "bra-2e19" })).toEqual(["BRA2E19"]);
    expect(plates({ q: "1d2" })).toEqual(["ABC1D23"]);
  });

  it("busca por telefone, modelo e cor", () => {
    expect(plates({ q: "98888" })).toEqual(["BRA2E19"]);
    expect(plates({ q: "civic preto" })).toEqual(["BRA2E19"]);
  });

  it("filtra pela data da última visita", () => {
    expect(plates({ periodo: "hoje" })).toEqual(["ABC1D23"]);
    expect(plates({ periodo: "7d" })).toEqual(["ABC1D23", "BRA2E19"]);
    expect(plates({ periodo: "30d" })).toEqual(["ABC1D23", "BRA2E19"]);
    const tenDaysAgo = new Date(2026, 9, 6);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect(
      plates({ periodo: "personalizado", de: iso(tenDaysAgo), ate: iso(new Date(2026, 9, 12)) }),
    ).toEqual(["BRA2E19"]);
  });

  it("filtra pela situação do último atendimento", () => {
    expect(plates({ situacao: "servico" })).toEqual(["ABC1D23"]);
    expect(plates({ situacao: "pronto" })).toEqual(["BRA2E19"]);
    expect(plates({ situacao: "sem" })).toEqual(["XYZ9Z99"]);
    expect(plates({ situacao: "entregue" })).toEqual([]);
  });

  it("ordena por recentes, visitas, cliente e placa", () => {
    expect(plates({})).toEqual(["ABC1D23", "BRA2E19", "XYZ9Z99"]);
    expect(plates({ ordem: "visitas" })[0]).toBe("ABC1D23");
    expect(plates({ ordem: "cliente" })).toEqual(["XYZ9Z99", "BRA2E19", "ABC1D23"]);
    expect(plates({ ordem: "placa" })).toEqual(["ABC1D23", "BRA2E19", "XYZ9Z99"]);
  });

  it("combina filtros", () => {
    expect(plates({ q: "toyota", situacao: "servico", periodo: "hoje" })).toEqual(["ABC1D23"]);
  });

  it("lê a URL ignorando valores inválidos e conta filtros ativos", () => {
    const filters = parseVehicleFilters({ q: "abc", periodo: "7d", situacao: "xyz", de: "ontem" });
    expect(filters).toEqual({ q: "abc", periodo: "7d", situacao: "todos", ordem: "recentes" });
    expect(activeFilterCount(filters)).toBe(1);
  });
});
