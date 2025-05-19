import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

// Esta ruta manejará las respuestas de Webpay
export async function POST(request: NextRequest) {
  try {
    // Obtener los datos de la solicitud
    const formData = await request.formData()

    // Extraer los parámetros relevantes de Webpay
    // Nota: Estos campos pueden variar según la configuración específica de Webpay
    const paymentStatus = formData.get("status") as string
    const transactionId = formData.get("transaction_id") as string
    const amount = formData.get("amount") as string

    // Verificar si el pago fue exitoso
    if (paymentStatus === "success" || paymentStatus === "approved") {
      // Recuperar los datos almacenados en la sesión
      // Nota: En una implementación real, deberías almacenar estos datos en una tabla temporal
      // o pasarlos como parámetros a Webpay y recibirlos de vuelta

      // Aquí procesaríamos los datos y los guardaríamos en Supabase
      const supabase = createServerClient()

      // Aquí iría la lógica para guardar los datos en Supabase
      // Similar a la función saveCheckoutData en actions.ts

      // Redirigir a la página de éxito
      return NextResponse.redirect(new URL("/checkout/success?orderId=" + transactionId, request.url))
    } else {
      // Si el pago falló, redirigir a la página de error
      return NextResponse.redirect(new URL("/checkout?error=payment-failed", request.url))
    }
  } catch (error) {
    console.error("Error al procesar webhook de Webpay:", error)
    return NextResponse.json({ success: false, error: "Error al procesar el pago" }, { status: 500 })
  }
}
