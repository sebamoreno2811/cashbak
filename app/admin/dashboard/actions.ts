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

export async function markBetsPlaced(orderItemIds: string[]) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("order_items")
    .update({ bet_placed: true })
    .in("id", orderItemIds)
  if (error) return { error: error.message }
  revalidatePath("/admin/dashboard")
  return { success: true }
}
