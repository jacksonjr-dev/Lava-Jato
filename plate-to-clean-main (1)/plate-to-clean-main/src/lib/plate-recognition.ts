import { isValidPlate, normalizePlate } from "./plate";

export type PlateRecognition = {
  plate: string;
  confidence: number;
  /** true no modo demonstração, em que a foto não é lida de verdade. */
  simulated: boolean;
};

// Trocas comuns de leitura entre letras e números.
const AS_LETTER: Record<string, string> = {
  "0": "O",
  "1": "I",
  "2": "Z",
  "4": "A",
  "5": "S",
  "6": "G",
  "8": "B",
};
const AS_DIGIT: Record<string, string> = {
  O: "0",
  Q: "0",
  D: "0",
  I: "1",
  L: "1",
  Z: "2",
  A: "4",
  S: "5",
  G: "6",
  T: "7",
  B: "8",
};

/**
 * Ajusta confusões letra/número conforme a posição da placa brasileira:
 * LLL N (N|L) NN — vale para o padrão antigo (ABC1234) e o Mercosul (ABC1D23).
 */
export function correctPlateCharacters(input: string): string {
  const plate = normalizePlate(input);
  if (plate.length !== 7) return plate;
  return plate
    .split("")
    .map((char, index) => {
      if (index <= 2) return AS_LETTER[char] ?? char;
      if (index === 3 || index >= 5) return AS_DIGIT[char] ?? char;
      return char;
    })
    .join("");
}

/** Interpreta a resposta do modelo; placas fora do padrão brasileiro são descartadas. */
export function parsePlateResponse(raw: string): Omit<PlateRecognition, "simulated"> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { plate: "", confidence: 0 };
  let parsed: { plate?: unknown; confidence?: unknown };
  try {
    parsed = JSON.parse(match[0]) as typeof parsed;
  } catch {
    return { plate: "", confidence: 0 };
  }
  const plate = correctPlateCharacters(typeof parsed.plate === "string" ? parsed.plate : "");
  if (!isValidPlate(plate)) return { plate: "", confidence: 0 };
  const confidence = Number(parsed.confidence);
  return {
    plate,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
  };
}
