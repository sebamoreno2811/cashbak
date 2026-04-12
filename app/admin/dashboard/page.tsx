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

  // Order items (para mapear tienda → orden y obtener bet_option_id)
  const orderIds = (orders ?? []).map((o: { id: string }) => o.id)
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, bet_option_id, vendor_net_amount, comision_cashbak, cashback_percentage, product_name, quantity, price, bet_amount, bet_placed")
    .in("order_id", orderIds.length > 0 ? orderIds : ["none"])

  // Productos para obtener store_id
  const productIds = [...new Set((orderItems ?? []).map((i: { product_id: string }) => i.product_id))]
  const { data: products } = await supabase
    .from("products")
    .select("id, store_id")
    .in("id", productIds.length > 0 ? productIds : ["none"])

  // Bets para obtener end_date, nombre, resultado y si está activo
  const betIds = [...new Set((orderItems ?? []).map((i: { bet_option_id: string }) => i.bet_option_id).filter(Boolean))]
  const { data: bets } = await supabase
    .from("bets")
    .select("id, end_date, name, is_winner, active")
    .in("id", betIds.length > 0 ? betIds : [-1])
  const betMap = Object.fromEntries(
    (bets ?? []).map((b: { id: number; end_date: string; name: string; is_winner: boolean | null; active: boolean }) => [String(b.id), b])
  )
  const betEndDateMap = Object.fromEntries(
    (bets ?? []).map((b: { id: number; end_date: string }) => [String(b.id), b.end_date])
  )

  // Items agrupados por orden (para el detalle)
  const orderItemsMap: Record<string, { product_name: string; bet_name: string; bet_id: string; cashback_percentage: number; is_winner: boolean | null; price: number; quantity: number }[]> = {}
  for (const item of orderItems ?? []) {
    if (!orderItemsMap[item.order_id]) orderItemsMap[item.order_id] = []
    const bet = item.bet_option_id ? betMap[String(item.bet_option_id)] : null
    orderItemsMap[item.order_id].push({
      product_name: item.product_name ?? "Producto",
      bet_name: bet?.name ?? "—",
      bet_id: item.bet_option_id ? String(item.bet_option_id) : "",
      cashback_percentage: item.cashback_percentage ?? 0,
      is_winner: bet?.is_winner ?? null,
      price: item.price ?? 0,
      quantity: item.quantity ?? 1,
    })
  }

  // Bet más antiguo por orden (para cashback)
  const orderBetEndDateMap: Record<string, string> = {}
  for (const item of orderItems ?? []) {
    if (!item.bet_option_id) continue
    const endDate = betEndDateMap[String(item.bet_option_id)]
    if (!endDate) continue
    const existing = orderBetEndDateMap[item.order_id]
    if (!existing || new Date(endDate) < new Date(existing)) {
      orderBetEndDateMap[item.order_id] = endDate
    }
  }

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

  // Primer store_id de cada orden + sumar vendor_net_amount por orden
  const orderStoreMap: Record<string, string> = {}
  const orderVendorNetMap: Record<string, number> = {}
  const orderComisionMap: Record<string, number> = {}
  for (const item of orderItems ?? []) {
    if (!orderStoreMap[item.order_id]) {
      const storeId = productStoreMap[item.product_id]
      if (storeId) orderStoreMap[item.order_id] = storeId
    }
    orderVendorNetMap[item.order_id] = (orderVendorNetMap[item.order_id] ?? 0) + (item.vendor_net_amount ?? 0) * (item.quantity ?? 1)
    orderComisionMap[item.order_id] = (orderComisionMap[item.order_id] ?? 0) + (item.comision_cashbak ?? 0)
  }

  // Merge final
  const merged = (orders ?? []).map((o: Record<string, unknown>) => {
    const storeId = orderStoreMap[o.id as string] ?? null
    const c = customerMap[o.customer_id as string] as { full_name: string | null; email: string } | undefined
    return {
      id: o.id as string,
      order_total: o.order_total as number,
      vendor_net_amount: orderVendorNetMap[o.id as string] ?? 0,
      comision_cashbak: orderComisionMap[o.id as string] ?? 0,
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
      bet_end_date: orderBetEndDateMap[o.id as string] ?? null,
      items: orderItemsMap[o.id as string] ?? [],
    }
  })

  // Apuestas por colocar: agrupa por bet_option_id, solo eventos activos y sin resultado
  type BetEventItem = { id: string; product_name: string; order_id: string; quantity: number; bet_amount: number }
  const betEventsMap: Record<string, { bet_option_id: number; name: string; total_amount: number; item_ids: string[]; items: BetEventItem[] }> = {}
  for (const item of orderItems ?? []) {
    if (!item.bet_option_id || item.bet_placed) continue
    const bet = betMap[String(item.bet_option_id)]
    if (!bet || !bet.active || bet.is_winner !== null) continue
    const key = String(item.bet_option_id)
    if (!betEventsMap[key]) {
      betEventsMap[key] = { bet_option_id: item.bet_option_id, name: bet.name, total_amount: 0, item_ids: [], items: [] }
    }
    betEventsMap[key].total_amount += (item.bet_amount ?? 0) * (item.quantity ?? 1)
    betEventsMap[key].item_ids.push(item.id)
    betEventsMap[key].items.push({
      id: item.id,
      product_name: item.product_name ?? "Producto",
      order_id: item.order_id,
      quantity: item.quantity ?? 1,
      bet_amount: (item.bet_amount ?? 0) * (item.quantity ?? 1),
    })
  }
  const betEvents = Object.values(betEventsMap).sort((a, b) => b.total_amount - a.total_amount)

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

        <DashboardClient orders={merged} stores={storeList} betEvents={betEvents} />
      </div>
    </div>
  )
}
