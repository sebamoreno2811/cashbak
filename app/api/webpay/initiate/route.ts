import { WebpayPlus } from "transbank-sdk"
import { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from "transbank-sdk"
import { NextResponse } from "next/server"
import { createSupabaseClientWithCookies } from "@/utils/supabase/server"

export async function POST(request: Request) {
  try {
    // Verificar que el usuario este autenticado antes de iniciar un pago
    const supabase = await createSupabaseClientWithCookies()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { orderId, items, shippingCost: rawShipping } = await request.json()

    if (!orderId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Datos de la orden inválidos" }, { status: 400 })
    }

    // Calcular monto server-side desde precios en DB — nunca confiar en el cliente
    const productIds = items.map((i: { productId: number }) => i.productId)
    const { data: dbProducts, error: productsError } = await supabase
      .from("products")
      .select("id, price")
      .in("id", productIds)

    if (productsError || !dbProducts || dbProducts.length === 0) {
      return NextResponse.json({ error: "No se pudieron verificar los productos" }, { status: 400 })
    }

    const productsTotal = items.reduce((sum: number, item: { productId: number; quantity: number }) => {
      const product = dbProducts.find((p: { id: number; price: number }) => p.id === item.productId)
      return sum + (product ? product.price * item.quantity : 0)
    }, 0)

    const shippingCost = Math.max(0, Math.round(Number(rawShipping) || 0))
    const amount = Math.round(productsTotal + shippingCost)

    if (amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
    }

    // Limitar orderId a 26 chars (limite de Webpay)
    const buyOrder = String(orderId).substring(0, 26)
    const sessionId = `session-${crypto.randomUUID()}`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const returnUrl = `${baseUrl}/api/webpay/commit`

    let tx
    if (process.env.NODE_ENV === "production" && process.env.COMMERCE_CODE && process.env.API_KEY) {
      tx = new WebpayPlus.Transaction(
        new Options(process.env.COMMERCE_CODE, process.env.API_KEY, Environment.Production),
      )
    } else {
      tx = new WebpayPlus.Transaction(
        new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration),
      )
    }

    const response = await tx.create(buyOrder, sessionId, amount, returnUrl)

    return NextResponse.json({
      token: response.token,
      url: response.url,
      originalOrderId: orderId,
      truncatedOrderId: buyOrder,
    })
  } catch (error: any) {
    console.error("Error creando transacción Webpay:", error)
    return NextResponse.json({ error: "Error al iniciar la transacción" }, { status: 500 })
  }
}
