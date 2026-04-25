import { notFound } from "next/navigation"
import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import type { Product } from "@/types/product"
import StorePageClient from "./StorePageClient"

interface Store {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  categories: string[] | null
  logo_url: string | null
}

export default async function TiendaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Buscar por slug primero, si no existe buscar por id (para tiendas sin slug)
  let { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, description, category, categories, logo_url")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle()

  if (!store) {
    const { data: byId } = await supabase
      .from("stores")
      .select("id, name, slug, description, category, categories, logo_url")
      .eq("id", slug)
      .eq("status", "approved")
      .maybeSingle()
    store = byId
  }

  if (!store) notFound()

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, cost, description, image, category, category_name, category_names, brand, stock, video_url, margin_pct, net_margin, store_id")
    .eq("store_id", store.id)
    .order("id", { ascending: false })

  return <StorePageClient store={store as Store} products={(products ?? []) as Product[]} />
}
