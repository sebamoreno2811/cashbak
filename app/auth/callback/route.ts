import { NextResponse } from "next/server"
import { createSupabaseClientWithCookies } from "@/utils/supabase/server"

/**
 * Normaliza el parámetro `next` a una ruta interna segura.
 *
 * H-03: la validación previa (solo `startsWith("/")`) dejaba pasar `//evil.com/foo` y
 * `/\\evil.com`, que en algunos browsers terminan resolviendo a un host externo cuando
 * se pasan a `NextResponse.redirect(${origin}${nextPath})`. Acá normalizamos con la
 * clase URL y rechazamos cualquier path que no resuelva al mismo origin.
 */
function safeNextPath(rawNext: string | null, origin: string): string {
  if (!rawNext) return "/"
  let next: string
  try {
    next = decodeURIComponent(rawNext)
  } catch {
    return "/"
  }

  // Rechazo explícito de patrones que escapan al origin propio.
  if (!next.startsWith("/")) return "/"
  if (next.startsWith("//")) return "/"     // protocol-relative URL
  if (next.startsWith("/\\")) return "/"    // backslash trick
  if (next.includes("\r") || next.includes("\n")) return "/"

  // Defensa en profundidad: resolver contra el origin y confirmar same-origin.
  try {
    const resolved = new URL(next, origin)
    if (resolved.origin !== origin) return "/"
    return resolved.pathname + resolved.search + resolved.hash
  } catch {
    return "/"
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const nextPath = safeNextPath(searchParams.get("next"), origin)

    if (!code) {
      return NextResponse.redirect(`${origin}${nextPath}`)
    }

    const supabase = await createSupabaseClientWithCookies()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("exchangeCodeForSession error:", error)
      return NextResponse.redirect(origin)
    }

    return NextResponse.redirect(`${origin}${nextPath}`)
  } catch (err) {
    console.error("Unhandled error in auth callback:", err)
    return NextResponse.redirect("https://www.cashbak.cl/")
  }
}
