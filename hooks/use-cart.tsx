"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { calculateExternalCashbak } from "@/lib/cashbak-calculator"
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
  hasPrint: boolean
}

export type Delivery = "envio" | "Entrega Metro Tobalaba" | "Entrega Metro Fernando Castillo Velasco" | null

type CartContextType = {
  items: CartItem[]
  addItem: (productId: number, quantity: number, betOptionId: string, size: string, hasPrint: boolean) => Promise<void>
  removeItem: (index: number) => void
  updateItemQuantity: (index: number, quantity: number) => void
  updateItemBetOption: (index: number, betOptionId: string) => Promise<void>
  updateItemSize: (index: number, size: string) => void
  updateItemHasPrint: (index: number, hasPrint: boolean) => void
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
    hasPrint: boolean
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

  // Cuando cargan los productos, limpia items huérfanos (producto eliminado o inválido)
  useEffect(() => {
    if (loading || products.length === 0) return
    setItems(prev => {
      const valid = prev.filter(item => products.some(p => p.id === item.productId))
      return valid.length !== prev.length ? valid : prev
    })
  }, [loading, products])

  useEffect(() => {
    localStorage.setItem("cashbak-cart", JSON.stringify(items))
  }, [items])

  const addItem = async (
    productId: number,
    quantity: number,
    betOptionId: string,
    size: string,
    hasPrint: boolean
  ) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const bet = bets.find(b => b.id === Number.parseFloat(betOptionId))
    const cuota = bet?.odd ?? 0
    const price = hasPrint ? product.price + 2990 : product.price
    const cost = hasPrint ? product.cost + 2500 : product.cost
    const sim = calculateExternalCashbak({ precioVenta: price, costo: cost, cuota, margenVendedorPct: product.margin_pct ?? 0.25 })
    const cashbakPercentage = sim.cashbackPct
    const bet_amount = sim.montoApuesta

    const existingItemIndex = items.findIndex(
      (item) =>
        item.productId === productId &&
        item.betOptionId === betOptionId &&
        item.size === size &&
        item.hasPrint === hasPrint
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
          hasPrint
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
      const bet = bets.find(b => b.id === Number.parseFloat(betOptionId))
      const cuota = bet?.odd ?? 0
      const price = item.hasPrint ? product.price + 2990 : product.price
      const cost = item.hasPrint ? product.cost + 2500 : product.cost
      const sim = calculateExternalCashbak({ precioVenta: price, costo: cost, cuota, margenVendedorPct: product.margin_pct ?? 0.25 })
      item.cashbakPercentage = sim.cashbackPct
      item.bet_amount = sim.montoApuesta
    }

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

  const updateItemHasPrint = (index: number, hasPrint: boolean) => {
    const updatedItems = [...items]
    updatedItems[index].hasPrint = hasPrint
    const item = updatedItems[index]

    const product = products.find((p) => p.id === item.productId)
    if (product) {
      const bet = bets.find(b => b.id === Number.parseFloat(item.betOptionId))
      const cuota = bet?.odd ?? 0
      const price = item.hasPrint ? product.price + 2990 : product.price
      const cost = item.hasPrint ? product.cost + 2500 : product.cost
      const sim = calculateExternalCashbak({ precioVenta: price, costo: cost, cuota, margenVendedorPct: product.margin_pct ?? 0.25 })
      item.cashbakPercentage = sim.cashbackPct
      item.bet_amount = sim.montoApuesta
    }

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
      return total + ((product?.price || 0) + (item.hasPrint ? 2990 : 0)) * item.quantity
    }, 0) + shippingCost
  }

  const calcItemCashbak = (item: CartItem, product: Product): { pct: number; montoApuesta: number } => {
    const bet = bets.find(b => b.id.toString() === item.betOptionId)
    if (!bet) return { pct: 0, montoApuesta: 0 }
    const price = item.hasPrint ? product.price + 2990 : product.price
    const cost = item.hasPrint ? product.cost + 2500 : product.cost
    const sim = calculateExternalCashbak({ precioVenta: price, costo: cost, cuota: bet.odd, margenVendedorPct: product.margin_pct ?? 0.25 })
    return { pct: sim.cashbackPct, montoApuesta: sim.montoApuesta }
  }

  const getTotalcashbak = () => {
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return total
      const { pct } = calcItemCashbak(item, product)
      const subtotal = (product.price + (item.hasPrint ? 2990 : 0)) * item.quantity
      return total + (subtotal * pct) / 100
    }, 0)
  }

  const getItemDetails = (item: CartItem) => {
    const product = products.find((p) => p.id === item.productId)
    const bet = bets.find((b) => b.id.toString() === item.betOptionId)
    const subtotal = ((product?.price || 0) + (item.hasPrint ? 2990 : 0)) * item.quantity
    const { pct: cashbakPercentage, montoApuesta } = product ? calcItemCashbak(item, product) : { pct: 0, montoApuesta: 0 }
    const cashbakAmount = (subtotal * cashbakPercentage) / 100

    return {
      product,
      betName: bet?.name || "Opción no disponible",
      subtotal,
      cashbakAmount,
      cashbakPercentage,
      bet_amount: montoApuesta,
      size: item.size,
      hasPrint: item.hasPrint,
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
        updateItemHasPrint,
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
