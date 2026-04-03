"use client"

import { useState, useTransition } from "react"
import { updateShippingStatus } from "./actions"
import { ChevronDown, ChevronUp, Loader2, Save, Package, Truck, CheckCircle2, Search, X } from "lucide-react"

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  price: number
  size: string | null
}

interface Order {
  id: string
  customer_name: string | null
  customer_email: string | null
  order_total: number
  vendor_net_amount: number
  shipping_method: string | null
  shipping_status: string | null
  created_at: string
  items: OrderItem[]
}

const SHIPPING_STATUSES = [
  { value: "Preparando pedido", label: "Preparando pedido" },
  { value: "Listo para entrega", label: "Listo para entrega" },
  { value: "Enviado", label: "Enviado" },
  { value: "Entregado", label: "Entregado" },
]

const SHIPPING_COLORS: Record<string, string> = {
  "Preparando pedido": "bg-yellow-100 text-yellow-800",
  "Listo para entrega": "bg-blue-100 text-blue-800",
  "Enviado": "bg-purple-100 text-purple-800",
  "Entregado": "bg-green-100 text-green-800",
}

const FILTER_OPTIONS = [
  { value: "todos", label: "Todos" },
  ...SHIPPING_STATUSES,
]

function OrderRow({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)
  const [shippingStatus, setShippingStatus] = useState(order.shipping_status ?? "")
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateShippingStatus(order.id, shippingStatus)
      if (!res.error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  const date = new Date(order.created_at).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })

  const statusColor = SHIPPING_COLORS[shippingStatus] ?? "bg-gray-100 text-gray-600"

  return (
    <div className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
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
            <p className="text-xs text-gray-400">{order.vendor_net_amount > 0 ? "A recibir" : "Total"}</p>
            <p className="text-sm font-semibold text-emerald-700">
              ${(order.vendor_net_amount > 0 ? order.vendor_net_amount : order.order_total).toLocaleString("es-CL")}
            </p>
          </div>
          <div>
            {shippingStatus ? (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {shippingStatus}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                Sin estado
              </span>
            )}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

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
                  <p className="font-semibold text-gray-800">${(item.price * item.quantity).toLocaleString("es-CL")}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Estado de envío */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Entrega
            </p>
            <p className="text-sm text-gray-600 mb-3">
              Método: <span className="font-medium">{order.shipping_method ?? "—"}</span>
            </p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Estado del pedido</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                value={shippingStatus}
                onChange={e => setShippingStatus(e.target.value)}
              >
                <option value="">Sin estado</option>
                {SHIPPING_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

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

export default function SellerOrdersPanel({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState("todos")
  const [search, setSearch] = useState("")

  const filtered = orders.filter(o => {
    const matchesFilter = filter === "todos" || o.shipping_status === filter
    const matchesSearch = !search.trim() || o.id.toLowerCase().includes(search.trim().toLowerCase())
    return matchesFilter && matchesSearch
  })

  const counts = Object.fromEntries(
    SHIPPING_STATUSES.map(s => [s.value, orders.filter(o => o.shipping_status === s.value).length])
  )

  return (
    <div>
      {/* Buscador por ID */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por ID de pedido..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(opt => {
          const count = opt.value !== "todos" ? counts[opt.value] ?? 0 : undefined
          const active = filter === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                active
                  ? "bg-green-900 text-white border-green-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-700 hover:text-green-800"
              }`}
            >
              {opt.label}
              {count !== undefined && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} pedidos</p>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center py-10 text-gray-400">No hay pedidos con este estado</p>
        ) : (
          filtered.map(order => <OrderRow key={order.id} order={order} />)
        )}
      </div>
    </div>
  )
}
