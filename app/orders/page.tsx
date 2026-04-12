"use client"

import { useOrders } from "@/context/orders-context"
import { useState, useTransition, useEffect } from "react"
import { confirmOrderReceived } from "./actions"
import { createClient } from "@/utils/supabase/client"
import { CheckCircle2, Loader2, ChevronDown, ChevronUp, Package, Trophy, Clock, XCircle, Banknote } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// ── Tipos ──────────────────────────────────────────────────────────────────

interface BetInfo { name: string; is_winner: boolean | null }

// ── Helpers ────────────────────────────────────────────────────────────────

const SHIPPING_COLORS: Record<string, string> = {
  "Preparando pedido": "bg-yellow-100 text-yellow-700",
  "Listo para entrega": "bg-blue-100 text-blue-700",
  "Enviado": "bg-purple-100 text-purple-700",
  "Entregado": "bg-green-100 text-green-700",
}

function CashbackBadge({ cashbackStatus, winningAmount }: { cashbackStatus: string; winningAmount: number }) {
  if (cashbackStatus === "transferido") {
    return (
      <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
        <Banknote className="w-4 h-4 text-green-700 shrink-0" />
        <div>
          <p className="text-xs font-bold text-green-700">CashBak transferido ✓</p>
          {winningAmount > 0 && (
            <p className="text-xs text-green-600">${winningAmount.toLocaleString("es-CL")} recibido</p>
          )}
        </div>
      </div>
    )
  }
  if (cashbackStatus === "transferencia_pendiente") {
    return (
      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
        <Trophy className="w-4 h-4 text-emerald-700 shrink-0" />
        <div>
          <p className="text-xs font-bold text-emerald-700">¡Ganaste! Transferencia en camino</p>
          {winningAmount > 0 && (
            <p className="text-xs text-emerald-600">${winningAmount.toLocaleString("es-CL")} por recibir</p>
          )}
        </div>
      </div>
    )
  }
  if (cashbackStatus === "evento_perdido") {
    return (
      <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
        <p className="text-xs font-medium text-red-500">El evento no se cumplió — sin CashBak</p>
      </div>
    )
  }
  // evento_pendiente (default)
  return (
    <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
      <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
      <p className="text-xs font-medium text-yellow-700">Esperando resultado del evento</p>
    </div>
  )
}

// ── ConfirmButton ──────────────────────────────────────────────────────────

function ConfirmButton({ orderId }: { orderId: string }) {
  const [confirmed, setConfirmed] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirmed) {
    return (
      <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" /> Recepción confirmada
      </div>
    )
  }

  return (
    <button
      onClick={() => startTransition(async () => {
        const res = await confirmOrderReceived(orderId)
        if (!res.error) setConfirmed(true)
      })}
      disabled={isPending}
      className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-green-700 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-60"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
      Confirmar recepción
    </button>
  )
}

// ── OrderCard ──────────────────────────────────────────────────────────────

function OrderCard({ order, bets }: { order: any; bets: Record<number, BetInfo> }) {
  const [open, setOpen] = useState(false)

  const date = new Date(order.created_at).toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  })

  const winningAmount = order.order_items.reduce((total: number, item: any) => {
    const bet = bets[Number(item.bet_option_id)]
    if (bet?.is_winner === true) {
      return total + ((item.cashback_percentage || 0) / 100) * item.price * item.quantity
    }
    return total
  }, 0)

  const shippingColor = SHIPPING_COLORS[order.shipping_status] ?? "bg-gray-100 text-gray-600"

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${shippingColor}`}>
                {order.shipping_status ?? "Preparando pedido"}
              </span>
            </div>
            <p className="text-xs text-gray-400">{date}</p>
            <p className="text-sm font-semibold text-gray-900">${order.order_total.toLocaleString("es-CL")} CLP</p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Productos
            </p>
            <div className="space-y-2">
              {order.order_items.map((item: any) => {
                const bet = bets[Number(item.bet_option_id)]
                const resultado = bet?.is_winner === true ? "Ganado" : bet?.is_winner === false ? "Perdido" : "Pendiente"
                const resultColor = resultado === "Ganado" ? "bg-green-100 text-green-700" : resultado === "Perdido" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"
                const cashbackMonto = Math.round(((item.cashback_percentage || 0) / 100) * item.price * item.quantity)

                return (
                  <div key={item.id} className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.quantity > 1 ? `x${item.quantity} · ` : ""}
                          ${item.price.toLocaleString("es-CL")} c/u
                          {item.size ? ` · Talla: ${item.size}` : ""}
                        </p>
                        {bet && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">Evento: {bet.name}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${resultColor}`}>
                          {resultado}
                        </span>
                        <p className="text-xs text-emerald-600 font-medium mt-1">
                          {item.cashback_percentage}% = ${cashbackMonto.toLocaleString("es-CL")}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CashBak status */}
          <CashbackBadge cashbackStatus={order.cashback_status ?? "evento_pendiente"} winningAmount={Math.round(winningAmount)} />

          {/* Confirmar recepción */}
          {!order.customer_confirmed ? (
            order.shipping_status === "Enviado" || order.shipping_status === "Listo para entrega" ? (
              <div className="pt-1">
                <ConfirmButton orderId={order.id} />
              </div>
            ) : null
          ) : (
            <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Recepción confirmada
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { orders, loading: ordersLoading } = useOrders()
  const [bets, setBets] = useState<Record<number, BetInfo>>({})
  const [betsLoading, setBetsLoading] = useState(true)

  useEffect(() => {
    if (ordersLoading) return
    const betIds = [...new Set(
      orders.flatMap(o => o.order_items.map(i => i.bet_option_id)).filter(Boolean)
    )]
    if (betIds.length === 0) { setBetsLoading(false); return }
    createClient()
      .from("bets")
      .select("id, name, is_winner")
      .in("id", betIds)
      .then(({ data }: { data: { id: number; name: string; is_winner: boolean | null }[] | null }) => {
        const map: Record<number, BetInfo> = {}
        for (const b of data ?? []) {
          map[b.id] = { name: b.name, is_winner: b.is_winner }
        }
        setBets(map)
        setBetsLoading(false)
      })
  }, [ordersLoading, orders])

  if (ordersLoading || betsLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-3">
        <Skeleton className="w-32 h-8" />
        <Skeleton className="w-full h-24 rounded-2xl" />
        <Skeleton className="w-full h-24 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Sin pedidos todavía</p>
          <p className="text-sm mt-1">Cuando realices una compra, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} bets={bets} />
          ))}
        </div>
      )}
    </div>
  )
}
