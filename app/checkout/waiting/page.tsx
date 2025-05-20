"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveCheckoutData } from "../actions"
import { useCart } from "@/hooks/use-cart"

export default function WaitingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const { clearCart } = useCart()

  const [status, setStatus] = useState<"waiting" | "success" | "timeout" | "error">("waiting")
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Verificar el estado del pago periódicamente
  useEffect(() => {
    if (!orderId) {
      setStatus("error")
      return
    }

    // Verificar si ya tenemos un estado de pago guardado para este orderId
    const paymentStatus = localStorage.getItem(`payment_status_${orderId}`)
    if (paymentStatus === "success") {
      handleSuccessfulPayment()
      return
    }

    let interval: NodeJS.Timeout
    let timeout: NodeJS.Timeout

    // Función para verificar el estado del pago
    const checkPaymentStatus = async () => {
      try {
        // En un entorno real, aquí haríamos una llamada a la API para verificar el estado del pago
        // Por ahora, simulamos verificando si hay un indicador en localStorage
        const paymentCompleted = localStorage.getItem(`payment_completed_${orderId}`)

        if (paymentCompleted === "true") {
          handleSuccessfulPayment()
          clearInterval(interval)
          clearTimeout(timeout)
        }
      } catch (error) {
        console.error("Error al verificar el estado del pago:", error)
      }
    }

    // Verificar cada 3 segundos
    interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 3)
      checkPaymentStatus()
    }, 3000)

    // Timeout después de 5 minutos (300 segundos)
    timeout = setTimeout(() => {
      clearInterval(interval)
      setStatus("timeout")
    }, 300000)

    // Limpiar intervalos al desmontar
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [orderId, clearCart, router])

  // Manejar un pago exitoso
  const handleSuccessfulPayment = async () => {
    if (isProcessing) return
    setIsProcessing(true)

    try {
      // Recuperar los datos almacenados
      const formDataStr = localStorage.getItem("checkoutFormData")
      const cartItemsStr = localStorage.getItem("checkoutCartItems")
      const cartTotalStr = localStorage.getItem("checkoutCartTotal")
      const cashbackTotalStr = localStorage.getItem("checkoutCashbackTotal")

      if (formDataStr && cartItemsStr && cartTotalStr && cashbackTotalStr) {
        const formData = JSON.parse(formDataStr)
        const cartItems = JSON.parse(cartItemsStr)
        const cartTotal = Number.parseFloat(cartTotalStr)
        const cashbackTotal = Number.parseFloat(cashbackTotalStr)

        // Guardar los datos en Supabase
        const result = await saveCheckoutData(formData, cartItems, cartTotal, cashbackTotal)

        if (result.success) {
          // Limpiar el carrito y los datos almacenados
          clearCart()
          localStorage.removeItem("checkoutFormData")
          localStorage.removeItem("checkoutCartItems")
          localStorage.removeItem("checkoutCartTotal")
          localStorage.removeItem("checkoutCashbackTotal")
          localStorage.removeItem(`pendingOrderId`)

          // Guardar el estado del pago
          localStorage.setItem(`payment_status_${orderId}`, "success")

          // Actualizar el estado y redirigir
          setStatus("success")
          setTimeout(() => {
            router.push(`/checkout/success?order_id=${orderId}`)
          }, 1500)
        } else {
          setStatus("error")
        }
      } else {
        setStatus("error")
      }
    } catch (error) {
      console.error("Error al procesar el pago exitoso:", error)
      setStatus("error")
    } finally {
      setIsProcessing(false)
    }
  }

  // Simular un pago exitoso (solo para pruebas)
  const simulateSuccessfulPayment = () => {
    if (orderId) {
      localStorage.setItem(`payment_completed_${orderId}`, "true")
    }
  }

  return (
    <div className="container px-4 py-16 mx-auto">
      <div className="max-w-md mx-auto text-center">
        {status === "waiting" && (
          <>
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full">
              <Clock className="w-12 h-12 text-blue-600 animate-pulse" />
            </div>
            <h1 className="mb-4 text-3xl font-bold">Procesando tu pago</h1>
            <p className="mb-8 text-gray-600">
              Estamos esperando la confirmación de tu pago con Webpay. Por favor, no cierres esta ventana.
            </p>
            <div className="p-4 mb-8 border border-blue-200 rounded-lg bg-blue-50">
              <p className="text-blue-800">
                <span className="font-semibold">Tiempo de espera:</span> {Math.floor(timeElapsed / 60)}:
                {(timeElapsed % 60).toString().padStart(2, "0")}
              </p>
              <p className="mt-2 text-blue-700">
                Si ya completaste el pago en Webpay, serás redirigido automáticamente en breve.
              </p>
            </div>

            {/* Botón para simular pago exitoso (solo para desarrollo) */}
            {process.env.NODE_ENV === "development" && (
              <Button onClick={simulateSuccessfulPayment} className="mt-4">
                Simular pago exitoso
              </Button>
            )}
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="mb-4 text-3xl font-bold">¡Pago Confirmado!</h1>
            <p className="mb-8 text-gray-600">Tu pago ha sido procesado correctamente. Estás siendo redirigido...</p>
          </>
        )}

        {status === "timeout" && (
          <>
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-yellow-100 rounded-full">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>
            <h1 className="mb-4 text-3xl font-bold">Tiempo de espera agotado</h1>
            <p className="mb-8 text-gray-600">
              No hemos recibido confirmación de tu pago. Si ya realizaste el pago, por favor contáctanos.
            </p>
            <div className="space-y-4">
              <Button onClick={() => router.push("/checkout")} className="w-full bg-green-900 hover:bg-emerald-700">
                Volver al checkout
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                Ir al inicio
              </Button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="mb-4 text-3xl font-bold">Error en el proceso</h1>
            <p className="mb-8 text-gray-600">
              Ha ocurrido un error al procesar tu pago. Por favor, intenta nuevamente o contáctanos.
            </p>
            <div className="space-y-4">
              <Button onClick={() => router.push("/checkout")} className="w-full bg-green-900 hover:bg-emerald-700">
                Volver al checkout
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                Ir al inicio
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
