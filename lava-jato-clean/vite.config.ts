import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [tanstackStart({ server: { entry: "server" } }), nitro(), react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  environments: {
    client: {
      build: {
        // Nada de código-fonte original no navegador.
        sourcemap: false,
        rolldownOptions: {
          output: {
            // Arquivos públicos só com hash: o nome não revela telas nem funções.
            // (Não é proteção por si só; as regras de acesso ficam no servidor e no banco.)
            entryFileNames: "assets/[hash].js",
            chunkFileNames: "assets/[hash].js",
            assetFileNames: "assets/[hash][extname]",
          },
        },
      },
    },
  },
});
