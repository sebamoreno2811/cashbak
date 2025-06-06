"use client"

import AuthModal  from "@/components/auth/auth-modal"
import UserMenu  from "@/components/auth/user-menu"
import { createClient } from "@/utils/supabase/client"
import { useState, type ReactNode } from "react"

interface ClientLayoutProps {
  children: ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const supabase = createClient()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b shadow-sm">
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img src="/img/logo.png" alt="CashBak" className="w-auto h-8" />
            </div>

            <nav className="items-center hidden space-x-6 md:flex">
              <a href="/" className="text-gray-700 hover:text-green-900">
                Iniciosdedenjdjnde
              </a>
              <a href="/products" className="text-gray-700 hover:text-green-900">
                Productos
              </a>
              <a href="/cart" className="text-gray-700 hover:text-green-900">
                Carrito
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <UserMenu onAuthRequired={() => setShowAuthModal(true)} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
