"use client"

import AuthModal from "@/components/auth/auth-modal"
import UserMenu from "@/components/auth/user-menu"
import { useCart } from "@/hooks/use-cart"
import { ShoppingCart } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { items } = useCart()
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="text-white bg-green-900 shadow-lg">
        <div className="container px-4 mx-auto">
          <div className="relative flex flex-col items-center justify-center py-4 md:h-20">
            {/* Top right (cart + user) */}
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

            {/* Logo: centered on mobile, left on desktop */}
            <Link
              href="/"
              className="mb-2 text-xl font-bold md:mb-0 md:absolute md:left-4 md:top-4"
            >
              CashBak
            </Link>

            {/* Center nav */}
            <nav className="flex flex-col items-center space-y-2 md:flex-row md:space-y-0 md:space-x-6">
              <Link href="/" className="transition-colors hover:text-green-200">
                Inicio
              </Link>
              <Link href="/products" className="transition-colors hover:text-green-200">
                Productos
              </Link>
              <Link href="/howto" className="transition-colors hover:text-green-200">
                ¿Qué es CashBak?
              </Link>
              <Link href="/contact" className="transition-colors hover:text-green-200">
                Contacto
              </Link>
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
                <li>
                  <Link href="#" className="hover:underline">
                    Términos y condiciones
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Preguntas frecuentes
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-xl font-bold">Contacto</h3>
              <p>cashbak.ops@gmail.com</p>
              <p>IG: @cashbak.oficial</p>
            </div>
          </div>
          <div className="pt-8 mt-8 text-center border-t border-gray-700">
            <p>&copy; {new Date().getFullYear()} CashBak. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
