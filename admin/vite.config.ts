import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

// Código compartilhado com o app dos lava-jatos (planos e tipos do banco).
// Quando o repositório virar monorepo, isto aponta para packages/core.
const core = fileURLToPath(
  new URL("../lava-jato-clean/src", import.meta.url),
);

export default defineConfig({
  plugins: [tanstackStart({ server: { entry: "server" } }), nitro(), react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
    alias: { "@core": core },
  },
  server: { fs: { allow: [".", core] } },
  environments: {
    client: {
      build: {
        sourcemap: false,
        rolldownOptions: {
          output: {
            // Arquivos públicos só com hash: o nome não revela telas nem funções.
            entryFileNames: "assets/[hash].js",
            chunkFileNames: "assets/[hash].js",
            assetFileNames: "assets/[hash][extname]",
          },
        },
      },
    },
  },
});
