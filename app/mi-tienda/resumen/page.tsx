import { createSupabaseClientWithCookies as createClient, createSupabaseAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import SellerDashboard from "./SellerDashboard"

export default async function SellerResumenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/mi-tienda/resumen")

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("owner_id", user.id)
    .eq("status", "approved")
    .single()

  if (!store) redirect("/mi-tienda")

  const admin = createSupabaseAdminClient()

  const { data: storeProducts } = await admin
    .from("products")
    .select("id, name, stock")
    .eq("store_id", store.id)

  const productIds = (storeProducts ?? []).map((p: { id: number }) => String(p.id))

  if (productIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/mi-tienda" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Resumen</h1>
        </div>
        <p className="text-gray-500 text-center py-16">Aún no tienes productos publicados.</p>
      </div>
    )
  }

  const { data: orderItems } = await admin
    .from("order_items")
    .select("order_id, product_id, product_name, quantity, price, vendor_net_amount, cashback_percentage, bet_amount, comision_cashbak, tarifa_procesamiento")
    .in("product_id", productIds)

  const orderIds = [...new Set((orderItems ?? []).map((i: any) => i.order_id))]

  if (orderIds.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/mi-tienda" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Resumen · {store.name}</h1>
        </div>
        <p className="text-gray-500 text-center py-16">Aún no tienes pedidos registrados.</p>
      </div>
    )
  }

  const { data: orders } = await admin
    .from("orders")
    .select("id, customer_id, order_total, shipping_status, customer_confirmed, vendor_paid, created_at")
    .in("id", orderIds)
    .order("created_at", { ascending: false })

  const customerIds = [...new Set((orders ?? []).map((o: any) => o.customer_id))]

  const { data: customers } = await admin
    .from("customers")
    .select("id, full_name, email")
    .in("id", customerIds.length > 0 ? customerIds : ["none"])

  // Agrupar items por orden para calcular vendor_net_amount por orden
  const itemsByOrder: Record<string, any[]> = {}
  for (const item of orderItems ?? []) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
    itemsByOrder[item.order_id].push(item)
  }

  // Enriquecer órdenes con vendor_net_amount y items
  const enrichedOrders = (orders ?? []).map((o: any) => {
    const items = itemsByOrder[o.id] ?? []
    const vendor_net_amount = items.reduce(
      (sum: number, i: any) => sum + (i.vendor_net_amount ?? 0) * (i.quantity ?? 1), 0
    )
    return { ...o, vendor_net_amount, items }
  })

  // Ventas por mes (últimos 6 meses)
  const now = new Date()
  const monthlyData: { label: string; total: number; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString("es-CL", { month: "short", year: "2-digit" })
    const monthOrders = enrichedOrders.filter((o: any) => {
      const od = new Date(o.created_at)
      return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth()
    })
    monthlyData.push({
      label,
      total: monthOrders.reduce((s: number, o: any) => s + o.vendor_net_amount, 0),
      count: monthOrders.length,
    })
  }

  // Top productos por cantidad vendida
  const productQty: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const item of orderItems ?? []) {
    const key = item.product_id
    if (!productQty[key]) productQty[key] = { name: item.product_name ?? "Producto", qty: 0, revenue: 0 }
    productQty[key].qty += item.quantity ?? 1
    productQty[key].revenue += (item.vendor_net_amount ?? 0) * (item.quantity ?? 1)
  }
  const topProducts = Object.values(productQty)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  // Productos con stock bajo (< 3 unidades totales)
  const lowStockProducts = (storeProducts ?? [])
    .map((p: any) => {
      const totalStock = p.stock ? Object.values(p.stock as Record<string, number>).reduce((a, b) => a + b, 0) : 0
      return { id: p.id, name: p.name, totalStock }
    })
    .filter((p: any) => p.totalStock < 3)
    .sort((a: any, b: any) => a.totalStock - b.totalStock)

  // Clientes recurrentes
  const ordersByCustomer: Record<string, number> = {}
  for (const o of enrichedOrders) {
    ordersByCustomer[o.customer_id] = (ordersByCustomer[o.customer_id] ?? 0) + 1
  }
  const recurringCount = Object.values(ordersByCustomer).filter(n => n > 1).length

  // Mes actual
  const thisMonthOrders = enrichedOrders.filter((o: any) => {
    const d = new Date(o.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/mi-tienda" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resumen</h1>
          <p className="text-sm text-gray-500">{store.name}</p>
        </div>
      </div>

      <SellerDashboard
        enrichedOrders={enrichedOrders}
        customers={customers ?? []}
        topProducts={topProducts}
        lowStockProducts={lowStockProducts}
        monthlyData={monthlyData}
        recurringCount={recurringCount}
        thisMonthCount={thisMonthOrders.length}
        thisMonthRevenue={thisMonthOrders.reduce((s: number, o: any) => s + o.vendor_net_amount, 0)}
      />
    </div>
  )
}
