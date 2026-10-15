// Copia o motor de OCR (Tesseract.js) para public/ocr, para ser servido pelo
// próprio site em vez de um CDN. Roda antes de `dev` e `build` (ver package.json).
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const modules = join(root, "node_modules");
const out = join(root, "public", "ocr");

const files = [
  ["tesseract.js/dist/worker.min.js", "worker.min.js"],
  // Só os núcleos LSTM; o Tesseract escolhe o adequado ao aparelho (SIMD ou não).
  ["tesseract.js-core/tesseract-core-lstm.wasm.js", "core/tesseract-core-lstm.wasm.js"],
  ["tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "core/tesseract-core-simd-lstm.wasm.js"],
  [
    "tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js",
    "core/tesseract-core-relaxedsimd-lstm.wasm.js",
  ],
  ["@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "lang/eng.traineddata.gz"],
];

for (const [from, to] of files) {
  const target = join(out, to);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(modules, from), target);
}
console.log(`[ocr] ${files.length} arquivos copiados para public/ocr`);
