import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { CartProvider } from "@/hooks/use-cart"
import { BetOptionProvider } from "@/hooks/use-bet-option"
import { ProductSelectionProvider } from "@/hooks/use-product-selection"
import { ProductsProvider } from "@/context/product-context" // ⬅️ AÑADE ESTO
import { Inter } from "next/font/google"
import ClientLayout from "@/components/ClientLayout"
import { OrdersProvider } from "@/context/orders-context"
import { BetProvider } from "@/context/bet-context"
import { ShippingAddressProvider } from "@/context/shipping-context"
import { CommentProvider } from "@/context/comment-context"
import { CustomerProvider } from "@/context/customer-context"



const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "CashBak — Compra y recupera tu dinero",
    template: "%s | CashBak",
  },
  description: "Compra camisetas de fútbol y recupera hasta el 100% de tu dinero si se cumple tu evento deportivo. Envíos a todo Chile.",
  keywords: ["camisetas fútbol", "réplicas", "cashback", "cashbak", "camisetas Chile", "deporte"],
  openGraph: {
    siteName: "CashBak",
    locale: "es_CL",
    type: "website",
  },
  verification: {
    google: "RGA8T8bZSUjuiwnKbeDj72PjJtxeZINh2Wk1UGJBt8Y",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-dark.png', media: '(prefers-color-scheme: dark)' },
    ],
  },
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
          <BetProvider>
            <CustomerProvider>
              <CommentProvider>
                <BetOptionProvider>
                  <OrdersProvider>
                    <ProductSelectionProvider>
                        <CartProvider>
                          <ShippingAddressProvider>
                            <ClientLayout>{children}</ClientLayout>
                          </ShippingAddressProvider>
                        </CartProvider>
                    </ProductSelectionProvider>
                  </OrdersProvider>
                </BetOptionProvider>
              </CommentProvider>
            </CustomerProvider>
          </BetProvider>
        </ProductsProvider>
      </body>
    </html>
  )
}
