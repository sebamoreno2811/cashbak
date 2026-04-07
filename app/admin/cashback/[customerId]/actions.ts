"use server"

import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"

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

export async function markCashbackTransferred(orderId: string, customerEmail: string) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from("orders")
    .update({ cashback_status: "transferido", updated_at: new Date().toISOString() })
    .eq("id", orderId)

  if (error) return { error: error.message }

  // Email al cliente
  try {
    const { data: order } = await supabase
      .from("orders")
      .select("customer_id")
      .eq("id", orderId)
      .single()

    if (order) {
      const [{ data: customer }, { data: items }] = await Promise.all([
        supabase.from("customers").select("email, full_name").eq("id", order.customer_id).single(),
        supabase.from("order_items").select("price, quantity, cashback_percentage, bet_option_id").eq("order_id", orderId),
      ])

      if (customer?.email && items) {
        const betIds = [...new Set(items.map((i: any) => i.bet_option_id).filter(Boolean))]
        const { data: bets } = await supabase.from("bets").select("id, is_winner").in("id", betIds.length > 0 ? betIds : [-1])
        const betMap = Object.fromEntries((bets ?? []).map((b: any) => [String(b.id), b]))

        const winningCashback = items
          .filter((i: any) => betMap[String(i.bet_option_id)]?.is_winner === true)
          .reduce((s: number, i: any) => s + Math.round(i.price * i.quantity * i.cashback_percentage / 100), 0)

        const orderRef = orderId.slice(0, 8).toUpperCase()
        const nombre = customer.full_name?.split(" ")[0] || "Cliente"

        await resend.emails.send({
          from: EMAIL_FROM,
          to: customer.email,
          subject: `🎉 Tu CashBak llegó — Pedido #${orderRef}`,
          html: `
            <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
              <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
              <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:520px;text-align:left;">
                <h2 style="color:#14532d;margin-top:0;">¡Tu CashBak fue transferido! 🎉</h2>
                <p style="color:#555;">Hola <strong>${nombre}</strong>, ya realizamos la transferencia de tu CashBak correspondiente al pedido <strong>#${orderRef}</strong>.</p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
                  <p style="color:#166534;font-size:13px;margin:0 0 6px 0;">Monto transferido</p>
                  <p style="color:#14532d;font-size:36px;font-weight:800;margin:0;">$${winningCashback.toLocaleString("es-CL")}</p>
                  <p style="color:#6b7280;font-size:11px;margin:6px 0 0 0;">Transferido a tu cuenta bancaria registrada</p>
                </div>
                <p style="color:#555;font-size:14px;">El dinero ya fue depositado en la cuenta que registraste en tu perfil. Si tienes alguna duda, contáctanos respondiendo este correo.</p>
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
      }
    }
  } catch (e) {
    console.error(`[cashback] Error enviando email de transferencia al cliente (pedido ${orderId}):`, e)
  }

  revalidatePath(`/admin/cashback/${encodeURIComponent(customerEmail)}`)
  revalidatePath("/admin/dashboard")
  return { success: true }
}

export async function markAllCashbackTransferred(orderIds: string[], customerEmail: string) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from("orders")
    .update({ cashback_status: "transferido", updated_at: new Date().toISOString() })
    .in("id", orderIds)

  if (error) return { error: error.message }

  // Email por cada orden
  for (const orderId of orderIds) {
    try {
      const { data: order } = await supabase
        .from("orders")
        .select("customer_id")
        .eq("id", orderId)
        .single()

      if (!order) continue

      const [{ data: customer }, { data: items }] = await Promise.all([
        supabase.from("customers").select("email, full_name").eq("id", order.customer_id).single(),
        supabase.from("order_items").select("price, quantity, cashback_percentage, bet_option_id").eq("order_id", orderId),
      ])

      if (!customer?.email || !items) continue

      const betIds = [...new Set(items.map((i: any) => i.bet_option_id).filter(Boolean))]
      const { data: bets } = await supabase.from("bets").select("id, is_winner").in("id", betIds.length > 0 ? betIds : [-1])
      const betMap = Object.fromEntries((bets ?? []).map((b: any) => [String(b.id), b]))

      const winningCashback = items
        .filter((i: any) => betMap[String(i.bet_option_id)]?.is_winner === true)
        .reduce((s: number, i: any) => s + Math.round(i.price * i.quantity * i.cashback_percentage / 100), 0)

      const orderRef = orderId.slice(0, 8).toUpperCase()
      const nombre = customer.full_name?.split(" ")[0] || "Cliente"

      await resend.emails.send({
        from: EMAIL_FROM,
        to: customer.email,
        subject: `🎉 Tu CashBak llegó — Pedido #${orderRef}`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
            <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
            <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:520px;text-align:left;">
              <h2 style="color:#14532d;margin-top:0;">¡Tu CashBak fue transferido! 🎉</h2>
              <p style="color:#555;">Hola <strong>${nombre}</strong>, ya realizamos la transferencia de tu CashBak correspondiente al pedido <strong>#${orderRef}</strong>.</p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
                <p style="color:#166534;font-size:13px;margin:0 0 6px 0;">Monto transferido</p>
                <p style="color:#14532d;font-size:36px;font-weight:800;margin:0;">$${winningCashback.toLocaleString("es-CL")}</p>
                <p style="color:#6b7280;font-size:11px;margin:6px 0 0 0;">Transferido a tu cuenta bancaria registrada</p>
              </div>
              <p style="color:#555;font-size:14px;">El dinero ya fue depositado en la cuenta que registraste en tu perfil.</p>
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
      console.error(`[cashback] Error enviando email (pedido ${orderId}):`, e)
    }
  }

  revalidatePath(`/admin/cashback/${encodeURIComponent(customerEmail)}`)
  revalidatePath("/admin/dashboard")
  return { success: true }
}
