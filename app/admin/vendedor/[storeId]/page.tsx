import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, CreditCard } from "lucide-react"
import VendorDetailClient from "./VendorDetailClient"

export default async function VendorDetailPage({ params }: { params: Promise<{ storeId: string }> }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: me } = await supabase.from("customers").select("role").eq("id", user.id).single()
  if (me?.role !== "admin") redirect("/")

  const { storeId } = await params

  // Info de la tienda
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name, email, owner_id, owner_rut, bank_name, account_type, account_number, account_holder, rut")
    .eq("id", storeId)
    .maybeSingle()
  console.log("[vendedor] storeId:", storeId, "store:", store, "error:", storeError)
  if (!store) notFound()

  // Productos de esta tienda
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("store_id", storeId)
  const productIds = (products ?? []).map((p: { id: number }) => String(p.id))

  // Order items de esta tienda
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id, id, product_name, quantity, price, size, vendor_net_amount")
    .in("product_id", productIds.length > 0 ? productIds : ["none"])

  const orderIds = [...new Set((orderItems ?? []).map((i: { order_id: string }) => i.order_id))]

  // Órdenes sin pagar al vendedor
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_total, created_at, customer_id, shipping_method, shipping_status, customer_confirmed")
    .in("id", orderIds.length > 0 ? orderIds : ["none"])
    .eq("vendor_paid", false)
    .order("created_at", { ascending: true })

  // Clientes
  const customerIds = [...new Set((orders ?? []).map((o: { customer_id: string }) => o.customer_id))]
  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, email")
    .in("id", customerIds.length > 0 ? customerIds : ["none"])
  const customerMap = Object.fromEntries(
    (customers ?? []).map((c: { id: string; full_name: string | null; email: string }) => [c.id, c])
  )

  // Agrupar items por orden
  const itemsByOrder: Record<string, typeof orderItems> = {}
  for (const item of orderItems ?? []) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
    itemsByOrder[item.order_id]!.push(item)
  }

  type MergedOrder = { id: string; order_total: number; vendor_net_amount: number; created_at: string; shipping_method: string | null; shipping_status: string | null; customer_confirmed: boolean; customer_name: string | null; customer_email: string | null; items: { id: string; product_name: string; quantity: number; price: number; size: string | null; vendor_net_amount: number }[] }
  const merged: MergedOrder[] = (orders ?? []).map((o: Record<string, unknown>) => {
    const c = customerMap[o.customer_id as string] as { full_name: string | null; email: string } | undefined
    return {
      id: o.id as string,
      order_total: o.order_total as number,
      vendor_net_amount: (itemsByOrder[o.id as string] ?? []).reduce((sum: number, i: any) => sum + (i.vendor_net_amount ?? 0) * (i.quantity ?? 1), 0),
      created_at: o.created_at as string,
      shipping_method: o.shipping_method as string | null,
      shipping_status: o.shipping_status as string | null,
      customer_confirmed: o.customer_confirmed as boolean,
      customer_name: c?.full_name ?? null,
      customer_email: c?.email ?? null,
      items: (itemsByOrder[o.id as string] ?? []).map((i: Record<string, unknown>) => ({
        id: i.id as string,
        product_name: i.product_name as string,
        quantity: i.quantity as number,
        price: i.price as number,
        size: i.size as string | null,
        vendor_net_amount: (i.vendor_net_amount as number ?? 0) * (i.quantity as number ?? 1),
      })),
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
            <p className="text-sm text-gray-500">Pagos pendientes al vendedor</p>
          </div>
        </div>

        {/* Datos de transferencia */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-800">Datos de la tienda</h2>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600">
              <p><span className="font-medium text-gray-700">Nombre:</span> {store.name}</p>
              <p><span className="font-medium text-gray-700">Email:</span> {store.email ?? "—"}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-800">Identificación del dueño</h2>
            </div>
            <div className="text-sm text-gray-600">
              <p><span className="font-medium text-gray-700">RUT dueño:</span> {store.owner_rut
                ? <span className="font-mono">{store.owner_rut}</span>
                : <span className="text-orange-500 font-medium">No registrado</span>}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h2 className="font-semibold text-gray-800 mb-3">Datos bancarios</h2>
              {store.bank_name ? (
                <div className="space-y-1.5 text-sm text-gray-600">
                  {store.account_holder && <p><span className="font-medium text-gray-700">Titular:</span> {store.account_holder}</p>}
                  <p><span className="font-medium text-gray-700">RUT cuenta:</span> {store.rut ?? "—"}</p>
                  <p><span className="font-medium text-gray-700">Banco:</span> {store.bank_name}</p>
                  <p><span className="font-medium text-gray-700">Tipo:</span> {store.account_type ?? "—"}</p>
                  <p><span className="font-medium text-gray-700">Cuenta:</span> {store.account_number}</p>
                </div>
              ) : (
                <p className="text-sm text-orange-600 font-medium">El vendedor no ha registrado datos bancarios</p>
              )}
            </div>
          </div>
        </div>

        {merged.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Sin pagos pendientes</p>
            <p className="text-sm mt-1">Todos los pedidos de esta tienda ya fueron pagados.</p>
          </div>
        ) : (
          <VendorDetailClient
            storeId={storeId}
            ordersReady={merged.filter(o => o.shipping_status === "Entregado")}
            ordersInTransit={merged.filter(o => o.shipping_status !== "Entregado")}
          />
        )}
      </div>
    </div>
  )
}
