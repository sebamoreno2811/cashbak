import { createBrowserClient } from "@supabase/ssr"

/**
 * Cliente Supabase para uso en componentes cliente.
 *
 * IMPORTANTE: usa la implementación oficial de @supabase/ssr, que coordina cookies con
 * el cliente server-side (createServerClient en utils/supabase/server.ts) y respeta
 * los atributos de cookie configurados desde el server (HttpOnly, Secure, SameSite).
 *
 * El wrapper manual previo (`document.cookie = …`) impedía HttpOnly y dejaba el token
 * de sesión expuesto a XSS. No volver a esa implementación.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
