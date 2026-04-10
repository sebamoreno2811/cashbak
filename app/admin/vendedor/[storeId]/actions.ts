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
  console.log(`[sendVendorPaidEmail] START orderId=${orderId}`)

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("vendor_net_amount, quantity, product_id")
    .eq("order_id", orderId)

  console.log(`[sendVendorPaidEmail] items=`, JSON.stringify(items), "error=", itemsError?.message)
  if (!items || items.length === 0) return

  const productId = items[0]?.product_id
  if (!productId) return

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("store_id")
    .eq("id", Number(productId))
    .single()

  console.log(`[sendVendorPaidEmail] product=`, JSON.stringify(product), "error=", productError?.message)
  const storeId = product?.store_id
  if (!storeId) return

  const vendorNetAmount = items.reduce((sum: number, i: any) => sum + (i.vendor_net_amount ?? 0) * (i.quantity ?? 1), 0)

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("name, email")
    .eq("id", storeId)
    .single()

  console.log(`[sendVendorPaidEmail] store=`, JSON.stringify(store), "error=", storeError?.message)
  if (!store?.email) return

  const orderRef = orderId.slice(0, 8).toUpperCase()
  console.log(`[sendVendorPaidEmail] Sending to ${store.email} amount=${vendorNetAmount}`)

  const { data: emailData, error: emailError } = await resend.emails.send({
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

  console.log(`[sendVendorPaidEmail] Resend data=`, JSON.stringify(emailData), "error=", JSON.stringify(emailError))
  if (emailError) throw new Error(`Resend error: ${JSON.stringify(emailError)}`)
}

export async function markOrderVendorPaid(orderId: string, storeId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("orders")
    .update({ vendor_paid: true, updated_at: new Date().toISOString() })
    .eq("id", orderId)
  if (error) return { error: error.message }

  try {
    await sendVendorPaidEmail(supabase, orderId)
  } catch (e: any) {
    console.error("[markOrderVendorPaid] email error:", e?.message)
    return { success: true, emailError: e?.message }
  }

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

  await Promise.all(orderIds.map(id =>
    sendVendorPaidEmail(supabase, id).catch(e =>
      console.error(`[markAllVendorPaid] email error for ${id}:`, e?.message)
    )
  ))

  revalidatePath(`/admin/vendedor/${storeId}`)
  revalidatePath("/admin/dashboard")
  return { success: true }
}
