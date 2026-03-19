"use server"

import { Resend } from "resend"
import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_FROM = process.env.EMAIL_FROM || "support@cashbak.cl"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@cashbak.cl"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cashbak.cl"

// Llamada después de que el vendedor envía el formulario
export async function notifyStoreSubmitted(storeId: string) {
  const supabase = await createClient()

  const { data: store } = await supabase
    .from("stores")
    .select("name, email, whatsapp, category")
    .eq("id", storeId)
    .single()

  if (!store) return

  // Email al admin
  await resend.emails.send({
    from: EMAIL_FROM,
    to: ADMIN_EMAIL,
    subject: `Nueva solicitud de tienda: ${store.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #14532d; margin-bottom: 4px;">Nueva solicitud de tienda</h2>
        <p style="color: #6b7280; margin-top: 0;">Alguien quiere vender en CashBak</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background: #fff; border-radius: 8px; overflow: hidden;">
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px; color: #6b7280; font-size: 14px;">Tienda</td>
            <td style="padding: 12px 16px; font-weight: 600;">${store.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px; color: #6b7280; font-size: 14px;">Categoría</td>
            <td style="padding: 12px 16px;">${store.category ?? "—"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px; color: #6b7280; font-size: 14px;">Email</td>
            <td style="padding: 12px 16px;">${store.email ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; color: #6b7280; font-size: 14px;">WhatsApp</td>
            <td style="padding: 12px 16px;">${store.whatsapp ?? "—"}</td>
          </tr>
        </table>
        <a href="${APP_URL}/admin/tiendas" style="display: inline-block; padding: 12px 24px; background: #14532d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Revisar solicitud →
        </a>
      </div>
    `,
  }).catch(() => {}) // no bloquea si falla

  // Email de confirmación al vendedor
  if (store.email) {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: store.email,
      subject: "Recibimos tu solicitud — CashBak",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #14532d;">¡Hola! Recibimos tu solicitud</h2>
          <p style="color: #374151;">Gracias por querer unirte a CashBak. Hemos recibido la solicitud para abrir la tienda <strong>${store.name}</strong>.</p>
          <p style="color: #374151;">Nuestro equipo la revisará y te avisaremos por este mismo correo en cuanto tengamos una respuesta.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #166534; margin: 0; font-size: 14px;">
              Mientras esperas, puedes seguir explorando el simulador de cashback para entender cómo funcionará tu tienda.
            </p>
          </div>
          <a href="${APP_URL}/sell" style="display: inline-block; padding: 12px 24px; background: #14532d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ir al simulador →
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">CashBak · cashbak.cl</p>
        </div>
      `,
    }).catch(() => {})
  }
}

// Llamada cuando el admin aprueba
export async function approveStore(storeId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const { data: customer } = await supabase.from("customers").select("role").eq("id", user.id).single()
  if (customer?.role !== "admin") return { error: "No autorizado" }

  const { error: updateError } = await supabase
    .from("stores")
    .update({ status: "approved", reject_reason: null })
    .eq("id", storeId)

  if (updateError) return { error: updateError.message }

  const { data: store } = await supabase
    .from("stores")
    .select("name, email")
    .eq("id", storeId)
    .single()

  if (store?.email) {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: store.email,
      subject: "¡Tu tienda en CashBak fue aprobada! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #14532d;">¡Bienvenido a CashBak!</h2>
          <p style="color: #374151;">Tu tienda <strong>${store.name}</strong> ha sido aprobada y ya forma parte de CashBak.</p>
          <p style="color: #374151;">Ya puedes acceder a tu panel para agregar tus productos y comenzar a ofrecer cashback a tus clientes.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #166534; margin: 0; font-size: 14px;">
              ¿Tienes dudas? Responde este correo y te ayudamos.
            </p>
          </div>
          <a href="${APP_URL}/mi-tienda" style="display: inline-block; padding: 12px 24px; background: #14532d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Administrar mi tienda →
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">CashBak · cashbak.cl</p>
        </div>
      `,
    }).catch(() => {})
  }

  revalidatePath("/admin/tiendas")
  return { success: true }
}

// Llamada cuando el admin rechaza
export async function rejectStore(storeId: string, reason: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const { data: customer } = await supabase.from("customers").select("role").eq("id", user.id).single()
  if (customer?.role !== "admin") return { error: "No autorizado" }

  const { error: updateError } = await supabase
    .from("stores")
    .update({ status: "rejected", reject_reason: reason })
    .eq("id", storeId)

  if (updateError) return { error: updateError.message }

  const { data: store } = await supabase
    .from("stores")
    .select("name, email")
    .eq("id", storeId)
    .single()

  if (store?.email) {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: store.email,
      subject: "Actualización sobre tu solicitud en CashBak",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #374151;">Hola, sobre tu solicitud</h2>
          <p style="color: #374151;">Hemos revisado la solicitud para la tienda <strong>${store.name}</strong> y por el momento no podemos aprobarla.</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #991b1b; margin: 0; font-size: 14px;"><strong>Motivo:</strong> ${reason}</p>
          </div>
          <p style="color: #374151;">Si tienes preguntas o quieres volver a postular, responde este correo y con gusto te ayudamos.</p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">CashBak · cashbak.cl</p>
        </div>
      `,
    }).catch(() => {})
  }

  revalidatePath("/admin/tiendas")
  return { success: true }
}
