import { type NextRequest, NextResponse } from "next/server"

// Esta ruta manejará las respuestas de Webpay
export async function POST(request: NextRequest) {
  try {
    // Obtener los datos de la solicitud
    const formData = await request.formData()

    // Extraer los parámetros relevantes de Webpay
    const paymentStatus = formData.get("status") as string
    const transactionId = formData.get("transaction_id") as string
    const amount = formData.get("amount") as string
    const orderId = formData.get("order_id") as string

    console.log("Webhook de Webpay recibido:", { paymentStatus, transactionId, amount, orderId })

    // Crear una respuesta HTML que se ejecutará en el navegador del cliente
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Procesando pago...</title>
        <script>
          // Notificar a la ventana principal que el pago fue exitoso
          try {
            localStorage.setItem("payment_completed_${orderId}", "true");
            
            // Intentar redirigir a la página de éxito
            window.location.href = "/checkout/success?order_id=${orderId}";
          } catch (e) {
            console.error("Error:", e);
          }
        </script>
      </head>
      <body>
        <h1>Procesando tu pago...</h1>
        <p>Serás redirigido automáticamente.</p>
      </body>
      </html>
    `

    return new Response(htmlResponse, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error al procesar webhook de Webpay:", error)
    return NextResponse.json({ success: false, error: "Error al procesar el pago" }, { status: 500 })
  }
}

// También manejaremos solicitudes GET para la redirección de Webpay
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const orderId = url.searchParams.get("order_id")

  // Crear una respuesta HTML que se ejecutará en el navegador del cliente
  const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Procesando pago...</title>
      <script>
        // Notificar a la ventana principal que el pago fue exitoso
        try {
          localStorage.setItem("payment_completed_${orderId}", "true");
          
          // Intentar redirigir a la página de éxito
          window.location.href = "/checkout/success?order_id=${orderId}";
        } catch (e) {
          console.error("Error:", e);
        }
      </script>
    </head>
    <body>
      <h1>Procesando tu pago...</h1>
      <p>Serás redirigido automáticamente.</p>
    </body>
    </html>
  `

  return new Response(htmlResponse, {
    headers: {
      "Content-Type": "text/html",
    },
  })
}
