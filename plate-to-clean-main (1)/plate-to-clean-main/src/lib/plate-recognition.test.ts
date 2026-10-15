import { afterEach, describe, expect, it, vi } from "vitest";
import { correctPlateCharacters, parsePlateResponse } from "./plate-recognition";

describe("leitura de placa", () => {
  it("aceita placas Mercosul e do padrão antigo", () => {
    expect(parsePlateResponse('{"plate":"ABC1D23","confidence":0.93}')).toEqual({
      plate: "ABC1D23",
      confidence: 0.93,
    });
    expect(parsePlateResponse('{"plate":"abc-1234","confidence":0.8}').plate).toBe("ABC1234");
  });

  it("corrige confusões entre letras e números pela posição", () => {
    // 0→O e 1→I nas letras; O→0 e B→8 nos números.
    expect(correctPlateCharacters("0B11D2B")).toBe("OBI1D28");
    expect(correctPlateCharacters("ABCO234")).toBe("ABC0234");
  });

  it("descarta respostas que não são placas brasileiras", () => {
    expect(parsePlateResponse('{"plate":"12345","confidence":0.9}')).toEqual({
      plate: "",
      confidence: 0,
    });
    expect(parsePlateResponse('{"plate":"","confidence":0}').plate).toBe("");
    expect(parsePlateResponse("não consegui ler").plate).toBe("");
    expect(parsePlateResponse("{plate: ABC1D23}").plate).toBe("");
  });

  it("limita a confiança entre 0 e 1", () => {
    expect(parsePlateResponse('{"plate":"ABC1D23","confidence":7}').confidence).toBe(1);
    expect(parsePlateResponse('{"plate":"ABC1D23","confidence":"x"}').confidence).toBe(0);
  });

  it("extrai o JSON mesmo com texto em volta", () => {
    expect(parsePlateResponse('Resposta: {"plate":"BRA2E19","confidence":0.7} ok').plate).toBe(
      "BRA2E19",
    );
  });
});

describe("chamada ao serviço de leitura", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env["OPENAI_API_KEY"];
  });

  const reply = (content: string, status = 200) =>
    vi.fn(
      async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status }),
    );

  it("envia a foto pedindo JSON, com tempo-limite, e devolve a placa validada", async () => {
    process.env["OPENAI_API_KEY"] = "sk-teste";
    const fetchMock = reply('{"plate":"BRA2E19","confidence":0.91}');
    vi.stubGlobal("fetch", fetchMock);
    const { recognizePlateFromImage } = await import("./lavajato.server");

    await expect(recognizePlateFromImage("data:image/jpeg;base64,AAAA")).resolves.toEqual({
      plate: "BRA2E19",
      confidence: 0.91,
      simulated: false,
    });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[1].content[1].image_url.url).toBe("data:image/jpeg;base64,AAAA");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("descarta texto que não é placa", async () => {
    process.env["OPENAI_API_KEY"] = "sk-teste";
    vi.stubGlobal("fetch", reply('{"plate":"OLA","confidence":0.9}'));
    const { recognizePlateFromImage } = await import("./lavajato.server");
    await expect(recognizePlateFromImage("data:image/jpeg;base64,AAAA")).resolves.toMatchObject({
      plate: "",
    });
  });

  it("avisa quando a leitura demora demais", async () => {
    process.env["OPENAI_API_KEY"] = "sk-teste";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("tempo esgotado", "TimeoutError");
      }),
    );
    const { recognizePlateFromImage } = await import("./lavajato.server");
    await expect(recognizePlateFromImage("data:image/jpeg;base64,AAAA")).rejects.toThrow(
      "demorou demais",
    );
  });

  it("pede para aguardar quando o serviço limita as chamadas", async () => {
    process.env["OPENAI_API_KEY"] = "sk-teste";
    vi.stubGlobal("fetch", reply("{}", 429));
    const { recognizePlateFromImage } = await import("./lavajato.server");
    await expect(recognizePlateFromImage("data:image/jpeg;base64,AAAA")).rejects.toThrow("Aguarde");
  });

  it("recusa quando a chave não está configurada", async () => {
    const { recognizePlateFromImage } = await import("./lavajato.server");
    await expect(recognizePlateFromImage("data:image/jpeg;base64,AAAA")).rejects.toThrow(
      "indisponível",
    );
  });
});
