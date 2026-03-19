import { WebpayPlus } from "transbank-sdk"
import { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from "transbank-sdk"
import { NextResponse } from "next/server"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

function buildTx() {
  if (process.env.NODE_ENV === "production" && process.env.COMMERCE_CODE && process.env.API_KEY) {
    return new WebpayPlus.Transaction(
      new Options(process.env.COMMERCE_CODE, process.env.API_KEY, Environment.Production),
    )
  }
  return new WebpayPlus.Transaction(
    new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration),
  )
}

async function confirmTransaction(token: string) {
  console.log(`Confirmando transacción con token: ${token}`)
  try {
    const response = await buildTx().commit(token)
    console.log("Transacción confirmada:", response)
    return response
  } catch (error) {
    console.error("Error en confirmTransaction:", error)
    throw error
  }
}

function safeRedirect(path: string) {
  // Solo permite rutas relativas al dominio propio — evita open-redirect
  const url = new URL(path, BASE_URL)
  if (url.origin !== BASE_URL) {
    return NextResponse.redirect(`${BASE_URL}/checkout?status=error&reason=system`)
  }
  return NextResponse.redirect(url.toString())
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const token = formData.get("token_ws") as string | null
    const tbkToken = formData.get("TBK_TOKEN") as string | null
    const tbkOrdenCompra = formData.get("TBK_ORDEN_COMPRA") as string | null

    if (tbkToken) {
      const orderId = encodeURIComponent(tbkOrdenCompra ?? "")
      return safeRedirect(`/checkout?status=error&reason=aborted&order_id=${orderId}`)
    }

    if (!token) {
      return safeRedirect("/checkout?status=error&reason=token_missing")
    }

    const result = await confirmTransaction(token)
    const isSuccessful = result.status === "AUTHORIZED" && result.response_code === 0
    const orderId = encodeURIComponent(result.buy_order ?? "")

    if (isSuccessful) {
      return safeRedirect(`/checkout?status=success&order_id=${orderId}`)
    }
    return safeRedirect(`/checkout?status=error&reason=payment&code=${result.response_code}&order_id=${orderId}`)
  } catch (error: any) {
    console.error("Error confirmando transacción Webpay:", error)
    return safeRedirect("/checkout?status=error&reason=system")
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get("token_ws")
    const tbkToken = url.searchParams.get("TBK_TOKEN")
    const tbkOrdenCompra = url.searchParams.get("TBK_ORDEN_COMPRA")

    if (tbkToken) {
      const orderId = encodeURIComponent(tbkOrdenCompra ?? "")
      return safeRedirect(`/checkout?status=error&reason=aborted&order_id=${orderId}`)
    }

    if (!token) {
      return safeRedirect("/checkout?status=error&reason=token_missing")
    }

    const result = await confirmTransaction(token)
    const isSuccessful = result.status === "AUTHORIZED" && result.response_code === 0
    const orderId = encodeURIComponent(result.buy_order ?? "")

    if (isSuccessful) {
      return safeRedirect(`/checkout?status=success&order_id=${orderId}`)
    }
    return safeRedirect(`/checkout?status=error&reason=payment&code=${result.response_code}&order_id=${orderId}`)
  } catch (error: any) {
    console.error("Error en la redirección de Webpay:", error)
    return safeRedirect("/checkout?status=error&reason=system")
  }
}
