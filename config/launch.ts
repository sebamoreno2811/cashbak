/**
 * Configuración del gate de pre-lanzamiento.
 *
 * Mientras `PRELAUNCH_ENABLED` sea true y no se haya cumplido `LAUNCH_DATE`,
 * el público general (anónimos y compradores) ve la cuenta regresiva en
 * `/proximamente`. Los vendedores (dueños de una tienda) y los admins pueden
 * navegar el sitio real y previsualizar su tienda con normalidad.
 *
 * Post-lanzamiento el gate se apaga solo (la fecha ya pasó). Para apagarlo
 * antes o testear, setear PRELAUNCH_ENABLED=false en las env vars de Vercel.
 */

// 21 de octubre de 2026, 18:00 hora de Chile.
// En octubre Chile está en horario de verano (UTC-3), por eso el offset -03:00.
// Se deja explícito para que el cálculo sea idéntico corra donde corra el server.
export const LAUNCH_DATE = "2026-10-21T18:00:00-03:00"

export const LAUNCH_TS = new Date(LAUNCH_DATE).getTime()

// Interruptor global. Default: activado, salvo que la env var diga "false".
export const PRELAUNCH_ENABLED =
  process.env.NEXT_PUBLIC_PRELAUNCH_ENABLED !== "false"

/** true cuando ya se cumplió la fecha de lanzamiento. */
export function isLaunched(now: number = Date.now()): boolean {
  return now >= LAUNCH_TS
}

/** true cuando el gate debe estar activo (habilitado y aún no lanzado). */
export function isPrelaunchActive(now: number = Date.now()): boolean {
  return PRELAUNCH_ENABLED && !isLaunched(now)
}

// Ruta de la cuenta regresiva.
export const COUNTDOWN_PATH = "/proximamente"

// Cookie que marca a un visitante ya validado como vendedor/admin, para
// evitar reconsultar la DB en cada request durante el pre-lanzamiento.
export const PREVIEW_COOKIE = "cb_preview"

/**
 * Rutas que SIEMPRE quedan abiertas durante el pre-lanzamiento, sin importar
 * quién entre. Cubre onboarding de vendedores, auth, admin, legales y APIs.
 * El match es por prefijo.
 */
export const ALWAYS_OPEN_PREFIXES = [
  COUNTDOWN_PATH,
  "/sell",
  "/mi-tienda",
  "/admin",
  "/auth",
  "/login",
  "/reset-password",
  "/complete-profile",
  "/perfil",
  "/contact",
  "/terminos",
  "/privacy-policy",
  "/api",
]

/** true si la ruta está en la allow-list (siempre accesible). */
export function isAlwaysOpen(pathname: string): boolean {
  return ALWAYS_OPEN_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(prefix + "/")
  )
}
