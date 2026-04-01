import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: customer } = await supabase
    .from("customers")
    .select("role")
    .eq("id", user.id)
    .single()
  if (customer?.role !== "admin") redirect("/")

  // Órdenes
  const { data: orders } = await supabase
    .from("orders")
    .select("id, customer_id, order_total, cashback_amount, cashback_status, cashback_transfer_note, vendor_paid, shipping_status, created_at")
    .order("created_at", { ascending: false })

  // Order items (para mapear tienda → orden)
  const orderIds = (orders ?? []).map((o: { id: string }) => o.id)
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id, product_id")
    .in("order_id", orderIds.length > 0 ? orderIds : ["none"])

  // Productos para obtener store_id
  const productIds = [...new Set((orderItems ?? []).map((i: { product_id: string }) => i.product_id))]
  const { data: products } = await supabase
    .from("products")
    .select("id, store_id")
    .in("id", productIds.length > 0 ? productIds : ["none"])

  // Tiendas aprobadas
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .eq("status", "approved")

  // Clientes
  const customerIds = [...new Set((orders ?? []).map((o: { customer_id: string }) => o.customer_id))]
  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, email")
    .in("id", customerIds.length > 0 ? customerIds : ["none"])

  // Mapas de lookup
  const productStoreMap = Object.fromEntries(
    (products ?? []).map((p: { id: number; store_id: string }) => [String(p.id), p.store_id])
  )
  const storeNameMap = Object.fromEntries(
    (stores ?? []).map((s: { id: string; name: string }) => [s.id, s.name])
  )
  const customerMap = Object.fromEntries(
    (customers ?? []).map((c: { id: string; full_name: string | null; email: string }) => [c.id, c])
  )

  // Primer store_id de cada orden
  const orderStoreMap: Record<string, string> = {}
  for (const item of orderItems ?? []) {
    if (!orderStoreMap[item.order_id]) {
      const storeId = productStoreMap[item.product_id]
      if (storeId) orderStoreMap[item.order_id] = storeId
    }
  }

  // Merge final
  const merged = (orders ?? []).map((o: Record<string, unknown>) => {
    const storeId = orderStoreMap[o.id as string] ?? null
    const c = customerMap[o.customer_id as string] as { full_name: string | null; email: string } | undefined
    return {
      id: o.id as string,
      order_total: o.order_total as number,
      cashback_amount: o.cashback_amount as number,
      cashback_status: (o.cashback_status as string) ?? "evento_pendiente",
      cashback_transfer_note: o.cashback_transfer_note as string | null,
      vendor_paid: o.vendor_paid as boolean,
      shipping_status: o.shipping_status as string | null,
      created_at: o.created_at as string,
      store_id: storeId,
      store_name: storeId ? (storeNameMap[storeId] ?? "Tienda desconocida") : "CashBak Store",
      customer_name: c?.full_name ?? null,
      customer_email: c?.email ?? null,
    }
  })

  const storeList = (stores ?? []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/tiendas" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Resumen operativo de CashBak</p>
          </div>
        </div>

        <DashboardClient orders={merged} stores={storeList} />
      </div>
    </div>
  )
}
