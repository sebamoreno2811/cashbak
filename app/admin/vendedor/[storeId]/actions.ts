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

export async function markOrderVendorPaid(orderId: string, storeId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("orders")
    .update({ vendor_paid: true, updated_at: new Date().toISOString() })
    .eq("id", orderId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/vendedor/${storeId}`)
  revalidatePath("/admin/dashboard")
  return { success: true }
}

export async function markAllVendorPaid(orderIds: string[], storeId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("orders")
    .update({ vendor_paid: true, updated_at: new Date().toISOString() })
    .in("id", orderIds)
  if (error) return { error: error.message }
  revalidatePath(`/admin/vendedor/${storeId}`)
  revalidatePath("/admin/dashboard")
  return { success: true }
}
