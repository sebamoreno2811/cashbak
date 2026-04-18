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
  description: "CashBak es el marketplace chileno donde compras en múltiples tiendas y recuperas parte de tu dinero si se cumple tu evento deportivo. Cashback real en Chile.",
  keywords: [
    "cashback Chile",
    "cashbak",
    "marketplace Chile",
    "tiendas online Chile",
    "compras con cashback",
    "recupera tu dinero",
    "marketplace deportivo",
    "cashback deportivo Chile",
    "compras online Chile",
    "plataforma de comercio Chile",
    "ganar cashback Chile",
    "ecommerce cashback",
  ],
  metadataBase: new URL("https://cashbak.cl"),
  alternates: {
    canonical: "https://cashbak.cl",
  },
  openGraph: {
    siteName: "CashBak",
    locale: "es_CL",
    type: "website",
    url: "https://cashbak.cl",
    title: "CashBak — Compra y recupera tu dinero",
    description: "Compra en tiendas chilenas y recupera hasta el 100% de tu dinero con cashback si se cumple tu evento deportivo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CashBak — Cashback en Chile",
    description: "Compra en tiendas chilenas y recupera tu dinero con cashback si se cumple tu evento deportivo.",
  },
  verification: {
    google: "d2-BXDwd0vOrs2jrkdfCzYC9c8qeE9-wW7aZsDkONv0",
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#14532d" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CashBak" />
        <link rel="apple-touch-icon" href="/img/logo_no_text.png" />
      </head>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "CashBak",
              url: "https://cashbak.cl",
              logo: "https://cashbak.cl/img/logo_no_text.png",
              sameAs: ["https://www.instagram.com/cashbak.cl"],
              description: "CashBak es el marketplace chileno de cashback. Compra en tiendas chilenas y recupera hasta el 100% de tu dinero si se cumple tu evento deportivo.",
              address: {
                "@type": "PostalAddress",
                addressCountry: "CL",
              },
            }),
          }}
        />
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
