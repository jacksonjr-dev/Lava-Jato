import { describe, expect, it } from "vitest";
import {
  isReadyTransition,
  readyMessage,
  validatePushSubscription,
} from "./customer-notifications";

const keys = { p256dh: "B".repeat(87), auth: "a".repeat(22) };

describe("assinatura de notificação", () => {
  it("aceita os serviços de push dos navegadores", () => {
    for (const endpoint of [
      "https://fcm.googleapis.com/fcm/send/abc123",
      "https://updates.push.services.mozilla.com/wpush/v2/abc",
      "https://web.push.apple.com/QGx1",
      "https://wns2-par02p.notify.windows.com/w/?token=abc",
    ]) {
      expect(validatePushSubscription({ endpoint, keys }).endpoint).toBe(endpoint);
    }
  });

  it("recusa endereços que fariam o servidor chamar outro lugar", () => {
    for (const endpoint of [
      "http://fcm.googleapis.com/fcm/send/abc",
      "https://evil.example.com/push",
      "https://fcm.googleapis.com.evil.com/x",
      "https://169.254.169.254/latest/meta-data",
      "https://localhost/push",
      "https://user:pw@fcm.googleapis.com/x",
      "https://fcm.googleapis.com:8443/x",
    ]) {
      expect(() => validatePushSubscription({ endpoint, keys })).toThrow();
    }
  });

  it("recusa chaves ausentes ou fora do formato", () => {
    const endpoint = "https://fcm.googleapis.com/fcm/send/abc";
    expect(() => validatePushSubscription({ endpoint })).toThrow();
    expect(() =>
      validatePushSubscription({ endpoint, keys: { p256dh: "<script>", auth: keys.auth } }),
    ).toThrow();
    expect(() => validatePushSubscription(null)).toThrow();
  });
});

describe("mensagem de carro pronto", () => {
  it("diz a placa, o lava-jato e como pagar", () => {
    const message = readyMessage({
      plate: "ABC1D23",
      tenantName: "Lava Rápido do Zé",
      orderNumber: 101,
      hasPix: true,
    });
    expect(message.title).toBe("Seu carro está pronto!");
    expect(message.body).toBe(
      "ABC1D23 · Lava Rápido do Zé. Pague pelo PIX ou no lava-jato e retire.",
    );
    expect(message.tag).toBe("lavapro-pronto-101");
    expect(
      readyMessage({ plate: "X", tenantName: "Y", orderNumber: 1, hasPix: false }).body,
    ).toContain("Já pode retirar");
  });

  it("só avisa quando o carro fica pronto", () => {
    expect(isReadyTransition("AGUARDANDO_PAGAMENTO")).toBe(true);
    expect(isReadyTransition("EM_LAVAGEM")).toBe(false);
    expect(isReadyTransition("ENTREGUE")).toBe(false);
  });
});
