"use client"

import { useState, useTransition } from "react"
import { markOrderVendorPaid, markAllVendorPaid } from "./actions"
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Package } from "lucide-react"

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  price: number
  size: string | null
}

interface VendorOrder {
  id: string
  order_total: number
  created_at: string
  customer_name: string | null
  customer_email: string | null
  shipping_method: string | null
  shipping_status: string | null
  customer_confirmed: boolean
  items: OrderItem[]
}

const SHIPPING_COLORS: Record<string, string> = {
  "Preparando pedido": "bg-yellow-100 text-yellow-800",
  "Listo para entrega": "bg-blue-100 text-blue-800",
  "Enviado": "bg-purple-100 text-purple-800",
  "Entregado": "bg-green-100 text-green-800",
}

function OrderRow({ order, storeId }: { order: VendorOrder; storeId: string }) {
  const [open, setOpen] = useState(false)
  const [paid, setPaid] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handlePaid = () => {
    startTransition(async () => {
      const res = await markOrderVendorPaid(order.id, storeId)
      if (!res.error) setPaid(true)
    })
  }

  const date = new Date(order.created_at).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", year: "numeric",
  })

  if (paid) {
    return (
      <div className="flex items-center gap-2 px-5 py-3 bg-green-50 rounded-xl text-sm text-green-700 border border-green-200">
        <CheckCircle2 className="w-4 h-4" />
        <span>Pedido <span className="font-mono font-semibold">{order.id.slice(0, 8).toUpperCase()}</span> marcado como pagado</span>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 bg-white rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex-1 grid grid-cols-3 gap-2 items-center">
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
          <div className="text-right">
            <p className="text-xs text-gray-400">Total compra</p>
            <p className="text-sm font-bold text-gray-900">${order.order_total.toLocaleString("es-CL")}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Productos
            </p>
            <div className="space-y-1.5">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 text-sm">
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

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {order.shipping_method && (
              <p>Método: <span className="font-medium">{order.shipping_method}</span></p>
            )}
            <p>Estado envío: {order.shipping_status ? (
              <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${SHIPPING_COLORS[order.shipping_status] ?? "bg-gray-100 text-gray-600"}`}>
                {order.shipping_status}
              </span>
            ) : (
              <span className="inline-block px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500">Sin actualizar</span>
            )}</p>
            <p>Confirmación cliente: {order.customer_confirmed ? (
              <span className="inline-block px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">Recibido ✓</span>
            ) : (
              <span className="inline-block px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500">Pendiente</span>
            )}</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handlePaid}
              disabled={isPending}
              className="flex items-center gap-2 bg-green-900 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Marcar como pagado
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VendorDetailClient({
  storeId,
  orders,
}: {
  storeId: string
  orders: VendorOrder[]
}) {
  const [allPaid, setAllPaid] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleMarkAll = () => {
    startTransition(async () => {
      const res = await markAllVendorPaid(orders.map(o => o.id), storeId)
      if (!res.error) setAllPaid(true)
    })
  }

  const total = orders.reduce((s, o) => s + o.order_total, 0)

  if (allPaid) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
        <p className="text-lg font-semibold text-green-800">Todos los pedidos marcados como pagados</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumen + botón pagar todo */}
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{orders.length} pedido{orders.length !== 1 ? "s" : ""} pendientes</p>
          <p className="text-2xl font-bold text-gray-900">${total.toLocaleString("es-CL")}</p>
          <p className="text-xs text-gray-400">Total a transferir al vendedor</p>
        </div>
        <button
          onClick={handleMarkAll}
          disabled={isPending}
          className="flex items-center gap-2 bg-green-900 hover:bg-green-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Marcar todos como pagados
        </button>
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-3">
        {orders.map(order => (
          <OrderRow key={order.id} order={order} storeId={storeId} />
        ))}
      </div>
    </div>
  )
}
