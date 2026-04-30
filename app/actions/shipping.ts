"use server"

import { createSupabaseAdminClient, createSupabaseClientWithCookies } from "@/utils/supabase/server"

export async function saveShippingAddress(formData: {
  ciudad: string
  comuna: string
  calle: string
  numero_calle: string
  numero_casa_depto: string
}) {
  const supabaseAuth = await createSupabaseClientWithCookies()
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()

  if (userError || !user) {
    return { error: "Debes iniciar sesión para guardar una dirección." }
  }

  const admin = createSupabaseAdminClient()

  // Garantizar que el registro del cliente exista
  const { error: customerError } = await admin.from("customers").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "",
      created_at: new Date().toISOString(),
    },
    { onConflict: "id", ignoreDuplicates: true }
  )

  if (customerError) {
    console.error("Error ensuring customer:", customerError)
    return { error: `Error preparando cuenta: ${customerError.message}` }
  }

  // Crear o actualizar la dirección de envío
  const { data: existing } = await admin
    .from("customer_shipping_details")
    .select("id")
    .eq("customer_id", user.id)
    .maybeSingle()

  const { error: saveError } = existing
    ? await admin
        .from("customer_shipping_details")
        .update({ ...formData })
        .eq("customer_id", user.id)
    : await admin
        .from("customer_shipping_details")
        .insert([{ customer_id: user.id, ...formData }])

  if (saveError) {
    console.error("Error saving shipping:", saveError)
    return { error: `Error al guardar la dirección: ${saveError.message}` }
  }

  return { error: null }
}
