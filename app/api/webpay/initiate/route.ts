import { NextResponse } from "next/server"

// Configuración para el ambiente de integración de Webpay
const WEBPAY_HOST = "https://webpay3gint.transbank.cl"
const COMMERCE_CODE = "597055555532" // Código de comercio para integración
const API_KEY = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C" // API Key para integración

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { cartTotal, orderId } = data

    if (!cartTotal || !orderId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Datos de la orden
    const buyOrder = orderId
    const sessionId = "S-" + Math.floor(Math.random() * 1000000)
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webpay/commit`
    const amount = cartTotal

    // Crear la transacción en Webpay
    const response = await fetch(`${WEBPAY_HOST}/rswebpaytransaction/api/webpay/v1.2/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Tbk-Api-Key-Id": COMMERCE_CODE,
        "Tbk-Api-Key-Secret": API_KEY,
      },
      body: JSON.stringify({
        buy_order: buyOrder,
        session_id: sessionId,
        amount: amount,
        return_url: returnUrl,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error en respuesta de Webpay:", errorData)
      return NextResponse.json(
        { error: "Error al iniciar la transacción con Webpay", details: errorData },
        { status: response.status },
      )
    }

    const transactionData = await response.json()
    console.log("Transacción iniciada correctamente:", transactionData)

    return NextResponse.json({
      token: transactionData.token,
      url: transactionData.url,
    })
  } catch (error: any) {
    console.error("Error creando transacción Webpay", error)
    return NextResponse.json({ error: "Error iniciando pago", details: error.message }, { status: 500 })
  }
}
