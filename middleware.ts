import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value ?? null
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
      },
    }
  )

  // ⛔️ NADA de getUser, getSession, onAuthStateChange, etc.

  return response
}

export const config = {
  matcher: [
    "/((?!reset-password|auth|api|_next/static|_next/image|favicon.ico).*)",
  ],
}
