"use server"

import { createSupabaseClientWithCookies, createSupabaseAdminClient } from "@/utils/supabase/server"
import type { CheckoutFormData } from "@/types/checkout"
import { Resend } from 'resend'
import { sendPushToUser } from "@/lib/push"
import { calculateExternalCashbak } from "@/lib/cashbak-calculator"

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cashbak.cl"
const EMAIL_FROM = process.env.EMAIL_FROM || "support@cashbak.cl"


export async function saveCheckoutData(
  _formData: CheckoutFormData,
  cartItems: any[],
  _cartTotal: number,
  cashbakTotal: number,
  deliveryType: string,
  shippingCost: number = 0
) {
  try {
    const supabase = await createSupabaseClientWithCookies()

    // 1. Verificar usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Usuario no autenticado" }
    }

    // 2. Buscar cliente por user.id (no por email)
    const { data: profile, error: profileError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: "No se encontró el perfil del usuario" }
    }

    const customerId = profile.id

    // 3. Verificar idempotencia — evitar ordenes duplicadas con el mismo order_id_client
    const clientOrderId = cartItems[0]?.order_id
    if (clientOrderId) {
      const { data: existingItem } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id_client", clientOrderId)
        .limit(1)
        .maybeSingle()

      if (existingItem) {
        return { success: true, orderId: clientOrderId, alreadyProcessed: true }
      }
    }

    // 4. Verificar precios contra la base de datos (evitar manipulacion de localStorage)
    const productIds = cartItems.map((item) => item.productId)
    const { data: dbProducts, error: productsError } = await supabase
      .from("products")
      .select("id, price, stock, margin_pct")
      .in("id", productIds)

    if (productsError || !dbProducts) {
      return { success: false, error: "No se pudieron verificar los productos" }
    }

    // Fix 7: obtener cuotas de los eventos desde la DB
    const betOptionIds = [...new Set(cartItems.map((i: any) => i.betOptionId).filter(Boolean))]
    const { data: dbBets } = await supabase
      .from("bets")
      .select("id, odd")
      .in("id", betOptionIds.length > 0 ? betOptionIds : [-1])
    const betOddMap: Record<string, number> = Object.fromEntries(
      (dbBets ?? []).map((b: { id: number; odd: number }) => [String(b.id), b.odd])
    )

    let serverTotal = shippingCost
    for (const item of cartItems) {
      const dbProduct = dbProducts.find((p: { id: number; price: number; stock: Record<string, number> }) => p.id === item.productId)
      if (!dbProduct) {
        return { success: false, error: `Producto ${item.productId} no encontrado` }
      }
      serverTotal += dbProduct.price * item.quantity
    }
    serverTotal = Math.round(serverTotal)

    // 5. Crear orden (admin client para saltarse RLS — auth ya validada arriba)
    const admin = createSupabaseAdminClient()
    const { data: orderData, error: orderError } = await admin
      .from("orders")
      .insert({
        customer_id: customerId,
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
      console.error("[saveCheckoutData] Error creando orden:", orderError)
      return { success: false, error: "Error al crear la orden" }
    }

    const orderId = orderData.id

    // 6. Insertar items — Fix 7: recalcular valores financieros server-side
    const orderItems = cartItems.map((item: any) => {
      const dbProduct = dbProducts.find((p: any) => p.id === item.productId)
      const precioVenta = dbProduct?.price ?? item.product.price
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
        product_name: item.product.name,
        quantity: item.quantity,
        price: precioVenta,
        bet_option_id: item.betOptionId,
        bet_name: item.betName,
        cashback_percentage,
        order_id_client: item.order_id,
        bet_amount,
        size: item.size,
        comision_cashbak,
        tarifa_procesamiento,
        vendor_net_amount,
      }
    })

    const { error: itemsError } = await admin.from("order_items").insert(orderItems)

    if (itemsError) {
      return { success: false, error: "Error al guardar los items de la orden" }
    }

    // 7. Obtener info de la(s) tienda(s) para emails
    const storeIds = [...new Set(cartItems.map((i: any) => i.product?.store_id).filter(Boolean))]
    const storeEmailMap: Record<string, { name: string; email: string | null }> = {}
    if (storeIds.length > 0) {
      const { data: storeRows } = await supabase
        .from("stores")
        .select("id, name, email")
        .in("id", storeIds)
      for (const s of storeRows ?? []) {
        storeEmailMap[s.id] = { name: s.name, email: s.email }
      }
    }

    const itemsHtml = cartItems.map((item: any) =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${item.product?.name ?? "Producto"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">$${(item.product?.price * item.quantity).toLocaleString("es-CL")}</td>
      </tr>`
    ).join("")

    // 8. Push + email de confirmación al comprador
    sendPushToUser(user.id, {
      title: "¡Compra exitosa! 🎉",
      body: `Tu pedido fue registrado. Pronto recibirás más información.`,
      url: "/orders",
    }).catch(() => {})

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email!,
        subject: `¡Gracias por tu compra! Pedido #${orderId}`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
            <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
            <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:560px;text-align:left;">
              <h2 style="color:#14532d;margin-top:0;">¡Compra exitosa!</h2>
              <p style="color:#555;">Tu pedido fue registrado correctamente.</p>
              <p style="font-size:15px;margin:16px 0;">
                <strong>Número de pedido:</strong>
                <span style="color:#1c7ed6;">${orderId}</span>
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
    } catch (emailError) {
      console.error("Error enviando email al comprador:", emailError)
    }

    // 10. Email + push a la(s) tienda(s)
    const { data: storeOwners } = await supabase
      .from("stores")
      .select("id, owner_id")
      .in("id", storeIds)
    const ownerMap = Object.fromEntries((storeOwners ?? []).map((s: any) => [s.id, s.owner_id]))

    for (const storeId of storeIds) {
      const store = storeEmailMap[storeId]
      const ownerId = ownerMap[storeId]
      if (ownerId) {
        sendPushToUser(ownerId, {
          title: "¡Nueva venta! 🛍️",
          body: `Tienes un nuevo pedido en tu tienda. Revísalo en Mi Tienda.`,
          url: "/mi-tienda/pedidos",
        }).catch(() => {})
      }
      if (!store?.email) continue
      const storeItems = cartItems.filter((i: any) => i.product?.store_id === storeId)
      const storeItemsHtml = storeItems.map((item: any) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${item.product?.name ?? "Producto"} ${item.size ? `(${item.size})` : ""}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">$${(item.product?.price * item.quantity).toLocaleString("es-CL")}</td>
        </tr>`
      ).join("")

      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: store.email,
          subject: `Nueva venta en CashBak — Pedido #${orderId}`,
          html: `
            <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
              <img src="${APP_URL}/img/logo.png" alt="CashBak" style="max-width:140px;margin-bottom:28px;" />
              <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:560px;text-align:left;">
                <h2 style="color:#14532d;margin-top:0;">¡Tienes una nueva venta!</h2>
                <p style="color:#555;">Se realizó un pedido en tu tienda <strong>${store.name}</strong>.</p>
                <p style="font-size:15px;margin:16px 0;">
                  <strong>Número de pedido:</strong>
                  <span style="color:#1c7ed6;">${orderId}</span>
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
      } catch (emailError) {
        console.error(`Error enviando email a tienda ${storeId}:`, emailError)
      }
    }

    // 11. Email de notificación al admin
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "cashbak.ops@gmail.com"
    try {
      const orderRef = orderId.slice(0, 8).toUpperCase()
      const adminItemsHtml = orderItems.map((item) => {
        const storeName = storeEmailMap[cartItems.find((c: any) => c.productId.toString() === item.product_id)?.product?.store_id]?.name ?? "CashBak Store"
        const betName = cartItems.find((c: any) => c.productId.toString() === item.product_id)?.betName ?? "—"
        const comisionTotal = (item.comision_cashbak ?? 0) + (item.tarifa_procesamiento ?? 0)
        return `
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px 12px;vertical-align:top;">
              <p style="margin:0;font-weight:600;color:#111;">${item.product_name}${item.size ? ` (${item.size})` : ""} ×${item.quantity}</p>
              <p style="margin:2px 0 0 0;font-size:12px;color:#6b7280;">Tienda: ${storeName}</p>
              <p style="margin:2px 0 0 0;font-size:12px;color:#6b7280;">Evento: ${betName}</p>
            </td>
            <td style="padding:10px 12px;text-align:right;vertical-align:top;white-space:nowrap;">
              <p style="margin:0;font-size:13px;">Precio: <strong>$${(item.price * item.quantity).toLocaleString("es-CL")}</strong></p>
              <p style="margin:2px 0 0 0;font-size:12px;color:#2563eb;">Monto a apostar: $${(item.bet_amount ?? 0).toLocaleString("es-CL")}</p>
              <p style="margin:2px 0 0 0;font-size:12px;color:#7c3aed;">Comisión CashBak + procesamiento: $${comisionTotal.toLocaleString("es-CL")}</p>
              <p style="margin:2px 0 0 0;font-size:12px;color:#059669;font-weight:600;">Ingreso neto vendedor: $${(item.vendor_net_amount ?? 0).toLocaleString("es-CL")}</p>
            </td>
          </tr>`
      }).join("")

      await resend.emails.send({
        from: EMAIL_FROM,
        to: ADMIN_EMAIL,
        subject: `🛍️ Nueva compra — Pedido #${orderRef} ($${serverTotal.toLocaleString("es-CL")})`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:32px;">
            <h2 style="color:#14532d;margin:0 0 4px 0;">Nueva compra en CashBak</h2>
            <p style="color:#6b7280;margin:0 0 20px 0;font-size:13px;">Pedido #${orderRef} · ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" })}</p>

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
                <td style="padding:10px 16px;font-size:13px;font-weight:600;text-align:right;">${user.email}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:10px 16px;font-size:13px;color:#374151;">Total orden</td>
                <td style="padding:10px 16px;font-size:15px;font-weight:800;color:#14532d;text-align:right;">$${serverTotal.toLocaleString("es-CL")}</td>
              </tr>
            </table>

            <p style="font-size:12px;color:#9ca3af;margin:0;">
              <a href="${APP_URL}/admin/dashboard" style="color:#14532d;">Ver en el dashboard →</a>
            </p>
          </div>
        `,
      })
    } catch (adminEmailError) {
      console.error("Error enviando email al admin:", adminEmailError)
    }

    return { success: true, orderId }
  } catch (error: any) {
    console.error("Error al guardar datos de checkout:", error)
    return { success: false, error: "Error al procesar la orden. Por favor intenta nuevamente." }
  }
}

export async function createUserProfile(userData: {
  email: string
  password: string
  fullName: string
  phone: string
  bankName: string
  accountType: string
  accountNumber: string
  rut: string
}) {
  try {
    const supabase = await createSupabaseClientWithCookies()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })

    if (authError) return { success: false, error: authError.message }
    if (!authData.user) return { success: false, error: "No se pudo crear el usuario" }

    const { error: profileError } = await supabase.from("customers").insert({
      id: authData.user.id,
      email: userData.email,
      full_name: userData.fullName,
      phone: userData.phone,
      created_at: new Date().toISOString(),
    })

    if (profileError) return { success: false, error: "Error al crear el perfil del usuario" }

    const { error: bankError } = await supabase.from("bank_accounts").insert({
      customer_id: authData.user.id,
      bank_name: userData.bankName,
      account_type: userData.accountType,
      account_number: userData.accountNumber,
      rut: userData.rut,
      created_at: new Date().toISOString(),
    })

    if (bankError) return { success: false, error: "Error al crear la cuenta bancaria" }

    return { success: true, user: authData.user }
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido" }
  }
}

export async function signInUser(email: string, password: string) {
  try {
    const supabase = await createSupabaseClientWithCookies()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    return { success: true, user: data.user }
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido" }
  }
}

export async function verifyCartStock(cartItems: { productId: number; quantity: number; size: string; productName?: string }[]) {
  try {
    const supabase = await createSupabaseClientWithCookies()
    const productIds = cartItems.map(i => i.productId)
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, stock")
      .in("id", productIds)

    if (error || !products) return { success: false, error: "No se pudo verificar el stock" }

    const outOfStock: string[] = []
    for (const item of cartItems) {
      const product = products.find((p: { id: number; name: string; stock: Record<string, number> }) => p.id === item.productId)
      const available = product?.stock?.[item.size] ?? 0
      if (item.quantity > available) {
        const label = item.productName || product?.name || `Producto ${item.productId}`
        outOfStock.push(available === 0 ? `${label} (talla ${item.size}) está agotado` : `${label} (talla ${item.size}): solo quedan ${available} unidades`)
      }
    }

    if (outOfStock.length > 0) return { success: false, outOfStock }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || "Error al verificar stock" }
  }
}

export async function updateProductStock(cartItems: any[]) {
  try {
    const admin = createSupabaseAdminClient()

    for (const item of cartItems) {
      const size = item.size

      const { data: productData, error: fetchError } = await admin
        .from("products")
        .select("stock")
        .eq("id", item.productId)
        .single()

      if (fetchError || !productData) {
        return { success: false, error: `Error al obtener stock del producto ${item.productId}` }
      }

      const currentStock = productData.stock || {}
      const availableStock = currentStock[size] ?? 0

      if (availableStock < item.quantity) {
        return {
          success: false,
          error: `Stock insuficiente para ${item.product?.name ?? item.productId} (talla ${size})`,
        }
      }

      const newStockValue = availableStock - item.quantity
      const updatedStock = { ...currentStock, [size]: newStockValue }

      // Optimistic locking: solo actualiza si sigue habiendo stock suficiente
      const { error: updateError, count } = await admin
        .from("products")
        .update({ stock: updatedStock })
        .eq("id", item.productId)
        .gte(`stock->>${size}`, item.quantity)
        .select()

      if (updateError) {
        return { success: false, error: `Error al actualizar stock del producto ${item.productId}` }
      }

      if (count === 0) {
        return {
          success: false,
          error: `Stock agotado para ${item.product?.name ?? item.productId} (talla ${size}). Otro cliente compró el último.`,
        }
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar stock" }
  }
}
