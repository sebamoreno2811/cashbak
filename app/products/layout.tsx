import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Productos",
  description: "Explora toda la colección de camisetas de fútbol en CashBak. Camisetas actuales y retro con cashback hasta el 100% si se cumple tu evento deportivo.",
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
