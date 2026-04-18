import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Productos con Cashback en Chile",
  description: "Explora todos los productos disponibles en CashBak. Compra en Chile con cashback: si se cumple tu evento deportivo recuperas hasta el 100% de tu dinero.",
  keywords: ["productos cashback Chile", "comprar con cashback", "tiendas Chile cashback", "cashbak productos"],
  openGraph: {
    title: "Productos con Cashback en Chile — CashBak",
    description: "Compra en CashBak y recupera hasta el 100% de tu dinero si se cumple tu evento deportivo.",
    url: "https://cashbak.cl/products",
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
