"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import type { Talla } from "@/types/cart"
import type { DeliveryOption } from "@/hooks/use-cart"
import { Truck as TruckIcon, MapPin, AlertTriangle, Building2 } from "lucide-react"

const DEFAULT_DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: "envio", name: "Envío a domicilio", price: 2990, type: "delivery" },
  { id: "metro-tobalaba", name: "Retiro Metro Tobalaba", price: 0, type: "pickup" },
  { id: "metro-fcastillo", name: "Retiro Metro Fernando Castillo Velasco", price: 0, type: "pickup" },
]
import { createClient } from "@/utils/supabase/client"
import { verifyCartStock } from "@/app/checkout/actions"

interface StoreInfo { id: string; name: string; logo_url: string | null; delivery_options: DeliveryOption[] | null }


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
import { calculateProductCashbak } from "@/lib/cashbak-calculator"
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
    deliveryOption,
    shippingCost,
    chooseDelivery,
  } = useCart()
  const { user, loading: loadingUser } = useSupabaseUser()
  const { bets, loading: loadingBets } = useBets()
  
  const [storeInfoMap, setStoreInfoMap] = useState<Record<string, StoreInfo>>({})
  const [loadingStores, setLoadingStores] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [requiresAddress, setRequiresAddress] = useState(false)
  const [invalidBets, setInvalidBets] = useState<string[]>([])
  const [stockErrors, setStockErrors] = useState<string[]>([])


  const { hasShippingDetails } = useShipping()

  // Fetch store info for products in cart
  useEffect(() => {
    const storeIds = [...new Set(
      items.map(item => getItemDetails(item).product?.store_id).filter(Boolean) as string[]
    )]
    if (storeIds.length === 0) return
    setLoadingStores(true)
    const supabase = createClient()
    supabase.from("stores").select("id, name, logo_url, delivery_options").in("id", storeIds).then(({ data }: { data: StoreInfo[] | null }) => {
      if (!data) { setLoadingStores(false); return }
      const map: Record<string, StoreInfo> = {}
      data.forEach((s: StoreInfo) => { map[s.id] = s })
      setStoreInfoMap(map)
      setLoadingStores(false)
    })
  }, [items.length])

  const uniqueStoreIds = [...new Set(
    items.map(item => getItemDetails(item).product?.store_id).filter(Boolean) as string[]
  )]
  const hasMultipleStores = uniqueStoreIds.length > 1

  // Delivery options: from the single store in cart, or CashBak defaults for official products
  const cartDeliveryOptions = useMemo(() => {
    if (hasMultipleStores) return []
    if (uniqueStoreIds.length === 0) return DEFAULT_DELIVERY_OPTIONS
    const store = storeInfoMap[uniqueStoreIds[0]]
    return store?.delivery_options ?? []
  }, [hasMultipleStores, uniqueStoreIds, storeInfoMap])

  // Auto-select first delivery option when options load or store changes
  useEffect(() => {
    if (hasMultipleStores || cartDeliveryOptions.length === 0) return
    const stillValid = cartDeliveryOptions.find(o => o.id === deliveryOption?.id)
    if (!stillValid) chooseDelivery(cartDeliveryOptions[0])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartDeliveryOptions.length, uniqueStoreIds.join(",")])

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

  const handleCheckout = async () => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    if (deliveryOption?.type === "delivery" && !hasShippingDetails) {
      setRequiresAddress(true)
      return
    }

    if (!validateBets()) {
      return
    }

    setIsProcessing(true)
    const stockCheck = await verifyCartStock(
      items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        productName: getItemDetails(item).product?.name,
      }))
    )
    if (!stockCheck.success && stockCheck.outOfStock) {
      setStockErrors(stockCheck.outOfStock)
      setIsProcessing(false)
      return
    }

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
            {hasMultipleStores && (
              <div className="flex items-start gap-3 p-4 mb-4 border border-amber-300 rounded-lg bg-amber-50">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Tienes productos de varias tiendas</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Por ahora solo puedes hacer pedidos de una tienda a la vez. Paga primero los productos de una tienda y luego continúa con los de la siguiente.
                  </p>
                </div>
              </div>
            )}
            <div className="overflow-hidden bg-white rounded-lg shadow-lg">
              <div className="p-6">
                <div className="hidden mb-4 md:grid md:grid-cols-12 md:gap-4 md:text-sm md:font-medium md:text-gray-500">
                  <div className="col-span-5">Producto</div>
                  <div className="col-span-2 text-center">Precio</div>
                  <div className="col-span-3"></div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {items.map((item, index) => {
                    const { product, subtotal, cashbakAmount, } = getItemDetails(item)
                    if (!product) return null

                    return (
                      <div key={index} className="py-6 md:grid md:grid-cols-12 md:gap-4 md:items-center">
                        {/* Producto */}
                        <div className="flex min-w-0 md:col-span-5">
                          <div className="flex-shrink-0 w-24 h-24 overflow-hidden rounded-md">
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="flex flex-col flex-1 ml-4 min-w-0">
                            <h3 className="text-base font-medium truncate">{product.name}</h3>
                            {product.store_id && storeInfoMap[product.store_id] && (
                              <div className="flex items-center gap-1 mt-1">
                                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-500 truncate">{storeInfoMap[product.store_id].name}</span>
                              </div>
                            )}
                            <p className="mt-1 text-sm text-gray-500 truncate">Categoría: {product.category_name}</p>

                            <div className="mt-2">
                              <BetSelector
                                value={item.betOptionId}
                                onChange={(value) => updateItemBetOption(index, value)}
                                className="mb-0"
                                compact
                                getCashback={(bet) => product ? calculateProductCashbak(product, bet.odd) : 0}
                              />
                            </div>
                            <div className="flex items-center mt-2 text-sm text-emerald-600">
                              <span>CashBak: {(item.cashbakPercentage ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%</span>
                            </div>
                            <div className="items-center hidden mt-2 text-sm md:flex text-emerald-600">
                              <span>CashBak potencial: ${cashbakAmount.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                            </div>
                            <button
                              onClick={() => removeItem(index)}
                              className="flex items-center self-start mt-2 text-sm text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar
                            </button>
                            <div className="mt-4 space-y-1 text-sm text-gray-700 md:hidden">
                              <div className="flex justify-between">
                                <span>Precio:</span>
                                <span>${product.price.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                              </div>
                               <div className="flex justify-between text-emerald-600">
                                <span>CashBak potencial:</span>
                                <span>${cashbakAmount.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>${subtotal.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Precio */}
                        <div className="hidden md:flex md:col-span-2 md:items-center md:justify-center">
                          <span className="text-sm font-medium text-gray-800">${(product?.price ?? 0).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>

                        {/* Cantidad y Talla */}
                        <div className="flex items-end mt-4 gap-x-4 md:mt-0 md:col-span-3 md:items-center">
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
                        <div className="hidden md:flex md:col-span-2 md:items-center md:justify-end">
                          <span className="text-sm font-semibold text-gray-900">${subtotal.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
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
                {hasMultipleStores ? (
                  <p className="text-xs text-amber-700">Disponible al tener productos de una sola tienda.</p>
                ) : loadingStores ? (
                  <p className="text-xs text-gray-400">Cargando opciones de entrega…</p>
                ) : cartDeliveryOptions.length === 0 && uniqueStoreIds.length > 0 ? (
                  <p className="text-xs text-gray-400">Esta tienda no ha configurado opciones de entrega.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {cartDeliveryOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          chooseDelivery(opt)
                          setRequiresAddress(opt.type === "delivery" && !hasShippingDetails)
                        }}
                        className={`flex items-center p-3 text-left border rounded-lg transition ${
                          deliveryOption?.id === opt.id
                            ? "border-green-700 bg-green-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {opt.type === "delivery"
                          ? <TruckIcon className="w-5 h-5 mr-3 text-green-700 shrink-0" />
                          : <MapPin className="w-5 h-5 mr-3 text-green-700 shrink-0" />}
                        <div>
                          <p className="text-sm font-medium">{opt.name}</p>
                          <p className="text-xs text-gray-500">
                            {opt.priceTBD ? "Por pagar" : opt.price > 0 ? `$${opt.price.toLocaleString("es-CL")}` : "Gratis"}
                            {opt.type === "delivery" ? " · Requiere dirección de envío" : ""}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${getCartTotal(0).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span>{deliveryOption?.priceTBD ? "Por pagar" : shippingCost > 0 ? `$${shippingCost.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "Gratis"}</span>
                </div>

                <div className="flex justify-between text-emerald-600">
                  <span>CashBak potencial</span>
                  <span>${getTotalcashbak().toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${total.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full mt-6 bg-green-900 hover:bg-emerald-700"
                onClick={handleCheckout}
                disabled={isProcessing || hasMultipleStores}
              >
                {isProcessing ? "Procesando..." : "Finalizar compra"}
              </Button>
              {hasMultipleStores && (
                <p className="mt-2 text-xs text-center text-amber-700">
                  Elimina los productos de otras tiendas para continuar.
                </p>
              )}

              <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <h3 className="mb-1 text-sm font-semibold text-emerald-800">¿Cuándo recibes tu CashBak?</h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  El CashBak se transfiere en un solo pago una vez que <strong>todos los eventos de tu pedido tengan resultado</strong>. Cada evento es <strong>independiente</strong>: si tienes 4 productos con distintos eventos y solo 1 acierta, igual recibes el CashBak de ese producto. No necesitas ganar todos para cobrar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal dirección */}
      {deliveryOption?.type === "delivery" && requiresAddress && (
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
      
      {/* Modal eventos inválidos */}
      {invalidBets.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-red-600">Evento inválido</h2>
            <p className="mb-4 text-sm text-gray-700">
              Debes cambiar el evento para los siguientes productos, ya que están vencidos:
            </p>
            <ul className="mb-4 text-sm text-gray-800 list-disc list-inside">
              {invalidBets.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setInvalidBets([])}>
                Cambiar evento
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal stock insuficiente */}
      {stockErrors.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-red-600">Stock insuficiente</h2>
            <p className="mb-4 text-sm text-gray-700">
              Los siguientes productos no tienen suficiente stock disponible:
            </p>
            <ul className="mb-4 text-sm text-gray-800 list-disc list-inside space-y-1">
              {stockErrors.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setStockErrors([])}>
                Volver al carrito
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
