"use server"

import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateShippingStatus(orderId: string, shipping_status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  // Verificar que el vendedor tenga productos en este pedido
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()
  if (!store) return { error: "No tienes una tienda registrada" }

  const { data: storeProducts } = await supabase
    .from("products")
    .select("id")
    .eq("store_id", store.id)
  const productIds = (storeProducts ?? []).map((p: { id: number }) => String(p.id))

  const { data: orderItem } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderId)
    .in("product_id", productIds.length > 0 ? productIds : ["none"])
    .limit(1)
    .maybeSingle()

  if (!orderItem) return { error: "No tienes acceso a este pedido" }

  const { error } = await supabase
    .from("orders")
    .update({ shipping_status, updated_at: new Date().toISOString() })
    .eq("id", orderId)

  if (error) return { error: error.message }
  revalidatePath("/mi-tienda/pedidos")
  return { success: true }
}
