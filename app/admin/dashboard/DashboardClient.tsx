"use client"

import { useState, useMemo } from "react"
import { TrendingUp, ShoppingBag, Banknote, AlertCircle, Building2, X, DollarSign } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  order_total: number
  vendor_net_amount: number
  cashback_amount: number
  cashback_status: string
  cashback_transfer_note: string | null
  comision_cashbak: number
  vendor_paid: boolean
  shipping_status: string | null
  created_at: string
  store_id: string | null
  store_name: string
  customer_name: string | null
  customer_email: string | null
  bet_end_date: string | null
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function ageRowClass(days: number) {
  if (days >= 14) return "bg-red-50 border-l-4 border-l-red-400"
  if (days >= 7)  return "bg-orange-50 border-l-4 border-l-orange-400"
  if (days >= 3)  return "bg-yellow-50 border-l-4 border-l-yellow-400"
  return "border-l-4 border-l-green-300"
}

function AgeBadge({ days }: { days: number }) {
  const label = days === 0 ? "Hoy" : days === 1 ? "1 día" : `${days} días`
  const color = days >= 14 ? "bg-red-100 text-red-700"
    : days >= 7  ? "bg-orange-100 text-orange-700"
    : days >= 3  ? "bg-yellow-100 text-yellow-700"
    : "bg-green-100 text-green-700"
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>{label}</span>
}

interface Store {
  id: string
  name: string
}

function MetricCard({ label, value, sub, icon, color }: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardClient({ orders, stores }: { orders: Order[]; stores: Store[] }) {
  const [storeFilter, setStoreFilter] = useState("todos")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (storeFilter !== "todos" && o.store_id !== storeFilter) return false
      if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false
      if (dateTo && new Date(o.created_at) > new Date(dateTo + "T23:59:59")) return false
      return true
    })
  }, [orders, storeFilter, dateFrom, dateTo])

  const metrics = useMemo(() => {
    const totalVentas = filtered.reduce((s, o) => s + o.order_total, 0)
    const totalPedidos = filtered.length
    const cashbackPendiente = filtered
      .filter(o => o.cashback_status === "transferencia_pendiente")
      .reduce((s, o) => s + o.cashback_amount, 0)
    const cashbackEntregado = filtered
      .filter(o => o.cashback_status === "transferido")
      .reduce((s, o) => s + o.cashback_amount, 0)
    const gananciasCashbak = filtered.reduce((s, o) => s + o.comision_cashbak, 0)
    return { totalVentas, totalPedidos, cashbackPendiente, cashbackEntregado, gananciasCashbak }
  }, [filtered])

  // Vendedores pendientes de pago — separados en listos (Entregado) y en camino
  const { vendoresListos, vendoresEnCamino } = useMemo(() => {
    type StoreRow = { store_name: string; store_id: string | null; count: number; total: number; net_total: number; oldestDate: string }
    const groupByStore = (orders: typeof filtered) => {
      const byStore: Record<string, StoreRow> = {}
      for (const o of orders) {
        const key = o.store_id ?? "__cashbak__"
        if (!byStore[key]) byStore[key] = { store_name: o.store_name, store_id: o.store_id, count: 0, total: 0, net_total: 0, oldestDate: o.created_at }
        byStore[key].count++
        byStore[key].total += o.order_total
        byStore[key].net_total += o.vendor_net_amount
        if (new Date(o.created_at) < new Date(byStore[key].oldestDate)) byStore[key].oldestDate = o.created_at
      }
      return Object.values(byStore).sort((a, b) => new Date(a.oldestDate).getTime() - new Date(b.oldestDate).getTime())
    }
    const unpaid = filtered.filter(o => !o.vendor_paid)
    return {
      vendoresListos: groupByStore(unpaid.filter(o => o.shipping_status === "Entregado")),
      vendoresEnCamino: groupByStore(unpaid.filter(o => o.shipping_status !== "Entregado")),
    }
  }, [filtered])

  // Clientes con cashback pendiente, ordenados por end_date más antiguo
  const cashbackPendienteList = useMemo(() => {
    return filtered
      .filter(o => o.cashback_status === "transferencia_pendiente")
      .sort((a, b) => {
        const aDate = a.bet_end_date ? new Date(a.bet_end_date).getTime() : new Date(a.created_at).getTime()
        const bDate = b.bet_end_date ? new Date(b.bet_end_date).getTime() : new Date(b.created_at).getTime()
        return aDate - bDate
      })
  }, [filtered])

  const hasFilters = storeFilter !== "todos" || dateFrom || dateTo

  return (
    <div className="space-y-8">

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block font-medium">Tienda</label>
          <select
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
          >
            <option value="todos">Todas las tiendas</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block font-medium">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block font-medium">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </div>
        {hasFilters && (
          <button
            onClick={() => { setStoreFilter("todos"); setDateFrom(""); setDateTo("") }}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 px-3 py-2"
          >
            <X className="w-4 h-4" /> Limpiar
          </button>
        )}
        <p className="text-xs text-gray-400 ml-auto self-center">{filtered.length} pedidos</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Ventas totales"
          value={`$${metrics.totalVentas.toLocaleString("es-CL")}`}
          sub={`${metrics.totalPedidos} pedidos`}
          icon={<TrendingUp className="w-5 h-5 text-green-700" />}
          color="bg-green-50"
        />
        <MetricCard
          label="Pedidos"
          value={String(metrics.totalPedidos)}
          icon={<ShoppingBag className="w-5 h-5 text-blue-700" />}
          color="bg-blue-50"
        />
        <MetricCard
          label="CashBak pendiente"
          value={`$${metrics.cashbackPendiente.toLocaleString("es-CL")}`}
          sub={`${cashbackPendienteList.length} clientes`}
          icon={<AlertCircle className="w-5 h-5 text-orange-600" />}
          color="bg-orange-50"
        />
        <MetricCard
          label="CashBak entregado"
          value={`$${metrics.cashbackEntregado.toLocaleString("es-CL")}`}
          icon={<Banknote className="w-5 h-5 text-emerald-700" />}
          color="bg-emerald-50"
        />
        <MetricCard
          label="Ganancias CashBak"
          value={`$${metrics.gananciasCashbak.toLocaleString("es-CL")}`}
          sub="Comisiones + exceso cobertura"
          icon={<DollarSign className="w-5 h-5 text-violet-700" />}
          color="bg-violet-50"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Listos para pagar — Entregados */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h2 className="font-semibold text-gray-800">Listos para pagar</h2>
              <span className="text-xs text-gray-400 font-normal">Pedidos entregados</span>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
              {vendoresListos.length} tiendas
            </span>
          </div>
          {vendoresListos.length === 0 ? (
            <p className="text-center py-10 text-sm text-gray-400">Sin pagos pendientes ✓</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {vendoresListos.map(v => {
                const days = daysSince(v.oldestDate)
                return (
                  <div key={v.store_id ?? "__cashbak__"} className={`px-5 py-3 flex items-center justify-between ${ageRowClass(days)}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{v.store_name}</p>
                        <AgeBadge days={days} />
                      </div>
                      <p className="text-xs text-gray-400">{v.count} pedido{v.count !== 1 ? "s" : ""} · entregado hace {days === 0 ? "hoy" : `${days} días`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700">${v.net_total.toLocaleString("es-CL")}</p>
                      <p className="text-xs text-gray-400">Total compra: ${v.total.toLocaleString("es-CL")}</p>
                      {v.store_id && (
                        <Link href={`/admin/vendedor/${v.store_id}`} className="text-xs text-green-700 hover:underline font-medium">
                          Ver y pagar →
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* En camino — aún no entregados */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-800">Por entregar</h2>
              <span className="text-xs text-gray-400 font-normal">Aún no entregados</span>
            </div>
            <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
              {vendoresEnCamino.length} tiendas
            </span>
          </div>
          {vendoresEnCamino.length === 0 ? (
            <p className="text-center py-10 text-sm text-gray-400">Sin pedidos en camino ✓</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {vendoresEnCamino.map(v => {
                const days = daysSince(v.oldestDate)
                return (
                  <div key={v.store_id ?? "__cashbak__"} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{v.store_name}</p>
                      <p className="text-xs text-gray-400">{v.count} pedido{v.count !== 1 ? "s" : ""} · más antiguo hace {days === 0 ? "hoy" : `${days} días`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-600">${v.net_total.toLocaleString("es-CL")}</p>
                      <p className="text-xs text-gray-400">Total compra: ${v.total.toLocaleString("es-CL")}</p>
                      {v.store_id && (
                        <Link href={`/admin/vendedor/${v.store_id}`} className="text-xs text-green-700 hover:underline font-medium">
                          Ver detalle →
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Clientes con cashback pendiente */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-800">CashBak pendiente de transferir</h2>
            </div>
            <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
              {cashbackPendienteList.length} clientes
            </span>
          </div>
          {cashbackPendienteList.length === 0 ? (
            <p className="text-center py-10 text-sm text-gray-400">Sin cashbacks pendientes ✓</p>
          ) : (
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {cashbackPendienteList.map(o => {
                const refDate = o.bet_end_date ?? o.created_at
                const days = daysSince(refDate)
                return (
                  <div key={o.id} className={`px-5 py-3 flex items-center justify-between gap-4 ${ageRowClass(days)}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{o.customer_name ?? "—"}</p>
                        <AgeBadge days={days} />
                      </div>
                      <p className="text-xs text-gray-400 truncate">{o.customer_email}</p>
                      {o.cashback_transfer_note && (
                        <p className="text-xs text-orange-600 mt-0.5 truncate">{o.cashback_transfer_note}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-700">${o.cashback_amount.toLocaleString("es-CL")}</p>
                      <p className="text-xs text-gray-400">
                        {o.bet_end_date
                          ? `Evento: ${new Date(o.bet_end_date).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}`
                          : new Date(o.created_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
