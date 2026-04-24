"use client"

import AuthModal from "@/components/auth/auth-modal"
import UserMenu from "@/components/auth/user-menu"
import { useCart } from "@/hooks/use-cart"
import { useProducts } from "@/context/product-context"
import { ShoppingCart, ChevronDown, Shirt, Dumbbell, Package, Tag, Menu, X } from "lucide-react"
import { useState, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  const productsButtonRef = useRef<HTMLButtonElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

  // Helpers para navegación a categorías (evita botones que deberían ser links)
  const categoryHref = (cat: string) => `/products?category=${encodeURIComponent(cat)}`
  const closeAllMenus = () => {
    setShowProductsMenu(false)
    setMobileOpen(false)
    setMobileProductsOpen(false)
  }

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

  // Escape cierra menús abiertos y devuelve el foco al botón trigger
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (showProductsMenu) {
        setShowProductsMenu(false)
        productsButtonRef.current?.focus()
      }
      if (mobileOpen) {
        setMobileOpen(false)
        hamburgerRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [showProductsMenu, mobileOpen])

  // Cierra el menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false)
    setMobileProductsOpen(false)
  }, [pathname])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip link — WCAG 2.4.1 */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-green-900 focus:font-semibold focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      <header ref={headerRef} className="text-white bg-green-900 shadow-lg relative z-40 border-b border-green-700">
        <div className="px-4 mx-auto max-w-7xl">

          {/* Barra principal — una sola fila en todos los tamaños */}
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <span className="text-xl font-extrabold tracking-tight">Cash<span className="text-green-300">Bak</span></span>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
              <Link href="/" className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-white/10">Inicio</Link>

              {/* Productos mega-menu */}
              <div ref={menuRef} className="relative">
                <button
                  ref={productsButtonRef}
                  type="button"
                  onClick={() => setShowProductsMenu(v => !v)}
                  aria-haspopup="true"
                  aria-expanded={showProductsMenu}
                  aria-controls="products-mega-menu"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-white/10"
                >
                  Productos
                  <ChevronDown aria-hidden="true" className={`w-3.5 h-3.5 transition-transform duration-200 ${showProductsMenu ? "rotate-180" : ""}`} />
                </button>

                {showProductsMenu && (
                  <div
                    id="products-mega-menu"
                    role="menu"
                    aria-label="Categorías de productos"
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                    style={{ minWidth: "520px" }}
                  >
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">Explorar productos</h3>
                      <Link href="/products" onClick={() => setShowProductsMenu(false)} className="text-xs font-medium text-green-800 hover:text-green-900 hover:underline">
                        Ver todos →
                      </Link>
                    </div>
                    <div className="p-4 grid gap-5" style={{ gridTemplateColumns: `repeat(${Math.min(Object.keys(grouped).length, 3)}, 1fr)` }}>
                      {Object.entries(grouped).map(([group, cats]) => (
                        <div key={group}>
                          <div className="flex items-center gap-1.5 mb-2 px-1">
                            <span className="text-green-800" aria-hidden="true">{CATEGORY_GROUPS[group]?.icon ?? <Package className="w-4 h-4" />}</span>
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{group}</h4>
                          </div>
                          <ul className="space-y-0.5">
                            {cats.map(cat => (
                              <li key={cat}>
                                <Link
                                  href={categoryHref(cat)}
                                  role="menuitem"
                                  onClick={closeAllMenus}
                                  className="block w-full text-left px-3 py-1.5 rounded-lg text-sm text-gray-800 hover:bg-green-50 hover:text-green-900 font-medium transition-colors"
                                >
                                  {cat}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-600">{products.length} productos disponibles en CashBak</p>
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
              <Link
                href="/cart"
                aria-label={totalItems > 0 ? `Carrito, ${totalItems} ${totalItems === 1 ? "producto" : "productos"}` : "Carrito, vacío"}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full px-3 py-1.5 text-sm font-medium transition-all"
              >
                <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                {totalItems > 0
                  ? <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-green-900 bg-white rounded-full" aria-hidden="true">{totalItems}</span>
                  : <span className="hidden sm:inline" aria-hidden="true">Carrito</span>
                }
              </Link>

              {/* Hamburger — solo mobile */}
              <button
                ref={hamburgerRef}
                type="button"
                onClick={() => setMobileOpen(v => !v)}
                aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-drawer"
                className="md:hidden flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Drawer móvil */}
          {mobileOpen && (
            <nav
              id="mobile-drawer"
              aria-label="Navegación móvil"
              className="md:hidden border-t border-green-700 py-3 space-y-1"
            >
              <Link href="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                Inicio
              </Link>

              {/* Productos expandible */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileProductsOpen(v => !v)}
                  aria-expanded={mobileProductsOpen}
                  aria-controls="mobile-products-submenu"
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Productos
                  <ChevronDown aria-hidden="true" className={`w-4 h-4 transition-transform duration-200 ${mobileProductsOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileProductsOpen && (
                  <div id="mobile-products-submenu" className="mt-1 ml-3 pl-3 border-l border-white/20 space-y-3 py-2">
                    <Link href="/products" onClick={closeAllMenus} className="block text-sm text-green-100 font-medium py-1">
                      Ver todos los productos →
                    </Link>
                    {Object.entries(grouped).map(([group, cats]) => (
                      <div key={group}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-green-200" aria-hidden="true">{CATEGORY_GROUPS[group]?.icon ?? <Package className="w-3.5 h-3.5" />}</span>
                          <h4 className="text-xs font-bold text-green-200 uppercase tracking-wider">{group}</h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cats.map(cat => (
                            <Link
                              key={cat}
                              href={categoryHref(cat)}
                              onClick={closeAllMenus}
                              className="text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-full transition-colors"
                            >
                              {cat}
                            </Link>
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
            </nav>
          )}

        </div>
      </header>

      <main className="flex-grow bg-gray-50">{children}</main>

      <footer className="py-8 text-white bg-gray-800" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">Pie de página</h2>
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <section aria-labelledby="footer-about">
              <h3 id="footer-about" className="mb-4 text-xl font-bold">CashBak</h3>
              <p>La mejor forma de comprar y recibir dinero de vuelta.</p>
            </section>
            <section aria-labelledby="footer-links">
              <h3 id="footer-links" className="mb-4 text-xl font-bold">Enlaces</h3>
              <ul className="space-y-2">
                <li><Link href="/terminos" className="hover:underline">Términos y condiciones</Link></li>
                <li><Link href="/privacy-policy" className="hover:underline">Política de privacidad</Link></li>
                <li><Link href="/howto" className="hover:underline">Cómo funciona</Link></li>
              </ul>
            </section>
            <section aria-labelledby="footer-contact">
              <h3 id="footer-contact" className="mb-4 text-xl font-bold">Contacto</h3>
              <p>
                <a href="mailto:cashbak.ops@gmail.com" className="hover:underline">
                  cashbak.ops@gmail.com
                </a>
              </p>
              <a
                href="https://www.instagram.com/cashbak.cl/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @cashbak.cl (se abre en una pestaña nueva)"
                className="hover:underline"
              >
                IG: @cashbak.cl
              </a>
            </section>
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
