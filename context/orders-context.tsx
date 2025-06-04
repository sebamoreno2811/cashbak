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
  payment_status: string
  created_at: string
  order_items: OrderItem[]
}

interface OrdersContextType {
  orders: Order[]
  loading: boolean
  error: string | null
}

const OrdersContext = createContext<OrdersContextType>({
  orders: [],
  loading: false,
  error: null,
})

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient()
  const { products } = useProducts()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("email", user.email)
          .single()

        if (customerError || !customer) {
          setError("No se pudo obtener el cliente")
          setLoading(false)
          return
        }

        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false })

        if (ordersError || !ordersData) {
          setError("No se pudieron obtener las órdenes")
          setLoading(false)
          return
        }

        const enrichedOrders = await Promise.all(
          ordersData.map(async (order: { id: any }) => {
            const { data: items, error: itemsError } = await supabase
              .from("order_items")
              .select("id, quantity, price, bet_option_id, cashback_percentage, product_id, product_name")
              .eq("order_id", order.id)

            if (itemsError || !items) return { ...order, order_items: [] }

            const itemsWithProducts = items.map((item: { product_id: string }) => {
              const product = products.find((p) => String(p.id) === item.product_id)
              return { ...item, product }
            })

            return { ...order, order_items: itemsWithProducts }
          })
        )

        setOrders(enrichedOrders)
      } catch (err) {
        setError("Error general al obtener órdenes")
        console.error(err)
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
