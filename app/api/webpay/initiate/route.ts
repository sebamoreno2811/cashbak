import { WebpayPlus } from "transbank-sdk"
import { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from "transbank-sdk"

export async function POST(request: Request) {
  try {
    const { cartTotal, orderId } = await request.json()

    if (!cartTotal || !orderId) {
      return Response.json({ error: "Se requiere el monto total y el ID de la orden" }, { status: 400 })
    }

    console.log("Iniciando transacción Webpay:", { cartTotal, orderId })

    // Asegurarse de que el orderId no exceda los 26 caracteres (límite de Webpay)
    const buyOrder = orderId.toString().substring(0, 26)

    // Generar un ID de sesión único
    const sessionId = `session-${Date.now()}`

    // Convertir el monto a entero (Webpay requiere montos sin decimales)
    const amount = Math.round(cartTotal)

    // URL de retorno después del pago
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const returnUrl = `${baseUrl}/api/webpay/commit`

    // Inicializar el SDK de Transbank
    let tx
    if (process.env.NODE_ENV === "production" && process.env.COMMERCE_CODE && process.env.API_KEY) {
      tx = new WebpayPlus.Transaction(
        new Options(process.env.COMMERCE_CODE, process.env.API_KEY, Environment.Production),
      )
    } else {
      // Ambiente de integración (pruebas)
      tx = new WebpayPlus.Transaction(
        new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration),
      )
    }

    // Crear la transacción usando el SDK
    const response = await tx.create(buyOrder, sessionId, amount, returnUrl)

    console.log("Transacción iniciada correctamente:", response)

    return Response.json({
      token: response.token,
      url: response.url,
      originalOrderId: orderId,
      truncatedOrderId: buyOrder,
    })
  } catch (error: any) {
    console.error("Error creando transacción Webpay", error)
    return Response.json({ error: error.message || "Error al iniciar la transacción" }, { status: 500 })
  }
}
