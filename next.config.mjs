/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Asegurarse de que Next.js use el directorio pages en lugar de app
  useFileSystemPublicRoutes: true,
  // Desactivar el directorio app
  experimental: {
    appDir: false,
  },
}

export default nextConfig
