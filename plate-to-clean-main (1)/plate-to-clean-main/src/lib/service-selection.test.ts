import { describe, expect, it } from "vitest";
import {
  assertCompatibleServices,
  isWashService,
  toggleServiceSelection,
} from "./service-selection";

const services = [
  { id: "simple", nome: "Lavagem simples (apenas externa)" },
  { id: "complete", nome: "Lavagem completa (externa e interna)" },
  { id: "polish", nome: "Polimento" },
];

describe("seleção de serviços", () => {
  it("reconhece os dois tipos de lavagem", () => {
    expect(isWashService(services[0]!.nome)).toBe(true);
    expect(isWashService(services[1]!.nome)).toBe(true);
    expect(isWashService(services[2]!.nome)).toBe(false);
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
