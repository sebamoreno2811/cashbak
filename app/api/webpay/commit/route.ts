import { WebpayPlus } from "transbank-sdk"
import { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from "transbank-sdk"
import { NextResponse } from "next/server"
import { createOrderFromWebpayCommit } from "@/lib/order-creation"

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
  console.log(`Confirmando transacción con token: ${token.slice(0, 8)}…`)
  try {
    const response = await buildTx().commit(token)
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

/**
 * Crea la orden a partir del resultado autorizado de Transbank y redirige al cliente.
 * Toda la lógica de creación de orden vive server-side acá: el cliente NO puede crear
 * órdenes "pagadas" sin un commit() exitoso de Transbank.
 */
async function finalizeAuthorizedPayment(result: any) {
  const buyOrder: string = result.buy_order ?? ""
  const paidAmount: number = Number(result.amount ?? 0)
  const authorizationCode: string | null = result.authorization_code ?? null

  if (!buyOrder) {
    console.error("[webpay/commit] commit autorizado pero sin buy_order:", result)
    return safeRedirect("/checkout?status=error&reason=order_failed")
  }

  const creation = await createOrderFromWebpayCommit({
    buyOrder,
    paidAmount,
    authorizationCode,
  })

  const orderIdQs = encodeURIComponent(buyOrder)

  if (!creation.ok) {
    console.error(
      "[webpay/commit] no se pudo crear la orden tras commit autorizado",
      "buyOrder=", buyOrder,
      "reason=", creation.reason,
      "detail=", creation.detail
    )
    return safeRedirect(`/checkout?status=error&reason=order_failed&order_id=${orderIdQs}`)
  }

  return safeRedirect(`/checkout?status=success&order_id=${orderIdQs}`)
}

async function handleCommit(token: string | null, tbkToken: string | null, tbkOrdenCompra: string | null) {
  if (tbkToken) {
    const orderId = encodeURIComponent(tbkOrdenCompra ?? "")
    return safeRedirect(`/checkout?status=error&reason=aborted&order_id=${orderId}`)
  }

  if (!token) {
    return safeRedirect("/checkout?status=error&reason=token_missing")
  }

  try {
    const result = await confirmTransaction(token)
    const isSuccessful = result.status === "AUTHORIZED" && result.response_code === 0

    if (isSuccessful) {
      return await finalizeAuthorizedPayment(result)
    }

    const orderId = encodeURIComponent(result.buy_order ?? "")
    return safeRedirect(`/checkout?status=error&reason=payment&code=${result.response_code}&order_id=${orderId}`)
  } catch (error) {
    console.error("Error confirmando transacción Webpay:", error)
    return safeRedirect("/checkout?status=error&reason=system")
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const token = formData.get("token_ws") as string | null
    const tbkToken = formData.get("TBK_TOKEN") as string | null
    const tbkOrdenCompra = formData.get("TBK_ORDEN_COMPRA") as string | null
    return await handleCommit(token, tbkToken, tbkOrdenCompra)
  } catch (error) {
    console.error("Error en POST de Webpay commit:", error)
    return safeRedirect("/checkout?status=error&reason=system")
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get("token_ws")
    const tbkToken = url.searchParams.get("TBK_TOKEN")
    const tbkOrdenCompra = url.searchParams.get("TBK_ORDEN_COMPRA")
    return await handleCommit(token, tbkToken, tbkOrdenCompra)
  } catch (error) {
    console.error("Error en GET de Webpay commit:", error)
    return safeRedirect("/checkout?status=error&reason=system")
  }
}
