import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import TiendasClient from "./TiendasClient"

export default async function TiendasPage() {
  const supabase = await createClient()

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, logo_url, category, categories, description")
    .eq("status", "approved")
    .order("created_at", { ascending: true })

  // Contar productos por tienda
  const { data: counts } = await supabase
    .from("products")
    .select("store_id")

  const productCount: Record<string, number> = {}
  for (const row of (counts ?? []) as { store_id: string | null }[]) {
    if (row.store_id) productCount[row.store_id] = (productCount[row.store_id] ?? 0) + 1
  }

  const storesWithCount = (stores ?? []).map(s => ({
    ...s,
    productCount: productCount[s.id] ?? 0,
  }))

  return <TiendasClient stores={storesWithCount} />
}
