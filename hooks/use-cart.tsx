"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { bets } from "@/lib/bets"
import { products, type Product } from "@/lib/products"
import { calculatecashbak, calcularMontoApostar } from "@/lib/cashbak-calculator"

export type CartItem = {
  productId: number
  quantity: number
  betOptionId: string
  cashbakPercentage: number
  bet_amount: number
  size: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (productId: number, quantity: number, betOptionId: string, size: string) => void
  removeItem: (index: number) => void
  updateItemQuantity: (index: number, quantity: number) => void
  updateItemBetOption: (index: number, betOptionId: string) => void
  updateItemSize: (index: number, size: string) => void
  clearCart: () => void
  getItemsCount: () => number
  getCartTotal: () => number
  getTotalcashbak: () => number
  getItemDetails: (item: CartItem) => {
    product: Product | undefined
    betName: string
    subtotal: number
    cashbakAmount: number
    cashbakPercentage: number
    bet_amount: number
    size: string
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Cargar desde localStorage
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

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem("cashbak-cart", JSON.stringify(items))
  }, [items])

  const addItem = (productId: number, quantity: number, betOptionId: string, size: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const cashbakPercentage = calculatecashbak(Number.parseFloat(betOptionId), product.category)
    const bet_amount = calcularMontoApostar(Number.parseFloat(betOptionId), product.category)

    const existingItemIndex = items.findIndex(
      (item) =>
        item.productId === productId &&
        item.betOptionId === betOptionId &&
        item.size === size
    )

    if (existingItemIndex >= 0) {
      const updatedItems = [...items]
      updatedItems[existingItemIndex].quantity += quantity
      setItems(updatedItems)
    } else {
      setItems([
        ...items,
        {
          productId,
          quantity,
          betOptionId,
          cashbakPercentage,
          bet_amount,
          size,
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
    item.betOptionId = betOptionId

    const product = products.find((p) => p.id === item.productId)
    if (product) {
      item.cashbakPercentage = calculatecashbak(Number.parseFloat(betOptionId), product.category)
      item.bet_amount = calcularMontoApostar(Number.parseFloat(betOptionId), product.category)
    }

    setItems(updatedItems)
  }

  const updateItemSize = (index: number, newSize: string) => {
    const updatedItems = [...items]
    updatedItems[index].size = newSize
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

  const getTotalcashbak = () => {
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return total
      const cashbakAmount = (product.price * item.quantity * item.cashbakPercentage) / 100
      return total + cashbakAmount
    }, 0)
  }

  const getItemDetails = (item: CartItem) => {
    const product = products.find((p) => p.id === item.productId)
    const bet = bets.find((b) => b.id.toString() === item.betOptionId)
    const subtotal = (product?.price || 0) * item.quantity
    const cashbakAmount = (subtotal * item.cashbakPercentage) / 100

    return {
      product,
      betName: bet?.name || "Opción no disponible",
      subtotal,
      cashbakAmount,
      cashbakPercentage: item.cashbakPercentage,
      bet_amount: item.bet_amount,
      size: item.size,
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
        updateItemSize,
        clearCart,
        getItemsCount,
        getCartTotal,
        getTotalcashbak,
        getItemDetails,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
