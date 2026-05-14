/**
 * Server-only: crea la orden definitiva DESPUÉS de que Transbank confirmó el pago.
 *
 * Esta función reemplaza el flujo anterior donde el cliente, vía server action, marcaba la
 * orden como "paid" sin verificación contra Transbank. Acá toda la decisión proviene del
 * resultado de tx.commit() en /api/webpay/commit y de los datos guardados en
 * checkout_sessions por el usuario autenticado en el paso de initiate.
 *
 * Garantías:
 *  - Idempotente: si ya existe una orden para este buyOrder, la devuelve sin re-crear.
 *  - Recalcula precios desde la DB para evitar tampering del cliente.
 *  - Valida que el monto pagado coincida con el monto esperado (anti-tamper de localStorage).
 *  - Decrementa stock con optimistic locking.
 *  - Borra la sesión al finalizar.
 *
 * No exporta `use server`. Se llama únicamente desde route handlers de servidor.
 */

import { createSupabaseAdminClient } from "@/utils/supabase/server"
import { Resend } from "resend"
import { sendPushToUser } from "@/lib/push"
import { calculateExternalCashbak } from "@/lib/cashbak-calculator"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cashbak.cl"
const EMAIL_FROM = process.env.EMAIL_FROM || "support@cashbak.cl"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "cashbak.ops@gmail.com"

// Escapa HTML para evitar inyección desde datos controlados por usuario (nombre de producto,
// nombre de tienda, etc.) cuando se interpolan en cuerpos de email.
function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export type CreateOrderResult =
  | { ok: true; orderId: string; alreadyExisted: boolean }
  | { ok: false; reason: "session_not_found" | "amount_mismatch" | "stock_failure" | "db_error"; detail?: string }

export interface CreateOrderArgs {
  buyOrder: string
  paidAmount: number
  authorizationCode?: string | null
}

export async function createOrderFromWebpayCommit({
  buyOrder,
  paidAmount,
  authorizationCode,
}: CreateOrderArgs): Promise<CreateOrderResult> {
  const admin = createSupabaseAdminClient()

  // ── 0. Idempotencia: si ya hay una orden con este buyOrder, devolverla ────────
  const { data: existingItem } = await admin
    .from("order_items")
    .select("order_id")
    .eq("order_id_client", buyOrder)
    .limit(1)
    .maybeSingle()

  if (existingItem?.order_id) {
    return { ok: true, orderId: existingItem.order_id, alreadyExisted: true }
  }

  // ── 1. Cargar sesión guardada en initiate ─────────────────────────────────────
  const { data: session } = await admin
    .from("checkout_sessions")
    .select("user_id, cart_items, shipping_cost, delivery_type, cashbak_total, expires_at")
    .eq("order_id_client", buyOrder)
    .maybeSingle()

  if (!session) {
    console.error("[createOrderFromWebpayCommit] sesión no encontrada para buyOrder=", buyOrder)
    return { ok: false, reason: "session_not_found" }
  }

  // No exigir expires_at > now: Webpay puede tardar y el cliente pudo seguir el link
  // mucho después de iniciar el pago. La sesión solo se considera "consumida" cuando se borra
  // al finalizar este flujo.

  const userId: string = session.user_id
  const cartItems: any[] = Array.isArray(session.cart_items) ? session.cart_items : []
  const shippingCost: number = Number(session.shipping_cost ?? 0) || 0
  const deliveryType: string = String(session.delivery_type ?? "")
  const cashbakTotal: number = Number(session.cashbak_total ?? 0) || 0

  if (cartItems.length === 0) {
    return { ok: false, reason: "session_not_found", detail: "carrito vacío en la sesión" }
  }

  // ── 2. Recalcular total server-side desde DB ──────────────────────────────────
  const productIds = cartItems.map((i: any) => i.productId)
  const { data: dbProducts, error: productsError } = await admin
    .from("products")
    .select("id, price, margin_pct, store_id")
    .in("id", productIds)

  if (productsError || !dbProducts) {
    return { ok: false, reason: "db_error", detail: "no se pudieron leer productos" }
  }

  const betOptionIds = [...new Set(cartItems.map((i: any) => i.betOptionId).filter(Boolean))]
  const { data: dbBets } = await admin
    .from("bets")
    .select("id, odd")
    .in("id", betOptionIds.length > 0 ? betOptionIds : [-1])
  const betOddMap: Record<string, number> = Object.fromEntries(
    (dbBets ?? []).map((b: { id: number; odd: number }) => [String(b.id), b.odd])
  )

  let serverTotal = shippingCost
  for (const item of cartItems) {
    const dbProduct = dbProducts.find((p: { id: number; price: number }) => p.id === item.productId)
    if (!dbProduct) {
      return { ok: false, reason: "db_error", detail: `producto ${item.productId} no encontrado` }
    }
    serverTotal += dbProduct.price * item.quantity
  }
  serverTotal = Math.round(serverTotal)

  // ── 3. Verificar monto pagado vs monto esperado (anti-tamper) ────────────────
  const expected = Math.round(serverTotal)
  const paid = Math.round(Number(paidAmount) || 0)
  if (Math.abs(expected - paid) > 1) {
    console.error(
      "[createOrderFromWebpayCommit] amount mismatch buyOrder=", buyOrder,
      "expected=", expected,
      "paid=", paid
    )
    return { ok: false, reason: "amount_mismatch", detail: `expected ${expected}, paid ${paid}` }
  }

  // ── 4. Crear orden ────────────────────────────────────────────────────────────
  // El authorizationCode de Webpay queda solo en logs server-side para no contaminar
  // cashback_transfer_note (que admin usa para notas de cashback).
  if (authorizationCode) {
    console.log(`[createOrderFromWebpayCommit] webpay_auth=${authorizationCode} buyOrder=${buyOrder}`)
  }

  const { data: orderData, error: orderError } = await admin
    .from("orders")
    .insert({
      customer_id: userId,
      order_total: serverTotal,
      cashback_amount: cashbakTotal,
      shipping_cost: shippingCost,
      order_status: "completed",
      payment_status: "paid",
      shipping_method: deliveryType,
      shipping_status: "Preparando pedido",
    })
    .select("id")
    .single()

  if (orderError || !orderData) {
    console.error("[createOrderFromWebpayCommit] error creando orden:", orderError)
    return { ok: false, reason: "db_error", detail: orderError?.message }
  }

  const orderId: string = orderData.id

  // ── 5. Insertar order_items con valores financieros recalculados ─────────────
  const orderItems = cartItems.map((item: any) => {
    const dbProduct = dbProducts.find((p: any) => p.id === item.productId)
    const precioVenta = dbProduct?.price ?? item.product?.price ?? 0
    const margenVendedorPct = dbProduct?.margin_pct ?? 0.85
    const cuota = betOddMap[String(item.betOptionId)] ?? 0

    let vendor_net_amount = item.vendor_net_amount ?? null
    let comision_cashbak = item.comision_cashbak ?? null
    let tarifa_procesamiento = item.tarifa_procesamiento ?? null
    let cashback_percentage = item.cashbakPercentage
    let bet_amount = item.bet_amount

    if (dbProduct && cuota > 0) {
      const sim = calculateExternalCashbak({ precioVenta, costo: 0, cuota, margenVendedorPct })
      vendor_net_amount = sim.margenVendedorNeto
      comision_cashbak = sim.comisionDisplay
      tarifa_procesamiento = sim.tarifaProcesamiento
      cashback_percentage = sim.cashbackPct
      bet_amount = sim.montoApuesta
    }

    return {
      order_id: orderId,
      product_id: item.productId.toString(),
      product_name: item.product?.name ?? "",
      quantity: item.quantity,
      price: precioVenta,
      bet_option_id: item.betOptionId,
      bet_name: item.betName,
      cashback_percentage,
      order_id_client: buyOrder,
      bet_amount,
      size: item.size,
      comision_cashbak,
      tarifa_procesamiento,
      vendor_net_amount,
    }
  })

  const { error: itemsError } = await admin.from("order_items").insert(orderItems)
  if (itemsError) {
    console.error("[createOrderFromWebpayCommit] error insertando items:", itemsError)
    return { ok: false, reason: "db_error", detail: itemsError.message }
  }

  // ── 6. Descontar stock con optimistic locking ────────────────────────────────
  for (const item of cartItems) {
    const size = item.size
    const { data: productRow } = await admin
      .from("products")
      .select("stock")
      .eq("id", item.productId)
      .single()

    if (!productRow) continue
    const currentStock = (productRow.stock as Record<string, number>) || {}
    const available = currentStock[size] ?? 0
    if (available < item.quantity) {
      // Stock se agotó entre auth y commit — la orden ya fue cobrada, así que la dejamos
      // creada y registramos el conflicto para resolución manual.
      console.error(
        `[createOrderFromWebpayCommit] stock insuficiente post-pago orderId=${orderId} producto=${item.productId} talla=${size} disponible=${available} pedido=${item.quantity}`
      )
      continue
    }
    const updatedStock = { ...currentStock, [size]: available - item.quantity }
    await admin
      .from("products")
      .update({ stock: updatedStock })
      .eq("id", item.productId)
      .gte(`stock->>${size}`, item.quantity)
  }

  // ── 7. Emails (best-effort, no abortan la creación) ──────────────────────────
  sendEmailsBestEffort({
    orderId,
    serverTotal,
    cartItems,
    orderItems,
    userId,
    cashbakTotal,
  }).catch((e) => console.error("[createOrderFromWebpayCommit] error en emails:", e))

  // ── 8. Borrar sesión ──────────────────────────────────────────────────────────
  await admin.from("checkout_sessions").delete().eq("order_id_client", buyOrder)

  return { ok: true, orderId, alreadyExisted: false }
}

// ─────────────────────────────────────────────────────────────────────────────────
// Emails — extraídos de saveCheckoutData. Se ejecutan async sin bloquear la respuesta.
// ─────────────────────────────────────────────────────────────────────────────────

interface EmailContext {
  orderId: string
  serverTotal: number
  cartItems: any[]
  orderItems: any[]
  userId: string
  cashbakTotal: number
}

async function sendEmailsBestEffort(ctx: EmailContext) {
  const admin = createSupabaseAdminClient()

  // Datos del comprador
  const { data: customer } = await admin
    .from("customers")
    .select("email, full_name")
    .eq("id", ctx.userId)
    .single()

  // Tiendas involucradas
  const storeIds = [...new Set(ctx.cartItems.map((i: any) => i.product?.store_id).filter(Boolean))]
  const storeEmailMap: Record<string, { name: string; email: string | null; owner_id: string | null }> = {}
  if (storeIds.length > 0) {
    const { data: storeRows } = await admin
      .from("stores")
      .select("id, name, email, owner_id")
      .in("id", storeIds)
    for (const s of (storeRows ?? []) as any[]) {
      storeEmailMap[s.id] = { name: s.name, email: s.email, owner_id: s.owner_id }
    }
  }

  // Push al comprador
  sendPushToUser(ctx.userId, {
    title: "¡Compra exitosa! 🎉",
    body: "Tu pedido fue registrado. Pronto recibirás más información.",
    url: "/orders",
  }).catch(() => {})

  // Email al comprador
  if (customer?.email) {
    const itemsHtml = ctx.cartItems
      .map(
        (item: any) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${escapeHtml(item.product?.name ?? "Producto")}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">${escapeHtml(item.quantity)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">$${(item.product?.price * item.quantity).toLocaleString("es-CL")}</td>
          </tr>`
      )
      .join("")

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: customer.email,
        subject: `¡Gracias por tu compra! Pedido #${escapeHtml(ctx.orderId)}`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
            <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
            <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:560px;text-align:left;">
              <h2 style="color:#14532d;margin-top:0;">¡Compra exitosa!</h2>
              <p style="color:#555;">Tu pedido fue registrado correctamente.</p>
              <p style="font-size:15px;margin:16px 0;">
                <strong>Número de pedido:</strong>
                <span style="color:#1c7ed6;">${escapeHtml(ctx.orderId)}</span>
              </p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:8px 12px;text-align:left;color:#6b7280;">Producto</th>
                    <th style="padding:8px 12px;text-align:center;color:#6b7280;">Cant.</th>
                    <th style="padding:8px 12px;text-align:right;color:#6b7280;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
                <p style="color:#166534;margin:0;font-size:14px;">
                  La tienda te contactará confirmando el envío o disponibilidad para retiro según hayas elegido.<br/><br/>
                  <strong>¡Éxito con tu CashBak!</strong> 🎉
                </p>
              </div>
              <div style="background:#f9fafb;border-radius:8px;padding:14px;margin:16px 0;font-size:13px;color:#374151;">
                <p style="margin:0 0 6px 0;font-weight:600;">¿Cómo ver tu pedido?</p>
                <p style="margin:0;">Ingresa a <a href="${APP_URL}" style="color:#14532d;font-weight:600;">cashbak.cl</a>, inicia sesión con tu cuenta y ve a <strong>Mi Perfil → Mis Pedidos</strong>.</p>
              </div>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CashBak · cashbak.cl</p>
            </div>
          </div>
        `,
      })
    } catch (e) {
      console.error("[createOrderFromWebpayCommit] error email comprador:", e)
    }
  }

  // Email a cada tienda
  for (const storeId of storeIds) {
    const store = storeEmailMap[storeId]
    if (!store) continue
    if (store.owner_id) {
      sendPushToUser(store.owner_id, {
        title: "¡Nueva venta! 🛍️",
        body: "Tienes un nuevo pedido en tu tienda. Revísalo en Mi Tienda.",
        url: "/mi-tienda/pedidos",
      }).catch(() => {})
    }
    if (!store.email) continue
    const storeItems = ctx.cartItems.filter((i: any) => i.product?.store_id === storeId)
    const storeItemsHtml = storeItems
      .map(
        (item: any) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${escapeHtml(item.product?.name ?? "Producto")} ${item.size ? `(${escapeHtml(item.size)})` : ""}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">${escapeHtml(item.quantity)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">$${(item.product?.price * item.quantity).toLocaleString("es-CL")}</td>
          </tr>`
      )
      .join("")

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: store.email,
        subject: `Nueva venta en CashBak — Pedido #${escapeHtml(ctx.orderId)}`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
            <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
            <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:560px;text-align:left;">
              <h2 style="color:#14532d;margin-top:0;">¡Tienes una nueva venta!</h2>
              <p style="color:#555;">Se realizó un pedido en tu tienda <strong>${escapeHtml(store.name)}</strong>.</p>
              <p style="font-size:15px;margin:16px 0;">
                <strong>Número de pedido:</strong>
                <span style="color:#1c7ed6;">${escapeHtml(ctx.orderId)}</span>
              </p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:8px 12px;text-align:left;color:#6b7280;">Producto</th>
                    <th style="padding:8px 12px;text-align:center;color:#6b7280;">Cant.</th>
                    <th style="padding:8px 12px;text-align:right;color:#6b7280;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>${storeItemsHtml}</tbody>
              </table>
              <p style="color:#374151;font-size:14px;">Coordina el envío o retiro con el cliente según el método elegido.</p>
              <div style="background:#f9fafb;border-radius:8px;padding:14px;margin:16px 0;font-size:13px;color:#374151;">
                <p style="margin:0 0 6px 0;font-weight:600;">¿Cómo ver tus pedidos?</p>
                <p style="margin:0;">Ingresa a <a href="${APP_URL}" style="color:#14532d;font-weight:600;">cashbak.cl</a>, inicia sesión con tu cuenta y ve a <strong>Mi Tienda → Mis Pedidos</strong>.</p>
              </div>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CashBak · cashbak.cl</p>
            </div>
          </div>
        `,
      })
    } catch (e) {
      console.error(`[createOrderFromWebpayCommit] error email tienda ${storeId}:`, e)
    }
  }

  // Email al admin
  try {
    const orderRef = ctx.orderId.slice(0, 8).toUpperCase()
    const adminItemsHtml = ctx.orderItems
      .map((item) => {
        const cartMatch = ctx.cartItems.find((c: any) => c.productId.toString() === item.product_id)
        const storeName = storeEmailMap[cartMatch?.product?.store_id]?.name ?? "CashBak Store"
        const betName = cartMatch?.betName ?? "—"
        const comisionTotal = (item.comision_cashbak ?? 0) + (item.tarifa_procesamiento ?? 0)
        return `
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px 12px;vertical-align:top;">
              <p style="margin:0;font-weight:600;color:#111;">${escapeHtml(item.product_name)}${item.size ? ` (${escapeHtml(item.size)})` : ""} ×${escapeHtml(item.quantity)}</p>
              <p style="margin:2px 0 0 0;font-size:12px;color:#6b7280;">Tienda: ${escapeHtml(storeName)}</p>
              <p style="margin:2px 0 0 0;font-size:12px;color:#6b7280;">Evento: ${escapeHtml(betName)}</p>
            </td>
            <td style="padding:10px 12px;text-align:right;vertical-align:top;white-space:nowrap;">
              <p style="margin:0;font-size:13px;">Precio: <strong>$${(item.price * item.quantity).toLocaleString("es-CL")}</strong></p>
              <p style="margin:2px 0 0 0;font-size:12px;color:#2563eb;">Monto a apostar: $${((item.bet_amount ?? 0) * item.quantity).toLocaleString("es-CL")}</p>
              <p style="margin:2px 0 0 0;font-size:12px;color:#7c3aed;">Comisión CashBak + procesamiento: $${(comisionTotal * item.quantity).toLocaleString("es-CL")}</p>
              <p style="margin:2px 0 0 0;font-size:12px;color:#059669;font-weight:600;">Ingreso neto vendedor: $${((item.vendor_net_amount ?? 0) * item.quantity).toLocaleString("es-CL")}</p>
            </td>
          </tr>`
      })
      .join("")

    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `🛍️ Nueva compra — Pedido #${escapeHtml(orderRef)} ($${ctx.serverTotal.toLocaleString("es-CL")})`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:32px;">
          <h2 style="color:#14532d;margin:0 0 4px 0;">Nueva compra en CashBak</h2>
          <p style="color:#6b7280;margin:0 0 20px 0;font-size:13px;">Pedido #${escapeHtml(orderRef)} · ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" })}</p>

          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:16px;">
            <thead>
              <tr style="background:#f0fdf4;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#166534;font-weight:600;">PRODUCTO / EVENTO</th>
                <th style="padding:10px 12px;text-align:right;font-size:12px;color:#166534;font-weight:600;">MONTOS</th>
              </tr>
            </thead>
            <tbody>${adminItemsHtml}</tbody>
          </table>

          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:16px;">
            <tr>
              <td style="padding:10px 16px;font-size:13px;color:#374151;">Cliente</td>
              <td style="padding:10px 16px;font-size:13px;font-weight:600;text-align:right;">${escapeHtml(customer?.email ?? "")}</td>
            </tr>
            <tr style="background:#f9fafb;">
              <td style="padding:10px 16px;font-size:13px;color:#374151;">Total orden</td>
              <td style="padding:10px 16px;font-size:15px;font-weight:800;color:#14532d;text-align:right;">$${ctx.serverTotal.toLocaleString("es-CL")}</td>
            </tr>
          </table>

          <p style="font-size:12px;color:#9ca3af;margin:0;">
            <a href="${APP_URL}/admin/dashboard" style="color:#14532d;">Ver en el dashboard →</a>
          </p>
        </div>
      `,
    })
  } catch (e) {
    console.error("[createOrderFromWebpayCommit] error email admin:", e)
  }
}
