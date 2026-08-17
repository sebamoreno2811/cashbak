import { test, expect } from "@playwright/test"
import { goto } from "./helpers"

/**
 * Smoke tests del onboarding de vendedores — el flujo más importante para el
 * lanzamiento (conseguir tiendas). Rutas siempre abiertas en el gate.
 */
test.describe("Onboarding de vendedores", () => {
  test("la landing /sell muestra el hero y el CTA a aplicar", async ({ page }) => {
    await goto(page, "/sell")
    await expect(
      page.getByRole("heading", { name: "Vende con nosotros" })
    ).toBeVisible()

    const cta = page.getByRole("link", { name: /Solicitar mi tienda/i }).first()
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute("href", /\/sell\/aplicar/)
  })

  test("el simulador reacciona al precio ingresado", async ({ page }) => {
    await goto(page, "/sell")

    const precio = page.locator("#precio")
    await expect(precio).toBeVisible()
    await precio.fill("35000")

    // El label exacto del bloque de resultado (texto idéntico, no el pie de página).
    await expect(
      page.getByText("CashBak que ofreces a tus clientes", { exact: true })
    ).toBeVisible()
  })

  test("/sell/aplicar muestra auth wall a visitantes anónimos", async ({ page }) => {
    await goto(page, "/sell/aplicar")
    // Sin sesión, la página pide login antes de mostrar el formulario.
    await expect(
      page.getByRole("heading", { name: /Necesitas una cuenta/i })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Iniciar sesión / Crear cuenta" })
    ).toBeVisible()
  })
})
