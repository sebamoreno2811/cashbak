"use client"

import AuthModal from "@/components/auth/auth-modal"
import UserMenu from "@/components/auth/user-menu"
import { useCart } from "@/hooks/use-cart"
import { ShoppingCart, Menu } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { items } = useCart()
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="text-white bg-green-900 shadow-lg">
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold">CashBak</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="items-center hidden space-x-6 md:flex">
              <Link href="/" className="transition-colors hover:text-green-200">
                Inicio
              </Link>
              <Link href="/products" className="transition-colors hover:text-green-200">
                Productos
              </Link>
              <Link href="/howto" className="transition-colors hover:text-green-200">
                Cómo funciona
              </Link>
              <Link href="/contact" className="transition-colors hover:text-green-200">
                Contacto
              </Link>
            </nav>

            {/* Right side actions (always visible) */}
            <div className="flex items-center space-x-4">
              {/* User menu */}
              <UserMenu onAuthRequired={() => setShowAuthModal(true)} />

              {/* Mobile menu (hidden on md+) */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 rounded hover:bg-green-800 focus:outline-none">
                    <Menu className="w-6 h-6 text-white" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 text-green-900">
                    <DropdownMenuItem asChild>
                      <Link href="/">Inicio</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/products">Productos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#">Cómo funciona</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#">Contacto</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Cart */}
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
