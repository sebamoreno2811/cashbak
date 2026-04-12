"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/utils/supabase/client"
import { useProducts } from "@/context/product-context"

interface OrderItem {
  id: string
  quantity: number
  price: number
  product_id: string
  product_name: string
  cashback_percentage: number
  bet_option_id: number
  product?: {
    id: string
    name: string
    image?: string
  }
}

interface Order {
  id: string
  order_total: number
  cashback_amount: number
  order_status: string
  shipping_status: string
  payment_status: string
  cashback_status: string
  customer_confirmed: boolean
  created_at: string
  order_items: OrderItem[]
}

interface OrdersContextType {
  orders: Order[]
  loading: boolean
  error: string | null
}

const OrdersContext = createContext<OrdersContextType>({ orders: [], loading: false, error: null })

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient()
  const { products } = useProducts()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // Usar user.id directamente como customer_id (evita lookup extra por email)
        // Una sola query con JOIN — evita N+1 queries
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(`
            *,
            order_items (
              id,
              quantity,
              price,
              bet_option_id,
              cashback_percentage,
              product_id,
              product_name,
              size
            )
          `)
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false })

        if (ordersError || !ordersData) {
          setError("No se pudieron obtener las órdenes")
          setLoading(false)
          return
        }

        // Enriquecer items con datos de producto desde el contexto (ya en memoria)
        const enrichedOrders = ordersData.map((order: Order & { order_items: OrderItem[] }) => ({
          ...order,
          order_items: (order.order_items ?? []).map((item: OrderItem) => ({
            ...item,
            product: products.find((p) => String(p.id) === item.product_id),
          })),
        }))

        setOrders(enrichedOrders)
      } catch (err) {
        console.error("Error al obtener órdenes:", err)
        setError("Error al obtener órdenes")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [products])

  return (
    <OrdersContext.Provider value={{ orders, loading, error }}>
      {children}
    </OrdersContext.Provider>
  )
}

export const useOrders = () => useContext(OrdersContext)
