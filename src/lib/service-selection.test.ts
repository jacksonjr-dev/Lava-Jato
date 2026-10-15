import { describe, expect, it } from "vitest";
import {
  assertCompatibleServices,
  isWashService,
  toggleServiceSelection,
} from "./service-selection";

const services = [
  { id: "simple", nome: "Lavagem simples (apenas externa)", categoria: "LAVAGEM" },
  { id: "complete", nome: "Lavagem completa (externa e interna)", categoria: "LAVAGEM" },
  { id: "polish", nome: "Polimento", categoria: "ADICIONAL" },
];

describe("seleção de serviços", () => {
  it("reconhece os dois tipos de lavagem", () => {
    expect(isWashService(services[0]!)).toBe(true);
    expect(isWashService(services[1]!)).toBe(true);
    expect(isWashService(services[2]!)).toBe(false);
    expect(isWashService({ nome: "Limpeza ecológica", categoria: "LAVAGEM" })).toBe(true);
  });

  it("troca a lavagem simples pela completa e mantém o polimento", () => {
    const selected = toggleServiceSelection(["simple", "polish"], services[1]!, services);
    expect(selected).toEqual(["polish", "complete"]);
  });

  it("bloqueia duas lavagens na validação do servidor", () => {
    expect(() => assertCompatibleServices([services[0]!, services[1]!])).toThrow(
      "Escolha apenas uma lavagem",
    );
    expect(() => assertCompatibleServices([services[0]!, services[2]!])).not.toThrow();
  });
});
