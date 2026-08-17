import { expect, type Page } from "@playwright/test"

/**
 * Navega a una ruta y verifica lo básico de "la página no está rota":
 *  - el servidor no respondió con 5xx
 *  - no se ve el overlay de error de Next
 * Devuelve la respuesta del documento para chequear el status si hace falta.
 */
export async function goto(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: "domcontentloaded" })
  if (res) {
    expect(res.status(), `GET ${path} respondió ${res.status()}`).toBeLessThan(500)
  }
  await expect(
    page.locator("text=Application error"),
    `La página ${path} mostró el overlay de error de Next`
  ).toHaveCount(0)
  return res
}
