import { afterEach, describe, expect, it } from "vitest";
import {
  demoClientPortal,
  demoQuickRegister,
  demoSearchPublicTenants,
  isDemoServerMode,
} from "./demo-data.server";

const originalDemoMode = process.env["DEMO_MODE"];
const originalViteDemoMode = process.env["VITE_DEMO_MODE"];

afterEach(() => {
  if (originalDemoMode === undefined) delete process.env["DEMO_MODE"];
  else process.env["DEMO_MODE"] = originalDemoMode;

  if (originalViteDemoMode === undefined) delete process.env["VITE_DEMO_MODE"];
  else process.env["VITE_DEMO_MODE"] = originalViteDemoMode;
});

describe("modo de demonstração", () => {
  it("mantém o servidor sincronizado quando o frontend está em modo demo", () => {
    delete process.env["DEMO_MODE"];
    process.env["VITE_DEMO_MODE"] = "true";

    expect(isDemoServerMode()).toBe(true);
  });

  it("aceita as credenciais exibidas no acesso fictício do cliente", () => {
    const portal = demoClientPortal("demo-tenant", "ABC1D23", "85999991234");

    expect(portal.vehicle.placa).toBe("ABC1D23");
    expect(portal.customer.telefone?.replace(/\D/g, "")).toBe("85999991234");
  });

  it("exige o lava-jato correto antes de consultar a mesma placa", () => {
    expect(() => demoClientPortal("demo-tenant-norte", "ABC1D23", "85999991234")).toThrow(
      "Placa ou telefone não encontrados",
    );
  });

  it("não libera o portal antes de existir uma ordem de serviço", () => {
    demoQuickRegister({
      placa: "TST9A99",
      cliente_nome: "Cliente sem ordem",
      cliente_telefone: "85988887777",
    });

    expect(() => demoClientPortal("demo-tenant", "TST9A99", "85988887777")).toThrow(
      "primeiro atendimento",
    );
  });

  it("oferece uma busca pública de empresas sem expor dados operacionais", () => {
    const result = demoSearchPublicTenants("norte");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "demo-tenant-norte", nome: expect.any(String) });
    expect(result[0]).not.toHaveProperty("pix_key");
  });
});
