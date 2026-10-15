import { describe, expect, it } from "vitest";
import { agreement, findPlateCandidates, tallyVotes } from "./plate-ocr";

describe("OCR de placa", () => {
  it("acha a placa dentro do texto lido, ignorando ruído em volta", () => {
    expect(findPlateCandidates("MERCOSUL\nBRASIL\nBRA2E19", true)[0]).toBe("BRA2E19");
    expect(findPlateCandidates("LSN41495 A 7A 1 TT", true)[0]).toBe("LSN4I49");
  });

  it("na placa Mercosul a 5ª posição vira letra", () => {
    expect(findPlateCandidates("LSN4149", true)).toContain("LSN4I49");
    // Sem faixa Mercosul, LSN4149 é uma placa antiga válida.
    expect(findPlateCandidates("LSN4149", false)[0]).toBe("LSN4149");
  });

  it("não inventa placa em texto sem sequência válida", () => {
    expect(findPlateCandidates("BRASIL\nMERCOSUL", true)).toEqual([]);
    expect(findPlateCandidates("", false)).toEqual([]);
  });

  it("escolhe a placa com mais votos entre as leituras", () => {
    const [winner] = tallyVotes([
      { candidates: ["SNA1A93"], confidence: 0.42 },
      { candidates: ["LSN4I49", "SNA1A95"], confidence: 0.29 },
      { candidates: ["LSN4I49"], confidence: 0.07 },
    ]);
    expect(winner).toMatchObject({ plate: "LSN4I49", votes: 2 });
  });

  it("calcula a confiança pela concordância entre leituras", () => {
    expect(agreement({ votes: 3, confidence: 0.3 }, 4)).toBe(0.75);
    expect(agreement({ votes: 1, confidence: 0.8 }, 4)).toBe(0.8);
    expect(agreement({ votes: 4, confidence: 1 }, 4)).toBe(0.99);
  });
});
