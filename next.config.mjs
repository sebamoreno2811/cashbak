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
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://webpay3gint.transbank.cl https://webpay3g.transbank.cl",
      "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://*.i.posthog.com https://va.vercel-scripts.com https://*.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://*.i.posthog.com https://api.anthropic.com https://*.vercel-insights.com https://va.vercel-scripts.com",
      "frame-src 'self' https://webpay3gint.transbank.cl https://webpay3g.transbank.cl",
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
