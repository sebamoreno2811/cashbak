"use client"

import { useOrders } from "@/context/orders-context"
import { useBets } from "@/context/bet-context"
import { useProducts } from "@/context/product-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function OrdersPage() {
  const { orders, loading: ordersLoading } = useOrders()
  const { bets, loading: betsLoading } = useBets()
  const { products, loading: productsLoading } = useProducts()

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
                <p className="text-sm text-muted-foreground">
                    Pedido #{order.id.slice(0, 8)} - {new Date(order.created_at).toLocaleDateString()}
                </p>
                <p className="font-medium">Total: ${order.order_total.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</p>
                <p className="text-sm">Estado: {order.order_status}</p>
                <p className="text-sm">Pago: {order.payment_status}</p>
                {(() => {
                    const cashbackEstado = order.order_items.map((item) => {
                    const bet = bets.find((b) => b.id === Number(item.bet_option_id))
                    return bet?.is_winner
                })

                if (cashbackEstado.includes(null)) {
                    return <p className="text-sm">CashBak Final : <span className="font-semibold text-yellow-600">Pendiente</span></p>
                }

                const cashbackGanado = order.order_items.reduce((total, item) => {
                    const bet = bets.find((b) => b.id === Number(item.bet_option_id))
                    if (bet?.is_winner) {
                    return total + ((item.cashback_percentage || 0) / 100) * item.price
                    }
                    return total
                }, 0)

                return (
                    <p className="text-sm">
                    CashBak Final: <span className="font-semibold text-green-600">${cashbackGanado.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</span>
                    </p>
                )
                })()}

            </div>
            <div className="mt-2 space-y-1">
              {order.order_items.map((item, index) => {
                console.log(order)
                const bet = bets.find((b) => b.id === Number(item.bet_option_id))
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
                                <span className="underline" >{bet.name}</span>
                            </span>

                        )}

                        <span className="text-sm font-semibold">
                            CashBak:{" "}
                        <span className="text-green-600">{item.cashback_percentage || 0}%</span>{" "}
                            ={" "}
                        <span className="text-green-600">
                            ${((item.cashback_percentage || 0) / 100 * item.price).toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                        </span>
                        </span>

                        <span className="text-sm font-bold">
                          Resultado: <span className={resultadoColor}>{resultado}</span>
                        </span>

                      </div>

                        {product?.image && (
                            <Link href={`/product/${product.id}`} className="block">
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
