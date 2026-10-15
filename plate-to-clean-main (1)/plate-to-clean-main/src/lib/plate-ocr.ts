// Leitura de placa por OCR no navegador (Tesseract.js). A foto não sai do
// aparelho e não depende de API paga. Os arquivos do motor ficam em /ocr
// (copiados por scripts/copy-ocr-assets.mjs).
import type { Worker } from "tesseract.js";
import { isValidPlate, normalizePlate } from "./plate";
import { correctPlateCharacters } from "./plate-recognition";

export type OcrResult = { plate: string; confidence: number };

const WHITELIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const TARGET_WIDTH = 1400;

// Na placa Mercosul a 5ª posição é letra; corrige leituras comuns de dígito.
const MERCOSUL_LETTER: Record<string, string> = {
  "0": "O",
  "1": "I",
  "2": "Z",
  "4": "A",
  "5": "S",
  "6": "G",
  "8": "B",
};

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  workerPromise ??= (async () => {
    const { createWorker, OEM } = await import("tesseract.js");
    const worker = await createWorker("eng", OEM.LSTM_ONLY, {
      workerPath: "/ocr/worker.min.js",
      corePath: "/ocr/core",
      langPath: "/ocr/lang",
      workerBlobURL: false,
    });
    await worker.setParameters({ tessedit_char_whitelist: WHITELIST });
    return worker;
  })().catch((error: unknown) => {
    workerPromise = null;
    throw error;
  });
  return workerPromise;
}

/** Carrega o OCR antecipadamente (ex.: ao abrir a tela de novo atendimento). */
export function preloadPlateOcr(): void {
  void getWorker().catch(() => undefined);
}

/**
 * Procura sequências de 7 caracteres que formem uma placa brasileira válida,
 * na ordem em que aparecem (a mais à esquerda primeiro).
 */
export function findPlateCandidates(text: string, mercosul: boolean): string[] {
  const found: string[] = [];
  for (const line of text.toUpperCase().split(/\n+/)) {
    const compact = normalizePlate(line);
    for (let start = 0; start + 7 <= compact.length; start++) {
      let candidate = correctPlateCharacters(compact.slice(start, start + 7));
      const fifth = candidate[4]!;
      if (mercosul && MERCOSUL_LETTER[fifth]) {
        candidate = candidate.slice(0, 4) + MERCOSUL_LETTER[fifth] + candidate.slice(5);
      }
      if (isValidPlate(candidate) && !found.includes(candidate)) found.push(candidate);
    }
  }
  return found;
}

/**
 * Soma os votos de cada leitura: a placa que aparece em mais variações (pesada
 * pela confiança do OCR) vence. Candidatos mais à esquerda pesam mais.
 */
export function tallyVotes(readings: Array<{ candidates: string[]; confidence: number }>) {
  const scores = new Map<string, { score: number; votes: number; confidence: number }>();
  for (const { candidates, confidence } of readings) {
    candidates.forEach((plate, index) => {
      const entry = scores.get(plate) ?? { score: 0, votes: 0, confidence: 0 };
      entry.score += (0.3 + confidence) / (index + 1);
      entry.votes += 1;
      entry.confidence = Math.max(entry.confidence, confidence);
      scores.set(plate, entry);
    });
  }
  return [...scores.entries()]
    .map(([plate, entry]) => ({ plate, ...entry }))
    .sort((a, b) => b.score - a.score);
}

function scaled(bitmap: ImageBitmap): HTMLCanvasElement {
  const scale = Math.min(TARGET_WIDTH / bitmap.width, 3);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Última linha da faixa azul da placa Mercosul (0 se não houver faixa). */
function mercosulBandBottom(source: HTMLCanvasElement): number {
  const context = source.getContext("2d", { willReadFrequently: true })!;
  const { data } = context.getImageData(0, 0, source.width, source.height);
  let bottom = 0;
  for (let y = 0; y < source.height; y++) {
    let blue = 0;
    let samples = 0;
    for (let x = 0; x < source.width; x += 4) {
      const i = (y * source.width + x) * 4;
      samples++;
      if (data[i + 2]! > 110 && data[i + 2]! > data[i]! * 1.7) blue++;
    }
    if (blue / samples > 0.5) bottom = y;
  }
  return bottom;
}

type Region = { x: number; y: number; w: number; h: number };

/** Recorta a região e aplica tons de cinza (threshold < 0) ou preto e branco. */
function prepare(source: HTMLCanvasElement, region: Region, threshold: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * region.w));
  canvas.height = Math.max(1, Math.round(source.height * region.h));
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(
    source,
    source.width * region.x,
    source.height * region.y,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    const value = threshold < 0 ? gray : gray < threshold * 255 ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = value;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Confiança exibida: a maior entre a confiança do OCR e a fração de leituras
 * que concordaram (a do Tesseract sozinha subestima placas com marca d'água).
 */
export function agreement(entry: { votes: number; confidence: number }, readings: number): number {
  return Math.min(0.99, Math.max(entry.confidence, entry.votes / Math.max(1, readings)));
}

/** Lê a placa da foto; devolve placa vazia se nada válido for encontrado. */
export async function readPlateWithOcr(file: Blob): Promise<OcrResult> {
  const bitmap = await createImageBitmap(file);
  const base = scaled(bitmap);
  bitmap.close();

  const bandBottom = mercosulBandBottom(base);
  const mercosul = bandBottom > 0;
  const full: Region = { x: 0, y: 0, w: 1, h: 1 };
  const belowBand: Region = {
    x: 0.04,
    y: (bandBottom + 4) / base.height,
    w: 0.92,
    h: Math.max(0.1, 1 - (bandBottom + 4) / base.height - 0.02),
  };

  const { PSM } = await import("tesseract.js");
  // Variações escolhidas a partir de testes com placas reais (marca d'água forte
  // e foto limpa); a ordem vai da mais barata/certeira para as de reforço.
  const attempts: Array<{ region: Region; threshold: number; mode: string }> = [
    { region: full, threshold: -1, mode: PSM.SINGLE_LINE },
    { region: full, threshold: 0.5, mode: PSM.SINGLE_LINE },
    { region: full, threshold: -1, mode: PSM.SPARSE_TEXT },
    { region: full, threshold: 0.35, mode: PSM.SINGLE_LINE },
    ...(mercosul
      ? [
          { region: belowBand, threshold: -1, mode: PSM.SPARSE_TEXT },
          { region: belowBand, threshold: 0.5, mode: PSM.SPARSE_TEXT },
        ]
      : [
          // Foto do carro inteiro: a placa costuma estar no centro ou embaixo.
          { region: { x: 0.1, y: 0.35, w: 0.8, h: 0.5 }, threshold: -1, mode: PSM.SPARSE_TEXT },
          { region: { x: 0, y: 0.5, w: 1, h: 0.5 }, threshold: -1, mode: PSM.SPARSE_TEXT },
        ]),
  ];

  const worker = await getWorker();
  const readings: Array<{ candidates: string[]; confidence: number }> = [];
  for (const attempt of attempts) {
    await worker.setParameters({ tessedit_pageseg_mode: attempt.mode as never });
    const { data } = await worker.recognize(prepare(base, attempt.region, attempt.threshold));
    readings.push({
      candidates: findPlateCandidates(data.text, mercosul),
      confidence: Math.max(0, Math.min(1, data.confidence / 100)),
    });
    const [leader, runnerUp] = tallyVotes(readings);
    // Para cedo quando há consenso claro entre leituras.
    if (leader && leader.votes >= 2 && leader.score >= 1.5 * (runnerUp?.score ?? 0)) {
      return { plate: leader.plate, confidence: agreement(leader, readings.length) };
    }
  }
  const [winner] = tallyVotes(readings);
  return winner
    ? { plate: winner.plate, confidence: agreement(winner, readings.length) }
    : { plate: "", confidence: 0 };
}
