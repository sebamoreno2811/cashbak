"use client"
import type React from "react"
import { useState } from "react" // 👈 IMPORTANTE
import { ProductSelectionProvider } from "@/hooks/use-product-selection"
import { BetOptionProvider } from "@/hooks/use-bet-option"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [menuOpen, setMenuOpen] = useState(false) // 👈 Estado del menú

  return (
    <html lang="es">
      <body className={inter.className}>
        <BetOptionProvider>
          <ProductSelectionProvider>
            <header className="py-4 text-white bg-green-900">
              <div className="container flex items-center justify-between px-4 mx-auto">
                <a href="/" className="text-2xl font-bold">
                  CashBak
                </a>
                <nav className="hidden md:block">
                  <ul className="flex space-x-6">
                    <li>
                      <a href="/" className="hover:underline">Inicio</a>
                    </li>
                    <li>
                      <a href="/products" className="hover:underline">Productos</a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline">Cómo funciona</a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline">Contacto</a>
                    </li>
                  </ul>
                </nav>

                {/* Botón hamburguesa */}
                <div className="md:hidden">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)} // 👈 Alterna estado
                    className="text-white focus:outline-none"
                  >
                    <span className="block w-6 h-1 bg-white mb-1"></span>
                    <span className="block w-6 h-1 bg-white mb-1"></span>
                    <span className="block w-6 h-1 bg-white"></span>
                  </button>
                </div>
              </div>

              {/* Menú móvil */}
              {menuOpen && ( // 👈 Mostrar sólo si está abierto
                <div className="md:hidden mt-4 px-4">
                  <ul className="space-y-4">
                    <li>
                      <a href="/" className="block text-white hover:underline">Inicio</a>
                    </li>
                    <li>
                      <a href="/products" className="block text-white hover:underline">Productos</a>
                    </li>
                    <li>
                      <a href="#" className="block text-white hover:underline">Cómo funciona</a>
                    </li>
                    <li>
                      <a href="#" className="block text-white hover:underline">Contacto</a>
                    </li>
                  </ul>
                </div>
              )}
            </header>

            {children}

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
                      <li><a href="#" className="hover:underline">Términos y condiciones</a></li>
                      <li><a href="#" className="hover:underline">Política de privacidad</a></li>
                      <li><a href="#" className="hover:underline">Preguntas frecuentes</a></li>
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
          </ProductSelectionProvider>
        </BetOptionProvider>
      </body>
    </html>
  )
}
