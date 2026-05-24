"use server"

import { createSupabaseClientWithCookies } from "@/utils/supabase/server"

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

  // Anti-hijack (M-07b): si ya existe una sesión con este order_id_client, debe ser del
  // mismo usuario. Sin esto un usuario autenticado podría pisar la sesión de checkout
  // de otro si llegara a conocer/enumerar su order_id_client.
  const { data: existing } = await supabase
    .from("checkout_sessions")
    .select("user_id")
    .eq("order_id_client", data.orderIdClient)
    .maybeSingle()

  if (existing && (existing as { user_id: string }).user_id !== user.id) {
    console.warn(
      "[checkout-session] intento de pisar sesión ajena",
      "order_id_client=", data.orderIdClient,
      "actor=", user.id
    )
    return { error: "No se pudo guardar la sesión" }
  }

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
    return { error: "No se pudo guardar la sesión" }
  }
  return { error: null }
}

// Nota: getCheckoutSession y deleteCheckoutSession se eliminaron (C-01) porque eran
// server actions invocables por cualquier visitante con el service-role client y sin
// verificación de ownership. La lectura/borrado real de checkout_sessions vive en
// lib/order-creation.ts (server-only, llamado únicamente desde /api/webpay/commit
// tras tx.commit() autorizado por Transbank).
