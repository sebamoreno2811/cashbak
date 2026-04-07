import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import CashbackDetailClient from "./CashbackDetailClient"

export default async function CashbackDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: me } = await supabase.from("customers").select("role").eq("id", user.id).single()
  if (me?.role !== "admin") redirect("/")

  const { customerId } = await params
  const customerEmail = decodeURIComponent(customerId)

  // Buscar cliente por email
  const { data: customer } = await supabase
    .from("customers")
    .select("id, full_name, email")
    .eq("email", customerEmail)
    .maybeSingle()

  if (!customer) notFound()

  // Datos bancarios
  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("rut, bank_name, account_type, account_number, account_holder")
    .eq("customer_id", customer.id)
    .maybeSingle()

  // Órdenes con cashback pendiente
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_total, cashback_amount, cashback_transfer_note, created_at")
    .eq("customer_id", customer.id)
    .eq("cashback_status", "transferencia_pendiente")
    .order("created_at", { ascending: true })

  const orderIds = (orders ?? []).map((o: { id: string }) => o.id)

  // Items con bet info
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id, product_name, quantity, cashback_percentage, bet_option_id")
    .in("order_id", orderIds.length > 0 ? orderIds : ["none"])

  // Bet info
  const betIds = [...new Set((orderItems ?? []).map((i: any) => i.bet_option_id).filter(Boolean))]
  const { data: bets } = await supabase
    .from("bets")
    .select("id, name, is_winner, end_date")
    .in("id", betIds.length > 0 ? betIds : [-1])
  const betMap = Object.fromEntries((bets ?? []).map((b: any) => [String(b.id), b]))

  // Agrupar items por orden
  const itemsByOrder: Record<string, any[]> = {}
  for (const item of orderItems ?? []) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
    const bet = item.bet_option_id ? betMap[String(item.bet_option_id)] : null
    itemsByOrder[item.order_id].push({
      product_name: item.product_name ?? "Producto",
      bet_name: bet?.name ?? "—",
      cashback_percentage: item.cashback_percentage ?? 0,
      is_winner: bet?.is_winner ?? null,
      quantity: item.quantity ?? 1,
    })
  }

  // Bet end_date más antiguo por orden
  const betEndDateByOrder: Record<string, string> = {}
  for (const item of orderItems ?? []) {
    if (!item.bet_option_id) continue
    const bet = betMap[String(item.bet_option_id)]
    if (!bet?.end_date) continue
    const existing = betEndDateByOrder[item.order_id]
    if (!existing || new Date(bet.end_date) < new Date(existing)) {
      betEndDateByOrder[item.order_id] = bet.end_date
    }
  }

  const merged = (orders ?? []).map((o: any) => ({
    id: o.id,
    order_total: o.order_total,
    cashback_amount: o.cashback_amount,
    cashback_transfer_note: o.cashback_transfer_note,
    created_at: o.created_at,
    bet_end_date: betEndDateByOrder[o.id] ?? null,
    items: itemsByOrder[o.id] ?? [],
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.full_name ?? customer.email}</h1>
            <p className="text-sm text-gray-500">CashBaks pendientes de transferencia</p>
          </div>
        </div>

        {merged.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Sin CashBaks pendientes</p>
            <p className="text-sm mt-1">Este cliente no tiene transferencias pendientes.</p>
          </div>
        ) : (
          <CashbackDetailClient
            customer={{
              full_name: customer.full_name,
              email: customer.email,
              rut: bankAccount?.rut ?? null,
              bank_name: bankAccount?.bank_name ?? null,
              account_type: bankAccount?.account_type ?? null,
              account_number: bankAccount?.account_number ?? null,
              account_holder: bankAccount?.account_holder ?? null,
            }}
            orders={merged}
          />
        )}
      </div>
    </div>
  )
}
