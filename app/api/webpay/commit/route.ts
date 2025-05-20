import { WebpayPlus } from "transbank-sdk"
import { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from "transbank-sdk"

// Función para confirmar la transacción con Webpay usando el SDK
const confirmTransaction = async (token: string) => {
  console.log(`Confirmando transacción con token: ${token}`)

  try {
    // Inicializar el SDK de Transbank
    // Si estamos en producción, usamos las credenciales de producción
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

    // Confirmar la transacción usando el SDK
    const response = await tx.commit(token)

    console.log("Transacción confirmada:", response)
    return response
  } catch (error) {
    console.error("Error en confirmTransaction:", error)
    throw error
  }
}

// Función para manejar la redirección después de procesar el pago
const handleRedirection = (result: any, success: boolean) => {
  // Obtener la URL base de la aplicación
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // Crear la URL de redirección
  const redirectUrl = success
    ? `${baseUrl}/checkout?status=success&order_id=${result.buy_order}`
    : `${baseUrl}/checkout?status=error&code=${result.response_code}&order_id=${result.buy_order}`

  // Devolver una respuesta HTML que redirige al usuario
  return new Response(
    `<html><body><script>
      window.location.href = "${redirectUrl}";
    </script></body></html>`,
    { headers: { "Content-Type": "text/html" } },
  )
}

// Manejador para solicitudes POST (Webpay normalmente usa POST para la redirección)
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const token = formData.get("token_ws") as string
    const tbkToken = formData.get("TBK_TOKEN") as string
    const tbkOrdenCompra = formData.get("TBK_ORDEN_COMPRA") as string

    console.log("POST Webpay commit recibido:", { token, tbkToken, tbkOrdenCompra })

    // Si recibimos TBK_TOKEN, es una transacción abortada o con error
    if (tbkToken) {
      console.log("Transacción abortada o con error:", { tbkToken, tbkOrdenCompra })
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      return new Response(
        `<html><body><script>
          window.location.href = "${baseUrl}/checkout?status=error&reason=aborted&order_id=${tbkOrdenCompra}";
        </script></body></html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    if (!token) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      return new Response(
        `<html><body><script>
          window.location.href = "${baseUrl}/checkout?status=error&reason=token_missing";
        </script></body></html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    // Confirmar la transacción con Webpay
    const result = await confirmTransaction(token)
    console.log("Resultado de la transacción:", result)

    // Verificamos si la transacción fue exitosa
    const isSuccessful = result.status === "AUTHORIZED" && result.response_code === 0

    // Redirigir al usuario según el resultado
    return handleRedirection(result, isSuccessful)
  } catch (error: any) {
    console.error("Error confirmando transacción Webpay", error)

    // Redirigir a página de error
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return new Response(
      `<html><body><script>
        window.location.href = "${baseUrl}/checkout?status=error&reason=system&message=${encodeURIComponent(error.message)}";
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } },
    )
  }
}

// Manejador para solicitudes GET (por si Webpay usa GET para la redirección)
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token_ws")
  const tbkToken = url.searchParams.get("TBK_TOKEN")
  const tbkOrdenCompra = url.searchParams.get("TBK_ORDEN_COMPRA")

  console.log("GET Webpay commit recibido:", { token, tbkToken, tbkOrdenCompra })

  // Si recibimos TBK_TOKEN, es una transacción abortada o con error
  if (tbkToken) {
    console.log("Transacción abortada o con error:", { tbkToken, tbkOrdenCompra })
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return new Response(
      `<html><body><script>
        window.location.href = "${baseUrl}/checkout?status=error&reason=aborted&order_id=${tbkOrdenCompra}";
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } },
    )
  }

  if (!token) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return new Response(
      `<html><body><script>
        window.location.href = "${baseUrl}/checkout?status=error&reason=token_missing";
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } },
    )
  }

  try {
    // Confirmar la transacción con Webpay
    const result = await confirmTransaction(token)
    console.log("Resultado de la transacción (GET):", result)

    // Verificamos si la transacción fue exitosa
    const isSuccessful = result.status === "AUTHORIZED" && result.response_code === 0

    // Redirigir al usuario según el resultado
    return handleRedirection(result, isSuccessful)
  } catch (error: any) {
    console.error("Error en la redirección de Webpay:", error)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return new Response(
      `<html><body><script>
        window.location.href = "${baseUrl}/checkout?status=error&reason=system&message=${encodeURIComponent(error.message)}";
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } },
    )
  }
}
