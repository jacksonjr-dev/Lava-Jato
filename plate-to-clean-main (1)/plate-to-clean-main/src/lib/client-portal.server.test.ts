import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertPortalRateLimit,
  clearPortalFailures,
  issueClientPortalToken,
  portalAttemptKey,
  recordPortalFailure,
  verifyClientPortalToken,
} from "./client-portal.server";

describe("segurança do portal do cliente", () => {
  beforeEach(() => {
    process.env["CLIENT_PORTAL_SECRET"] = "segredo-de-teste-com-mais-de-trinta-e-dois-caracteres";
    vi.useRealTimers();
  });

  afterEach(() => {
    delete process.env["DEMO_MODE"];
    delete process.env["VITE_DEMO_MODE"];
  });

  it("emite e valida uma sessão assinada", () => {
    const token = issueClientPortalToken("vehicle-1", "tenant-1");
    expect(verifyClientPortalToken(token)).toMatchObject({
      vehicleId: "vehicle-1",
      tenantId: "tenant-1",
    });
  });

  it("rejeita sessão adulterada", () => {
    const token = issueClientPortalToken("vehicle-1", "tenant-1");
    expect(() => verifyClientPortalToken(`${token}x`)).toThrow("Acesso do cliente expirado");
  });

  it("usa um segredo isolado para a sessão fictícia quando o modo demo está ativo", () => {
    delete process.env["CLIENT_PORTAL_SECRET"];
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    process.env["DEMO_MODE"] = "true";

    const token = issueClientPortalToken("vehicle-demo-1", "tenant-demo");
    expect(verifyClientPortalToken(token)).toMatchObject({
      vehicleId: "vehicle-demo-1",
      tenantId: "tenant-demo",
    });
  });

  it("bloqueia após cinco tentativas e libera após a janela", () => {
    const key = portalAttemptKey("tenant-1", "ABC1D23", "85999991234");
    clearPortalFailures(key);
    for (let attempt = 0; attempt < 5; attempt += 1) recordPortalFailure(key, 1_000);
    expect(() => assertPortalRateLimit(key, 2_000)).toThrow("Muitas tentativas");
    expect(() => assertPortalRateLimit(key, 1_000 + 15 * 60 * 1000 + 1)).not.toThrow();
  });

  it("isola as tentativas por lava-jato", () => {
    expect(portalAttemptKey("tenant-1", "ABC1D23", "85999991234")).not.toBe(
      portalAttemptKey("tenant-2", "ABC1D23", "85999991234"),
    );
  });
});
