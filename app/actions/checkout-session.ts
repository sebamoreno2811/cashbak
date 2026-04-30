"use server"

import { createSupabaseClientWithCookies, createSupabaseAdminClient } from "@/utils/supabase/server"

export async function saveCheckoutSession(data: {
  orderIdClient: string
  cartItems: any[]
  shippingCost: number
  deliveryType: string
  cashbakTotal: number
}) {
  const supabase = await createSupabaseClientWithCookies()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { error } = await supabase.from("checkout_sessions").upsert({
    user_id: user.id,
    order_id_client: data.orderIdClient,
    cart_items: data.cartItems,
    shipping_cost: data.shippingCost,
    delivery_type: data.deliveryType,
    cashbak_total: data.cashbakTotal,
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: "order_id_client" })

  if (error) {
    console.error("[checkout-session] Error guardando sesión:", error)
    return { error: error.message }
  }
  return { error: null }
}

export async function getCheckoutSession(orderIdClient: string) {
  const admin = createSupabaseAdminClient()
  const { data } = await admin
    .from("checkout_sessions")
    .select("*")
    .eq("order_id_client", orderIdClient)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()
  return data
}

export async function deleteCheckoutSession(orderIdClient: string) {
  const admin = createSupabaseAdminClient()
  await admin.from("checkout_sessions").delete().eq("order_id_client", orderIdClient)
}
