// Câmera com moldura para fotografar a placa: recorte exato da moldura e aviso
// do motivo quando a leitura falha (foto escura, com reflexo ou tremida).
import { assessFrameQuality, type FrameQuality } from "./plate-scan";

/** Moldura desenhada sobre o vídeo, em frações da área visível. */
export const PLATE_FRAME = { left: 0.06, top: 0.3, width: 0.88, height: 0.4 } as const;

/** A câmera dentro do app só abre em página segura (HTTPS ou localhost). */
export function canUseInAppCamera(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Converte a moldura (frações da área visível) para pixels do vídeo, considerando
 * o `object-fit: cover`: o vídeo é ampliado até cobrir a área e as sobras laterais
 * (ou de cima e de baixo) ficam escondidas. `margin` amplia o recorte para não
 * cortar a placa quando ela encosta na borda da moldura.
 */
export function coverCropRect(
  view: { width: number; height: number },
  video: { width: number; height: number },
  frame: { left: number; top: number; width: number; height: number } = PLATE_FRAME,
  margin = 0.08,
): Rect {
  const scale = Math.max(view.width / video.width, view.height / video.height);
  const offsetX = (view.width - video.width * scale) / 2;
  const offsetY = (view.height - video.height * scale) / 2;
  const left = frame.left - frame.width * margin;
  const top = frame.top - frame.height * margin;
  const right = frame.left + frame.width * (1 + margin);
  const bottom = frame.top + frame.height * (1 + margin);
  const toVideoX = (fraction: number) => (fraction * view.width - offsetX) / scale;
  const toVideoY = (fraction: number) => (fraction * view.height - offsetY) / scale;
  const x = Math.max(0, toVideoX(left));
  const y = Math.max(0, toVideoY(top));
  const w = Math.min(video.width, toVideoX(right)) - x;
  const h = Math.min(video.height, toVideoY(bottom)) - y;
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

export type PhotoProblem = FrameQuality["reason"];

/**
 * Nitidez mínima de uma foto (recorte da moldura, reduzido a 640 px). Medido com
 * fotos de placa: nítida ≈ 5, levemente suave ≈ 2,5 (o leitor ainda acerta),
 * borrada ≈ 1,2. Só o que está claramente borrado recebe o aviso.
 */
export const PHOTO_MIN_SHARPNESS = 2;

/** Mensagem para a próxima tentativa, conforme o problema da foto. */
export function photoProblemMessage(problem: PhotoProblem): string {
  switch (problem) {
    case "dark":
      return "A foto ficou escura. Procure mais luz ou acenda a lanterna e tire outra.";
    case "bright":
      return "A foto ficou com reflexo ou luz forte. Mude um pouco o ângulo e tire outra.";
    case "blurred":
      return "A foto saiu tremida ou fora de foco. Segure firme, aproxime e tire outra.";
    default:
      return "Não encontrei a placa na foto. Enquadre só a placa, de frente, e tente de novo.";
  }
}

/**
 * Avalia a foto em tamanho reduzido. A nitidez só é considerada quando a foto já
 * é o recorte da moldura (a placa ocupa a maior parte); numa foto inteira, o
 * para-choque liso derruba a média e a placa nítida pareceria tremida.
 */
export async function assessPhoto(
  photo: Blob,
  options: { checkSharpness: boolean },
): Promise<PhotoProblem> {
  const bitmap = await createImageBitmap(photo);
  const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(3, Math.round(bitmap.width * scale));
  canvas.height = Math.max(3, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const quality = assessFrameQuality(
    context.getImageData(0, 0, canvas.width, canvas.height).data,
    canvas.width,
    canvas.height,
    PHOTO_MIN_SHARPNESS,
  );
  if (quality.reason === "blurred" && !options.checkSharpness) return null;
  return quality.reason;
}
