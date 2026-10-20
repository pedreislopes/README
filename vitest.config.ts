import { defineConfig } from "vitest/config";
import path from "node:path";

// Configuração dos testes automáticos (rode com: npm test)
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
