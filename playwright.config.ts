import { defineConfig, devices } from "@playwright/test"

/**
 * Configuración de Playwright para los smoke tests de Cashbak.
 *
 * Por defecto levanta el dev server (`npm run dev`) con el gate de
 * pre-lanzamiento APAGADO, para poder probar las páginas públicas reales.
 * Si defines BASE_URL, apunta a esa URL (ej. un preview de Vercel) y NO
 * levanta server local.
 *
 *   npm run test:e2e                      # local, gate apagado
 *   BASE_URL=https://tu-preview npm run test:e2e   # contra un deploy
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000"
const useLocalServer = !process.env.BASE_URL

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    locale: "es-CL",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  ...(useLocalServer
    ? {
        webServer: {
          command: "npm run dev",
          url: BASE_URL,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
          // Apaga el gate para que las páginas públicas sean accesibles en el test.
          env: { NEXT_PUBLIC_PRELAUNCH_ENABLED: "false" },
        },
      }
    : {}),
})
