import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  completeDemoBusinessRegistration,
  endDemoSession,
  getDemoBusiness,
  hasDemoSession,
  isDemoOnboardingPending,
  startDemoBusinessSignup,
} from "./demo-auth";

describe("cadastro empresarial no ambiente de teste", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
    vi.stubEnv("VITE_DEMO_MODE", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Reflect.deleteProperty(globalThis, "localStorage");
  });

  it("leva a nova conta ao onboarding e preserva a empresa cadastrada", () => {
    startDemoBusinessSignup("Maria Responsável", "maria@empresa.com");

    expect(hasDemoSession()).toBe(true);
    expect(isDemoOnboardingPending()).toBe(true);

    completeDemoBusinessRegistration({
      slug: "lava-jato-brilho-azul",
      nome: "Lava-Jato Brilho Azul",
      telefone: "85999990000",
      endereco: "Fortaleza - CE",
      logo_url: null,
    });

    expect(isDemoOnboardingPending()).toBe(false);
    expect(getDemoBusiness()?.nome).toBe("Lava-Jato Brilho Azul");

    endDemoSession();
    expect(hasDemoSession()).toBe(false);
    expect(getDemoBusiness()).toBeNull();
  });
});
