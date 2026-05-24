"use server"

import { createSupabaseClientWithCookies as createClient, createSupabaseAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Confirma la recepción de un pedido por parte del comprador.
 *
 * Después del fix de RLS (orders_update_own fue eliminada), el cliente autenticado
 * ya no puede hacer UPDATE sobre orders directamente — eso impide que un comprador
 * malicioso marque su orden como entregada/pagada al vendedor/cashback transferido
 * usando la API REST de Supabase desde el browser.
 *
 * Acá hacemos la verificación de ownership con el cliente autenticado (que sí puede
 * SELECT vía orders_select_own) y, una vez confirmado el ownership, hacemos el UPDATE
 * con el admin client (que bypasea RLS). Solo cambiamos los dos campos que esta
 * acción tiene permitido tocar.
 */
export async function confirmOrderReceived(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  // Verificar que la orden pertenece al usuario con el cliente autenticado (RLS
  // garantiza que solo veamos órdenes propias). No usamos el admin client acá:
  // queremos defensa en profundidad.
  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id, customer_confirmed, shipping_status")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle()

  if (!order) return { error: "Orden no encontrada" }

  // Idempotente: si ya estaba confirmada, no rehacer el UPDATE.
  if ((order as { customer_confirmed: boolean }).customer_confirmed === true) {
    return { success: true }
  }

  // UPDATE acotado a los dos campos legítimos de esta acción, vía service_role,
  // re-filtrando por customer_id como defensa en profundidad.
  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from("orders")
    .update({
      customer_confirmed: true,
      shipping_status: "Entregado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("customer_id", user.id)

  if (error) {
    console.error("[confirmOrderReceived] update error:", error)
    return { error: "No se pudo confirmar la recepción" }
  }

  revalidatePath("/orders")
  return { success: true }
}
