import type React from "react"
import { ProductSelectionProvider } from "@/hooks/use-product-selection"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "CashBak - Compra y recibe dinero de vuelta",
  description: "Tienda online con sistema de CashBak en todos los productos",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ProductSelectionProvider>
          <header className="py-4 text-white bg-green-900">
            <div className="container flex items-center justify-between px-4 mx-auto">
              <a href="/" className="text-2xl font-bold">
                CashBak
              </a>
              <nav>
                <ul className="flex space-x-6">
                  <li>
                    <a href="/" className="hover:underline">
                      Inicio
                    </a>
                  </li>
                  <li>
                    <a href="/products" className="hover:underline">
                      Productos
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:underline">
                      Cómo funciona
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:underline">
                      Contacto
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
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
                    <li>
                      <a href="#" className="hover:underline">
                        Términos y condiciones
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline">
                        Política de privacidad
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline">
                        Preguntas frecuentes
                      </a>
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
        </ProductSelectionProvider>
      </body>
    </html>
  )
}
