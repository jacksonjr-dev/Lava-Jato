import { describe, expect, it } from "vitest";
import { buildPixPayload } from "./pix";

describe("BR Code PIX", () => {
  it("gera payload com valor, identificador e CRC", () => {
    const payload = buildPixPayload({
      key: "pagamentos@lavapro.com.br",
      receiverName: "Lava Pró",
      city: "Fortaleza",
      amount: 84.2,
      transactionId: "OS1001",
    });
    expect(payload).toContain("br.gov.bcb.pix");
    expect(payload).toContain("540584.20");
    expect(payload).toContain("OS1001");
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
  });
});
