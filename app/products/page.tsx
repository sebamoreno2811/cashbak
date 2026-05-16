import { createSupabaseClientWithoutCookies } from "@/utils/supabase/server"
import type { Product } from "@/types/product"
import type { Bet } from "@/context/bet-context"
import ProductsClient from "./ProductsClient"

interface Store {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

export default async function ProductsPage() {
  const supabase = createSupabaseClientWithoutCookies()

  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

  const [{ data: products }, { data: stores }, { data: bets }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, cost, description, image, category, category_name, category_names, brand, stock, margin_pct, net_margin, store_id")
      .order("id", { ascending: false }),
    supabase
      .from("stores")
      .select("id, name, slug, logo_url")
      .eq("status", "approved"),
    supabase
      .from("bets")
      .select("id, name, odd, sport, category, end_date, is_winner")
      .eq("active", true)
      .gt("end_date", cutoff)
      .order("end_date", { ascending: true }),
  ])

  return (
    <ProductsClient
      initialProducts={(products ?? []) as Product[]}
      initialStores={(stores ?? []) as Store[]}
      initialBets={(bets ?? []) as Bet[]}
    />
  )
}
