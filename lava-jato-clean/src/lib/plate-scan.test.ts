import { describe, expect, it } from "vitest";
import { assessFrameQuality, PlateReadConfirmation } from "./plate-scan";

function solidFrame(value: number, width = 30, height = 20) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    pixels[i + 3] = 255;
  }
  return { pixels, width, height };
}

describe("confirmação da leitura contínua da placa", () => {
  it("confirma apenas após três leituras confiáveis e consecutivas iguais", () => {
    const confirmation = new PlateReadConfirmation();

    expect(confirmation.observe("ABC1D23", 0.91).confirmed).toBeNull();
    expect(confirmation.observe("ABC1D23", 0.88).confirmed).toBeNull();
    expect(confirmation.observe("ABC1D23", 0.84).confirmed).toBe("ABC1D23");
  });

  it("reinicia a sequência quando a leitura é inválida ou tem baixa confiança", () => {
    const confirmation = new PlateReadConfirmation();
    confirmation.observe("ABC1D23", 0.9);
    confirmation.observe("ABC1D23", 0.9);

    expect(confirmation.observe("ABC1D2", 0.99).confirmed).toBeNull();
    expect(confirmation.observe("ABC1D23", 0.9).stableReads).toBe(1);
    expect(confirmation.observe("ABC1D23", 0.74).stableReads).toBe(0);
    expect(confirmation.observe("ABC1D23", 0.95).stableReads).toBe(1);
  });

  it("não confirma uma leitura que muda para outra placa válida", () => {
    const confirmation = new PlateReadConfirmation();
    confirmation.observe("ABC1D23", 0.9);
    confirmation.observe("ABC1D23", 0.9);

    expect(confirmation.observe("ABC1234", 0.9)).toMatchObject({
      plate: "ABC1234",
      stableReads: 1,
      confirmed: null,
    });
  });

  it("aceita os padrões antigo e Mercosul, preservando os caracteres lidos", () => {
    const confirmation = new PlateReadConfirmation();
    expect(confirmation.observe("ABC1234", 0.9).plate).toBe("ABC1234");
    confirmation.reset();
    expect(confirmation.observe("ABC1D23", 0.9).plate).toBe("ABC1D23");
    expect(confirmation.observe("ABC1O23", 0.9).confirmed).toBeNull();
  });
});

describe("qualidade do quadro da câmera", () => {
  it("rejeita quadros escuros, estourados e sem bordas nítidas", () => {
    const dark = solidFrame(10);
    const bright = solidFrame(250);
    const blurred = solidFrame(128);

    expect(assessFrameQuality(dark.pixels, dark.width, dark.height).reason).toBe("dark");
    expect(assessFrameQuality(bright.pixels, bright.width, bright.height).reason).toBe("bright");
    expect(assessFrameQuality(blurred.pixels, blurred.width, blurred.height).reason).toBe(
      "blurred",
    );
  });

  it("permite um quadro com exposição e bordas nítidas", () => {
    const frame = solidFrame(128);
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        const value = x % 2 === 0 ? 40 : 220;
        const i = (y * frame.width + x) * 4;
        frame.pixels[i] = frame.pixels[i + 1] = frame.pixels[i + 2] = value;
      }
    }

    expect(assessFrameQuality(frame.pixels, frame.width, frame.height).usable).toBe(true);
  });
});
