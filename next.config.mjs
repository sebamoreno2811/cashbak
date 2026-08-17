/** @type {import('next').NextConfig} */

// Headers de seguridad aplicados a TODA respuesta del servidor.
//
// Notas:
// - CSP es deliberadamente permisiva en `script-src` con 'unsafe-inline' porque hay
//   inyecciones inline (JSON-LD, PostHog, Vercel Analytics). El XSS via JSON-LD ya está
//   mitigado en `lib/utils.ts#safeJsonForScript`. Migrar a nonces es trabajo aparte.
// - `frame-ancestors 'none'` + `X-Frame-Options: DENY` previene clickjacking.
// - HSTS con preload requiere que cashbak.cl esté listo para 2 años de TLS continuo.
// - `connect-src` lista los dominios outbound que el browser realmente usa.
// - M-02: en producción el sandbox webpay3gint queda fuera del CSP — solo se permite
//   webpay3g (ambiente real). En dev sí se permiten ambos para poder probar.
// - M-03: Permissions-Policy ampliada con sensores/APIs que la app no usa.
const isProd = process.env.NODE_ENV === "production"

const webpayHosts = isProd
  ? "https://webpay3g.transbank.cl"
  : "https://webpay3gint.transbank.cl https://webpay3g.transbank.cl"

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "browsing-topics=()",
      "payment=(self)",
      "usb=()",
      "magnetometer=()",
      "accelerometer=()",
      "gyroscope=()",
      "midi=()",
      "serial=()",
      "bluetooth=()",
    ].join(", "),
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      `form-action 'self' ${webpayHosts}`,
      "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://*.i.posthog.com https://va.vercel-scripts.com https://*.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://*.i.posthog.com https://api.anthropic.com https://*.vercel-insights.com https://va.vercel-scripts.com",
      `frame-src 'self' ${webpayHosts}`,
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
]

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      // URLs antiguas con dos segmentos: strip del slug, el handler de /producto/[handle]
      // detecta el ID decimal y redirige al handle canónico.
      {
        source: "/product/:id/:slug+",
        destination: "/producto/:id",
        permanent: true,
      },
      {
        source: "/producto/:id/:slug+",
        destination: "/producto/:id",
        permanent: true,
      },
      {
        source: "/product/:id",
        destination: "/producto/:id",
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
