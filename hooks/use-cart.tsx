"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { calculatecashbak, calcularMontoApostar } from "@/lib/cashbak-calculator"
import type { Product } from "@/types/product"
import { useProducts } from "@/context/product-context"
import { useBets } from "@/context/bet-context" // <-- ✅ importa el contexto de apuestas

export type CartItem = {
  productId: number
  quantity: number
  betOptionId: string
  cashbakPercentage: number
  bet_amount: number
  size: string
}

export type Delivery = "envio" | "retiro" | null

type CartContextType = {
  items: CartItem[]
  addItem: (productId: number, quantity: number, betOptionId: string, size: string) => Promise<void>
  removeItem: (index: number) => void
  updateItemQuantity: (index: number, quantity: number) => void
  updateItemBetOption: (index: number, betOptionId: string) => Promise<void>
  updateItemSize: (index: number, size: string) => void
  clearCart: () => void
  getItemsCount: () => number
  getCartTotal: (shippingCost: number) => number
  getTotalcashbak: () => number
  deliveryType: Delivery,
  chooseDeliveryType: (type: Delivery) => void,
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
  const { products, loading, error } = useProducts()
  const { bets, loading: betsLoading, error: betsError } = useBets() // <-- ✅ usa el hook aquí
  const [deliveryType, setDeliveryType] = useState<Delivery>("envio")

  const [items, setItems] = useState<CartItem[]>([])

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

  useEffect(() => {
    localStorage.setItem("cashbak-cart", JSON.stringify(items))
  }, [items])

  const addItem = async (
    productId: number,
    quantity: number,
    betOptionId: string,
    size: string
  ) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const cashbakPercentage = calculatecashbak(
      Number.parseFloat(betOptionId),
      product.category,
      products,
      bets
    )

    const bet_amount = calcularMontoApostar(
      Number.parseFloat(betOptionId),
      product.category,
      products,
      bets
    )

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

  const updateItemBetOption = async (index: number, betOptionId: string) => {
    const updatedItems = [...items]
    const item = updatedItems[index]
    item.betOptionId = betOptionId

    const product = products.find((p) => p.id === item.productId)
    if (product) {
      item.cashbakPercentage = calculatecashbak(
        Number.parseFloat(betOptionId),
        product.category,
        products,
        bets
      )
      item.bet_amount = calcularMontoApostar(
        Number.parseInt(betOptionId),
        product.category,
        products,
        bets
      )
    }
    console.log("acaaaaa")
    console.log(item.bet_amount)

    setItems(updatedItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const chooseDeliveryType = (type: Delivery) => {
    setDeliveryType(type)
  }


  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return
    const updatedItems = [...items]
    updatedItems[index].quantity = quantity
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

  const getCartTotal = (shippingCost: number) => {
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId)
      return total + (product?.price || 0) * item.quantity
    }, 0) + shippingCost
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
    const bet = bets.find((b) => b.id.toString() === item.betOptionId) // <-- ✅ usa el context
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

  // Mostrar carga combinada de productos o apuestas
  if (loading || betsLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-green-700 rounded-full border-t-transparent animate-spin" />
      </div>
    )

  if (error || betsError)
    return <div>Error cargando datos: {error || betsError}</div>

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
        deliveryType,
        chooseDeliveryType,
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
