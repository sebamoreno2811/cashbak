import { NextResponse } from "next/server"
import { createSupabaseClientWithCookies, createSupabaseAdminClient } from "@/utils/supabase/server"

export async function POST(request: Request) {
  const supabase = await createSupabaseClientWithCookies()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const subscription = await request.json()
  if (!subscription?.endpoint) return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 })

  const admin = createSupabaseAdminClient()
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
  await admin.from("push_subscriptions").delete().eq("endpoint", endpoint)

  return NextResponse.json({ ok: true })
}
