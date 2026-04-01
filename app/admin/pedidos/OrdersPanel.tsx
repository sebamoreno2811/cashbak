"use client"

import { useState, useTransition } from "react"
import { updateOrderStatuses, bulkUpdateOrders } from "./actions"
import { ChevronDown, ChevronUp, Loader2, Save, Package, Truck, Banknote, CheckCircle2, Square, CheckSquare } from "lucide-react"

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
  vendor_paid: boolean
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

function OrderRow({ order, selected, onSelect }: { order: Order; selected: boolean; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    order_status: order.order_status,
    shipping_status: order.shipping_status ?? "",
    cashback_status: order.cashback_status,
    cashback_transfer_note: order.cashback_transfer_note ?? "",
    vendor_paid: order.vendor_paid,
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
      <div className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onSelect(order.id) }}
          className="shrink-0 text-gray-400 hover:text-green-700"
        >
          {selected ? <CheckSquare className="w-4 h-4 text-green-700" /> : <Square className="w-4 h-4" />}
        </button>
        <button className="flex-1 flex items-center gap-3 text-left" onClick={() => setOpen(v => !v)}>
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
            {form.vendor_paid ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Vendedor pagado</span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Pago pendiente</span>
            )}
          </div>
        </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
        </button>
      </div>

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

          {/* Pago al vendedor */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pago al vendedor</p>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, vendor_paid: !f.vendor_paid }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                form.vendor_paid
                  ? "bg-green-50 border-green-300 text-green-800"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.vendor_paid ? "border-green-600 bg-green-600" : "border-gray-400"}`}>
                {form.vendor_paid && <CheckCircle2 className="w-3 h-3 text-white" />}
              </span>
              {form.vendor_paid ? "Pagado al vendedor" : "Pago pendiente al vendedor"}
            </button>
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

const SHIPPING_FILTER = [
  { value: "todos", label: "Todos" },
  { value: "Preparando pedido", label: "Preparando" },
  { value: "Listo para entrega", label: "Listo para entrega" },
  { value: "Enviado", label: "Enviado" },
  { value: "Entregado", label: "Entregado" },
]

const CASHBACK_FILTER = [
  { value: "todos", label: "Todos" },
  { value: "evento_pendiente", label: "Evento pendiente" },
  { value: "transferencia_pendiente", label: "Transferencia pendiente" },
  { value: "transferido", label: "Transferido" },
  { value: "evento_perdido", label: "Evento perdido" },
]

const VENDOR_PAID_FILTER = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pago pendiente" },
  { value: "pagado", label: "Pagado" },
]

function FilterRow({
  label, icon, options, value, onChange, counts,
}: {
  label: string
  icon: React.ReactNode
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  counts: Record<string, number>
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider pt-1.5 w-20 shrink-0">
        {icon}{label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const count = opt.value === "todos" ? undefined : counts[opt.value] ?? 0
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
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
    </div>
  )
}

const BULK_ACTIONS = [
  { label: "Vendedor pagado", fields: { vendor_paid: true } },
  { label: "Enviado", fields: { shipping_status: "Enviado" } },
  { label: "Entregado", fields: { shipping_status: "Entregado" } },
  { label: "CashBak transferido", fields: { cashback_status: "transferido" } },
  { label: "Evento perdido", fields: { cashback_status: "evento_perdido" } },
]

export default function OrdersPanel({ orders }: { orders: Order[] }) {
  const [shippingFilter, setShippingFilter] = useState("todos")
  const [cashbackFilter, setCashbackFilter] = useState("todos")
  const [vendorPaidFilter, setVendorPaidFilter] = useState("todos")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isBulkPending, startBulkTransition] = useTransition()
  const [bulkDone, setBulkDone] = useState(false)

  const filtered = orders.filter(o => {
    const shipOk = shippingFilter === "todos" || o.shipping_status === shippingFilter
    const cbOk = cashbackFilter === "todos" || o.cashback_status === cashbackFilter
    const vpOk = vendorPaidFilter === "todos" || (vendorPaidFilter === "pagado" ? o.vendor_paid : !o.vendor_paid)
    return shipOk && cbOk && vpOk
  })

  const shippingCounts = Object.fromEntries(
    SHIPPING_FILTER.filter(f => f.value !== "todos").map(f => [f.value, orders.filter(o => o.shipping_status === f.value).length])
  )
  const cashbackCounts = Object.fromEntries(
    CASHBACK_FILTER.filter(f => f.value !== "todos").map(f => [f.value, orders.filter(o => o.cashback_status === f.value).length])
  )
  const vendorPaidCounts = {
    pendiente: orders.filter(o => !o.vendor_paid).length,
    pagado: orders.filter(o => o.vendor_paid).length,
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(o => o.id)))
    }
  }

  const handleBulkAction = (fields: Record<string, unknown>) => {
    startBulkTransition(async () => {
      await bulkUpdateOrders([...selected], fields as Parameters<typeof bulkUpdateOrders>[1])
      setSelected(new Set())
      setBulkDone(true)
      setTimeout(() => setBulkDone(false), 2000)
    })
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length

  return (
    <div>
      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 space-y-3">
        <FilterRow
          label="Envío"
          icon={<Truck className="w-3.5 h-3.5" />}
          options={SHIPPING_FILTER}
          value={shippingFilter}
          onChange={setShippingFilter}
          counts={shippingCounts}
        />
        <div className="border-t border-gray-100" />
        <FilterRow
          label="CashBak"
          icon={<Banknote className="w-3.5 h-3.5" />}
          options={CASHBACK_FILTER}
          value={cashbackFilter}
          onChange={setCashbackFilter}
          counts={cashbackCounts}
        />
        <div className="border-t border-gray-100" />
        <FilterRow
          label="Vendedor"
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          options={VENDOR_PAID_FILTER}
          value={vendorPaidFilter}
          onChange={setVendorPaidFilter}
          counts={vendorPaidCounts}
        />
      </div>

      {/* Barra de selección / bulk actions */}
      <div className="flex items-center gap-3 mb-3 min-h-[36px]">
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-700 font-medium"
        >
          {allSelected ? <CheckSquare className="w-4 h-4 text-green-700" /> : <Square className="w-4 h-4" />}
          {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
        </button>

        {selected.size > 0 && (
          <>
            <span className="text-xs text-gray-400">{selected.size} seleccionados</span>
            <div className="flex flex-wrap gap-2 ml-2">
              {BULK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={() => handleBulkAction(action.fields)}
                  disabled={isBulkPending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-900 text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
                >
                  {isBulkPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {action.label}
                </button>
              ))}
            </div>
            {bulkDone && (
              <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Actualizado
              </span>
            )}
          </>
        )}

        <p className="text-xs text-gray-400 ml-auto">{filtered.length} pedidos</p>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center py-10 text-gray-400">No hay pedidos con estos filtros</p>
        )}
        {filtered.map(order => (
          <OrderRow
            key={order.id}
            order={order}
            selected={selected.has(order.id)}
            onSelect={toggleSelect}
          />
        ))}
      </div>
    </div>
  )
}
