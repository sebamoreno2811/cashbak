import { NextResponse } from "next/server"
import { createSupabaseClientWithoutCookies } from "@/utils/supabase/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cashbak.cl"
const EMAIL_FROM = process.env.EMAIL_FROM || "support@cashbak.cl"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createSupabaseClientWithoutCookies()

  // 1. Buscar token
  const { data: tokenRow } = await supabase
    .from("order_tokens")
    .select("id, order_id, action, used, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (!tokenRow) {
    return NextResponse.redirect(`${APP_URL}/order-action-result?status=invalid`)
  }
  if (tokenRow.used) {
    return NextResponse.redirect(`${APP_URL}/order-action-result?status=already_used`)
  }
  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.redirect(`${APP_URL}/order-action-result?status=expired`)
  }

  const { order_id, action } = tokenRow

  // 2. Ejecutar acción
  if (action === "mark_shipped") {
    await supabase
      .from("orders")
      .update({ shipping_status: "Enviado", updated_at: new Date().toISOString() })
      .eq("id", order_id)

    // Marcar token como usado
    await supabase.from("order_tokens").update({ used: true }).eq("id", tokenRow.id)

    // Generar token para que el cliente confirme recepción
    const { data: clientTokenRow } = await supabase
      .from("order_tokens")
      .insert({ order_id, action: "confirm_received" })
      .select("token")
      .single()

    // Obtener email del cliente
    const { data: order } = await supabase
      .from("orders")
      .select("id, customer_id, customers(email, full_name)")
      .eq("id", order_id)
      .single() as any

    const customerEmail = order?.customers?.email
    const customerName = order?.customers?.full_name ?? "Cliente"

    if (customerEmail && clientTokenRow?.token) {
      const confirmUrl = `${APP_URL}/api/order-action/${clientTokenRow.token}`
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: customerEmail,
          subject: `Tu pedido #${order_id.slice(0, 8).toUpperCase()} ha sido enviado`,
          html: `
            <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
              <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
              <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:520px;text-align:left;">
                <h2 style="color:#14532d;margin-top:0;">¡Tu pedido está en camino!</h2>
                <p style="color:#555;">Hola ${customerName}, la tienda ha marcado tu pedido <strong>#${order_id.slice(0, 8).toUpperCase()}</strong> como enviado.</p>
                <p style="color:#555;">Cuando lo recibas, confírmalo con un click:</p>
                <div style="text-align:center;margin:28px 0;">
                  <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;background:#14532d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
                    ✅ Confirmar recepción
                  </a>
                </div>
                <p style="color:#9ca3af;font-size:12px;">Este link es válido por 30 días.</p>
                <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CashBak · cashbak.cl</p>
              </div>
            </div>
          `,
        })
      } catch (e) {
        console.error("Error enviando email a cliente:", e)
      }
    }

    return NextResponse.redirect(`${APP_URL}/order-action-result?status=shipped`)

  } else if (action === "confirm_received") {
    await supabase
      .from("orders")
      .update({
        customer_confirmed: true,
        shipping_status: "Entregado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)

    await supabase.from("order_tokens").update({ used: true }).eq("id", tokenRow.id)

    return NextResponse.redirect(`${APP_URL}/order-action-result?status=confirmed`)
  }

  return NextResponse.redirect(`${APP_URL}/order-action-result?status=invalid`)
}
