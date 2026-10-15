import { describe, expect, it } from "vitest";
import {
  allowedManualTransitions,
  assertOrderTransition,
  canTransitionOrder,
  nextOrderStatus,
} from "./order-flow";

describe("fluxo obrigatório de atendimento", () => {
  it("segue a sequência operacional completa", () => {
    expect(nextOrderStatus("AGUARDANDO")).toBe("EM_LAVAGEM");
    expect(nextOrderStatus("EM_LAVAGEM")).toBe("AGUARDANDO_PAGAMENTO");
    expect(nextOrderStatus("EM_FINALIZACAO")).toBe("AGUARDANDO_PAGAMENTO");
    expect(nextOrderStatus("FINALIZADO")).toBe("AGUARDANDO_PAGAMENTO");
    expect(nextOrderStatus("AGUARDANDO_PAGAMENTO")).toBe("PAGO");
    expect(nextOrderStatus("PAGO")).toBe("ENTREGUE");
    expect(nextOrderStatus("ENTREGUE")).toBeNull();
  });

  it("bloqueia saltos e regressões de status", () => {
    expect(canTransitionOrder("EM_LAVAGEM", "ENTREGUE")).toBe(false);
    expect(canTransitionOrder("FINALIZADO", "EM_LAVAGEM")).toBe(false);
    expect(() => assertOrderTransition("AGUARDANDO", "FINALIZADO")).toThrow(
      "Transição de status inválida",
    );
  });

  it("marca como pago somente pelo fluxo de pagamento", () => {
    expect(canTransitionOrder("AGUARDANDO_PAGAMENTO", "PAGO")).toBe(false);
    expect(canTransitionOrder("AGUARDANDO_PAGAMENTO", "PAGO", { viaPayment: true })).toBe(true);
    expect(canTransitionOrder("EM_LAVAGEM", "PAGO", { viaPayment: true })).toBe(false);
  });

  it("permite cancelamento somente com autorização e antes do pagamento", () => {
    expect(canTransitionOrder("EM_LAVAGEM", "CANCELADO", { canCancel: true })).toBe(true);
    expect(canTransitionOrder("EM_LAVAGEM", "CANCELADO", { canCancel: false })).toBe(false);
    expect(canTransitionOrder("PAGO", "CANCELADO", { canCancel: true })).toBe(false);
  });

  it("não oferece PAGO como alteração manual", () => {
    expect(allowedManualTransitions("AGUARDANDO_PAGAMENTO")).toEqual(["CANCELADO"]);
    expect(allowedManualTransitions("PAGO")).toEqual(["ENTREGUE"]);
  });
});
