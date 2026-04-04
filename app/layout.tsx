import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Analytics } from "@vercel/analytics/react"
import PostHogProvider from "@/components/PostHogProvider"
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
  description: "CashBak es el marketplace chileno donde compras en múltiples tiendas y recuperas parte de tu dinero si se cumple tu evento deportivo. Tecnología, cashback y variedad en un solo lugar.",
  keywords: ["cashback Chile", "marketplace Chile", "tiendas online Chile", "cashbak", "compras con cashback", "recupera tu dinero", "marketplace deportivo", "variedad de tiendas", "tecnología ecommerce", "cashback deportivo", "compras online Chile", "plataforma de comercio"],
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
        <Analytics />
        <PostHogProvider>
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
        </PostHogProvider>
      </body>
    </html>
  )
}
