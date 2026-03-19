"use server"

import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

async function getVendorStore(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, owner_id, status")
    .eq("owner_id", userId)
    .eq("status", "approved")
    .single()
  return store
}

export async function addProduct(formData: {
  name: string
  price: number
  cost: number
  margin_pct: number
  net_margin: number
  category_name: string
  description?: string
  image_url?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const store = await getVendorStore(supabase, user.id)
  if (!store) return { error: "No tienes una tienda aprobada" }

  const { error } = await supabase.from("products").insert({
    name: formData.name.trim(),
    price: formData.price,
    cost: formData.cost,
    margin_pct: formData.margin_pct,
    net_margin: formData.net_margin,
    category_name: formData.category_name,
    description: formData.description?.trim() || null,
    image: formData.image_url || null,
    store_id: store.id,
    category: 1,
    stock: {},
  })

  if (error) return { error: error.message }
  revalidatePath("/mi-tienda")
  return { success: true }
}

export async function updateProduct(productId: number, formData: {
  name: string
  price: number
  cost: number
  margin_pct: number
  net_margin: number
  category_name: string
  description?: string
  image_url?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const store = await getVendorStore(supabase, user.id)
  if (!store) return { error: "No tienes una tienda aprobada" }

  const { error } = await supabase.from("products")
    .update({
      name: formData.name.trim(),
      price: formData.price,
      cost: formData.cost,
      margin_pct: formData.margin_pct,
      net_margin: formData.net_margin,
      category_name: formData.category_name,
      description: formData.description?.trim() || null,
      image: formData.image_url || null,
    })
    .eq("id", productId)
    .eq("store_id", store.id)

  if (error) return { error: error.message }
  revalidatePath("/mi-tienda")
  return { success: true }
}

export async function deleteProduct(productId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const store = await getVendorStore(supabase, user.id)
  if (!store) return { error: "No tienes una tienda aprobada" }

  const { error } = await supabase.from("products")
    .delete()
    .eq("id", productId)
    .eq("store_id", store.id)

  if (error) return { error: error.message }
  revalidatePath("/mi-tienda")
  return { success: true }
}
