import { describe, expect, it } from "vitest";
import {
  agreement,
  combineReadings,
  findPlateCandidates,
  tallyVotes,
  UNSURE_CONFIDENCE,
} from "./plate-ocr";

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

  it("no scanner ao vivo não corrige caracteres ambíguos para forçar uma placa", () => {
    expect(findPlateCandidates("LSN4149", true, true)).toEqual([]);
    expect(findPlateCandidates("ABC1023", true, true)).toEqual([]);
    expect(findPlateCandidates("ABC1O23", true, true)).toEqual(["ABC1O23"]);
    expect(findPlateCandidates("ABC1D23", true, true)).toEqual(["ABC1D23"]);
    expect(findPlateCandidates("ABC1234", false, true)).toEqual(["ABC1234"]);
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

  it("leituras deslocadas da mesma placa não vencem a leitura principal", () => {
    // Cada leitura gera a placa e cópias "deslocadas"; só a 1ª deve pesar de verdade.
    const [winner] = tallyVotes([
      { candidates: ["LSN4T49", "SNA7A94"], confidence: 0, weight: 1 },
      { candidates: ["ISN4T49", "SNA7A94"], confidence: 0, weight: 1 },
      { candidates: ["LSN4T49", "SNA7A94"], confidence: 0, weight: 1 },
    ]);
    expect(winner?.plate).toBe("LSN4T49");
  });

  it("o recorte da placa pesa mais que a foto inteira", () => {
    const [winner] = tallyVotes([
      { candidates: ["PLQ8F28"], confidence: 0.47, weight: 1 },
      { candidates: ["PLO8F28"], confidence: 0.6 },
    ]);
    expect(winner?.plate).toBe("PLQ8F28");
  });
});

describe("conferência da leitura", () => {
  it("mantém a leitura quando a conferência concorda ou não acha placa", () => {
    const first = { plate: "BRA2E19", confidence: 0.82 };
    expect(combineReadings(first, { plate: "BRA2E19", confidence: 0.7 })).toEqual({
      ...first,
      conflict: false,
    });
    expect(combineReadings(first, { plate: "", confidence: 0 }).conflict).toBe(false);
    expect(combineReadings(first, null).conflict).toBe(false);
  });

  it("marca como incerta quando a conferência acha outra placa", () => {
    expect(
      combineReadings(
        { plate: "RRA2E10", confidence: 0.99 },
        { plate: "BRA2E19", confidence: 0.85 },
      ),
    ).toEqual({ plate: "RRA2E10", confidence: UNSURE_CONFIDENCE, conflict: true });
  });
});
