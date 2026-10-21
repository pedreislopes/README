// =============================================================================
// Testes de ponta a ponta (navegador de verdade clicando pelo site)
// Rode com: npm run test:e2e
//
// ATENÇÃO: os testes APAGAM e recriam os dados de teste do banco local
// (antes e depois de rodar), como o "npm run banco:resetar".
// =============================================================================
import { defineConfig } from "@playwright/test";

const PORTA = 3200;

export default defineConfig({
  testDir: "e2e",
  // Os testes compartilham o mesmo banco: rodam um de cada vez, em ordem
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  globalSetup: "./e2e/preparar.ts",
  globalTeardown: "./e2e/preparar.ts",
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
  },
  projects: [
    {
      // Celular pequeno: 360 px de largura (ex.: Galaxy A / Moto G de entrada)
      name: "celular-360px",
      use: { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORTA}`,
    url: `http://localhost:${PORTA}`,
    timeout: 240_000,
    reuseExistingServer: false,
  },
});
