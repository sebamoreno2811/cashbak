/**
 * Este archivo quedó deprecado (H-04).
 *
 * Antes exportaba `createServerSupabaseClient` y `createClientSupabaseClient`, pero:
 *  1) Nadie lo importa hoy (dead code, verificado con grep).
 *  2) El cliente server hacía fallback al ANON_KEY si faltaba SUPABASE_SERVICE_ROLE_KEY,
 *     lo que vuelve silenciosos los errores de configuración en producción.
 *
 * Para clientes Supabase usar:
 *  - Server (con cookies de sesión): `utils/supabase/server.ts#createSupabaseClientWithCookies`
 *  - Server (sin sesión, service role): `utils/supabase/server.ts#createSupabaseAdminClient`
 *  - Cliente browser: `utils/supabase/client.ts#createClient`
 *
 * Cualquier import a este archivo va a tirar en runtime para forzar la migración.
 */

const DEPRECATED_MSG =
  "lib/supabase.ts está deprecado. Usa utils/supabase/server.ts o utils/supabase/client.ts (ver comentario del archivo)."

export const createServerSupabaseClient = () => {
  throw new Error(DEPRECATED_MSG)
}

export const createClientSupabaseClient = () => {
  throw new Error(DEPRECATED_MSG)
}
