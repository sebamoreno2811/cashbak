import { NextResponse } from "next/server"
import { createSupabaseClientWithCookies, createSupabaseAdminClient } from "@/utils/supabase/server"

export async function POST(request: Request) {
  const supabase = await createSupabaseClientWithCookies()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const subscription = await request.json()
  if (!subscription?.endpoint) return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 })

  const admin = createSupabaseAdminClient()

  // H-05: si el endpoint ya existe y pertenece a otro user, NO sobrescribir el user_id
  // (eso permitiría secuestrar la suscripción push de otra persona y recibir sus
  // notificaciones).
  const { data: existing } = await admin
    .from("push_subscriptions")
    .select("user_id")
    .eq("endpoint", subscription.endpoint)
    .maybeSingle()

  if (existing && (existing as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: "Endpoint en uso" }, { status: 409 })
  }

  await admin.from("push_subscriptions").upsert(
    { user_id: user.id, endpoint: subscription.endpoint, subscription },
    { onConflict: "endpoint" }
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseClientWithCookies()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { endpoint } = await request.json()
  const admin = createSupabaseAdminClient()

  // H-05: filtrar también por user_id. Sin esto, un usuario autenticado que conozca
  // el endpoint de otro podría borrarle la suscripción push.
  await admin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id)

  return NextResponse.json({ ok: true })
}
