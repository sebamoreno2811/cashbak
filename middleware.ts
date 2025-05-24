import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Método get: obtener el valor de la cookie
        get(name: string) {
          const cookie = request.cookies.get(name); // Obtener el objeto RequestCookie
          return cookie ? cookie.value : null; // Accedemos al valor de la cookie o null si no existe
        },

        // Método set: establecer la cookie correctamente
        set(name: string, value: string, options?: { [key: string]: any }) {
          if (options) {
            // Si hay opciones, las pasamos como un solo objeto
            request.cookies.set({ name, value, ...options }); // Enviamos nombre, valor y las opciones
          } else {
            // Si no hay opciones, solo pasamos nombre y valor
            request.cookies.set(name, value);
          }
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return supabaseResponse
}
