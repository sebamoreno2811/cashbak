import { createSupabaseClientWithCookies as createClient, createSupabaseAdminClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import OrdersPanel from "./OrdersPanel"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AdminPedidosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: customer } = await supabase
    .from("customers")
    .select("role")
    .eq("id", user.id)
    .single()

  if (customer?.role !== "admin") redirect("/")

  const admin = createSupabaseAdminClient()

  // Traer pedidos con items y cliente
  const { data: orders } = await admin
    .from("orders")
    .select(`
      id, customer_id, order_total, cashback_amount,
      order_status, payment_status, shipping_method,
      shipping_status, cashback_status, cashback_transfer_note,
      vendor_paid, created_at, is_fake_order,
      order_items (
        id, product_name, quantity, price, size,
        bet_name, cashback_percentage
      )
    `)
    .order("created_at", { ascending: false })

  // Traer info de clientes
  const customerIds = [...new Set((orders ?? []).map((o: { customer_id: string }) => o.customer_id))]
  const { data: customers } = await admin
    .from("customers")
    .select("id, full_name, email")
    .in("id", customerIds.length > 0 ? customerIds : ["none"])

  const customerMap = Object.fromEntries(
    (customers ?? []).map((c: { id: string; full_name: string | null; email: string }) => [c.id, c])
  )

  // Merge + priorizar incompletos primero
  const merged = (orders ?? []).map((o: Record<string, unknown>) => ({
    ...o,
    cashback_status: (o.cashback_status as string) ?? "evento_pendiente",
    cashback_transfer_note: (o.cashback_transfer_note as string | null) ?? null,
    customer_name: (customerMap[o.customer_id as string] as { full_name: string | null } | undefined)?.full_name ?? null,
    customer_email: (customerMap[o.customer_id as string] as { email: string } | undefined)?.email ?? null,
    items: (o.order_items as unknown[]) ?? [],
  })).sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aComplete = a.cashback_status === "transferido" || a.cashback_status === "evento_perdido"
    const bComplete = b.cashback_status === "transferido" || b.cashback_status === "evento_perdido"
    if (aComplete !== bComplete) return aComplete ? 1 : -1
    return new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/tiendas" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500">{merged.length} pedidos en total</p>
        </div>
      </div>

      <OrdersPanel orders={merged} />
    </div>
  )
}
