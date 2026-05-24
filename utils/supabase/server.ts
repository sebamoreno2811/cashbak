import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createSupabaseClientWithCookies() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          } catch {
            // Ignorar errores al setear cookies desde Server Components
          }
        },
      },
    }
  )
}

export const createSupabaseAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Cliente server sin cookies y con SERVICE_ROLE.
 *
 * H-04: el fallback previo a NEXT_PUBLIC_SUPABASE_ANON_KEY hacía que un deploy mal
 * configurado (rotación de service-role olvidada, typo en env de Vercel) corriera
 * silenciosamente con privilegios de anon. Los crons y route handlers que dependen
 * de esto necesitan SÍ o SÍ permisos elevados — preferimos error ruidoso a
 * comportamiento inconsistente.
 */
export const createSupabaseClientWithoutCookies = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL. createSupabaseClientWithoutCookies requiere ambos."
    )
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  })
}
