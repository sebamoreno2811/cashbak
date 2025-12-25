import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ PERMITIR reset de contraseña SIN tocar sesión
  if (pathname.startsWith("/reset-password")) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

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
          if (options) {
            request.cookies.set({ name, value, ...options })
          } else {
            request.cookies.set(name, value)
          }
        },
      },
    }
  )

  // ⚠️ NO fuerces redirects aquí
  await supabase.auth.getUser()

  return supabaseResponse
}
