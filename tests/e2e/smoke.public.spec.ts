import { test, expect } from "@playwright/test"
import { goto } from "./helpers"

/**
 * Smoke tests de las páginas públicas del comprador.
 * Corren con el gate de pre-lanzamiento APAGADO (ver playwright.config.ts).
 */
test.describe("Páginas públicas (comprador)", () => {
  test("la home carga con título y contenido de CashBak", async ({ page }) => {
    await goto(page, "/")
    await expect(page).toHaveTitle(/CashBak/i)
    // h1 sr-only definido en app/page.tsx
    await expect(page.locator("h1")).toContainText(/CashBak/i)
  })

  test("el grid de productos carga", async ({ page }) => {
    const res = await goto(page, "/products")
    expect(res?.status()).toBeLessThan(400)
    await expect(page).toHaveTitle(/CashBak/i)
  })

  test("el directorio de tiendas carga", async ({ page }) => {
    await goto(page, "/tiendas")
    await expect(page).toHaveTitle(/Tiendas con CashBak/i)
  })

  test("la página 'cómo funciona' carga", async ({ page }) => {
    await goto(page, "/howto")
    await expect(page).toHaveTitle(/CashBak/i)
  })

  test("términos y política de privacidad cargan", async ({ page }) => {
    await goto(page, "/terminos")
    await expect(page).toHaveTitle(/CashBak/i)

    await goto(page, "/privacy-policy")
    await expect(page).toHaveTitle(/CashBak/i)
  })

  test("la página de contacto carga", async ({ page }) => {
    await goto(page, "/contact")
    await expect(page.locator("body")).toBeVisible()
  })

  test("una ruta inexistente responde 404", async ({ page }) => {
    const res = await page.goto("/ruta-que-no-existe-9c8b7a")
    expect(res?.status()).toBe(404)
  })
})
