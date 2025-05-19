"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { saveCheckoutData } from "../actions"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const { clearCart } = useCart()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Limpiar el carrito cuando se carga la página de éxito
    clearCart()

    // Recuperar los datos almacenados en sessionStorage
    const savedFormData = sessionStorage.getItem("checkoutFormData")
    const savedCartItems = sessionStorage.getItem("checkoutCartItems")
    const savedCartTotal = sessionStorage.getItem("checkoutCartTotal")
    const savedCashbackTotal = sessionStorage.getItem("checkoutCashbackTotal")

    if (savedFormData && savedCartItems && savedCartTotal && savedCashbackTotal) {
      const formData = JSON.parse(savedFormData)
      const cartItems = JSON.parse(savedCartItems)
      const cartTotal = Number.parseFloat(savedCartTotal)
      const cashbackTotal = Number.parseFloat(savedCashbackTotal)

      // Ahora que el pago fue exitoso, guardar los datos en Supabase
      const saveData = async () => {
        try {
          setIsProcessing(true)
          const result = await saveCheckoutData(formData, cartItems, cartTotal, cashbackTotal)

          if (!result.success) {
            setError(result.error || "Error al guardar los datos de la orden")
          }

          // Limpiar los datos almacenados
          sessionStorage.removeItem("checkoutFormData")
          sessionStorage.removeItem("checkoutCartItems")
          sessionStorage.removeItem("checkoutCartTotal")
          sessionStorage.removeItem("checkoutCashbackTotal")
        } catch (err: any) {
          console.error("Error al guardar datos después del pago:", err)
          setError(err.message || "Error al procesar la orden")
        } finally {
          setIsProcessing(false)
        }
      }

      saveData()
    } else {
      setIsProcessing(false)
    }
  }, [clearCart])

  return (
    <div className="container px-4 py-16 mx-auto">
      <div className="max-w-md mx-auto text-center">
        {isProcessing ? (
          <div className="p-8 text-center">
            <div className="inline-block w-16 h-16 border-4 border-green-200 rounded-full border-t-green-500 animate-spin"></div>
            <p className="mt-4 text-lg">Procesando tu orden...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-lg bg-red-50">
            <h1 className="mb-4 text-2xl font-bold text-red-700">Error al procesar la orden</h1>
            <p className="mb-6 text-red-600">{error}</p>
            <Link href="/checkout">
              <Button variant="outline">Volver al checkout</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="mb-4 text-3xl font-bold">¡Compra Exitosa!</h1>
            <p className="mb-8 text-gray-600">
              Tu orden ha sido procesada correctamente. Hemos enviado un correo electrónico con los detalles de tu
              compra.
            </p>
            <div className="p-4 mb-8 border border-green-200 rounded-lg bg-green-50">
              <p className="text-green-800">
                <span className="font-semibold">Número de orden:</span> {orderId || "N/A"}
              </p>
            </div>
            <div className="space-y-4">
              <Link href="/products">
                <Button className="w-full bg-green-900 hover:bg-emerald-700">Seguir comprando</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
