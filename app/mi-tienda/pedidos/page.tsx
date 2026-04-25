import { createSupabaseClientWithCookies as createClient, createSupabaseAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import SellerOrdersPanel from "./SellerOrdersPanel"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function SellerPedidosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/mi-tienda/pedidos")

  // Verificar que tiene tienda aprobada
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, delivery_options")
    .eq("owner_id", user.id)
    .eq("status", "approved")
    .single()

  if (!store) redirect("/mi-tienda")

  // Usar cliente admin para queries multi-tabla (evita problemas de RLS en server-side)
  // La autorización ya está garantizada: verificamos que user.id === store.owner_id arriba
  const admin = createSupabaseAdminClient()

  // Obtener product IDs de esta tienda
  const { data: storeProducts } = await admin
    .from("products")
    .select("id")
    .eq("store_id", store.id)

  const productIds = (storeProducts ?? []).map((p: { id: number }) => String(p.id))

  if (productIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/mi-tienda" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Mis pedidos</h1>
        </div>
        <p className="text-gray-500 text-center py-16">Aún no tienes productos publicados.</p>
      </div>
    )
  }

  const { data: orderItems } = await admin
    .from("order_items")
    .select("order_id, product_id, product_name, quantity, price, size, id, vendor_net_amount")
    .in("product_id", productIds)

  const orderIds = [...new Set((orderItems ?? []).map((i: { order_id: string }) => i.order_id))]

  if (orderIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/mi-tienda" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Mis pedidos</h1>
        </div>
        <p className="text-gray-500 text-center py-16">Aún no tienes pedidos.</p>
      </div>
    )
  }

  const { data: orders } = await admin
    .from("orders")
    .select("id, customer_id, order_total, shipping_method, shipping_status, customer_confirmed, created_at")
    .in("id", orderIds)
    .order("created_at", { ascending: false })

  const customerIds = [...new Set((orders ?? []).map((o: { customer_id: string }) => o.customer_id))]
  const { data: customers } = await admin
    .from("customers")
    .select("id, full_name, email")
    .in("id", customerIds.length > 0 ? customerIds : ["none"])

  const customerMap = Object.fromEntries(
    (customers ?? []).map((c: { id: string; full_name: string | null; email: string }) => [c.id, c])
  )

  const { data: shippingDetails } = await admin
    .from("customer_shipping_details")
    .select("customer_id, calle, numero_calle, numero_casa_depto, comuna, ciudad")
    .in("customer_id", customerIds.length > 0 ? customerIds : ["none"])

  const shippingMap = Object.fromEntries(
    (shippingDetails ?? []).map((s: any) => [s.customer_id, s])
  )

  // Agrupar items por orden
  const itemsByOrder: Record<string, typeof orderItems> = {}
  for (const item of orderItems ?? []) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
    itemsByOrder[item.order_id]!.push(item)
  }

  const merged = (orders ?? []).map((o: Record<string, unknown>) => {
    const items = itemsByOrder[o.id as string] ?? []
    const vendor_net_amount = items.reduce((sum: number, item: any) => sum + (item.vendor_net_amount ?? 0) * (item.quantity ?? 1), 0)
    const customerId = o.customer_id as string
    const shipping = shippingMap[customerId] as any
    return {
      id: o.id as string,
      order_total: o.order_total as number,
      vendor_net_amount,
      shipping_method: o.shipping_method as string | null,
      shipping_status: o.shipping_status as string | null,
      customer_confirmed: o.customer_confirmed as boolean | null,
      created_at: o.created_at as string,
      customer_name: (customerMap[customerId] as { full_name: string | null } | undefined)?.full_name ?? null,
      customer_email: (customerMap[customerId] as { email: string } | undefined)?.email ?? null,
      shipping_address: shipping
        ? `${shipping.calle} ${shipping.numero_calle}${shipping.numero_casa_depto ? `, ${shipping.numero_casa_depto}` : ""}, ${shipping.comuna}, ${shipping.ciudad}`
        : null,
      items,
    }
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mi-tienda" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis pedidos</h1>
          <p className="text-sm text-gray-500">{merged.length} pedidos en total · {store.name}</p>
        </div>
      </div>

      <SellerOrdersPanel orders={merged} deliveryOptions={store.delivery_options ?? []} />
    </div>
  )
}
