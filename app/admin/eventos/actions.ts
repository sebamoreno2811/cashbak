"use server"

import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { sendPushToUser } from "@/lib/push"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cashbak.cl"
const EMAIL_FROM = process.env.EMAIL_FROM || "support@cashbak.cl"

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
    .select("order_id, price, quantity, cashback_percentage")
    .eq("bet_option_id", betId)

  if (orderItems && orderItems.length > 0) {
    const orderIds = [...new Set(orderItems.map((i: any) => i.order_id))]

    // Cashback ganado por orden (solo items de este evento)
    const cashbackByOrder: Record<string, number> = {}
    for (const item of orderItems) {
      cashbackByOrder[item.order_id] = (cashbackByOrder[item.order_id] ?? 0) +
        Math.round((item.price ?? 0) * (item.quantity ?? 1) * (item.cashback_percentage ?? 0) / 100)
    }

    const { data: orders } = await supabase
      .from("orders")
      .select("id, customer_id")
      .in("id", orderIds)

    if (orders && orders.length > 0) {
      const customerIds = orders.map((o: any) => o.customer_id)

      const [{ data: bankAccounts }, { data: customers }] = await Promise.all([
        supabase.from("bank_accounts").select("customer_id").in("customer_id", customerIds),
        supabase.from("customers").select("id, email, full_name").in("id", customerIds),
      ])

      const customersWithBank = new Set((bankAccounts ?? []).map((b: any) => b.customer_id))
      const customerMap = Object.fromEntries((customers ?? []).map((c: any) => [c.id, c]))

      for (const order of orders as any[]) {
        const hasBankAccount = customersWithBank.has(order.customer_id)
        await supabase
          .from("orders")
          .update({
            cashback_status: "transferencia_pendiente",
            cashback_transfer_note: hasBankAccount ? null : "Datos de transferencia faltantes",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)

        // Email al comprador
        const customer = customerMap[order.customer_id]
        if (!customer?.email) continue
        const cashbackAmount = cashbackByOrder[order.id] ?? 0
        const orderRef = order.id.slice(0, 8).toUpperCase()

        try {
          sendPushToUser(order.customer_id, {
            title: "🏆 ¡Tu evento se cumplió!",
            body: `Tu CashBak de $${cashbackAmount.toLocaleString("es-CL")} para el pedido #${orderRef} está en camino.`,
            url: "/orders",
          }).catch(() => {})

          await resend.emails.send({
            from: EMAIL_FROM,
            to: customer.email,
            subject: `🎉 ¡Tu evento se cumplió! CashBak pedido #${orderRef}`,
            html: `
              <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
                <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
                <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:520px;text-align:left;">
                  <h2 style="color:#14532d;margin-top:0;">¡Felicidades, tu evento se cumplió! 🏆</h2>
                  <p style="color:#555;">Hola ${customer.full_name ?? ""},  el evento que elegiste al momento de tu compra resultó a tu favor.</p>
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
                    <p style="color:#166534;font-size:13px;margin:0 0 6px 0;">Tu CashBak para el pedido <strong>#${orderRef}</strong></p>
                    <p style="color:#14532d;font-size:32px;font-weight:800;margin:0;">$${cashbackAmount.toLocaleString("es-CL")}</p>
                  </div>
                  <p style="color:#555;font-size:14px;">Recibirás esta transferencia pronto en la cuenta bancaria que registraste en tu perfil.</p>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="${APP_URL}/orders" style="display:inline-block;padding:12px 24px;background:#14532d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
                      Ver mis pedidos →
                    </a>
                  </div>
                  <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CashBak · cashbak.cl</p>
                </div>
              </div>
            `,
          })
        } catch (e) {
          console.error(`[eventos] Error enviando email ganador a ${customer.email}:`, e)
        }
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

  // Actualizar cashback_status de todos los pedidos con este evento
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("bet_option_id", betId)

  if (orderItems && orderItems.length > 0) {
    const orderIds = [...new Set(orderItems.map((i: any) => i.order_id))]

    // Para cada orden, revisar el estado de TODOS sus eventos antes de actualizar
    const { data: orders } = await supabase
      .from("orders")
      .select("id, customer_id, customers(email, full_name)")
      .in("id", orderIds)

    for (const order of orders as any[] ?? []) {
      // Obtener todos los bet_option_id de esta orden
      const { data: allItems } = await supabase
        .from("order_items")
        .select("bet_option_id")
        .eq("order_id", order.id)

      const allBetIds = [...new Set((allItems ?? []).map((i: any) => i.bet_option_id).filter(Boolean))]

      // Obtener el resultado de todos los eventos de esta orden
      const { data: allBets } = await supabase
        .from("bets")
        .select("id, is_winner")
        .in("id", allBetIds.length > 0 ? allBetIds : [-1])

      const hasWinner = (allBets ?? []).some((b: any) => b.is_winner === true)
      const allResolved = (allBets ?? []).every((b: any) => b.is_winner !== null)

      if (hasWinner) {
        // Al menos un evento ganó — mantener transferencia_pendiente
        await supabase
          .from("orders")
          .update({ cashback_status: "transferencia_pendiente", updated_at: new Date().toISOString() })
          .eq("id", order.id)
      } else if (allResolved) {
        // Todos los eventos resueltos y todos perdieron
        await supabase
          .from("orders")
          .update({ cashback_status: "evento_perdido", updated_at: new Date().toISOString() })
          .eq("id", order.id)

        // Email solo si todos los eventos de la orden fallaron
        const customer = order.customers
        if (!customer?.email) continue
        const orderRef = order.id.slice(0, 8).toUpperCase()

        try {
          sendPushToUser(order.customer_id, {
            title: "Tu evento no se cumplió",
            body: `El evento de tu pedido #${orderRef} no resultó, pero tu producto sigue en camino.`,
            url: "/orders",
          }).catch(() => {})

          await resend.emails.send({
            from: EMAIL_FROM,
            to: customer.email,
            subject: `Tu evento no se cumplió — Pedido #${orderRef}`,
            html: `
              <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
                <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
                <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:520px;text-align:left;">
                  <h2 style="color:#374151;margin-top:0;">Esta vez no fue, ¡pero no te desanimes!</h2>
                  <p style="color:#555;">Hola ${customer.full_name ?? ""}, el evento que elegiste para tu pedido <strong>#${orderRef}</strong> no se cumplió esta vez.</p>
                  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;">
                    <p style="color:#6b7280;font-size:14px;margin:0;">Tu producto llegó o llegará de todas formas y eso es lo importante. El próximo evento podría ser el que te otorgue ese CashBak que estás esperando. 💪</p>
                  </div>
                  <p style="color:#555;font-size:14px;">Sigue explorando productos y elige el evento que más te convenza en tu próxima compra.</p>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="${APP_URL}/products" style="display:inline-block;padding:12px 24px;background:#14532d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
                      Explorar productos →
                    </a>
                  </div>
                  <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CashBak · cashbak.cl</p>
                </div>
              </div>
            `,
          })
        } catch (e) {
          console.error(`[eventos] Error enviando email perdedor a ${customer.email}:`, e)
        }
      }
      // Si aún hay eventos pendientes: no cambiar el estado de la orden
    }
  }

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
