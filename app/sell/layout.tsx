import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vende con nosotros — Simula tu cashback",
  description: "¿Tienes una tienda o productos para vender? Únete a CashBak, el marketplace chileno de cashback. Simula cuánto cashback puedes ofrecer y cómo funciona tu comisión en tiempo real.",
  keywords: ["vender en Chile", "marketplace vendedores Chile", "plataforma de ventas cashback", "vender con cashback", "tienda online Chile", "cashbak vendedores"],
  openGraph: {
    title: "Vende con nosotros en CashBak",
    description: "Simula cómo funcionaría vender en CashBak: cuánto cashback ofrecer, cuánto te quedas y cuánto se lleva la plataforma.",
    url: "https://cashbak.cl/sell",
  },
}

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children
}
