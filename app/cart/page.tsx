"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, ArrowLeft, ShoppingBag } from "lucide-react"
import { bets } from "@/lib/bets"
import useSupabaseUser from "@/hooks/use-supabase-user"
import AuthModal from "@/components/auth/auth-modal"

export default function CartPage() {
  const router = useRouter()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const {
    items,
    removeItem,
    updateItemQuantity,
    updateItemBetOption,
    updateItemSize,
    getCartTotal,
    getTotalcashbak,
    getItemDetails,
    clearCart,
  } = useCart()
  const { user, loading: loadingUser } = useSupabaseUser()

  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = () => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }
    setIsProcessing(true)
    router.push("/checkout")
  }

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false)
    window.location.reload()
  }

  if (items.length === 0) {
    return (
      <div className="container px-4 py-16 mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h1 className="mb-4 text-2xl font-bold">Tu carrito está vacío</h1>
          <p className="mb-8 text-gray-600">
            Parece que aún no has agregado productos a tu carrito.
          </p>
          <Button
            onClick={() => router.push("/products")}
            className="bg-green-900 hover:bg-emerald-700"
          >
            Ver productos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Tu Carrito</h1>
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" /> Seguir comprando
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden bg-white rounded-lg shadow-lg">
              <div className="p-6">
                <div className="hidden mb-4 md:grid md:grid-cols-12 md:gap-4 md:text-sm md:font-medium md:text-gray-500">
                  <div className="col-span-6">Producto</div>
                  <div className="col-span-2">Precio</div>
                  <div className="col-span-2"></div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {items.map((item, index) => {
                    const { product, betName, subtotal, cashbakAmount } = getItemDetails(item)
                    if (!product) return null

                    return (
                      <div key={index} className="py-6 md:grid md:grid-cols-12 md:gap-4">
                        {/* Producto */}
                        <div className="flex md:col-span-6">
                          <div className="flex-shrink-0 w-24 h-24 overflow-hidden rounded-md">
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="flex flex-col flex-1 ml-4">
                            <h3 className="text-base font-medium">{product.name}</h3>
                            <p className="mt-1 text-sm text-gray-500">Categoría: {product.categoryName}</p>

                            {/* Evento (mobile) */}
                            <div className="mt-2 md:hidden">
                              <p className="mb-1 text-sm text-gray-500">Evento asociado a Cashbak:</p>
                              <Select
                                value={item.betOptionId}
                                onValueChange={(value) => updateItemBetOption(index, value)}
                              >
                                <SelectTrigger className="w-full h-8 text-xs">
                                  <SelectValue placeholder="Selecciona un evento pa" />
                                </SelectTrigger>
                                <SelectContent>
                                  {bets.map((bet) => (
                                    <SelectItem key={bet.id} value={bet.id.toString()}>
                                      {bet.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Evento (desktop) */}
                            <div className="hidden mt-2 md:block">
                              <Select
                                value={item.betOptionId}
                                onValueChange={(value) => updateItemBetOption(index, value)}
                              >
                                <SelectTrigger className="w-full h-8 text-xs">
                                  <SelectValue placeholder="Selecciona una Evento" />
                                </SelectTrigger>
                                <SelectContent>
                                  {bets.map((bet) => (
                                    <SelectItem key={bet.id} value={bet.id.toString()}>
                                      {bet.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center mt-2 text-sm text-emerald-600">
                              <span>CashBak: {(item.cashbakPercentage ?? 0).toFixed(0)}%</span>
                            </div>

                            <button
                              onClick={() => removeItem(index)}
                              className="flex items-center self-start mt-2 text-sm text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar
                            </button>
                          </div>
                        </div>

                        {/* Precio (desktop) */}
                        <div className="hidden md:flex md:col-span-2 md:items-center">
                          <span>${product.price.toLocaleString()}</span>
                        </div>

                        {/* Cantidad + Talla */}
                        <div className="flex items-end mt-4 gap-x-4 md:mt-0 md:col-span-2">
                          {/* Cantidad */}
                          <div className="flex flex-col">
                            <label className="mb-1 text-sm text-gray-600">Cantidad</label>
                            <Select
                              value={item.quantity.toString()}
                              onValueChange={(value) => updateItemQuantity(index, Number.parseInt(value))}
                            >
                              <SelectTrigger className="w-24 h-8 text-sm">
                                <SelectValue placeholder="Cant." />
                              </SelectTrigger>
                              <SelectContent>
                                {[...Array(10)].map((_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                                    {i + 1}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Talla */}
                          <div className="flex flex-col">
                            <label className="mb-1 text-sm text-gray-600">Talla</label>
                            <Select
                              value={item.size || ""}
                              onValueChange={(val) => updateItemSize(index, val)}
                            >
                              <SelectTrigger className="w-24 h-8 text-sm">
                                <SelectValue placeholder="Talla" />
                              </SelectTrigger>
                              <SelectContent>
                                {["S", "M", "L", "XL"].map((talla) => (
                                  <SelectItem key={talla} value={talla}>
                                    {talla}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>


                        {/* Subtotal (desktop) */}
                        <div className="hidden text-right md:flex md:col-span-2 md:items-center md:justify-end">
                          <span>${subtotal.toLocaleString()}</span>
                        </div>

                        {/* Subtotal (móvil) */}
                        <div className="mt-4 md:hidden">
                          <span className="text-sm text-gray-500">Subtotal: </span>
                          <span className="font-medium">${subtotal.toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RESUMEN DE ORDEN */}
          <div className="lg:col-span-1">
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <h2 className="mb-4 text-lg font-bold">Resumen de la orden</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${getCartTotal().toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span>Gratis</span>
                </div>

                <div className="flex justify-between text-emerald-600">
                  <span>CashBak potencial</span>
                  <span>${Math.ceil(getTotalcashbak()).toLocaleString()}</span>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${getCartTotal().toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Impuestos incluidos</p>
                </div>
              </div>

              <Button
                className="w-full mt-6 bg-green-900 hover:bg-emerald-700"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? "Procesando..." : "Finalizar compra"}
              </Button>

              <div className="mt-6">
                <h3 className="mb-2 text-sm font-medium">Información de CashBak</h3>
                <p className="text-sm text-gray-600">
                  El CashBak se acreditará en tu cuenta una vez que se confirme el resultado de los eventos deportivos seleccionados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de autenticación */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
    </div>
  )
}
