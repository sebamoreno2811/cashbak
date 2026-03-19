import { type NextRequest, NextResponse } from "next/server"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Valida que el orderId tenga formato esperado (solo letras, números, guiones)
function sanitizeOrderId(raw: string | null): string | null {
  if (!raw) return null
  const clean = raw.replace(/[^a-zA-Z0-9\-_]/g, "")
  return clean.length > 0 && clean.length < 200 ? clean : null
}

function redirectToCheckout(orderId: string | null) {
  if (!orderId) {
    return NextResponse.redirect(`${BASE_URL}/checkout?status=error&reason=invalid_order`)
  }
  return NextResponse.redirect(`${BASE_URL}/checkout?status=success&order_id=${orderId}`)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const rawOrderId = formData.get("order_id") as string | null
    const orderId = sanitizeOrderId(rawOrderId)

    console.log("Webhook de Webpay recibido:", {
      status: formData.get("status"),
      transaction_id: formData.get("transaction_id"),
      order_id: orderId,
    })

    return redirectToCheckout(orderId)
  } catch (error) {
    console.error("Error al procesar webhook de Webpay:", error)
    return NextResponse.redirect(`${BASE_URL}/checkout?status=error&reason=system`)
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const orderId = sanitizeOrderId(url.searchParams.get("order_id"))
    return redirectToCheckout(orderId)
  } catch (error) {
    console.error("Error en la redirección de Webpay:", error)
    return NextResponse.redirect(`${BASE_URL}/checkout?status=error&reason=system`)
  }
}
