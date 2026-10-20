import { describe, expect, it } from "vitest";
import { portalStatusMessage, sinceText, whenText } from "./portal-status";

const NOW = new Date(2026, 9, 20, 15, 0);
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute).toISOString();

describe("mensagem do acompanhamento", () => {
  it("fala a etapa na linguagem do cliente", () => {
    expect(portalStatusMessage("AGUARDANDO", false).titulo).toBe("Seu carro chegou");
    expect(portalStatusMessage("EM_LAVAGEM", false).titulo).toBe("Seu carro está sendo lavado");
    expect(portalStatusMessage("EM_FINALIZACAO", false).tom).toBe("andamento");
    expect(portalStatusMessage("PAGO", false).tom).toBe("pronto");
  });

  it("só oferece o PIX quando o lava-jato recebe por PIX", () => {
    expect(portalStatusMessage("AGUARDANDO_PAGAMENTO", true).detalhe).toContain("PIX");
    expect(portalStatusMessage("AGUARDANDO_PAGAMENTO", false).detalhe).not.toContain("PIX");
  });
});

describe("horários", () => {
  it("diz quando o carro chegou", () => {
    expect(whenText(at(20, 14, 32), NOW)).toBe("hoje às 14:32");
    expect(whenText(at(19, 9, 5), NOW)).toBe("ontem às 09:05");
    expect(whenText(at(18, 10, 0), NOW)).toBe("18/10 às 10:00");
    expect(whenText(null, NOW)).toBeNull();
  });

  it("diz há quanto tempo foi a última atualização", () => {
    expect(sinceText(new Date(NOW.getTime() - 20_000).toISOString(), NOW)).toBe("agora mesmo");
    expect(sinceText(at(20, 14, 55), NOW)).toBe("há 5 min");
    expect(sinceText(at(20, 12, 10), NOW)).toBe("há 2 h");
    expect(sinceText(at(19, 16, 0), NOW)).toBe("ontem às 16:00");
  });
});
