import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@core": fileURLToPath(
        new URL("../plate-to-clean-main (1)/plate-to-clean-main/src", import.meta.url),
      ),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
