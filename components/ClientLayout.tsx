"use client"

import AuthModal from "@/components/auth/auth-modal"
import UserMenu from "@/components/auth/user-menu"
import { useCart } from "@/hooks/use-cart"
import { useProducts } from "@/context/product-context"
import { ShoppingCart, ChevronDown, Shirt, Dumbbell, Package, Tag, Menu, X } from "lucide-react"
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false)
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

  // Cierra el menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false)
    setMobileProductsOpen(false)
  }, [router])

  const navigate = (cat: string) => {
    setShowProductsMenu(false)
    setMobileOpen(false)
    router.push(`/products?category=${encodeURIComponent(cat)}`)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header ref={headerRef} className="text-white bg-green-900 shadow-lg relative z-40 border-b border-green-800">
        <div className="px-4 mx-auto max-w-7xl">

          {/* Barra principal — una sola fila en todos los tamaños */}
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <span className="text-xl font-extrabold tracking-tight">Cash<span className="text-green-300">Bak</span></span>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-white/10">Inicio</Link>

              {/* Productos mega-menu */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setShowProductsMenu(v => !v)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-white/10"
                >
                  Productos
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showProductsMenu ? "rotate-180" : ""}`} />
                </button>

                {showProductsMenu && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    style={{ minWidth: "520px" }}
                  >
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">Explorar productos</p>
                      <Link href="/products" onClick={() => setShowProductsMenu(false)} className="text-xs font-medium text-green-700 hover:text-green-900 hover:underline">
                        Ver todos →
                      </Link>
                    </div>
                    <div className="p-4 grid gap-5" style={{ gridTemplateColumns: `repeat(${Math.min(Object.keys(grouped).length, 3)}, 1fr)` }}>
                      {Object.entries(grouped).map(([group, cats]) => (
                        <div key={group}>
                          <div className="flex items-center gap-1.5 mb-2 px-1">
                            <span className="text-green-700">{CATEGORY_GROUPS[group]?.icon ?? <Package className="w-4 h-4" />}</span>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group}</p>
                          </div>
                          <ul className="space-y-0.5">
                            {cats.map(cat => (
                              <li key={cat}>
                                <button onClick={() => navigate(cat)} className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-900 font-medium transition-colors">
                                  {cat}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-400">{products.length} productos disponibles en CashBak</p>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/tiendas" className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-white/10">Tiendas</Link>
              <Link href="/sell" className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-white/10">Vende con nosotros</Link>
              <Link href="/howto" className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-white/10">¿Qué es CashBak?</Link>
              <Link href="/contact" className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-white/10">Contacto</Link>
            </nav>

            {/* Acciones derecha */}
            <div className="flex items-center gap-2">
              <UserMenu onAuthRequired={() => setShowAuthModal(true)} />
              <Link href="/cart" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full px-3 py-1.5 text-sm font-medium transition-all">
                <ShoppingCart className="w-4 h-4" />
                {totalItems > 0
                  ? <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-green-900 bg-white rounded-full">{totalItems}</span>
                  : <span className="hidden sm:inline">Carrito</span>
                }
              </Link>

              {/* Hamburger — solo mobile */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Menú"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Drawer móvil */}
          {mobileOpen && (
            <div className="md:hidden border-t border-green-800 py-3 space-y-1">
              <Link href="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                Inicio
              </Link>

              {/* Productos expandible */}
              <div>
                <button
                  onClick={() => setMobileProductsOpen(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Productos
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileProductsOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileProductsOpen && (
                  <div className="mt-1 ml-3 pl-3 border-l border-white/20 space-y-3 py-2">
                    <Link href="/products" onClick={() => setMobileOpen(false)} className="block text-sm text-green-200 font-medium py-1">
                      Ver todos los productos →
                    </Link>
                    {Object.entries(grouped).map(([group, cats]) => (
                      <div key={group}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-green-300">{CATEGORY_GROUPS[group]?.icon ?? <Package className="w-3.5 h-3.5" />}</span>
                          <p className="text-xs font-bold text-green-300 uppercase tracking-wider">{group}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cats.map(cat => (
                            <button key={cat} onClick={() => navigate(cat)} className="text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full transition-colors">
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/tiendas" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                Tiendas
              </Link>
              <Link href="/sell" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                Vende con nosotros
              </Link>
              <Link href="/howto" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                ¿Qué es CashBak?
              </Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                Contacto
              </Link>
            </div>
          )}

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
              <a href="https://www.instagram.com/cashbak.cl/" target="_blank" rel="noopener noreferrer" className="hover:underline">IG: @cashbak.cl</a>
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
