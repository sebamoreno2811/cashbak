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
  vendor_net_amount: number
}

interface VendorOrder {
  id: string
  order_total: number
  vendor_net_amount: number
  shipping_cost: number
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

function getShippingCost(order: VendorOrder) {
  return order.shipping_cost ?? 0
}

function OrderRow({ order, storeId }: { order: VendorOrder; storeId: string }) {
  const [open, setOpen] = useState(false)
  const [paid, setPaid] = useState(false)
  const [isPending, startTransition] = useTransition()

  const shippingCost = getShippingCost(order)
  const totalTransfer = order.vendor_net_amount + shippingCost

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
            <p className="text-xs text-gray-400">A transferir</p>
            <p className="text-sm font-bold text-emerald-700">${totalTransfer.toLocaleString("es-CL")}</p>
            <p className="text-xs text-gray-400">Compra: ${order.order_total.toLocaleString("es-CL")}</p>
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
                <div key={item.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-gray-800">{item.product_name}</span>
                      {item.size && <span className="ml-2 text-xs text-gray-400">Talla: {item.size}</span>}
                      <span className="ml-2 text-xs text-gray-400">x{item.quantity}</span>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-semibold text-gray-800">${(item.price * item.quantity).toLocaleString("es-CL")}</p>
                      <p className="text-xs text-emerald-600 font-medium">Margen: ${item.vendor_net_amount.toLocaleString("es-CL")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">Precio total de compra</p>
              <p className="text-base font-bold text-gray-800">${order.order_total.toLocaleString("es-CL")}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">Total a transferir</p>
              <p className="text-base font-bold text-emerald-700">${totalTransfer.toLocaleString("es-CL")}</p>
              <p className="text-[10px] text-gray-400">
                Margen: ${order.vendor_net_amount.toLocaleString("es-CL")}
                {shippingCost > 0 && ` + Envío: $${shippingCost.toLocaleString("es-CL")}`}
              </p>
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
  ordersReady,
  ordersInTransit,
}: {
  storeId: string
  ordersReady: VendorOrder[]
  ordersInTransit: VendorOrder[]
}) {
  const [allPaid, setAllPaid] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleMarkAll = () => {
    startTransition(async () => {
      const res = await markAllVendorPaid(ordersReady.map(o => o.id), storeId)
      if (!res.error) setAllPaid(true)
    })
  }

  const netTotal = ordersReady.reduce((s, o) => s + o.vendor_net_amount + getShippingCost(o), 0)
  const total = ordersReady.reduce((s, o) => s + o.order_total, 0)

  return (
    <div className="space-y-6">

      {/* ── Listos para pagar ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Listos para pagar</h2>
            <p className="text-xs text-gray-400">Pedidos con estado Entregado</p>
          </div>
          {ordersReady.length > 0 && !allPaid && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
              {ordersReady.length} pedido{ordersReady.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {allPaid ? (
          <div className="flex items-center gap-2 px-5 py-4 bg-green-50 rounded-xl text-green-700 border border-green-200">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-semibold">Todos los pedidos entregados marcados como pagados</p>
          </div>
        ) : ordersReady.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Sin pedidos entregados pendientes de pago.</p>
        ) : (
          <>
            {/* Resumen + botón */}
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">${netTotal.toLocaleString("es-CL")}</p>
                <p className="text-xs text-gray-400">Neto a transferir al vendedor</p>
                <p className="text-xs text-gray-400">Total compras: ${total.toLocaleString("es-CL")}</p>
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
            <div className="space-y-3">
              {ordersReady.map(order => (
                <OrderRow key={order.id} order={order} storeId={storeId} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── En camino ── */}
      {ordersInTransit.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Por entregar</h2>
              <p className="text-xs text-gray-400">Aún no se pueden pagar</p>
            </div>
            <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
              {ordersInTransit.length} pedido{ordersInTransit.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-3 opacity-75">
            {ordersInTransit.map(order => (
              <OrderRow key={order.id} order={order} storeId={storeId} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
