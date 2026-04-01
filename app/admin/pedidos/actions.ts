"use server"

import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")
  const { data } = await supabase.from("customers").select("role").eq("id", user.id).single()
  if (data?.role !== "admin") throw new Error("No autorizado")
  return supabase
}

export async function updateOrderStatuses(orderId: string, fields: {
  order_status?: string
  shipping_status?: string
  cashback_status?: string
  cashback_transfer_note?: string
  vendor_paid?: boolean
}) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("orders")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", orderId)
  if (error) return { error: error.message }
  revalidatePath("/admin/pedidos")
  return { success: true }
}
