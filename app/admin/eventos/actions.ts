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

  // Buscar todos los pedidos que tengan items con este evento
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("bet_option_id", betId)

  if (orderItems && orderItems.length > 0) {
    const orderIds = [...new Set(orderItems.map((i: { order_id: string }) => i.order_id))]

    const { data: orders } = await supabase
      .from("orders")
      .select("id, customer_id")
      .in("id", orderIds)

    if (orders && orders.length > 0) {
      const customerIds = orders.map((o: { id: string; customer_id: string }) => o.customer_id)

      const { data: bankAccounts } = await supabase
        .from("bank_accounts")
        .select("customer_id")
        .in("customer_id", customerIds)

      const customersWithBank = new Set((bankAccounts ?? []).map((b: { customer_id: string }) => b.customer_id))

      for (const order of orders as { id: string; customer_id: string }[]) {
        const hasBankAccount = customersWithBank.has(order.customer_id)
        await supabase
          .from("orders")
          .update({
            cashback_status: "transferencia_pendiente",
            cashback_transfer_note: hasBankAccount ? null : "Datos de transferencia faltantes",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)
      }
    }
  }

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
