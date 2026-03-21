"use client"

import { useState, useTransition } from "react"
import { updateOrderStatuses } from "./actions"
import { ChevronDown, ChevronUp, Loader2, Save, Package, Truck, Banknote, CheckCircle2 } from "lucide-react"

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  price: number
  size: string | null
  bet_name: string | null
  cashback_percentage: number
}

interface Order {
  id: string
  customer_id: string
  customer_name: string | null
  customer_email: string | null
  order_total: number
  cashback_amount: number
  order_status: string
  payment_status: string
  shipping_method: string | null
  shipping_status: string | null
  cashback_status: string
  cashback_transfer_note: string | null
  created_at: string
  items: OrderItem[]
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
]

const SHIPPING_STATUSES = [
  "Preparando pedido",
  "Listo para entrega",
  "Enviado",
  "Entregado",
]

const CASHBACK_STATUSES = [
  { value: "evento_pendiente", label: "Evento pendiente", color: "bg-yellow-100 text-yellow-800" },
  { value: "transferencia_pendiente", label: "Transferencia pendiente", color: "bg-orange-100 text-orange-800" },
  { value: "transferido", label: "Transferido", color: "bg-green-100 text-green-800" },
  { value: "evento_perdido", label: "Evento perdido", color: "bg-red-100 text-red-800" },
]

function Badge({ value, map }: { value: string, map: { value: string, label: string, color: string }[] }) {
  const item = map.find(m => m.value === value)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item?.color ?? "bg-gray-100 text-gray-700"}`}>
      {item?.label ?? value}
    </span>
  )
}

function OrderRow({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    order_status: order.order_status,
    shipping_status: order.shipping_status ?? "",
    cashback_status: order.cashback_status,
    cashback_transfer_note: order.cashback_transfer_note ?? "",
  })
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isComplete = form.cashback_status === "transferido" || form.cashback_status === "evento_perdido"

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateOrderStatuses(order.id, form)
      if (!res.error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  const date = new Date(order.created_at).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  })

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${isComplete ? "border-gray-200 bg-gray-50/50" : "border-gray-200 bg-white shadow-sm"}`}>
      {/* Header row */}
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
          <div>
            <p className="text-xs text-gray-400">Pedido</p>
            <p className="text-sm font-mono font-semibold text-gray-800">{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Cliente</p>
            <p className="text-sm font-medium text-gray-800 truncate">{order.customer_name ?? "—"}</p>
            <p className="text-xs text-gray-400 truncate">{order.customer_email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total / CashBak</p>
            <p className="text-sm font-semibold text-gray-800">${order.order_total.toLocaleString("es-CL")}</p>
            <p className="text-xs text-emerald-600 font-medium">${order.cashback_amount.toLocaleString("es-CL")}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge value={form.cashback_status} map={CASHBACK_STATUSES} />
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-5">
          {/* Productos */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Productos
            </p>
            <div className="space-y-1.5">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{item.product_name}</span>
                    {item.size && <span className="ml-2 text-xs text-gray-400">Talla: {item.size}</span>}
                    <span className="ml-2 text-xs text-gray-400">x{item.quantity}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">${(item.price * item.quantity).toLocaleString("es-CL")}</p>
                    {item.bet_name && <p className="text-xs text-gray-400 truncate max-w-[180px]">{item.bet_name} — {item.cashback_percentage}% CB</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Envío */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Envío
            </p>
            <p className="text-sm text-gray-600 mb-2">{order.shipping_method ?? "—"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Estado del pedido</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  value={form.order_status}
                  onChange={e => setForm(f => ({ ...f, order_status: e.target.value }))}
                >
                  {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Estado del envío</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  value={form.shipping_status}
                  onChange={e => setForm(f => ({ ...f, shipping_status: e.target.value }))}
                >
                  {SHIPPING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* CashBak */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" /> CashBak — ${order.cashback_amount.toLocaleString("es-CL")}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Estado CashBak</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  value={form.cashback_status}
                  onChange={e => setForm(f => ({ ...f, cashback_status: e.target.value }))}
                >
                  {CASHBACK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nota de transferencia (opcional)</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                placeholder="Ej: Transferido el 20/03 — Comprobante #123"
                value={form.cashback_transfer_note}
                onChange={e => setForm(f => ({ ...f, cashback_transfer_note: e.target.value }))}
              />
            </div>
          </div>

          {/* Guardar */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 bg-green-900 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isPending ? "Guardando..." : saved ? "¡Guardado!" : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrdersPanel({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<"pendientes" | "todos">("pendientes")

  const filtered = orders.filter(o =>
    filter === "todos" ? true : o.cashback_status !== "transferido" && o.cashback_status !== "evento_perdido"
  )

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(["pendientes", "todos"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? "bg-green-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {f === "pendientes" ? `Pendientes (${orders.filter(o => o.cashback_status !== "transferido" && o.cashback_status !== "evento_perdido").length})` : `Todos (${orders.length})`}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center py-10 text-gray-400">No hay pedidos</p>
        )}
        {filtered.map(order => <OrderRow key={order.id} order={order} />)}
      </div>
    </div>
  )
}
