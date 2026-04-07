"use server"

import { createSupabaseClientWithoutCookies } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cashbak.cl"
const EMAIL_FROM = process.env.EMAIL_FROM || "support@cashbak.cl"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseClientWithoutCookies()
  const now = new Date()
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()

  let autoConfirmed = 0
  let remindersSent = 0

  // ── 1. Auto-confirmar pedidos con 10+ días sin confirmación ──────────────
  const { data: toConfirm } = await supabase
    .from("orders")
    .select("id")
    .eq("customer_confirmed", false)
    .not("customer_notified_at", "is", null)
    .lt("customer_notified_at", tenDaysAgo)

  if (toConfirm && toConfirm.length > 0) {
    const ids = toConfirm.map((o: any) => o.id)
    await supabase
      .from("orders")
      .update({ customer_confirmed: true, shipping_status: "Entregado" })
      .in("id", ids)
    autoConfirmed = ids.length
    console.log(`[cron] Auto-confirmed ${ids.length} orders`)
  }

  // ── 2. Enviar recordatorio a pedidos con 5-10 días sin confirmación ───────
  const { data: toRemind } = await supabase
    .from("orders")
    .select("id, shipping_status, customers(email, full_name)")
    .eq("customer_confirmed", false)
    .is("reminder_sent_at", null)
    .not("customer_notified_at", "is", null)
    .lt("customer_notified_at", fiveDaysAgo)
    .gt("customer_notified_at", tenDaysAgo)
    .in("shipping_status", ["Enviado", "Listo para entrega"])

  for (const order of toRemind ?? []) {
    const customerEmail = (order as any).customers?.email
    const customerName = (order as any).customers?.full_name ?? "Cliente"
    const orderRef = order.id.slice(0, 8).toUpperCase()
    const shippingStatus: string = order.shipping_status ?? ""

    if (!customerEmail) continue

    // Generar token de confirmación
    let confirmUrl = `${APP_URL}/orders`
    try {
      const { data: tokenRow } = await supabase
        .from("order_tokens")
        .insert({ order_id: order.id, action: "confirm_received" })
        .select("token")
        .single()
      if (tokenRow?.token) {
        confirmUrl = `${APP_URL}/api/order-action/${tokenRow.token}`
      }
    } catch (e) {
      console.error(`[cron] Error generando token para pedido ${order.id}:`, e)
    }

    const isPickup = shippingStatus === "Listo para entrega"

    const subject = isPickup
      ? `Recordatorio: ¿Ya retiraste tu pedido #${orderRef}?`
      : `Recordatorio: ¿Ya recibiste tu pedido #${orderRef}?`

    const actionText = isPickup ? "retirarlo" : "recibirlo"
    const actionBtn = isPickup ? "✅ Confirmar retiro" : "✅ Confirmar recepción"
    const contextText = isPickup
      ? `Tu pedido <strong>#${orderRef}</strong> lleva varios días listo para ser retirado. Si aún no lo has pasado a buscar, recuerda que tienes tiempo para hacerlo.`
      : `Tu pedido <strong>#${orderRef}</strong> fue enviado hace varios días. Si ya lo recibiste, por favor confírmalo para que podamos completar el proceso.`

    const html = `
      <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
        <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
        <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:520px;text-align:left;">
          <h2 style="color:#14532d;margin-top:0;">¿Ya ${actionText} tu pedido?</h2>
          <p style="color:#555;">Hola ${customerName}, ${contextText}</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin:20px 0;">
            <p style="color:#92400e;margin:0;font-size:13px;">
              <strong>⚠️ Aviso:</strong> Si ya recibiste el pedido y no confirmas en los próximos días, tu pedido se confirmará automáticamente.
            </p>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${confirmUrl}" style="display:inline-block;padding:13px 28px;background:#14532d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
              ${actionBtn}
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;">O ingresa a <a href="${APP_URL}/orders" style="color:#14532d;">Mis pedidos</a> en tu cuenta de CashBak.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CashBak · cashbak.cl</p>
        </div>
      </div>
    `

    try {
      await resend.emails.send({ from: EMAIL_FROM, to: customerEmail, subject, html })
      await supabase
        .from("orders")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", order.id)
      remindersSent++
    } catch (e) {
      console.error(`[cron] Error enviando recordatorio pedido ${order.id}:`, e)
    }
  }

  return NextResponse.json({
    ok: true,
    auto_confirmed: autoConfirmed,
    reminders_sent: remindersSent,
  })
}
