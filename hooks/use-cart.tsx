"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { bets } from "@/lib/bets"
import { products, type Product } from "@/lib/products"
import { calculateCashback } from "@/lib/cashback-calculator"

export type CartItem = {
  productId: number
  quantity: number
  betOptionId: string
  cashbackPercentage: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (productId: number, quantity: number, betOptionId: string) => void
  removeItem: (index: number) => void
  updateItemQuantity: (index: number, quantity: number) => void
  updateItemBetOption: (index: number, betOptionId: string) => void
  clearCart: () => void
  getItemsCount: () => number
  getCartTotal: () => number
  getTotalCashback: () => number
  getItemDetails: (item: CartItem) => {
    product: Product | undefined
    betName: string
    subtotal: number
    cashbackAmount: number
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Cargar carrito desde localStorage cuando el componente se monta
  useEffect(() => {
    const savedCart = localStorage.getItem("cashbak-cart")
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error)
      }
    }
  }, [])

  // Guardar carrito en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem("cashbak-cart", JSON.stringify(items))
  }, [items])

  const addItem = (productId: number, quantity: number, betOptionId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    // Calcular el porcentaje de cashback
    const cashbackPercentage = calculateCashback(Number.parseFloat(betOptionId), product.category)

    // Verificar si el producto ya está en el carrito
    const existingItemIndex = items.findIndex(
      (item) => item.productId === productId && item.betOptionId === betOptionId,
    )

    if (existingItemIndex >= 0) {
      // Actualizar cantidad si ya existe
      const updatedItems = [...items]
      updatedItems[existingItemIndex].quantity += quantity
      setItems(updatedItems)
    } else {
      // Agregar nuevo item
      setItems([
        ...items,
        {
          productId,
          quantity,
          betOptionId,
          cashbackPercentage,
        },
      ])
    }
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return
    const updatedItems = [...items]
    updatedItems[index].quantity = quantity
    setItems(updatedItems)
  }

  const updateItemBetOption = (index: number, betOptionId: string) => {
    const updatedItems = [...items]
    const item = updatedItems[index]

    // Actualizar la opción de apuesta
    item.betOptionId = betOptionId

    // Recalcular el porcentaje de cashback
    const product = products.find((p) => p.id === item.productId)
    if (product) {
      item.cashbackPercentage = calculateCashback(Number.parseFloat(betOptionId), product.category)
    }

    setItems(updatedItems)
  }

  const clearCart = () => {
    setItems([])
  }

  const getItemsCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getCartTotal = () => {
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId)
      return total + (product?.price || 0) * item.quantity
    }, 0)
  }

  const getTotalCashback = () => {
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return total

      const cashbackAmount = (product.price * item.quantity * item.cashbackPercentage) / 100
      return total + cashbackAmount
    }, 0)
  }

  const getItemDetails = (item: CartItem) => {
    const product = products.find((p) => p.id === item.productId)
    const bet = bets.find((b) => b.id.toString() === item.betOptionId)
    const subtotal = (product?.price || 0) * item.quantity
    const cashbackAmount = (subtotal * item.cashbackPercentage) / 100

    return {
      product,
      betName: bet?.name || "Opción no disponible",
      subtotal,
      cashbackAmount,
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateItemQuantity,
        updateItemBetOption,
        clearCart,
        getItemsCount,
        getCartTotal,
        getTotalCashback,
        getItemDetails,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
