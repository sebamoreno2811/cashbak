import { test, expect } from "@playwright/test"

/**
 * Verifica el gate de pre-lanzamiento. Requiere el server con el gate
 * ENCENDIDO (NEXT_PUBLIC_PRELAUNCH_ENABLED != "false") y la fecha de
 * lanzamiento aún sin cumplirse. Como el resto de la suite corre con el gate
 * apagado, estas pruebas están deshabilitadas por defecto.
 *
 * Para correrlas:
 *   1) Levanta el server con el gate encendido:  npm run dev
 *   2) En otra terminal:  BASE_URL=http://localhost:3000 TEST_GATE=1 npx playwright test gate
 */
const gateOn = process.env.TEST_GATE === "1"

test.describe("Gate de pre-lanzamiento", () => {
  test.skip(!gateOn, "Requiere TEST_GATE=1 y el server con el gate encendido")

  test("un visitante anónimo es redirigido a /proximamente", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/proximamente/)
    await expect(page.getByText(/Estamos a poco de lanzar/i)).toBeVisible()
  })

  test("las rutas de vendedor siguen abiertas durante el gate", async ({ page }) => {
    await page.goto("/sell")
    await expect(page).toHaveURL(/\/sell/)
    await expect(
      page.getByRole("heading", { name: "Vende con nosotros" })
    ).toBeVisible()
  })
})
