import { createServerClient as createSupabaseClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createSupabaseClientWithCookies() {
  const cookieStore = await cookies() // Esperamos a que se resuelva el Promise para obtener el objeto cookies.

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value || null
      },
      set(name: string, value: string, options?: { [key: string]: any }) {
        cookieStore.set(name, value, options)
      },
    },
  })
}

// Función auxiliar para crear un cliente sin necesidad de cookies
export const createSupabaseClientWithoutCookies = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  // Aquí estamos agregando la propiedad cookies vacía, para cumplir con la interfaz que exige SupabaseClientOptions
  return createSupabaseClient(supabaseUrl, supabaseKey, {
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
