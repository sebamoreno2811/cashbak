import type { Metadata } from "next"
import { createSupabaseClientWithoutCookies } from "@/utils/supabase/server"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = createSupabaseClientWithoutCookies()
  const { data: product } = await supabase
    .from("products")
    .select("name, description, image")
    .eq("id", id)
    .single()

  if (!product) {
    return { title: "Producto no encontrado" }
  }

  return {
    title: product.name,
    description: product.description ?? `Compra ${product.name} en CashBak y recupera hasta el 100% de tu dinero.`,
    openGraph: {
      title: product.name,
      description: product.description ?? `Compra ${product.name} en CashBak.`,
      images: product.image ? [{ url: product.image }] : [],
    },
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children
}
