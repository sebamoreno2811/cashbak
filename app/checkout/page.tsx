"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CreditCard, AlertCircle, CheckCircle, XCircle, Loader2, User } from "lucide-react"
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true) // For user, profile, bank data
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true) // General page loading state

  const formatAccountNumber = (accountNumber: any) => {
    if (!accountNumber) return "N/A"
    const accountStr = String(accountNumber)
    if (accountStr.length <= 4) return accountStr
    return `****${accountStr.slice(-4)}`
  }

  // Effect for initial auth check and data loading
  useEffect(() => {
    const initialLoad = async () => {
      setPageLoading(true);
      setIsLoadingProfile(true);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        try {
          const { data: profileData, error: profileError } = await supabase.from("customers").select("*").eq("id", currentUser.id).single();
          if (profileError && profileError.code !== 'PGRST116') throw profileError; // PGRST116 means no rows found, which is fine
          setUserProfile(profileData);

          const { data: bankDataResult, error: bankError } = await supabase.from("bank_accounts").select("*").eq("customer_id", currentUser.id).single();
          if (bankError && bankError.code !== 'PGRST116') throw bankError;
          setBankAccount(bankDataResult);
        } catch (e: any) {
          console.error("Error fetching profile/bank data:", e);
          // Set a general error to be displayed, or rely on conditional rendering
          setPaymentError("Error al cargar tus datos. Por favor, recarga la página.");
        }
      }
      setIsLoadingProfile(false);
      setPageLoading(false);
    };

    if (items.length === 0 && !searchParams.get("status") && !searchParams.get("order_id")) {
      router.push("/cart");
    } else {
      initialLoad();
    }
  }, [supabase.auth, items.length, router, searchParams]);


  // Effect to handle payment status from URL (after Webpay redirect)
  useEffect(() => {
    const status = searchParams.get("status")
    const reason = searchParams.get("reason")
    const message = searchParams.get("message")
    const orderIdParam = searchParams.get("order_id")

    if (status) {
      setPageLoading(true); // Show loader while processing redirect
      if (orderIdParam) {
        setOrderId(orderIdParam)
      }

      if (status === "success") {
        // The actual order saving logic is now in checkout/success/page.tsx
        // Here, we just redirect if we land on checkout page with success status
        router.replace(`/checkout/success?order_id=${orderIdParam}`);
      } else if (status === "error") {
        let errorMessage = "Ocurrió un error al procesar el pago."
        if (reason === "aborted") errorMessage = "El pago fue cancelado o abortado."
        else if (reason === "payment") errorMessage = "El pago fue rechazado por el banco emisor."
        else if (reason === "system") errorMessage = `Error del sistema: ${message || "Error desconocido"}`
        setPaymentError(errorMessage)
        setPageLoading(false)
      }
    }
  }, [searchParams, router])


  const handlePayment = async () => {
    // 1. Check if user is logged in
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    // 2. Check if profile data is still loading
    if (isLoadingProfile) {
      setPaymentError("Cargando tus datos, por favor espera un momento.")
      return
    }

    // 3. User is logged in, check if profile and bank account are complete
    if (!userProfile || !bankAccount) {
      setPaymentError(
        "Para continuar, por favor completa tu información personal y bancaria. Puedes hacerlo desde la configuración de tu cuenta o registrándote si aún no lo has hecho."
      )
      // Do not open the generic auth modal here if the user is logged in.
      // The render logic below will show a specific message for profile completion.
      return
    }

    // 4. All data present, proceed with payment
    try {
      setPaymentError(null)
      setPaymentProcessing(true)

      const uniqueOrderId = `cbk-${Date.now().toString().slice(-10)}` // Shorter, more unique ID
      setOrderId(uniqueOrderId)

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
      localStorage.setItem("checkout_order_id", uniqueOrderId) // Save the order ID used for Webpay

      console.log("Iniciando transacción con Webpay:", { cartTotal, uniqueOrderId })

      const response = await fetch("/api/webpay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartTotal, orderId: uniqueOrderId }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Error al iniciar el pago con Webpay")
      if (!data.token || !data.url) throw new Error("Respuesta inválida del servidor de pago")

      // Redirect to Webpay
      window.location.href = data.url + `?token_ws=${data.token}`;

    } catch (error: any) {
      console.error("Error al iniciar el pago:", error)
      setPaymentError("Error al iniciar el pago: " + (error.message || "Error desconocido"))
      setPaymentProcessing(false)
    }
  }

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false)
    // Re-fetch user data and profile after successful auth
    const reloadData = async () => {
        setPageLoading(true);
        setIsLoadingProfile(true);
        const { data: { user: updatedUser } } = await supabase.auth.getUser();
        setUser(updatedUser);
        if (updatedUser) {
            const { data: profile } = await supabase.from("customers").select("*").eq("id", updatedUser.id).single();
            const { data: bankData } = await supabase.from("bank_accounts").select("*").eq("customer_id", updatedUser.id).single();
            setUserProfile(profile);
            setBankAccount(bankData);
        }
        setIsLoadingProfile(false);
        setPageLoading(false);
    };
    reloadData();
  }


  if (pageLoading || (isLoadingProfile && !paymentError && !paymentSuccess) ) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col items-center justify-center max-w-3xl min-h-[60vh] mx-auto p-6 bg-white rounded-lg shadow-lg">
          <Loader2 className="w-16 h-16 mb-4 text-green-600 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-800">Cargando...</h2>
          <p className="mt-2 text-gray-600">Por favor, espera mientras preparamos tu checkout.</p>
        </div>
      </div>
    )
  }


  // If there's a paymentError, show it regardless of other states (unless processing again)
  if (paymentError && !paymentProcessing) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-3xl p-6 mx-auto text-center bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="mb-4 text-2xl font-bold text-red-800">Error</h2>
          <p className="mb-6 text-gray-600">{paymentError}</p>
          <div className="space-y-4">
            <Button className="w-full bg-green-900 hover:bg-emerald-700" onClick={() => { setPaymentError(null); if(user && userProfile && bankAccount) handlePayment(); else if (!user) setIsAuthModalOpen(true); }}>
              Intentar nuevamente
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/cart")}>
              Volver al carrito
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // If payment is successful (this state should ideally be handled by /checkout/success but as a fallback)
  if (paymentSuccess) {
     return (
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-3xl p-6 mx-auto text-center bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="mb-4 text-2xl font-bold text-green-800">¡Pago Exitoso!</h2>
          <p className="mb-6 text-gray-600">
            Tu pago ha sido procesado correctamente.
          </p>
           <p className="text-sm text-gray-500">Redirigiendo a la página de confirmación...</p>
        </div>
      </div>
    )
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
          {!user ? ( // Case 1: User not logged in
            <div className="p-6 text-center">
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full">
                <User className="w-12 h-12 text-green-600" /> 
              </div>
              <h2 className="mb-4 text-2xl font-bold text-green-800">Inicia Sesión para Continuar</h2>
              <p className="mb-6 text-gray-600">
                Para realizar tu compra, necesitas tener una cuenta. Inicia sesión o regístrate para continuar.
              </p>
              <Button className="w-full bg-green-900 hover:bg-emerald-700" onClick={() => setIsAuthModalOpen(true)}>
                Iniciar Sesión / Registrarse
              </Button>
            </div>
          ) : (!userProfile || !bankAccount) && !isLoadingProfile ? ( // Case 2: User logged in, profile incomplete
            <div className="p-6 text-center">
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-orange-100 rounded-full">
                <AlertCircle className="w-12 h-12 text-orange-500" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-orange-800">Completa tu Perfil</h2>
              <p className="mb-6 text-gray-600">
                Para continuar con tu compra, necesitamos que completes tu información personal y bancaria.
                Si ya lo hiciste, por favor espera un momento o recarga la página.
              </p>
              {/* TODO: Consider adding a button to redirect to a profile editing page */}
              <Button onClick={() => { /* router.push('/profile/edit') or trigger auth modal to re-enter data if that's the flow */ setIsAuthModalOpen(true); }} className="w-full mt-4 bg-orange-500 hover:bg-orange-600">
                Completar / Verificar Datos
              </Button>
            </div>
          ) : paymentProcessing ? ( // Case 3: Payment is being processed
            <div className="p-6 text-center">
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-green-800">Procesando Pago</h2>
              <p className="mb-6 text-gray-600">
                Estamos preparando tu transacción con Webpay. Serás redirigido automáticamente.
              </p>
            </div>
          ) : ( // Case 4: User logged in, profile complete, ready to pay
            <div className="space-y-6">
              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <h2 className="flex items-center text-xl font-semibold text-green-800">
                  <CheckCircle className="mr-2 size-5" />
                  ¡Listo para pagar!
                </h2>
                <p className="mt-2 text-green-700">Usaremos tus datos guardados para procesar la compra.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="mb-2 font-medium text-gray-900">Datos Personales</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Nombre:</span> {userProfile?.full_name || "No disponible"}</p>
                    <p><span className="font-medium">Email:</span> {userProfile?.email || "No disponible"}</p>
                    <p><span className="font-medium">Teléfono:</span> {userProfile?.phone || "No disponible"}</p>
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="mb-2 font-medium text-gray-900">Datos Bancarios</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Banco:</span> {bankAccount?.bank_name || "No disponible"}</p>
                    <p><span className="font-medium">Tipo:</span> {bankAccount?.account_type || "No disponible"}</p>
                    <p><span className="font-medium">Cuenta:</span> {formatAccountNumber(bankAccount?.account_number)}</p>
                    <p><span className="font-medium">RUT:</span> {bankAccount?.rut || "No disponible"}</p>
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

              <Button onClick={handlePayment} className="w-full bg-green-900 hover:bg-emerald-700" disabled={paymentProcessing}>
                {paymentProcessing ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" /> Procesando...</>
                ) : (
                  <><CreditCard className="mr-2 size-4" /> Pagar con Webpay</>
                )}
              </Button>
            </div>
          )}
        </div>

        {!paymentProcessing && !paymentSuccess && user && userProfile && bankAccount && (
          <div className="p-6 mt-8 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Resumen de tu compra</h2>
            {/* ... (cart summary items, same as before) ... */}
            <div className="space-y-4">
              {items.map((item, index) => {
                const { product, subtotal, cashbackAmount } = getItemDetails(item)
                if (!product) return null
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="w-12 h-12 overflow-hidden rounded-md">
                        <img src={product.image || "/placeholder.svg"} alt={product.name} className="object-cover w-full h-full" />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">{item.quantity} x ${product.price.toLocaleString()}</p>
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
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
    </div>
  )
}