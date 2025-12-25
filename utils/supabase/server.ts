import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createSupabaseClientWithCookies() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // ✅ CAMBIO CLAVE AQUÍ: Usar sintaxis de objeto para el set
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Este try/catch evita errores si se intenta setear cookies desde un Server Component 
            // (aunque en el route handler funcionará bien)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignorar error
          }
        },
      },
    }
  )
}

// Función auxiliar para crear un cliente sin necesidad de cookies
export const createSupabaseClientWithoutCookies = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  // Aquí estamos agregando la propiedad cookies vacía, para cumplir con la interfaz que exige SupabaseClientOptions
  return createServerClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        "x-client-info": `nextjs-app-router`,
      },
    },
    cookies: {
      // Solo agregamos un objeto vacío porque no estamos utilizando cookies en este caso
      get: () => null,
      set: () => {},
    },
  })
}