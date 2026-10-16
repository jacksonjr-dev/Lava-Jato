import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

// Código compartilhado com o app dos lava-jatos (planos e tipos do banco).
// Quando o repositório virar monorepo, isto aponta para packages/core.
const core = fileURLToPath(
  new URL("../plate-to-clean-main (1)/plate-to-clean-main/src", import.meta.url),
);

export default defineConfig({
  plugins: [tanstackStart({ server: { entry: "server" } }), nitro(), react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
    alias: { "@core": core },
  },
  server: { fs: { allow: [".", core] } },
});
