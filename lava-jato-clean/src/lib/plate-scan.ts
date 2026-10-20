import { isValidPlate, normalizePlate } from "./plate";

export const MIN_SCAN_CONFIDENCE = 0.75;
export const REQUIRED_STABLE_READS = 3;
const MIN_FRAME_BRIGHTNESS = 24;
const MAX_FRAME_BRIGHTNESS = 238;
const MIN_FRAME_SHARPNESS = 7;

export type PlateScanProgress = {
  plate: string | null;
  stableReads: number;
  confirmed: string | null;
};

export type FrameQuality = {
  usable: boolean;
  brightness: number;
  sharpness: number;
  reason: "dark" | "bright" | "blurred" | null;
};

/** Fast exposure and Laplacian checks on the same cropped frame sent to OCR. */
export function assessFrameQuality(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  minSharpness = MIN_FRAME_SHARPNESS,
): FrameQuality {
  if (width < 3 || height < 3 || pixels.length < width * height * 4) {
    return { usable: false, brightness: 0, sharpness: 0, reason: "blurred" };
  }

  const luminance = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return 0.299 * pixels[i]! + 0.587 * pixels[i + 1]! + 0.114 * pixels[i + 2]!;
  };
  let brightnessTotal = 0;
  let laplacianTotal = 0;
  let samples = 0;
  for (let y = 1; y < height - 1; y += 3) {
    for (let x = 1; x < width - 1; x += 3) {
      const center = luminance(x, y);
      brightnessTotal += center;
      laplacianTotal += Math.abs(
        4 * center -
          luminance(x - 1, y) -
          luminance(x + 1, y) -
          luminance(x, y - 1) -
          luminance(x, y + 1),
      );
      samples += 1;
    }
  }

  const brightness = brightnessTotal / samples;
  const sharpness = laplacianTotal / samples;
  const reason =
    brightness < MIN_FRAME_BRIGHTNESS
      ? "dark"
      : brightness > MAX_FRAME_BRIGHTNESS
        ? "bright"
        : sharpness < minSharpness
          ? "blurred"
          : null;
  return { usable: reason === null, brightness, sharpness, reason };
}

/** Requires several consecutive, exact OCR readings before accepting a plate. */
export class PlateReadConfirmation {
  private candidate: string | null = null;
  private stableReads = 0;

  observe(plateInput: string, confidence: number): PlateScanProgress {
    const plate = normalizePlate(plateInput);
    if (!isValidPlate(plate) || !Number.isFinite(confidence) || confidence < MIN_SCAN_CONFIDENCE) {
      this.reset();
      return { plate: null, stableReads: 0, confirmed: null };
    }

    if (plate === this.candidate) {
      this.stableReads += 1;
    } else {
      this.candidate = plate;
      this.stableReads = 1;
    }

    return {
      plate,
      stableReads: this.stableReads,
      confirmed: this.stableReads >= REQUIRED_STABLE_READS ? plate : null,
    };
  }

  reset() {
    this.candidate = null;
    this.stableReads = 0;
  }
}
