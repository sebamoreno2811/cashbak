"use client"

import { useOrders } from "@/context/orders-context"
import { useProducts } from "@/context/product-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { toSlug } from "@/lib/slug"
import { useState, useTransition, useEffect } from "react"
import { confirmOrderReceived } from "./actions"
import { CheckCircle2, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

function ConfirmButton({ orderId }: { orderId: string }) {
  const [confirmed, setConfirmed] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await confirmOrderReceived(orderId)
      if (!res.error) setConfirmed(true)
    })
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" />
        Recepción confirmada
      </div>
    )
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={isPending}
      className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-green-700 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-60"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
      Confirmar recepción
    </button>
  )
}

export default function OrdersPage() {
  const { orders, loading: ordersLoading } = useOrders()
  const { products, loading: productsLoading } = useProducts()
  const [bets, setBets] = useState<Record<number, { name: string; is_winner: boolean | null }>>({})
  const [betsLoading, setBetsLoading] = useState(true)

  useEffect(() => {
    if (ordersLoading) return
    const betIds = [...new Set(
      orders.flatMap(o => o.order_items.map(i => i.bet_option_id)).filter(Boolean)
    )]
    if (betIds.length === 0) { setBetsLoading(false); return }
    const supabase = createClient()
    supabase.from("bets").select("id, name, is_winner").in("id", betIds).then(({ data }: { data: { id: number; name: string; is_winner: boolean | null }[] | null }) => {
      const map: Record<number, { name: string; is_winner: boolean | null }> = {}
      for (const b of (data ?? []) as { id: number; name: string; is_winner: boolean | null }[]) {
        map[b.id] = { name: b.name, is_winner: b.is_winner }
      }
      setBets(map)
      setBetsLoading(false)
    })
  }, [ordersLoading, orders])

  if (ordersLoading || betsLoading || productsLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-24" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl p-4 mx-auto">
      <h1 className="mb-4 text-2xl font-bold">Mis Pedidos</h1>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">No tienes pedidos todavía.</p>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="p-4 mb-4 space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <p className="font-medium">Total: ${order.order_total.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</p>
              <p className="text-sm">Estado: {order.shipping_status}</p>
              {(() => {
                const cashbackStatus = (order as any).cashback_status ?? "evento_pendiente"

                const hayPendientes = order.order_items.some(
                  (item) => (bets[Number(item.bet_option_id)]?.is_winner ?? null) === null
                )
                if (hayPendientes) {
                  return <p className="text-sm">CashBak Final: <span className="font-semibold text-yellow-600">Pendiente</span></p>
                }

                const cashbackGanado = order.order_items.reduce((total, item) => {
                  const bet = bets[Number(item.bet_option_id)]
                  if (bet?.is_winner) return total + ((item.cashback_percentage || 0) / 100) * item.price * item.quantity
                  return total
                }, 0)

                if (cashbackStatus === "transferido") {
                  return <p className="text-sm">CashBak: <span className="font-semibold text-green-600">Transferido ✓ ${cashbackGanado.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</span></p>
                }

                if (cashbackStatus === "transferencia_pendiente") {
                  return <p className="text-sm">CashBak: <span className="font-semibold text-emerald-600">¡Ganaste! ${cashbackGanado.toLocaleString("es-CL", { maximumFractionDigits: 0 })} — en camino</span></p>
                }

                if (cashbackStatus === "evento_perdido" || cashbackGanado === 0) {
                  return <p className="text-sm">CashBak Final: <span className="font-semibold text-red-500">El evento no se cumplió</span></p>
                }

                return (
                  <p className="text-sm">
                    CashBak Final: <span className="font-semibold text-green-600">${cashbackGanado.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</span>
                  </p>
                )
              })()}
            </div>
            {!order.customer_confirmed ? (
              <div className="pt-2">
                <ConfirmButton orderId={order.id} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium pt-2">
                <CheckCircle2 className="w-4 h-4" />
                Recepción confirmada
              </div>
            )}
            <div className="mt-2 space-y-1">
              {order.order_items.map((item, index) => {
                const bet = bets[Number(item.bet_option_id)]
                const product = products.find((p) => p.id === Number(item.product_id))

                let resultado = "Pendiente"
                let resultadoColor = "text-yellow-600"
                if (bet) {
                  if (bet.is_winner === true) {
                    resultado = "Ganada"
                    resultadoColor = "text-green-600"
                  } else if (bet.is_winner === false) {
                    resultado = "Perdida"
                    resultadoColor = "text-red-600"
                  }
                }

                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between py-2 space-x-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{product?.name || item.product_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.quantity} x ${item.price.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                        </span>
                        {bet && (
                          <span className="flex items-center space-x-1 text-sm">
                            <span className="font-semibold">Evento elegido:</span>
                            <span className="underline">{bet.name}</span>
                          </span>
                        )}
                        <span className="text-sm font-semibold">
                          CashBak:{" "}
                          <span className="text-green-600">{item.cashback_percentage || 0}%</span>{" "}
                          ={" "}
                          <span className="text-green-600">
                            ${((item.cashback_percentage || 0) / 100 * item.price * item.quantity).toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                          </span>
                        </span>
                        <span className="text-sm font-bold">
                          Resultado: <span className={resultadoColor}>{resultado}</span>
                        </span>
                      </div>
                      {product?.image && (
                        <Link href={`/product/${product.id}/${toSlug(product.name)}`} className="block">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="object-cover w-32 h-32 transition shadow-md cursor-pointer rounded-xl hover:opacity-80"
                          />
                        </Link>
                      )}
                    </div>
                    {index < order.order_items.length - 1 && (
                      <div className="my-2 border-t border-gray-200" />
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
