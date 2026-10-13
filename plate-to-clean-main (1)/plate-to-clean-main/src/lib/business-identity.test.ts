import { describe, expect, it } from "vitest";
import { matchesBusinessIdentity, normalizeBusinessIdentity } from "./business-identity";

describe("identidade da empresa no login", () => {
  it("ignora caixa, acentos e espaços excedentes", () => {
    expect(normalizeBusinessIdentity("  Lava-Jato ÁGUA   Azul ")).toBe("lava-jato agua azul");
  });

  it("aceita o nome cadastrado ou o identificador da empresa", () => {
    const business = { nome: "Lava-Jato Água Azul", slug: "lava-jato-agua-azul" };

    expect(matchesBusinessIdentity("lava-jato agua azul", business)).toBe(true);
    expect(matchesBusinessIdentity("lava-jato-agua-azul", business)).toBe(true);
  });

  it("rejeita outra empresa e entradas vazias", () => {
    const business = { nome: "Lava-Jato Água Azul", slug: "lava-jato-agua-azul" };

    expect(matchesBusinessIdentity("Lava-Jato do Centro", business)).toBe(false);
    expect(matchesBusinessIdentity(" ", business)).toBe(false);
  });
});
