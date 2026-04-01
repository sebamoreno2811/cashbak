"use server"

import { createSupabaseClientWithCookies as createClient, createSupabaseClientWithoutCookies } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cashbak.cl"
const EMAIL_FROM = process.env.EMAIL_FROM || "support@cashbak.cl"

export async function updateShippingStatus(orderId: string, shipping_status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  // Verificar que el vendedor tenga productos en este pedido
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, delivery_options")
    .eq("owner_id", user.id)
    .single()
  if (!store) return { error: "No tienes una tienda registrada" }

  const { data: storeProducts } = await supabase
    .from("products")
    .select("id")
    .eq("store_id", store.id)
  const productIds = (storeProducts ?? []).map((p: { id: number }) => String(p.id))

  const { data: orderItem } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderId)
    .in("product_id", productIds.length > 0 ? productIds : ["none"])
    .limit(1)
    .maybeSingle()

  if (!orderItem) return { error: "No tienes acceso a este pedido" }

  const { error } = await supabase
    .from("orders")
    .update({ shipping_status, updated_at: new Date().toISOString() })
    .eq("id", orderId)

  if (error) return { error: error.message }
  revalidatePath("/mi-tienda/pedidos")

  // Enviar email al cliente cuando el estado es relevante
  if (shipping_status === "Listo para entrega" || shipping_status === "Enviado") {
    try {
      // Obtener datos del pedido y cliente
      const { data: order } = await supabase
        .from("orders")
        .select("id, shipping_method, customer_id, customers(email, full_name)")
        .eq("id", orderId)
        .single() as any

      const customerEmail = order?.customers?.email
      const customerName = order?.customers?.full_name ?? "Cliente"
      const shippingMethod = order?.shipping_method ?? ""

      if (!customerEmail) return { success: true }

      // Encontrar la delivery option para saber si es pickup o delivery
      const deliveryOptions: any[] = store.delivery_options ?? []
      const chosenOption = deliveryOptions.find((o: any) => o.name === shippingMethod)
      const isPickup = chosenOption?.type === "pickup"
      const pickupAddress = chosenOption?.address ?? ""

      // Generar token de confirmación (requiere service role para saltarse RLS)
      const supabaseAdmin = createSupabaseClientWithoutCookies()
      const { data: tokenRow } = await supabaseAdmin
        .from("order_tokens")
        .insert({ order_id: orderId, action: "confirm_received" })
        .select("token")
        .single()

      const confirmUrl = tokenRow?.token
        ? `${APP_URL}/api/order-action/${tokenRow.token}`
        : `${APP_URL}/orders`

      const ordersUrl = `${APP_URL}/orders`
      const orderRef = orderId.slice(0, 8).toUpperCase()

      let subject: string
      let html: string

      if (shipping_status === "Listo para entrega") {
        subject = `Tu pedido #${orderRef} está listo para retiro`
        html = `
          <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
            <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
            <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:520px;text-align:left;">
              <h2 style="color:#14532d;margin-top:0;">¡Tu pedido está listo para retiro!</h2>
              <p style="color:#555;">Hola ${customerName}, tu pedido <strong>#${orderRef}</strong> en <strong>${store.name}</strong> ya está listo para que lo pases a buscar.</p>
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;">
                <p style="color:#1e40af;margin:0;font-size:14px;">
                  <strong>Lugar de retiro:</strong> ${shippingMethod}${pickupAddress ? `<br/><strong>Dirección:</strong> ${pickupAddress}` : ""}
                </p>
              </div>
              <p style="color:#555;font-size:14px;">Cuando lo retires, confirma la recepción:</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${confirmUrl}" style="display:inline-block;padding:13px 28px;background:#14532d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
                  ✅ Confirmar retiro
                </a>
              </div>
              <p style="color:#9ca3af;font-size:12px;text-align:center;">O ingresa a <a href="${ordersUrl}" style="color:#14532d;">Mis pedidos</a> en tu cuenta de CashBak para confirmar.</p>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CashBak · cashbak.cl</p>
            </div>
          </div>
        `
      } else {
        // Enviado
        subject = `Tu pedido #${orderRef} fue enviado`
        html = `
          <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
            <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
            <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:520px;text-align:left;">
              <h2 style="color:#14532d;margin-top:0;">¡Tu pedido está en camino!</h2>
              <p style="color:#555;">Hola ${customerName}, el vendedor de <strong>${store.name}</strong> ha enviado tu pedido <strong>#${orderRef}</strong>.</p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
                <p style="color:#166534;margin:0;font-size:14px;">
                  <strong>Método de envío:</strong> ${shippingMethod}
                </p>
              </div>
              <p style="color:#555;font-size:14px;">Cuando lo recibas, confirma con un click:</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${confirmUrl}" style="display:inline-block;padding:13px 28px;background:#14532d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
                  ✅ Confirmar recepción
                </a>
              </div>
              <p style="color:#9ca3af;font-size:12px;text-align:center;">O ingresa a <a href="${ordersUrl}" style="color:#14532d;">Mis pedidos</a> en tu cuenta de CashBak para confirmar.</p>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CashBak · cashbak.cl</p>
            </div>
          </div>
        `
      }

      await resend.emails.send({ from: EMAIL_FROM, to: customerEmail, subject, html })
    } catch (e) {
      console.error("Error enviando email de estado:", e)
    }
  }

  return { success: true }
}
