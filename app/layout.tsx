import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { CartProvider } from "@/hooks/use-cart"
import { BetOptionProvider } from "@/hooks/use-bet-option"
import { ProductSelectionProvider } from "@/hooks/use-product-selection"
import { ProductsProvider } from "@/context/product-context" // ⬅️ AÑADE ESTO
import { Inter } from "next/font/google"
import ClientLayout from "@/components/ClientLayout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CashBak - Camisetas con cashbak",
  description: "Compra camisetas retro y recibe CashBak cuando tu equipo gane",
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ProductsProvider>
          <BetOptionProvider>
            <ProductSelectionProvider>
                <CartProvider>
                  <ClientLayout>{children}</ClientLayout>
                </CartProvider>
            </ProductSelectionProvider>
          </BetOptionProvider>
        </ProductsProvider> 
      </body>
    </html>
  )
}
