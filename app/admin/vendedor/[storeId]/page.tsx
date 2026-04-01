import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, CreditCard } from "lucide-react"
import VendorDetailClient from "./VendorDetailClient"

export default async function VendorDetailPage({ params }: { params: { storeId: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: me } = await supabase.from("customers").select("role").eq("id", user.id).single()
  if (me?.role !== "admin") redirect("/")

  const { storeId } = params

  // Info de la tienda
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, email, owner_id")
    .eq("id", storeId)
    .single()
  if (!store) notFound()

  // Datos bancarios del dueño
  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("bank_name, account_type, account_number, rut")
    .eq("customer_id", store.owner_id)
    .maybeSingle()

  // Productos de esta tienda
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("store_id", storeId)
  const productIds = (products ?? []).map((p: { id: number }) => String(p.id))

  // Order items de esta tienda
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id, id, product_name, quantity, price, size")
    .in("product_id", productIds.length > 0 ? productIds : ["none"])

  const orderIds = [...new Set((orderItems ?? []).map((i: { order_id: string }) => i.order_id))]

  // Órdenes sin pagar al vendedor
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_total, created_at, customer_id, shipping_method")
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

  const merged = (orders ?? []).map((o: Record<string, unknown>) => {
    const c = customerMap[o.customer_id as string] as { full_name: string | null; email: string } | undefined
    return {
      id: o.id as string,
      order_total: o.order_total as number,
      created_at: o.created_at as string,
      shipping_method: o.shipping_method as string | null,
      customer_name: c?.full_name ?? null,
      customer_email: c?.email ?? null,
      items: (itemsByOrder[o.id as string] ?? []).map((i: Record<string, unknown>) => ({
        id: i.id as string,
        product_name: i.product_name as string,
        quantity: i.quantity as number,
        price: i.price as number,
        size: i.size as string | null,
      })),
    }
  })

  const formatAccount = (n: unknown) => {
    const s = String(n ?? "")
    return s.length > 4 ? `****${s.slice(-4)}` : s
  }

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

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-800">Datos bancarios</h2>
            </div>
            {bankAccount ? (
              <div className="space-y-1.5 text-sm text-gray-600">
                <p><span className="font-medium text-gray-700">Banco:</span> {bankAccount.bank_name}</p>
                <p><span className="font-medium text-gray-700">Tipo:</span> {bankAccount.account_type}</p>
                <p><span className="font-medium text-gray-700">Cuenta:</span> {formatAccount(bankAccount.account_number)}</p>
                <p><span className="font-medium text-gray-700">RUT:</span> {bankAccount.rut}</p>
              </div>
            ) : (
              <p className="text-sm text-orange-600 font-medium">El vendedor no ha registrado datos bancarios</p>
            )}
          </div>
        </div>

        {merged.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Sin pagos pendientes</p>
            <p className="text-sm mt-1">Todos los pedidos de esta tienda ya fueron pagados.</p>
          </div>
        ) : (
          <VendorDetailClient storeId={storeId} orders={merged} />
        )}
      </div>
    </div>
  )
}
