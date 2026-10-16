import { describe, expect, it } from "vitest";
import { logoExtension, parseLogoDataUrl } from "./logo";

const dataUrl = (type: string, bytes: number[]) =>
  `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13];
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 16];
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50];

describe("validação do logo", () => {
  it("aceita PNG, JPEG e WebP verdadeiros", () => {
    expect(parseLogoDataUrl(dataUrl("image/png", PNG)).contentType).toBe("image/png");
    expect(parseLogoDataUrl(dataUrl("image/jpeg", JPEG)).bytes.length).toBe(JPEG.length);
    expect(parseLogoDataUrl(dataUrl("image/webp", WEBP)).contentType).toBe("image/webp");
    expect(logoExtension("image/jpeg")).toBe("jpg");
  });

  it("recusa arquivo disfarçado de imagem", () => {
    // Conteúdo de texto/HTML com tipo declarado de PNG.
    const fake = dataUrl("image/png", [...Buffer.from("<script>alert(1)</script>")]);
    expect(() => parseLogoDataUrl(fake)).toThrow("não é uma imagem válida");
  });

  it("recusa outros formatos e textos que não são data URL", () => {
    expect(() => parseLogoDataUrl(dataUrl("image/svg+xml", PNG))).toThrow("PNG, JPG ou WebP");
    expect(() => parseLogoDataUrl("https://exemplo.com/logo.png")).toThrow("PNG, JPG ou WebP");
  });

  it("recusa imagens acima de 1 MB", () => {
    const big = dataUrl("image/png", [...PNG, ...new Array(1024 * 1024 + 10).fill(0)]);
    expect(() => parseLogoDataUrl(big)).toThrow("no máximo 1 MB");
  });
});
