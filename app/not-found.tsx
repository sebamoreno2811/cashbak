import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">

      {/* Número grande */}
      <div className="relative mb-6">
        <p className="text-[120px] sm:text-[160px] font-black text-green-900/10 leading-none select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl sm:text-6xl">🔍</span>
        </div>
      </div>

      {/* Mensaje principal */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
        Esta página no entró al campo
      </h1>
      <p className="text-gray-500 max-w-sm mb-2 text-base leading-relaxed">
        La página que buscas no existe o fue movida. Pero no te preocupes —
        <span className="font-semibold text-green-800"> los eventos siguen activos </span>
        y hay productos esperándote.
      </p>
      <p className="text-xs text-gray-400 mb-10 italic">
        "El árbitro no encontró la jugada. Intenta de nuevo."
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 bg-green-900 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
        <Link
          href="/products"
          className="flex items-center gap-2 border border-gray-300 hover:border-green-700 hover:text-green-800 text-gray-600 font-medium px-6 py-3 rounded-xl transition-colors"
        >
          <Search className="w-4 h-4" />
          Ver productos
        </Link>
      </div>

    </div>
  )
}
