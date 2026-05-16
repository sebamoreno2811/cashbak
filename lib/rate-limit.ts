/**
 * Rate limiter compartido para server actions sensibles (auth, signup, etc.).
 *
 * El middleware ya cubre rutas con URL fija (`/api/...`, `/auth/callback`), pero los
 * server actions de Next.js van por POST a la página actual con un header `Next-Action`,
 * sin URL distintiva. Para esos casos necesitamos chequear el limit dentro del action.
 *
 * Uso:
 *   const { success } = await checkAuthRateLimit("signin")
 *   if (!success) return { success: false, error: "..." }
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { headers } from "next/headers"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 10 intentos cada 10 minutos por IP+acción. Suficiente para uso legítimo (incluido
// errores de tipeo) y duro contra credential stuffing.
const authLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  prefix: "rl:auth",
})

async function getClientIp(): Promise<string> {
  try {
    const h = await headers()
    return (
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      "anonymous"
    )
  } catch {
    return "anonymous"
  }
}

export async function checkAuthRateLimit(action: string): Promise<{
  success: boolean
  remaining: number
}> {
  const ip = await getClientIp()
  const result = await authLimit.limit(`${ip}:${action}`)
  return { success: result.success, remaining: result.remaining }
}
