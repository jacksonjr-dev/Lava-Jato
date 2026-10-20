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

/** Diagnóstico: localStorage.setItem("lavapro:ocr-debug", "1") mostra cada leitura no console. */
function debugEnabled(): boolean {
  try {
    return localStorage.getItem("lavapro:ocr-debug") === "1";
  } catch {
    return false;
  }
}

/** Carrega o OCR antecipadamente (ex.: ao abrir a tela de novo atendimento). */
export function preloadPlateOcr(): void {
  void getWorker().catch(() => undefined);
}

/**
 * Procura sequências de 7 caracteres que formem uma placa brasileira válida,
 * na ordem em que aparecem (a mais à esquerda primeiro).
 */
export function findPlateCandidates(text: string, mercosul: boolean, strict = false): string[] {
  const found: string[] = [];
  for (const line of text.toUpperCase().split(/\n+/)) {
    const compact = normalizePlate(line);
    for (let start = 0; start + 7 <= compact.length; start++) {
      let candidate = compact.slice(start, start + 7);
      if (!strict) candidate = correctPlateCharacters(candidate);
      const fifth = candidate[4]!;
      if (!strict && mercosul && MERCOSUL_LETTER[fifth]) {
        candidate = candidate.slice(0, 4) + MERCOSUL_LETTER[fifth] + candidate.slice(5);
      }
      if (strict && mercosul && !/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(candidate)) continue;
      if (isValidPlate(candidate) && !found.includes(candidate)) found.push(candidate);
    }
  }
  return found;
}

// Peso por posição do candidato na leitura: o 1º é a leitura em si; os seguintes
// costumam ser a mesma placa "deslocada" (ex.: começando na 2ª letra).
const POSITION_WEIGHT = [1, 0.25, 0.1];

export type OcrReading = { candidates: string[]; confidence: number; weight?: number };

/**
 * Soma os votos de cada leitura: vence a placa que aparece em mais variações,
 * pesada pela confiança do OCR e pela confiabilidade da variação (`weight`).
 */
export function tallyVotes(readings: OcrReading[]) {
  const scores = new Map<string, { score: number; votes: number; confidence: number }>();
  for (const { candidates, confidence, weight = 0.3 } of readings) {
    candidates.forEach((plate, index) => {
      const entry = scores.get(plate) ?? { score: 0, votes: 0, confidence: 0 };
      entry.score += (weight + confidence) * (POSITION_WEIGHT[index] ?? 0.05);
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

const isBlue = (data: Uint8ClampedArray, i: number) =>
  data[i + 2]! > 120 && data[i + 2]! > data[i]! * 1.8 && data[i + 2]! > data[i + 1]! * 1.25;

const median = (values: number[]) =>
  values.length ? values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)]! : 0;

/**
 * Localiza a placa Mercosul pela faixa azul, corrige a inclinação e devolve só a
 * linha dos caracteres. null quando não há faixa azul reconhecível.
 */
function locateMercosulCharacters(base: HTMLCanvasElement): HTMLCanvasElement | null {
  const { width, height } = base;
  const { data } = base
    .getContext("2d", { willReadFrequently: true })!
    .getImageData(0, 0, width, height);

  // Linhas com bastante azul delimitam a faixa na vertical.
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    let blue = 0;
    for (let x = 0; x < width; x += 2) if (isBlue(data, (y * width + x) * 4)) blue++;
    if (blue > (width / 2) * 0.12) {
      if (top < 0) top = y;
      bottom = y;
    }
  }
  if (top < 0) return null;

  // Colunas: maior trecho contínuo com azul entre essas linhas.
  const strong: boolean[] = [];
  let peak = 0;
  const columns: number[] = [];
  for (let x = 0; x < width; x++) {
    let blue = 0;
    for (let y = top; y <= bottom; y += 2) if (isBlue(data, (y * width + x) * 4)) blue++;
    columns.push(blue);
    peak = Math.max(peak, blue);
  }
  columns.forEach((value) => strong.push(value > peak * 0.25));
  let left = 0;
  let right = 0;
  for (let x = 0, start = -1, gap = 0; x < width; x++) {
    if (strong[x]) {
      if (start < 0) start = x;
      gap = 0;
      if (x - start > right - left) [left, right] = [start, x];
    } else if (start >= 0 && ++gap > 20) {
      start = -1;
      gap = 0;
    }
  }
  const bandWidth = right - left;
  if (bandWidth < width * 0.15) return null;

  // Espessura e topo da faixa (medianas por coluna) e inclinação (regressão do topo).
  const thickness: number[] = [];
  const firstBlue: number[] = [];
  const xs: number[] = [];
  for (
    let x = left + Math.round(bandWidth * 0.1);
    x <= right - Math.round(bandWidth * 0.1);
    x += 3
  ) {
    let count = 0;
    let first = -1;
    for (let y = Math.max(0, top - 80); y <= Math.min(height - 1, bottom + 80); y++) {
      if (isBlue(data, (y * width + x) * 4)) {
        count++;
        if (first < 0) first = y;
      }
    }
    if (count) {
      thickness.push(count);
      firstBlue.push(first);
      xs.push(x);
    }
  }
  if (xs.length < 5) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = firstBlue.reduce((a, b) => a + b, 0) / firstBlue.length;
  let num = 0;
  let den = 0;
  xs.forEach((x, i) => {
    num += (x - meanX) * (firstBlue[i]! - meanY);
    den += (x - meanX) ** 2;
  });
  const angle = Math.atan(num / Math.max(1, den));
  const bandHeight = Math.max(10, median(thickness));

  // Linha dos caracteres: logo abaixo da faixa, ~2,5x a altura dela, já endireitada.
  const chars = document.createElement("canvas");
  chars.width = Math.round(bandWidth * 1.04);
  chars.height = Math.round(bandHeight * 2.5);
  const context = chars.getContext("2d")!;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, chars.width, chars.height);
  context.translate(chars.width / 2, chars.height / 2);
  context.rotate(-angle);
  const centerX = left + bandWidth / 2;
  const centerY = median(firstBlue) + bandHeight * 1.05 + chars.height / 2;
  context.drawImage(base, -centerX, -centerY);
  return chars;
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

/** Filtro separável de mínimo/máximo em imagem binária (0 = escuro). */
function spread(bin: Uint8Array, width: number, height: number, radius: number, dark: boolean) {
  const pass = (source: Uint8Array, horizontal: boolean) => {
    const out = new Uint8Array(source.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let hit = false;
        for (let k = -radius; k <= radius && !hit; k++) {
          const xx = horizontal ? x + k : x;
          const yy = horizontal ? y : y + k;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
          hit = dark ? source[yy * width + xx] === 0 : source[yy * width + xx] === 255;
        }
        out[y * width + x] = dark ? (hit ? 0 : 255) : hit ? 255 : 0;
      }
    }
    return out;
  };
  return pass(pass(bin, true), false);
}

/**
 * Preto e branco + fechamento morfológico: preenche o relevo "MERCOSUL" que
 * fica dentro dos traços das letras e as deixa sólidas para o OCR.
 */
function solidCharacters(
  source: HTMLCanvasElement,
  threshold: number,
  blur: number,
  radius: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.filter = blur ? `blur(${blur}px)` : "none";
  context.drawImage(source, 0, 0);
  context.filter = "none";
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  let bin = new Uint8Array(canvas.width * canvas.height);
  for (let p = 0, i = 0; p < bin.length; p++, i += 4) {
    const gray = 0.299 * image.data[i]! + 0.587 * image.data[i + 1]! + 0.114 * image.data[i + 2]!;
    bin[p] = gray < threshold * 255 ? 0 : 255;
  }
  if (radius > 0) {
    bin = spread(
      spread(bin, canvas.width, canvas.height, radius, true),
      canvas.width,
      canvas.height,
      radius,
      false,
    );
  }
  for (let p = 0, i = 0; p < bin.length; p++, i += 4) {
    image.data[i] = image.data[i + 1] = image.data[i + 2] = bin[p]!;
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
export async function readPlateWithOcr(
  file: Blob,
  options: { strict?: boolean } = {},
): Promise<OcrResult> {
  const bitmap = await createImageBitmap(file);
  const base = scaled(bitmap);
  bitmap.close();

  const characters = locateMercosulCharacters(base);
  const mercosul = characters !== null;
  const full: Region = { x: 0, y: 0, w: 1, h: 1 };

  const { PSM } = await import("tesseract.js");
  // Variações escolhidas a partir de testes com placas reais (foto limpa, marca
  // d'água forte e foto inclinada no para-choque), da mais certeira à de reforço.
  // weight: o recorte da placa já endireitado é mais confiável que a foto inteira.
  const attempts: Array<{ image: () => HTMLCanvasElement; mode: string; weight?: number }> = [
    ...(characters
      ? [
          { image: () => solidCharacters(characters, 0.6, 0, 0), mode: PSM.SINGLE_LINE, weight: 1 },
          { image: () => solidCharacters(characters, 0.6, 0, 3), mode: PSM.SINGLE_LINE, weight: 1 },
          { image: () => solidCharacters(characters, 0.6, 2, 0), mode: PSM.SINGLE_LINE, weight: 1 },
        ]
      : []),
    { image: () => prepare(base, full, -1), mode: PSM.SINGLE_LINE },
    { image: () => prepare(base, full, 0.5), mode: PSM.SINGLE_LINE },
    { image: () => prepare(base, full, -1), mode: PSM.SPARSE_TEXT },
    { image: () => prepare(base, full, 0.35), mode: PSM.SINGLE_LINE },
    ...(characters
      ? []
      : [
          // Sem faixa azul (placa antiga ou foto distante): centro e parte de baixo.
          {
            image: () => prepare(base, { x: 0.1, y: 0.35, w: 0.8, h: 0.5 }, -1),
            mode: PSM.SPARSE_TEXT,
          },
          { image: () => prepare(base, { x: 0, y: 0.5, w: 1, h: 0.5 }, -1), mode: PSM.SPARSE_TEXT },
        ]),
  ];

  const worker = await getWorker();
  const readings: OcrReading[] = [];
  for (const attempt of attempts) {
    await worker.setParameters({ tessedit_pageseg_mode: attempt.mode as never });
    const { data } = await worker.recognize(attempt.image());
    if (debugEnabled())
      console.info("[OCR]", attempts.indexOf(attempt), JSON.stringify(data.text), data.confidence);
    readings.push({
      candidates: findPlateCandidates(data.text, mercosul, options.strict),
      confidence: Math.max(0, Math.min(1, data.confidence / 100)),
      ...(attempt.weight ? { weight: attempt.weight } : {}),
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

/** Confiança exibida quando as duas leituras discordam: a tela pede para conferir. */
export const UNSURE_CONFIDENCE = 0.5;

export type CheckedOcrResult = OcrResult & { conflict: boolean };

/**
 * Junta a leitura principal com a de conferência. Se a conferência achar OUTRA
 * placa válida, a leitura é incerta (o OCR pode errar com "99%" quando todas as
 * tentativas partem da mesma imagem ruidosa). Conferência vazia não desmente a
 * principal: numa foto do carro inteiro, a versão reduzida pode não achar a placa.
 */
export function combineReadings(first: OcrResult, second: OcrResult | null): CheckedOcrResult {
  if (!first.plate) return { ...first, conflict: false };
  if (second?.plate && second.plate !== first.plate) {
    return {
      plate: first.plate,
      confidence: Math.min(first.confidence, UNSURE_CONFIDENCE),
      conflict: true,
    };
  }
  return { ...first, conflict: false };
}

/** A mesma foto reduzida, sem perda; ao ser ampliada para a leitura, o ruído de compressão some. */
async function resampled(file: Blob, width = 700): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, width / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Não foi possível preparar a conferência da foto.");
  return blob;
}

/** Lê a placa e confere com uma segunda leitura da mesma foto em outro tamanho. */
export async function readPlateChecked(file: Blob): Promise<CheckedOcrResult> {
  const first = await readPlateWithOcr(file);
  if (!first.plate) return { ...first, conflict: false };
  const second = await readPlateWithOcr(await resampled(file)).catch(() => null);
  return combineReadings(first, second);
}
