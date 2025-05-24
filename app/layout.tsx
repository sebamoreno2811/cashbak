import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { CartProvider } from "@/hooks/use-cart"
import { BetOptionProvider } from "@/hooks/use-bet-option"
import { ProductSelectionProvider } from "@/hooks/use-product-selection"
import { Inter } from "next/font/google"
import ClientLayout from "@/components/ClientLayout" 

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CashBak - Camisetas con CashBack",
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
        <BetOptionProvider>
          <ProductSelectionProvider>
            <CartProvider>
              <ClientLayout>{children}</ClientLayout>
            </CartProvider>
          </ProductSelectionProvider>
        </BetOptionProvider>
      </body>
    </html>
  )
}
