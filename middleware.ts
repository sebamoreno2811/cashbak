import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import {
  isPrelaunchActive,
  isAlwaysOpen,
  COUNTDOWN_PATH,
  PREVIEW_COOKIE,
} from "@/config/launch"

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

// Límite estricto para endpoints de pago y auth: 10 intentos cada 10 minutos
const strictLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  prefix: "rl:strict",
})

// Rutas con URL fija que merecen el límite estricto (10 req/10min). El rate limit de los
// server actions de signin/signup vive dentro de las propias actions vía
// `lib/rate-limit.ts#checkAuthRateLimit` porque los server actions van por POST a la
// página actual sin URL distintiva.
const STRICT_PATHS = [
  "/auth/",
  "/api/webpay/initiate",
  "/api/webpay/commit",
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
  } else if (pathname.startsWith("/api/")) {
    // Límite global solo para APIs (no para páginas normales)
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // --- Gate de pre-lanzamiento ---
  // Mientras el gate esté activo, la vitrina pública queda cerrada para
  // anónimos y compradores. Vendedores (dueños de tienda) y admins pasan.
  // Se salta APIs y las rutas de la allow-list (onboarding, auth, admin, etc.).
  if (
    isPrelaunchActive() &&
    !pathname.startsWith("/api") &&
    !isAlwaysOpen(pathname)
  ) {
    // Cookie de bypass ya validada (evita reconsultar la DB en cada request).
    let allowed = request.cookies.get(PREVIEW_COOKIE)?.value === "1"

    if (!allowed && user) {
      const [{ data: store }, { data: customer }] = await Promise.all([
        supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle(),
        supabase.from("customers").select("role").eq("id", user.id).maybeSingle(),
      ])
      allowed = Boolean(store) || customer?.role === "admin"

      if (allowed) {
        supabaseResponse.cookies.set(PREVIEW_COOKIE, "1", {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 12, // 12 horas
        })
      }
    }

    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = COUNTDOWN_PATH
      url.search = ""
      const redirect = NextResponse.redirect(url)
      // Conserva las cookies de sesión refrescadas por Supabase.
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirect.cookies.set(cookie)
      })
      return redirect
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
