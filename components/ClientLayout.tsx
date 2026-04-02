"use client"

import AuthModal from "@/components/auth/auth-modal"
import UserMenu from "@/components/auth/user-menu"
import { useCart } from "@/hooks/use-cart"
import { useProducts } from "@/context/product-context"
import { ShoppingCart, ChevronDown, Shirt, Dumbbell, Package, Tag } from "lucide-react"
import { useState, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ChatWidget from "@/components/ChatWidget"

// Agrupación de categorías. Las que no encajen van a "Otros"
const CATEGORY_GROUPS: Record<string, { icon: React.ReactNode; categories: string[] }> = {
  Ropa: {
    icon: <Shirt className="w-4 h-4" />,
    categories: ["Poleras de Fútbol", "Camisetas", "Shorts", "Calcetines", "Buzos", "Chaquetas"],
  },
  "Artículos Deportivos": {
    icon: <Dumbbell className="w-4 h-4" />,
    categories: ["Balones", "Guantes", "Canilleras", "Zapatillas", "Implementos"],
  },
  Accesorios: {
    icon: <Tag className="w-4 h-4" />,
    categories: ["Gorros", "Bufandas", "Mochilas", "Llaveros", "Insignias"],
  },
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProductsMenu, setShowProductsMenu] = useState(false)
  const { items } = useCart()
  const { products } = useProducts()
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const menuRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const router = useRouter()

  // Agrupa las categorías activas por grupo
  const grouped = useMemo(() => {
    const active = new Set(products.map(p => p.category_name).filter(Boolean) as string[])
    const result: Record<string, string[]> = {}
    const assigned = new Set<string>()

    for (const [group, { categories }] of Object.entries(CATEGORY_GROUPS)) {
      const matched = categories.filter(c => active.has(c))
      if (matched.length > 0) {
        result[group] = matched
        matched.forEach(c => assigned.add(c))
      }
    }

    // Las que no encajan en ningún grupo van a "Otros"
    const others = [...active].filter(c => !assigned.has(c)).sort()
    if (others.length > 0) result["Otros"] = others

    return result
  }, [products])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProductsMenu(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const navigate = (cat: string) => {
    setShowProductsMenu(false)
    router.push(`/products?category=${encodeURIComponent(cat)}`)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header ref={headerRef} className="text-white bg-green-900 shadow-lg relative z-40">
        <div className="container px-4 mx-auto">
          <div className="relative flex flex-col items-center justify-center py-4 md:h-20">

            {/* Top right */}
            <div className="absolute flex items-center space-x-4 top-4 right-4">
              <UserMenu onAuthRequired={() => setShowAuthModal(true)} />
              <Link href="/cart" className="relative flex items-center transition-colors hover:text-green-200">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full -top-2 -right-2">
                    {totalItems}
                  </span>
                )}
                <span className="hidden ml-2 sm:inline">Carrito</span>
              </Link>
            </div>

            {/* Logo */}
            <Link href="/" className="mb-2 text-xl font-bold md:mb-0 md:absolute md:left-4 md:top-4">
              CashBak
            </Link>

            {/* Nav */}
            <nav className="flex flex-col items-center space-y-2 md:flex-row md:space-y-0 md:space-x-6">
              <Link href="/" className="transition-colors hover:text-green-200">Inicio</Link>

              {/* Productos mega-menu */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setShowProductsMenu(v => !v)}
                  className="flex items-center gap-1 transition-colors hover:text-green-200"
                >
                  Productos
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showProductsMenu ? "rotate-180" : ""}`} />
                </button>

                {showProductsMenu && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    style={{ minWidth: "520px" }}
                  >
                    {/* Header del dropdown */}
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">Explorar productos</p>
                      <Link
                        href="/products"
                        onClick={() => setShowProductsMenu(false)}
                        className="text-xs font-medium text-green-700 hover:text-green-900 hover:underline"
                      >
                        Ver todos →
                      </Link>
                    </div>

                    {/* Grupos */}
                    <div className="p-4 grid gap-5"
                      style={{ gridTemplateColumns: `repeat(${Math.min(Object.keys(grouped).length, 3)}, 1fr)` }}
                    >
                      {Object.entries(grouped).map(([group, cats]) => (
                        <div key={group}>
                          {/* Título del grupo */}
                          <div className="flex items-center gap-1.5 mb-2 px-1">
                            <span className="text-green-700">
                              {CATEGORY_GROUPS[group]?.icon ?? <Package className="w-4 h-4" />}
                            </span>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group}</p>
                          </div>

                          {/* Categorías */}
                          <ul className="space-y-0.5">
                            {cats.map(cat => (
                              <li key={cat}>
                                <button
                                  onClick={() => navigate(cat)}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-900 font-medium transition-colors"
                                >
                                  {cat}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Footer con total */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-400">{products.length} productos disponibles en CashBak</p>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/tiendas" className="transition-colors hover:text-green-200">Tiendas</Link>
              <Link href="/sell" className="transition-colors hover:text-green-200">Vende con nosotros</Link>
              <Link href="/howto" className="transition-colors hover:text-green-200">¿Qué es CashBak?</Link>
              <Link href="/contact" className="transition-colors hover:text-green-200">Contacto</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow bg-gray-50">{children}</main>

      <footer className="py-8 text-white bg-gray-800">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-4 text-xl font-bold">CashBak</h3>
              <p>La mejor forma de comprar y recibir dinero de vuelta.</p>
            </div>
            <div>
              <h3 className="mb-4 text-xl font-bold">Enlaces</h3>
              <ul className="space-y-2">
                <li><Link href="/terminos" className="hover:underline">Términos y condiciones</Link></li>
                <li><Link href="/privacy-policy" className="hover:underline">Política de privacidad</Link></li>
                <li><Link href="#" className="hover:underline">Preguntas frecuentes</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-xl font-bold">Contacto</h3>
              <p>cashbak.ops@gmail.com</p>
              <p>IG: @cashbak.cl</p>
            </div>
          </div>
          <div className="pt-8 mt-8 text-center border-t border-gray-700">
            <p>&copy; {new Date().getFullYear()} CashBak. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ChatWidget />
    </div>
  )
}
