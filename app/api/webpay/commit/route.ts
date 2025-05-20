// Configuración para el ambiente de integración de Webpay
const WEBPAY_HOST = "https://webpay3gint.transbank.cl"
const COMMERCE_CODE = "597055555532" // Código de comercio para integración
const API_KEY = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C" // API Key para integración

// Función para confirmar la transacción con Webpay
const confirmTransaction = async (token: string) => {
  const response = await fetch(`${WEBPAY_HOST}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Tbk-Api-Key-Id": COMMERCE_CODE,
      "Tbk-Api-Key-Secret": API_KEY,
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Error en respuesta de Webpay:", errorData)
    throw new Error(`Error al confirmar la transacción: ${JSON.stringify(errorData)}`)
  }

  return await response.json()
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const token = formData.get("token_ws") as string

    if (!token) {
      // Redirigir a página de error
      return new Response(
        `<html><body><script>window.location.href = "/checkout?error=token_missing";</script></body></html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    // Confirmar la transacción con Webpay
    const result = await confirmTransaction(token)
    console.log("Resultado de la transacción:", result)

    // Verificamos si la transacción fue exitosa
    const isSuccessful = result.status === "AUTHORIZED" && result.response_code === 0

    // Redirigimos al cliente a la página de éxito o error
    if (isSuccessful) {
      return new Response(
        `<html><body><script>
          localStorage.setItem("payment_completed_${result.buy_order}", "true");
          window.location.href = "/checkout/success?order_id=${result.buy_order}";
        </script></body></html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    } else {
      return new Response(
        `<html><body><script>
          window.location.href = "/checkout?error=payment_failed&code=${result.response_code}";
        </script></body></html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }
  } catch (error: any) {
    console.error("Error confirmando transacción Webpay", error)

    // Redirigir a página de error
    return new Response(
      `<html><body><script>window.location.href = "/checkout?error=transaction_error&message=${encodeURIComponent(
        error.message,
      )}";</script></body></html>`,
      { headers: { "Content-Type": "text/html" } },
    )
  }
}

// También manejamos GET para casos donde Webpay redirecciona con GET
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token_ws")

  if (!token) {
    return new Response(
      `<html><body><script>window.location.href = "/checkout?error=token_missing";</script></body></html>`,
      { headers: { "Content-Type": "text/html" } },
    )
  }

  try {
    // Confirmar la transacción con Webpay
    const result = await confirmTransaction(token)
    console.log("Resultado de la transacción (GET):", result)

    // Verificamos si la transacción fue exitosa
    const isSuccessful = result.status === "AUTHORIZED" && result.response_code === 0

    if (isSuccessful) {
      return new Response(
        `<html><body><script>
          localStorage.setItem("payment_completed_${result.buy_order}", "true");
          window.location.href = "/checkout/success?order_id=${result.buy_order}";
        </script></body></html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    } else {
      return new Response(
        `<html><body><script>
          window.location.href = "/checkout?error=payment_failed&code=${result.response_code}";
        </script></body></html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }
  } catch (error: any) {
    console.error("Error en la redirección de Webpay:", error)

    return new Response(
      `<html><body><script>window.location.href = "/checkout?error=transaction_error&message=${encodeURIComponent(
        error.message,
      )}";</script></body></html>`,
      { headers: { "Content-Type": "text/html" } },
    )
  }
}
