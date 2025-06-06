"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import type { Talla } from "@/types/cart"
import type { Delivery } from "@/hooks/use-cart"
import { ShoppingBag as StoreIcon, Truck as TruckIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, ArrowLeft, ShoppingBag } from "lucide-react"
import { useBets } from "@/context/bet-context"
import BetSelector from "@/components/bet-selector"
import useSupabaseUser from "@/hooks/use-supabase-user"
import AuthModal from "@/components/auth/auth-modal"
import ShippingDetailsForm from "@/components/shipping-modal"
import { useShipping } from "@/context/shipping-context"

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
    deliveryType,
    chooseDeliveryType,
  } = useCart()
  const { user, loading: loadingUser } = useSupabaseUser()
  const { bets, loading: loadingBets } = useBets()

  const [isProcessing, setIsProcessing] = useState(false)
  const [requiresAddress, setRequiresAddress] = useState(false)
  const [invalidBets, setInvalidBets] = useState<string[]>([])

  const { hasShippingDetails } = useShipping()

  const shippingCost = deliveryType === "envio" ? 2990 : 0
  const total = getCartTotal(shippingCost)

  // Validar que las apuestas seleccionadas sean válidas
  const validateBets = () => {
    const nowChile = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }))
    const invalid: string[] = []

    items.forEach((item) => {
      const bet = bets.find((b) => b.id === Number.parseFloat(item.betOptionId))
      if (!bet || new Date(bet.end_date) <= nowChile) {
        const product = getItemDetails(item).product
        invalid.push(product?.name || "Producto sin nombre")
      }
    })

    setInvalidBets(invalid)
    return invalid.length === 0
  }

  const handleCheckout = () => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    if (deliveryType === "envio" && !hasShippingDetails) {
      setRequiresAddress(true)
      return
    }

    if (!validateBets()) {
      return
    }

    setIsProcessing(true)
    router.push("/checkout")
  }

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false)
    window.location.reload()
  }

  if (loadingBets) {
    return (
      <div className="container px-4 py-16 mx-auto text-center text-gray-500">
        Cargando eventos de CashBak...
      </div>
    )
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
          {/* LISTA DE PRODUCTOS */}
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
                    const { product, subtotal } = getItemDetails(item)
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
                            <p className="mt-1 text-sm text-gray-500">Categoría: {product.category_name}</p>

                            <div className="mt-2">
                              <BetSelector
                                value={item.betOptionId}
                                onChange={(value) => updateItemBetOption(index, value)}
                              />
                            </div>

                            <div className="flex items-center mt-2 text-sm text-emerald-600">
                              <span>CashBak: {(item.cashbakPercentage ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%</span>
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

                        {/* Precio */}
                        <div className="hidden md:flex md:col-span-2 md:items-center">
                          <span>${product.price.toLocaleString("es-CL")}</span>
                        </div>

                        {/* Cantidad y Talla */}
                        <div className="flex items-end mt-4 gap-x-4 md:mt-0 md:col-span-2">
                          <div className="flex flex-col">
                            <label className="mb-1 text-sm text-gray-600">Cantidad</label>
                            {(() => {
                              const stockDisponible = product?.stock?.[item.size as Talla] ?? 0
                              const cantidadAjustada = Math.min(Math.max(item.quantity, 1), stockDisponible || 1)

                              return (
                                <Select
                                  value={cantidadAjustada.toString()}
                                  onValueChange={(value) => updateItemQuantity(index, parseInt(value))}
                                  disabled={stockDisponible === 0}
                                >
                                  <SelectTrigger className="w-24 h-8 text-sm">
                                    <SelectValue placeholder="Cant." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[...Array(Math.min(stockDisponible, 10))].map((_, i) => (
                                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                                        {i + 1}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )
                            })()}
                          </div>

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
                                {Object.entries(product?.stock || {}).map(([talla, cantidad]) => (
                                  <SelectItem key={talla} value={talla} disabled={cantidad <= 0}>
                                    {talla} {cantidad <= 0 ? "(Agotado)" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="hidden text-right md:flex md:col-span-2 md:items-center md:justify-end">
                          <span>${subtotal.toLocaleString("es-CL")}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RESUMEN */}
          <div className="lg:col-span-1">
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <h2 className="mb-4 text-lg font-bold">Resumen de la orden</h2>

              <div className="mt-6">
                <h3 className="mb-2 text-sm font-medium text-gray-700">Método de entrega</h3>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      chooseDeliveryType("envio")
                      setRequiresAddress(!hasShippingDetails)
                    }}
                    className={`flex items-center p-3 text-left border rounded-lg transition ${
                      deliveryType === "envio"
                        ? "border-green-700 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <TruckIcon className="w-5 h-5 mr-3 text-green-700" />
                    <div>
                      <p className="text-sm font-medium">Envío a domicilio</p>
                      <p className="text-xs text-gray-500">Recibe tu pedido en la dirección que elijas</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      chooseDeliveryType("retiro")
                      setRequiresAddress(false)
                    }}
                    className={`flex items-center p-3 text-left border rounded-lg transition ${
                      deliveryType === "retiro"
                        ? "border-green-700 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <StoreIcon className="w-5 h-5 mr-3 text-green-700" />
                    <div>
                      <p className="text-sm font-medium">Retiro en tienda</p>
                      <p className="text-xs text-gray-500">Puedes retirar tu pedido sin costo</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${getCartTotal(0).toLocaleString("es-CL")}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span>{shippingCost > 0 ? `$${shippingCost.toLocaleString("es-CL")}` : "Gratis"}</span>
                </div>

                <div className="flex justify-between text-emerald-600">
                  <span>CashBak potencial</span>
                  <span>${Math.ceil(getTotalcashbak()).toLocaleString("es-CL")}</span>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${total.toLocaleString("es-CL")}</span>
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

      {/* Modal dirección */}
      {deliveryType === "envio" && requiresAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-lg font-bold">Completa tus datos de envío</h2>
            <ShippingDetailsForm onSaved={() => setRequiresAddress(false)} />
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setRequiresAddress(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal apuestas inválidas */}
      {invalidBets.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-red-600">Apuesta inválida</h2>
            <p className="mb-4 text-sm text-gray-700">
              Debes cambiar las apuestas para los siguientes productos, ya que están vencidas:
            </p>
            <ul className="mb-4 text-sm text-gray-800 list-disc list-inside">
              {invalidBets.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setInvalidBets([])}>
                Cambiar apuestas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de autenticación */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
