"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CreditCard, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { saveCheckoutData } from "./actions"
import AuthModal from "@/components/auth/auth-modal"

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, getCartTotal, getTotalCashback, getItemDetails, clearCart } = useCart()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [bankAccount, setBankAccount] = useState<any>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Función helper para formatear número de cuenta
  const formatAccountNumber = (accountNumber: any) => {
    if (!accountNumber) return "N/A"
    const accountStr = String(accountNumber)
    if (accountStr.length <= 4) return accountStr
    return `****${accountStr.slice(-4)}`
  }

  // Verificar autenticación y cargar datos del usuario
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Cargar perfil del usuario
        const { data: profile } = await supabase.from("customers").select("*").eq("id", user.id).single()
        const { data: bankData } = await supabase.from("bank_accounts").select("*").eq("customer_id", user.id).single()

        setUserProfile(profile)
        setBankAccount(bankData)

        // Si el usuario está autenticado y tiene datos, proceder automáticamente al pago
        if (profile && bankData && items.length > 0) {
          // Pequeño delay para mostrar la información antes de proceder
          setTimeout(() => {
            handlePayment()
          }, 1500)
        }
      }

      setIsLoadingProfile(false)
    }

    checkAuth()
  }, [supabase])

  // Verificar si hay un pago exitoso al cargar la página
  useEffect(() => {
    setIsLoading(true)

    const status = searchParams.get("status")
    const reason = searchParams.get("reason")
    const message = searchParams.get("message")
    const orderIdParam = searchParams.get("order_id")

    if (status) {
      if (orderIdParam) {
        setOrderId(orderIdParam)
      }

      if (status === "success") {
        handleSuccessfulPayment(orderIdParam)
      } else if (status === "error") {
        let errorMessage = "Ocurrió un error al procesar el pago."

        if (reason === "aborted") {
          errorMessage = "El pago fue cancelado o abortado."
        } else if (reason === "payment") {
          errorMessage = "El pago fue rechazado por el banco emisor."
        } else if (reason === "system") {
          errorMessage = `Error del sistema: ${message || "Error desconocido"}`
        }

        setPaymentError(errorMessage)
        setIsLoading(false)
      }
    } else {
      if (items.length === 0) {
        router.push("/cart")
      } else {
        setIsLoading(false)
      }
    }
  }, [items, router, searchParams])

  const handleSuccessfulPayment = async (orderIdParam: string | null) => {
    try {
      const formDataStr = localStorage.getItem("checkout_form_data")
      const cartItemsStr = localStorage.getItem("checkout_cart_items")
      const cartTotalStr = localStorage.getItem("checkout_cart_total")
      const cashbackTotalStr = localStorage.getItem("checkout_cashback_total")

      if (formDataStr && cartItemsStr && cartTotalStr && cashbackTotalStr) {
        const storedFormData = JSON.parse(formDataStr)
        const cartItems = JSON.parse(cartItemsStr)
        const cartTotal = Number.parseFloat(cartTotalStr)
        const cashbackTotal = Number.parseFloat(cashbackTotalStr)

        const result = await saveCheckoutData(storedFormData, cartItems, cartTotal, cashbackTotal)

        if (result.success) {
          setPaymentSuccess(true)
          clearCart()
          localStorage.removeItem("checkout_form_data")
          localStorage.removeItem("checkout_cart_items")
          localStorage.removeItem("checkout_cart_total")
          localStorage.removeItem("checkout_cashback_total")
          localStorage.removeItem("checkout_order_id")
        } else {
          setPaymentError(result.error || "Error al guardar los datos de la orden")
        }
      } else {
        setPaymentError("No se encontraron datos para esta orden")
      }
    } catch (err: any) {
      console.error("Error al procesar la orden:", err)
      setPaymentError(err.message || "Error al procesar la orden")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!user || !userProfile || !bankAccount) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      setPaymentError(null)
      setPaymentProcessing(true)

      const uniqueOrderId = `order-${Date.now().toString().substring(0, 10)}`
      setOrderId(uniqueOrderId)

      // Usar los datos del usuario autenticado
      const formData = {
        fullName: userProfile.full_name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        bankName: bankAccount.bank_name || "",
        accountType: bankAccount.account_type || "",
        accountNumber: String(bankAccount.account_number || ""),
        rut: bankAccount.rut || "",
      }

      localStorage.setItem("checkout_form_data", JSON.stringify(formData))
      localStorage.setItem(
        "checkout_cart_items",
        JSON.stringify(
          items.map((item) => {
            const details = getItemDetails(item)
            return {
              ...item,
              product: details.product,
              betName: details.betName,
              cashbackPercentage: details.cashbackPercentage,
            }
          }),
        ),
      )

      const cartTotal = getCartTotal()
      const cashbackTotal = getTotalCashback()
      localStorage.setItem("checkout_cart_total", cartTotal.toString())
      localStorage.setItem("checkout_cashback_total", cashbackTotal.toString())
      localStorage.setItem("checkout_order_id", uniqueOrderId)

      console.log("Iniciando transacción con Webpay:", { cartTotal, uniqueOrderId })

      const response = await fetch("/api/webpay/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartTotal,
          orderId: uniqueOrderId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error en respuesta de API:", data)
        throw new Error(data.error || "Error al iniciar el pago con Webpay")
      }

      console.log("Respuesta de API Webpay:", data)

      if (!data.token || !data.url) {
        throw new Error("Respuesta inválida del servidor de pago")
      }

      const form = document.createElement("form")
      form.method = "POST"
      form.action = data.url
      form.style.display = "none"

      const tokenInput = document.createElement("input")
      tokenInput.type = "hidden"
      tokenInput.name = "token_ws"
      tokenInput.value = data.token

      form.appendChild(tokenInput)
      document.body.appendChild(form)

      console.log("Redirigiendo a Webpay:", { url: data.url, token: data.token })
      form.submit()
    } catch (error: any) {
      console.error("Error al iniciar el pago:", error)
      setPaymentError("Error al iniciar el pago: " + (error.message || "Error desconocido"))
      setPaymentProcessing(false)
    }
  }

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false)
    // Recargar la página para obtener los datos del usuario recién autenticado
    window.location.reload()
  }

  if (isLoading || isLoadingProfile) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col items-center justify-center max-w-3xl min-h-[60vh] mx-auto p-6 bg-white rounded-lg shadow-lg">
          <Loader2 className="w-16 h-16 mb-4 text-green-600 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-800">{user ? "Preparando tu pago..." : "Cargando..."}</h2>
          <p className="mt-2 text-gray-600">
            {user ? "Te redirigiremos a Webpay en un momento." : "Por favor, espera mientras cargamos tu información."}
          </p>
        </div>
      </div>
    )
  }

  if (items.length === 0 && !paymentSuccess && !paymentError) {
    return <div className="p-8 text-center">Redirigiendo al carrito...</div>
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <Button variant="ghost" onClick={() => router.back()} disabled={paymentProcessing}>
            <ArrowLeft className="mr-2 size-4" /> Volver
          </Button>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-lg">
          {paymentSuccess ? (
            <div className="p-6 text-center">
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-green-800">¡Pago Exitoso!</h2>
              <p className="mb-6 text-gray-600">
                Tu pago ha sido procesado correctamente. Hemos registrado tu compra y pronto recibirás un correo
                electrónico con todos los detalles.
              </p>
              <div className="p-4 mb-6 border border-green-200 rounded-lg bg-green-50">
                <p className="text-green-800">
                  <span className="font-semibold">Número de orden:</span> {orderId || "N/A"}
                </p>
                <p className="mt-2 text-green-700">
                  Guarda este número como referencia para cualquier consulta sobre tu compra.
                </p>
              </div>
              <div className="space-y-4">
                <Button className="w-full bg-green-900 hover:bg-emerald-700" onClick={() => router.push("/products")}>
                  Seguir comprando
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
                  Volver al inicio
                </Button>
              </div>
            </div>
          ) : paymentError ? (
            <div className="p-6 text-center">
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-red-800">Error en el Pago</h2>
              <p className="mb-6 text-gray-600">{paymentError}</p>
              <div className="space-y-4">
                <Button className="w-full bg-green-900 hover:bg-emerald-700" onClick={() => setPaymentError(null)}>
                  Intentar nuevamente
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push("/cart")}>
                  Volver al carrito
                </Button>
              </div>
            </div>
          ) : !user ? (
            <div className="p-6 text-center">
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full">
                <AlertCircle className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-blue-800">Inicia Sesión para Continuar</h2>
              <p className="mb-6 text-gray-600">
                Para realizar tu compra, necesitas tener una cuenta. Inicia sesión o regístrate para continuar.
              </p>
              <Button className="w-full bg-green-900 hover:bg-emerald-700" onClick={() => setIsAuthModalOpen(true)}>
                Iniciar Sesión / Registrarse
              </Button>
            </div>
          ) : paymentProcessing ? (
            <div className="p-6 text-center">
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-blue-800">Procesando Pago</h2>
              <p className="mb-6 text-gray-600">
                Estamos preparando tu transacción con Webpay. Serás redirigido automáticamente.
              </p>
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <p className="text-blue-800">
                  <span className="font-semibold">Total a pagar:</span> ${getCartTotal().toLocaleString()}
                </p>
                <p className="text-blue-700">
                  <span className="font-semibold">CashBak potencial:</span> $
                  {Math.ceil(getTotalCashback()).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <h2 className="flex items-center text-xl font-semibold text-green-800">
                  <CheckCircle className="mr-2 size-5" />
                  ¡Listo para pagar!
                </h2>
                <p className="mt-2 text-green-700">Usaremos tus datos guardados para procesar la compra.</p>
              </div>

              {/* Mostrar datos del usuario */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="mb-2 font-medium text-gray-900">Datos Personales</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Nombre:</span> {userProfile?.full_name || "No disponible"}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {userProfile?.email || "No disponible"}
                    </p>
                    <p>
                      <span className="font-medium">Teléfono:</span> {userProfile?.phone || "No disponible"}
                    </p>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="mb-2 font-medium text-gray-900">Datos Bancarios</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Banco:</span> {bankAccount?.bank_name || "No disponible"}
                    </p>
                    <p>
                      <span className="font-medium">Tipo:</span> {bankAccount?.account_type || "No disponible"}
                    </p>
                    <p>
                      <span className="font-medium">Cuenta:</span> {formatAccountNumber(bankAccount?.account_number)}
                    </p>
                    <p>
                      <span className="font-medium">RUT:</span> {bankAccount?.rut || "No disponible"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="mb-2 text-lg font-medium">Resumen de la orden</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total a pagar:</span>
                    <span className="font-semibold">${getCartTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>CashBak potencial:</span>
                    <span className="font-semibold">${Math.ceil(getTotalCashback()).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <p className="text-red-700">
                    <strong>Error:</strong> {paymentError}
                  </p>
                </div>
              )}

              <Button
                onClick={handlePayment}
                className="w-full bg-green-900 hover:bg-emerald-700"
                disabled={paymentProcessing}
              >
                {paymentProcessing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 size-4" />
                    Pagar con Webpay
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Resumen del carrito */}
        {!paymentSuccess && !paymentError && user && !paymentProcessing && (
          <div className="p-6 mt-8 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Resumen de tu compra</h2>
            <div className="space-y-4">
              {items.map((item, index) => {
                const { product, betName, subtotal, cashbackAmount } = getItemDetails(item)

                if (!product) return null

                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="w-12 h-12 overflow-hidden rounded-md">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} x ${product.price.toLocaleString()} • {betName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${subtotal.toLocaleString()}</p>
                      <p className="text-sm text-emerald-600">CashBak: ${cashbackAmount.toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}

              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold">${getCartTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>CashBak potencial</span>
                  <span className="font-medium">${Math.ceil(getTotalCashback()).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
    </div>
  )
}
