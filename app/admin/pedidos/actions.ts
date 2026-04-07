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

async function sendVendorPaidEmail(supabase: any, orderId: string) {
  try {
    // Obtener items del pedido con info de tienda y monto neto
    const { data: items } = await supabase
      .from("order_items")
      .select("vendor_net_amount, quantity, products(store_id)")
      .eq("order_id", orderId)

    if (!items || items.length === 0) return

    const storeId = items[0]?.products?.store_id
    if (!storeId) return

    const vendorNetAmount = items.reduce((sum: number, i: any) => sum + (i.vendor_net_amount ?? 0) * (i.quantity ?? 1), 0)

    const { data: store } = await supabase
      .from("stores")
      .select("name, email")
      .eq("id", storeId)
      .single()

    if (!store?.email) return

    const orderRef = orderId.slice(0, 8).toUpperCase()

    await resend.emails.send({
      from: EMAIL_FROM,
      to: store.email,
      subject: `💰 Transferencia realizada — Pedido #${orderRef}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
          <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
          <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:520px;text-align:left;">
            <h2 style="color:#14532d;margin-top:0;">¡Transferencia realizada! 💸</h2>
            <p style="color:#555;">Hola <strong>${store.name}</strong>, la transferencia correspondiente al pedido <strong>#${orderRef}</strong> ya fue realizada a tu cuenta bancaria registrada.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
              <p style="color:#166534;font-size:13px;margin:0 0 6px 0;">Monto transferido (neto)</p>
              <p style="color:#14532d;font-size:32px;font-weight:800;margin:0;">$${vendorNetAmount.toLocaleString("es-CL")}</p>
              <p style="color:#6b7280;font-size:11px;margin:6px 0 0 0;">Ya descontada la tarifa de procesamiento</p>
            </div>
            <p style="color:#555;font-size:14px;">El dinero ya fue depositado en la cuenta bancaria que registraste en tu tienda. Si tienes alguna duda, contáctanos.</p>
            <div style="text-align:center;margin:24px 0;">
              <div style="background:#f9fafb;border-radius:8px;padding:14px;font-size:13px;color:#374151;">
                <p style="margin:0 0 6px 0;font-weight:600;">¿Cómo ver tus pedidos?</p>
                <p style="margin:0;">Ingresa a <a href="${APP_URL}" style="color:#14532d;font-weight:600;">cashbak.cl</a>, inicia sesión con tu cuenta y ve a <strong>Mi Tienda → Mis Pedidos</strong>.</p>
              </div>
            </div>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CashBak · cashbak.cl · cashbak.ops@gmail.com</p>
          </div>
        </div>
      `,
    })
  } catch (e) {
    console.error(`[admin] Error enviando email de pago al vendedor (pedido ${orderId}):`, e)
  }
}

async function sendCashbackTransferredEmail(supabase: any, orderId: string) {
  try {
    const { data: order } = await supabase
      .from("orders")
      .select("cashback_amount, customer_id")
      .eq("id", orderId)
      .single()

    if (!order) return

    const { data: customer } = await supabase
      .from("customers")
      .select("email, full_name")
      .eq("id", order.customer_id)
      .single()

    if (!customer?.email) return

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
            <h2 style="color:#14532d;margin-top:0;">¡Tu CashBak está en camino! 🎉</h2>
            <p style="color:#555;">Hola <strong>${nombre}</strong>, el evento se cumplió y hemos depositado tu CashBak correspondiente al pedido <strong>#${orderRef}</strong>.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
              <p style="color:#166534;font-size:13px;margin:0 0 6px 0;">Monto depositado</p>
              <p style="color:#14532d;font-size:36px;font-weight:800;margin:0;">$${order.cashback_amount.toLocaleString("es-CL")}</p>
              <p style="color:#6b7280;font-size:11px;margin:6px 0 0 0;">Transferido a tu cuenta bancaria registrada</p>
            </div>
            <p style="color:#555;font-size:14px;">El dinero llegará a la cuenta que registraste en tu perfil. Si tienes alguna duda, contáctanos respondiendo este correo.</p>
            <div style="text-align:center;margin:24px 0;">
              <div style="background:#f9fafb;border-radius:8px;padding:14px;font-size:13px;color:#374151;">
                <p style="margin:0 0 6px 0;font-weight:600;">¿Quieres ver tus pedidos?</p>
                <p style="margin:0;">Ingresa a <a href="${APP_URL}" style="color:#14532d;font-weight:600;">cashbak.cl</a>, inicia sesión y ve a <strong>Mi Perfil → Mis Pedidos</strong>.</p>
              </div>
            </div>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CashBak · cashbak.cl · cashbak.ops@gmail.com</p>
          </div>
        </div>
      `,
    })
  } catch (e) {
    console.error(`[admin] Error enviando email de CashBak transferido al cliente (pedido ${orderId}):`, e)
  }
}

export async function bulkUpdateOrders(orderIds: string[], fields: {
  order_status?: string
  shipping_status?: string
  cashback_status?: string
  vendor_paid?: boolean
}) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("orders")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .in("id", orderIds)
  if (error) return { error: error.message }

  if (fields.vendor_paid === true) {
    await Promise.all(orderIds.map(id => sendVendorPaidEmail(supabase, id)))
  }

  if (fields.cashback_status === "transferido") {
    await Promise.all(orderIds.map(id => sendCashbackTransferredEmail(supabase, id)))
  }

  revalidatePath("/admin/pedidos")
  return { success: true }
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

  if (fields.vendor_paid === true) {
    await sendVendorPaidEmail(supabase, orderId)
  }

  if (fields.cashback_status === "transferido") {
    await sendCashbackTransferredEmail(supabase, orderId)
  }

  revalidatePath("/admin/pedidos")
  return { success: true }
}
