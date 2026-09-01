import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  css: {
    // Tests assert behaviour, never styling, and the Tailwind v4 PostCSS
    // plugin cannot load outside the Next build.
    postcss: { plugins: [] },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
