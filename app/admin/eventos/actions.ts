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

export async function markBetWinner(betId: number) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("bets")
    .update({ is_winner: true, active: false })
    .eq("id", betId)
  if (error) return { error: error.message }
  revalidatePath("/admin/eventos")
  revalidatePath("/admin/pedidos")
  return { success: true }
}

export async function markBetLost(betId: number) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("bets")
    .update({ is_winner: false, active: false })
    .eq("id", betId)
  if (error) return { error: error.message }
  revalidatePath("/admin/eventos")
  revalidatePath("/admin/pedidos")
  return { success: true }
}

export async function reactivateBet(betId: number) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("bets")
    .update({ is_winner: null, active: true })
    .eq("id", betId)
  if (error) return { error: error.message }
  revalidatePath("/admin/eventos")
  return { success: true }
}
