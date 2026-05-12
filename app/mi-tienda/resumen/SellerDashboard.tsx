"use client"

import Link from "next/link"
import { TrendingUp, ShoppingBag, Users, CheckCircle2, Clock, Package, AlertTriangle, BarChart3, Repeat } from "lucide-react"

const fmt = (n: number) => Math.round(n).toLocaleString("es-CL")

function MetricCard({
  label, value, sub, icon, color, border,
}: {
  label: string; value: string; sub?: string; icon: React.ReactNode; color: string; border?: string
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 flex items-start gap-4 ${border ?? "border-gray-100"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-tight">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface Order {
  id: string
  customer_id: string
  order_total: number
  shipping_status: string | null
  customer_confirmed: boolean
  vendor_paid: boolean
  created_at: string
  vendor_net_amount: number
  items: any[]
}

interface Props {
  enrichedOrders: Order[]
  customers: { id: string; full_name: string | null; email: string }[]
  topProducts: { name: string; qty: number; revenue: number }[]
  lowStockProducts: { id: number; name: string; totalStock: number }[]
  monthlyData: { label: string; total: number; count: number }[]
  recurringCount: number
  thisMonthCount: number
  thisMonthRevenue: number
}

export default function SellerDashboard({
  enrichedOrders, customers, topProducts, lowStockProducts,
  monthlyData, recurringCount, thisMonthCount, thisMonthRevenue,
}: Props) {
  const totalOrders = enrichedOrders.length

  // Métricas financieras
  const cobrado = enrichedOrders.filter(o => o.vendor_paid).reduce((s, o) => s + o.vendor_net_amount, 0)
  const porCobrar = enrichedOrders.filter(o => !o.vendor_paid && o.shipping_status === "Entregado").reduce((s, o) => s + o.vendor_net_amount, 0)
  const enProceso = enrichedOrders.filter(o => !o.vendor_paid && o.shipping_status !== "Entregado").reduce((s, o) => s + o.vendor_net_amount, 0)

  // Estado de pedidos
  const porEstado = {
    "Preparando pedido": enrichedOrders.filter(o => o.shipping_status === "Preparando pedido").length,
    "En camino / Listo": enrichedOrders.filter(o => o.shipping_status === "Enviado" || o.shipping_status === "Listo para entrega").length,
    "Entregado": enrichedOrders.filter(o => o.shipping_status === "Entregado").length,
  }

  // Ticket promedio
  const avgTicket = totalOrders > 0 ? enrichedOrders.reduce((s, o) => s + o.vendor_net_amount, 0) / totalOrders : 0

  // Gráfico barras mensual
  const maxMonthTotal = Math.max(...monthlyData.map(m => m.total), 1)

  return (
    <div className="space-y-8">

      {/* ── Bloque 1: Financiero ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">💰 Tus ingresos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Ya cobrado"
            value={`$${fmt(cobrado)}`}
            sub="Transferido a tu cuenta"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-700" />}
            color="bg-emerald-50"
            border="border-emerald-100"
          />
          <MetricCard
            label="Pendiente de cobro"
            value={`$${fmt(porCobrar)}`}
            sub="Pedidos entregados, pago en proceso"
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            color="bg-amber-50"
            border="border-amber-100"
          />
          <MetricCard
            label="En proceso"
            value={`$${fmt(enProceso)}`}
            sub="Pedidos aún no entregados"
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            color="bg-blue-50"
            border="border-blue-100"
          />
        </div>
      </div>

      {/* ── Bloque 2: Actividad ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">📊 Actividad</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            label="Total pedidos"
            value={String(totalOrders)}
            icon={<ShoppingBag className="w-5 h-5 text-green-700" />}
            color="bg-green-50"
          />
          <MetricCard
            label="Este mes"
            value={String(thisMonthCount)}
            sub={`$${fmt(thisMonthRevenue)} ingreso`}
            icon={<BarChart3 className="w-5 h-5 text-violet-600" />}
            color="bg-violet-50"
          />
          <MetricCard
            label="Clientes únicos"
            value={String(customers.length)}
            icon={<Users className="w-5 h-5 text-sky-600" />}
            color="bg-sky-50"
          />
          <MetricCard
            label="Clientes que repiten"
            value={String(recurringCount)}
            sub="Más de 1 compra"
            icon={<Repeat className="w-5 h-5 text-indigo-600" />}
            color="bg-indigo-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Bloque 3: Estado de pedidos ──────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-1">Estado de pedidos</h2>
          <p className="text-xs text-gray-400 mb-5">{totalOrders} pedidos en total</p>
          <div className="space-y-4">
            <StatusBar label="Preparando" count={porEstado["Preparando pedido"]} total={totalOrders} color="bg-yellow-400" />
            <StatusBar label="En camino / Listo para retiro" count={porEstado["En camino / Listo"]} total={totalOrders} color="bg-blue-400" />
            <StatusBar label="Entregado" count={porEstado["Entregado"]} total={totalOrders} color="bg-emerald-500" />
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Ticket promedio por venta</span>
            <span className="font-semibold text-gray-800">${fmt(avgTicket)}</span>
          </div>
        </div>

        {/* ── Bloque 4: Productos más vendidos ─────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-1">Productos más vendidos</h2>
          <p className="text-xs text-gray-400 mb-5">Por unidades totales vendidas</p>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-green-50 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">${fmt(p.revenue)} ingresado</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 shrink-0">{p.qty} uds.</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Bloque 5: Ventas por mes ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-1">Ingresos últimos 6 meses</h2>
        <p className="text-xs text-gray-400 mb-6">Ingreso neto mensual (ya descontado procesamiento)</p>
        <div className="flex items-end gap-3 h-36">
          {monthlyData.map((m) => {
            const heightPct = maxMonthTotal > 0 ? (m.total / maxMonthTotal) * 100 : 0
            const isCurrentMonth = m === monthlyData[monthlyData.length - 1]
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <p className="text-xs font-semibold text-gray-600 hidden sm:block truncate">
                  {m.total > 0 ? `$${fmt(m.total)}` : ""}
                </p>
                <div className="w-full flex items-end" style={{ height: "80px" }}>
                  <div
                    className={`w-full rounded-t-lg transition-all ${isCurrentMonth ? "bg-green-600" : "bg-green-200"}`}
                    style={{ height: `${Math.max(heightPct, m.total > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 capitalize truncate w-full text-center">{m.label}</p>
                <p className="text-[10px] text-gray-300">{m.count > 0 ? `${m.count}p` : ""}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bloque 6: Stock bajo ──────────────────────────────────────────── */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Stock bajo</h2>
            <span className="text-xs bg-amber-200 text-amber-800 font-semibold px-2 py-0.5 rounded-full">{lowStockProducts.length} productos</span>
          </div>
          <div className="space-y-2">
            {lowStockProducts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-amber-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm font-medium text-gray-800">{p.name}</span>
                </div>
                <span className={`text-sm font-bold ${p.totalStock === 0 ? "text-red-600" : "text-amber-600"}`}>
                  {p.totalStock === 0 ? "Agotado" : `${p.totalStock} en stock`}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-3">
            Actualiza el stock desde{" "}
            <Link href="/mi-tienda" className="underline font-semibold">Mi Tienda → Productos</Link>
          </p>
        </div>
      )}

    </div>
  )
}
