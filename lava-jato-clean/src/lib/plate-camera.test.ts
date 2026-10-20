import { describe, expect, it } from "vitest";
import { coverCropRect, photoProblemMessage } from "./plate-camera";

const VIEW = { width: 640, height: 360 }; // área 16:9 onde o vídeo aparece

describe("recorte da moldura", () => {
  it("vídeo deitado (16:9): recorta a faixa da moldura, sem sobras", () => {
    const rect = coverCropRect(VIEW, { width: 1280, height: 720 });
    expect(rect).toEqual({ x: 0, y: 193, w: 1280, h: 334 });
  });

  it("celular em pé (vídeo vertical): recorta só o que aparece na moldura", () => {
    // O vídeo vertical é ampliado e mostra só a faixa do meio; a moldura fica no
    // centro dessa faixa. Recortar 30%–70% da altura do vídeo pegaria muito
    // mais que a moldura (era o erro da leitura ao vivo).
    const rect = coverCropRect(VIEW, { width: 720, height: 1280 });
    expect(rect.x).toBe(0);
    expect(rect.w).toBe(720);
    expect(rect.y + rect.h / 2).toBeCloseTo(640, 0);
    expect(rect.h).toBeGreaterThan(180);
    expect(rect.h).toBeLessThan(200);
  });

  it("nunca sai dos limites do vídeo", () => {
    const rect = coverCropRect(
      { width: 400, height: 400 },
      { width: 1920, height: 1080 },
      { left: 0, top: 0, width: 1, height: 1 },
    );
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.w).toBeLessThanOrEqual(1920);
    expect(rect.y + rect.h).toBeLessThanOrEqual(1080);
  });
});

describe("aviso da foto", () => {
  it("explica o problema para a próxima tentativa", () => {
    expect(photoProblemMessage("dark")).toContain("escura");
    expect(photoProblemMessage("bright")).toContain("reflexo");
    expect(photoProblemMessage("blurred")).toContain("tremida");
    expect(photoProblemMessage(null)).toContain("Não encontrei a placa");
  });
});
