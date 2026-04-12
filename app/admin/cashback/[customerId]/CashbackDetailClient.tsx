"use client"

import { useState, useTransition } from "react"
import { markCashbackTransferred, markAllCashbackTransferred } from "./actions"
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Loader2, Package, Trophy } from "lucide-react"

interface OrderItem {
  product_name: string
  bet_name: string
  cashback_percentage: number
  is_winner: boolean | null
  quantity: number
  price: number
}

interface CashbackOrder {
  id: string
  order_total: number
  cashback_amount: number
  winning_cashback: number
  cashback_transfer_note: string | null
  created_at: string
  bet_end_date: string | null
  items: OrderItem[]
}

interface CustomerInfo {
  full_name: string | null
  email: string
  rut: string | null
  bank_name: string | null
  account_type: string | null
  account_number: string | null
}

const RESULT_COLORS: Record<string, string> = {
  Ganado: "bg-green-100 text-green-700",
  Perdido: "bg-red-100 text-red-600",
  Pendiente: "bg-yellow-100 text-yellow-700",
}

function OrderRow({ order, customerEmail }: { order: CashbackOrder; customerEmail: string }) {
  const [open, setOpen] = useState(false)
  const [paid, setPaid] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleMark = () => {
    startTransition(async () => {
      const res = await markCashbackTransferred(order.id, customerEmail)
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
        <span>Pedido <span className="font-mono font-semibold">{order.id.slice(0, 8).toUpperCase()}</span> marcado como transferido</span>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 bg-white rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex-1 grid grid-cols-2 gap-2 items-center">
          <div>
            <p className="text-xs text-gray-400">Pedido</p>
            <p className="text-sm font-mono font-semibold text-gray-800">{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">CashBak a transferir</p>
            <p className="text-sm font-bold text-emerald-700">${order.winning_cashback.toLocaleString("es-CL")}</p>
            <p className="text-xs text-gray-400">Compra: ${order.order_total.toLocaleString("es-CL")}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {order.cashback_transfer_note && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm text-orange-700">
              ⚠️ {order.cashback_transfer_note}
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Productos y eventos
            </p>
            <div className="space-y-1.5">
              {order.items.map((item, i) => {
                const resultado = item.is_winner === true ? "Ganado" : item.is_winner === false ? "Perdido" : "Pendiente"
                return (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-medium text-gray-800">{item.product_name}</span>
                        <span className="ml-2 text-xs text-gray-400">x{item.quantity}</span>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">Evento: {item.bet_name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${RESULT_COLORS[resultado]}`}>
                          {resultado}
                        </span>
                        <span className="text-xs font-bold text-emerald-700">{item.cashback_percentage}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">Total de compra</p>
              <p className="text-base font-bold text-gray-800">${order.order_total.toLocaleString("es-CL")}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">CashBak a transferir</p>
              <p className="text-base font-bold text-emerald-700">${order.winning_cashback.toLocaleString("es-CL")}</p>
              <p className="text-[10px] text-gray-400">Solo eventos ganados</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleMark}
              disabled={isPending}
              className="flex items-center gap-2 bg-green-900 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Marcar como transferido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CashbackDetailClient({
  customer,
  orders,
  ordersPending,
}: {
  customer: CustomerInfo
  orders: CashbackOrder[]
  ordersPending: CashbackOrder[]
}) {
  const [allDone, setAllDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const totalCashback = orders.reduce((s, o) => s + o.winning_cashback, 0)

  const handleMarkAll = () => {
    startTransition(async () => {
      const res = await markAllCashbackTransferred(orders.map(o => o.id), customer.email)
      if (!res.error) setAllDone(true)
    })
  }

  return (
    <div className="space-y-6">

      {/* Datos del cliente */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Cliente</h2>
          <div className="space-y-1.5 text-sm text-gray-600">
            <p><span className="font-medium text-gray-700">Nombre:</span> {customer.full_name ?? "—"}</p>
            <p><span className="font-medium text-gray-700">Email:</span> {customer.email}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Datos bancarios</h2>
          {customer.bank_name ? (
            <div className="space-y-1.5 text-sm text-gray-600">
              {customer.rut && <p><span className="font-medium text-gray-700">RUT:</span> <span className="font-mono">{customer.rut}</span></p>}
              <p><span className="font-medium text-gray-700">Banco:</span> {customer.bank_name}</p>
              <p><span className="font-medium text-gray-700">Tipo:</span> {customer.account_type ?? "—"}</p>
              <p><span className="font-medium text-gray-700">Cuenta:</span> <span className="font-mono">{customer.account_number}</span></p>
            </div>
          ) : (
            <p className="text-sm text-orange-600 font-medium">El cliente no ha registrado datos bancarios</p>
          )}
        </div>
      </div>

      {/* Pedidos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Pedidos pendientes de transferencia</h2>
            <p className="text-xs text-gray-400">{orders.length} pedido{orders.length !== 1 ? "s" : ""} con CashBak ganado</p>
          </div>
          {orders.length > 0 && !allDone && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
              {orders.length} pedido{orders.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {allDone ? (
          <div className="flex items-center gap-2 px-5 py-4 bg-green-50 rounded-xl text-green-700 border border-green-200">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-semibold">Todos los CashBaks marcados como transferidos</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">${totalCashback.toLocaleString("es-CL")}</p>
                <p className="text-xs text-gray-400">Total a transferir al cliente</p>
              </div>
              {orders.length > 1 && (
                <button
                  onClick={handleMarkAll}
                  disabled={isPending}
                  className="flex items-center gap-2 bg-green-900 hover:bg-green-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                  Marcar todos como transferidos
                </button>
              )}
            </div>
            <div className="space-y-3">
              {orders.map(order => (
                <OrderRow key={order.id} order={order} customerEmail={customer.email} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Próximamente — eventos aún sin resolver */}
      {ordersPending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Próximamente</h2>
              <p className="text-xs text-gray-400">Tienen eventos pendientes — aún no se pueden transferir</p>
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
              {ordersPending.length} pedido{ordersPending.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-3 opacity-70">
            {ordersPending.map(order => {
              const date = new Date(order.created_at).toLocaleDateString("es-CL", {
                day: "2-digit", month: "short", year: "numeric",
              })
              return (
                <div key={order.id} className="border border-dashed border-gray-300 bg-white rounded-xl overflow-hidden">
                  <div className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-2 items-center">
                      <div>
                        <p className="text-xs text-gray-400">Pedido</p>
                        <p className="text-sm font-mono font-semibold text-gray-600">{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-400">{date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">CashBak estimado</p>
                        <p className="text-sm font-bold text-gray-500">
                          {order.winning_cashback > 0 ? `$${order.winning_cashback.toLocaleString("es-CL")}` : "—"}
                        </p>
                        <p className="text-xs text-gray-400">Compra: ${order.order_total.toLocaleString("es-CL")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-2.5 py-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>Eventos pendientes</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 px-5 py-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> Productos y eventos
                    </p>
                    <div className="space-y-1.5">
                      {order.items.map((item, i) => {
                        const resultado = item.is_winner === true ? "Ganado" : item.is_winner === false ? "Perdido" : "Pendiente"
                        return (
                          <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="font-medium text-gray-700">{item.product_name}</span>
                                <span className="ml-2 text-xs text-gray-400">x{item.quantity}</span>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">Evento: {item.bet_name}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${RESULT_COLORS[resultado]}`}>
                                  {resultado}
                                </span>
                                <span className="text-xs font-bold text-emerald-700">{item.cashback_percentage}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
