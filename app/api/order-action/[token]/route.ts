import { NextResponse } from "next/server"
import { createSupabaseClientWithoutCookies } from "@/utils/supabase/server"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cashbak.cl"

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

    await supabase.from("order_tokens").update({ used: true }).eq("id", tokenRow.id)

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
