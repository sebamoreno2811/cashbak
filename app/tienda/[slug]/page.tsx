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
  logo_url: string | null
}

export default async function TiendaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, description, category, logo_url")
    .eq("slug", slug)
    .eq("status", "approved")
    .single()

  if (!store) notFound()

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, cost, description, image, category, category_name, brand, stock, video_url, hasPrint, print_text, margin_pct, net_margin, store_id")
    .eq("store_id", store.id)
    .order("id", { ascending: false })

  return <StorePageClient store={store as Store} products={(products ?? []) as Product[]} />
}
