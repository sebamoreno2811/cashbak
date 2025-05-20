"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { saveCheckoutData } from "../actions"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("order_id")
  const { clearCart } = useCart()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const processOrder = async () => {
      if (!orderId) {
        setError("No se encontró información de la orden")
        setIsProcessing(false)
        return
      }

      try {
        setIsProcessing(true)

        // Recuperar los datos almacenados en localStorage
        const formDataStr = localStorage.getItem("checkout_form_data")
        const cartItemsStr = localStorage.getItem("checkout_cart_items")
        const cartTotalStr = localStorage.getItem("checkout_cart_total")
        const cashbackTotalStr = localStorage.getItem("checkout_cashback_total")
        const storedOrderId = localStorage.getItem("checkout_order_id")

        // Verificar si los datos existen y corresponden a esta orden
        if (formDataStr && cartItemsStr && cartTotalStr && cashbackTotalStr && storedOrderId === orderId) {
          const formData = JSON.parse(formDataStr)
          const cartItems = JSON.parse(cartItemsStr)
          const cartTotal = Number.parseFloat(cartTotalStr)
          const cashbackTotal = Number.parseFloat(cashbackTotalStr)

          // Guardar los datos en Supabase
          const result = await saveCheckoutData(formData, cartItems, cartTotal, cashbackTotal)

          if (result.success) {
            setSuccess(true)

            // Limpiar el carrito y los datos almacenados
            clearCart()
            localStorage.removeItem("checkout_form_data")
            localStorage.removeItem("checkout_cart_items")
            localStorage.removeItem("checkout_cart_total")
            localStorage.removeItem("checkout_cashback_total")
            localStorage.removeItem("checkout_order_id")
          } else {
            setError(result.error || "Error al guardar los datos de la orden")
          }
        } else {
          setError("No se encontraron datos para esta orden o no coinciden con el ID de orden")
        }
      } catch (err: any) {
        console.error("Error al procesar la orden:", err)
        setError(err.message || "Error al procesar la orden")
      } finally {
        setIsProcessing(false)
      }
    }

    processOrder()
  }, [orderId, clearCart])

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
              Tu pago ha sido procesado correctamente. Hemos registrado tu compra y pronto recibirás un correo
              electrónico con todos los detalles.
            </p>
            <div className="p-4 mb-8 border border-green-200 rounded-lg bg-green-50">
              <p className="text-green-800">
                <span className="font-semibold">Número de orden:</span> {orderId || "N/A"}
              </p>
              <p className="mt-2 text-green-700">
                Guarda este número como referencia para cualquier consulta sobre tu compra.
              </p>
            </div>
            <div className="p-4 mb-8 border border-yellow-200 rounded-lg bg-yellow-50">
              <p className="font-medium text-yellow-800">Información sobre tu CashBak</p>
              <p className="mt-2 text-yellow-700">
                Recuerda que recibirás tu CashBak según los términos y condiciones de la promoción. Mantente atento a tu
                correo electrónico para más información.
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
