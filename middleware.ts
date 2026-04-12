import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Límite global: 100 requests por minuto por IP
const globalLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "rl:global",
})

// Límite estricto para endpoints críticos: 5 intentos cada 10 minutos
const strictLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "rl:strict",
})

const STRICT_PATHS = [
  "/api/auth",
  "/api/webpay/initiate",
  "/checkout",
]

function isStrictPath(pathname: string) {
  return STRICT_PATHS.some(p => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "anonymous"

  const pathname = request.nextUrl.pathname

  // Aplicar límite estricto en endpoints críticos
  if (isStrictPath(pathname)) {
    const { success } = await strictLimit.limit(`${ip}:${pathname}`)
    if (!success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera unos minutos antes de intentarlo de nuevo." },
        { status: 429 }
      )
    }
  } else {
    // Límite global para el resto
    const { success } = await globalLimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta más tarde." },
        { status: 429 }
      )
    }
  }

  // Refresca la sesión de Supabase
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as CookieOptions)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
