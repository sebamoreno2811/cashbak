"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CreditCard, User, Building, AlertCircle } from "lucide-react"
import { saveCheckoutData } from "./actions"
import type { CheckoutFormData, FormErrors } from "@/types/checkout"

const BANK_OPTIONS = [
  "Banco de Chile",
  "Banco Estado",
  "Banco Santander",
  "Banco BCI",
  "Banco Itaú",
  "Banco Falabella",
  "Scotiabank",
  "Banco Security",
  "Otro",
]

const ACCOUNT_TYPES = ["Cuenta Corriente", "Cuenta Vista", "Cuenta de Ahorro", "Cuenta RUT"]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getCartTotal, getTotalCashback, getItemDetails, clearCart } = useCart()

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    email: "",
    phone: "+569",
    bankName: "",
    accountType: "",
    accountNumber: "",
    rut: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    // Redirigir al carrito si está vacío
    if (items.length === 0) {
      router.push("/cart")
    }
  }, [items, router])

  const validateStep1 = () => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "El nombre completo es requerido"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ingresa un email válido"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El número de teléfono es requerido"
    } else if (!/^\+569\d{8}$/.test(formData.phone)) {
      newErrors.phone = "El número debe comenzar con +569 seguido de 8 dígitos"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: FormErrors = {}

    if (!formData.bankName) {
      newErrors.bankName = "Selecciona un banco"
    }

    if (!formData.accountType) {
      newErrors.accountType = "Selecciona un tipo de cuenta"
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "El número de cuenta es requerido"
    } else if (!/^\d+$/.test(formData.accountNumber)) {
      newErrors.accountNumber = "El número de cuenta debe contener solo dígitos"
    }

    if (!formData.rut.trim()) {
      newErrors.rut = "El RUT es requerido"
    } else if (!/^[0-9]+-[0-9K]$/.test(formData.rut)) {
      newErrors.rut = "Formato de RUT inválido (ej: 12345678-9 o 12345678-K)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 2 && validateStep2()) {
      setIsSubmitting(true)

      try {
        // Preparar los items del carrito para guardar
        const cartItemsFormatted = items.map((item) => {
          const details = getItemDetails(item)
          return {
            ...item,
            product: details.product,
            betName: details.betName,
            cashbackPercentage: details.cashbackPercentage,
          }
        })

        console.log("Enviando datos de checkout:", formData)
        console.log("Items del carrito:", cartItemsFormatted)

        const result = await saveCheckoutData(formData, cartItemsFormatted, getCartTotal(), getTotalCashback())

        console.log("Resultado de guardar datos:", result)

        if (result.success && result.orderId) {
          setOrderId(result.orderId)
          setStep(3) // Avanzar al paso de confirmación
        } else {
          alert(
            result.error ||
              "Ocurrió un error al procesar tu orden. Por favor, verifica los datos e intenta nuevamente.",
          )
        }
      } catch (error) {
        console.error("Error al enviar el formulario:", error)
        alert("Ocurrió un error al procesar tu orden. Por favor, intenta nuevamente más tarde.")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Reemplazar la función handlePayment actual con esta:
  const handlePayment = async () => {
    if (!orderId) {
      // Almacenar los datos temporalmente en sessionStorage para recuperarlos después del pago
      sessionStorage.setItem("checkoutFormData", JSON.stringify(formData))
      sessionStorage.setItem(
        "checkoutCartItems",
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
      sessionStorage.setItem("checkoutCartTotal", getCartTotal().toString())
      sessionStorage.setItem("checkoutCashbackTotal", getTotalCashback().toString())

      // El formulario de Webpay se enviará automáticamente
      ;(document.getElementById("webpayForm") as HTMLFormElement)?.submit()
    }
  }

  if (items.length === 0) {
    return <div className="p-8 text-center">Cargando...</div>
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" /> Volver
          </Button>
        </div>

        {/* Pasos del checkout */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex flex-col items-center ${step >= 1 ? "text-green-900" : "text-gray-400"}`}>
              <div
                className={`flex items-center justify-center w-10 h-10 mb-2 rounded-full ${step >= 1 ? "bg-green-100 text-green-900" : "bg-gray-200 text-gray-500"}`}
              >
                <User size={20} />
              </div>
              <span className="text-sm">Datos Personales</span>
            </div>

            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? "bg-green-500" : "bg-gray-200"}`}></div>

            <div className={`flex flex-col items-center ${step >= 2 ? "text-green-900" : "text-gray-400"}`}>
              <div
                className={`flex items-center justify-center w-10 h-10 mb-2 rounded-full ${step >= 2 ? "bg-green-100 text-green-900" : "bg-gray-200 text-gray-500"}`}
              >
                <Building size={20} />
              </div>
              <span className="text-sm">Datos Bancarios</span>
            </div>

            <div className={`flex-1 h-1 mx-2 ${step >= 3 ? "bg-green-500" : "bg-gray-200"}`}></div>

            <div className={`flex flex-col items-center ${step >= 3 ? "text-green-900" : "text-gray-400"}`}>
              <div
                className={`flex items-center justify-center w-10 h-10 mb-2 rounded-full ${step >= 3 ? "bg-green-100 text-green-900" : "bg-gray-200 text-gray-500"}`}
              >
                <CreditCard size={20} />
              </div>
              <span className="text-sm">Pago</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-lg">
          <form onSubmit={handleSubmit}>
            {/* Paso 1: Datos Personales */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Datos Personales</h2>
                <p className="text-sm text-gray-500">Ingresa tus datos para continuar con la compra</p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={errors.fullName ? "border-red-500" : ""}
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">Número de Contacto</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                    <p className="mt-1 text-xs text-gray-500">Formato: +569XXXXXXXX</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={handleNextStep} className="bg-green-900 hover:bg-emerald-700">
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Paso 2: Datos Bancarios */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Datos Bancarios para CashBak</h2>
                <p className="text-sm text-gray-500">
                  Ingresa los datos de tu cuenta bancaria donde recibirás el CashBak en caso de ganar
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bankName">Banco</Label>
                    <Select value={formData.bankName} onValueChange={(value) => handleSelectChange("bankName", value)}>
                      <SelectTrigger className={errors.bankName ? "border-red-500" : ""}>
                        <SelectValue placeholder="Selecciona tu banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_OPTIONS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bankName && <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="accountType">Tipo de Cuenta</Label>
                    <Select
                      value={formData.accountType}
                      onValueChange={(value) => handleSelectChange("accountType", value)}
                    >
                      <SelectTrigger className={errors.accountType ? "border-red-500" : ""}>
                        <SelectValue placeholder="Selecciona el tipo de cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.accountType && <p className="mt-1 text-sm text-red-500">{errors.accountType}</p>}
                  </div>

                  <div>
                    <Label htmlFor="accountNumber">Número de Cuenta</Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      className={errors.accountNumber ? "border-red-500" : ""}
                    />
                    {errors.accountNumber && <p className="mt-1 text-sm text-red-500">{errors.accountNumber}</p>}
                    <p className="mt-1 text-xs text-gray-500">Solo números, sin guiones ni espacios</p>
                  </div>

                  <div>
                    <Label htmlFor="rut">RUT</Label>
                    <Input
                      id="rut"
                      name="rut"
                      value={formData.rut}
                      onChange={handleInputChange}
                      className={errors.rut ? "border-red-500" : ""}
                    />
                    {errors.rut && <p className="mt-1 text-sm text-red-500">{errors.rut}</p>}
                    <p className="mt-1 text-xs text-gray-500">Formato: 12345678-9 o 12345678-K</p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handlePrevStep}>
                    Volver
                  </Button>
                  <Button type="submit" className="bg-green-900 hover:bg-emerald-700" disabled={isSubmitting}>
                    {isSubmitting ? "Procesando..." : "Continuar"}
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Paso 3: Confirmación y Pago */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <h2 className="flex items-center text-xl font-semibold text-green-800">
                  <AlertCircle className="mr-2 size-5" />
                  Información lista para procesar
                </h2>
                <p className="mt-2 text-green-700">
                  Tus datos están listos. Haz clic en el botón de Webpay para realizar el pago.
                </p>
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

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  Volver
                </Button>
                <div className="flex items-center">
                  <form
                    id="webpayForm"
                    name="rec20108_btn1"
                    method="post"
                    action="https://www.webpay.cl/backpub/external/form-pay"
                  >
                    <input type="hidden" name="idFormulario" value="281911" />
                    <input type="hidden" name="monto" value={getCartTotal()} />
                    <input
                      type="image"
                      title="Pagar con Webpay"
                      name="button1"
                      src="https://www.webpay.cl/assets/img/boton_webpaycl.svg"
                      value="Pagar con Webpay"
                      className="cursor-pointer"
                      onClick={() => handlePayment()}
                    />
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resumen del carrito */}
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
      </div>
    </div>
  )
}
