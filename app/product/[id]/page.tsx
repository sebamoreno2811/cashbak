import { redirect } from "next/navigation"
import { createSupabaseClientWithoutCookies } from "@/utils/supabase/server"
import { toSlug } from "@/lib/slug"

export default async function ProductRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createSupabaseClientWithoutCookies()
  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", id)
    .single()

  if (!product) redirect("/products")
  redirect(`/product/${id}/${toSlug(product.name)}`)
}
