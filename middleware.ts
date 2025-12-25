import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name)
          return cookie ? cookie.value : null
        },
        set(name: string, value: string, options?: { [key: string]: any }) {
          response.cookies.set({ name, value, ...options })
        },
      },
    }
  )

  // Solo sincroniza sesión, NO redirijas aquí
  await supabase.auth.getUser()

  return response
}

/**
 * 🔴 ESTO ES LO QUE TE FALTABA
 * Excluimos reset-password y auth
 */
export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas EXCEPTO:
     * - /reset-password
     * - /auth
     * - /api
     * - archivos estáticos
     */
    "/((?!reset-password|auth|api|_next/static|_next/image|favicon.ico).*)",
  ],
}
