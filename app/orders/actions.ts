"use server"

import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function confirmOrderReceived(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  // Verificar que la orden pertenece al usuario
  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle()

  if (!order) return { error: "Orden no encontrada" }

  const { error } = await supabase
    .from("orders")
    .update({ customer_confirmed: true, shipping_status: "Entregado", updated_at: new Date().toISOString() })
    .eq("id", orderId)

  if (error) return { error: error.message }
  revalidatePath("/orders")
  return { success: true }
}
