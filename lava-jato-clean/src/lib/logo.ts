/** Tamanho máximo do logo já decodificado (o navegador reduz antes de enviar). */
export const MAX_LOGO_BYTES = 1024 * 1024;

export type LogoImage = {
  contentType: "image/png" | "image/jpeg" | "image/webp";
  bytes: Uint8Array;
};

const EXTENSION: Record<LogoImage["contentType"], string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function logoExtension(contentType: LogoImage["contentType"]): string {
  return EXTENSION[contentType];
}

/** Confere a assinatura do arquivo, não só o tipo declarado. */
function hasSignature(bytes: Uint8Array, contentType: LogoImage["contentType"]): boolean {
  const starts = (...values: number[]) => values.every((value, i) => bytes[i] === value);
  if (contentType === "image/png") return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (contentType === "image/jpeg") return starts(0xff, 0xd8, 0xff);
  // WebP: "RIFF" .... "WEBP"
  return (
    starts(0x52, 0x49, 0x46, 0x46) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(base64, "base64"));
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Valida um logo enviado como data URL (PNG, JPEG ou WebP, até 1 MB) e devolve
 * os bytes. Lança erro com mensagem amigável quando o arquivo não serve.
 */
export function parseLogoDataUrl(dataUrl: string): LogoImage {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) throw new Error("Envie uma imagem PNG, JPG ou WebP.");
  const contentType = match[1] as LogoImage["contentType"];
  const base64 = match[2]!;
  if (base64.length > Math.ceil((MAX_LOGO_BYTES * 4) / 3) + 4) {
    throw new Error("A imagem do logo deve ter no máximo 1 MB.");
  }
  const bytes = base64ToBytes(base64);
  if (bytes.length > MAX_LOGO_BYTES) throw new Error("A imagem do logo deve ter no máximo 1 MB.");
  if (!hasSignature(bytes, contentType))
    throw new Error("O arquivo enviado não é uma imagem válida.");
  return { contentType, bytes };
}
