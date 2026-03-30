"use server"

import { createSupabaseClientWithCookies } from "@/utils/supabase/server"
import type { CheckoutFormData } from "@/types/checkout"
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cashbak.cl"
const EMAIL_FROM = process.env.EMAIL_FROM || "support@cashbak.cl"

export async function saveCheckoutData(
  _formData: CheckoutFormData,
  cartItems: any[],
  cartTotal: number,
  cashbakTotal: number,
  deliveryType: string
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
      .select("id, price, stock")
      .in("id", productIds)

    if (productsError || !dbProducts) {
      return { success: false, error: "No se pudieron verificar los productos" }
    }

    for (const item of cartItems) {
      const dbProduct = dbProducts.find((p: { id: number; price: number; stock: Record<string, number> }) => p.id === item.productId)
      if (!dbProduct) {
        return { success: false, error: `Producto ${item.productId} no encontrado` }
      }
      if (dbProduct.price !== item.product?.price) {
        return {
          success: false,
          error: `El precio de "${item.product?.name}" ha cambiado. Por favor, actualiza tu carrito.`,
        }
      }
    }

    // 5. Crear orden
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        order_total: cartTotal,
        cashback_amount: cashbakTotal,
        order_status: "completed",
        payment_status: "paid",
        shipping_method: deliveryType,
      })
      .select("id")
      .single()

    if (orderError || !orderData) {
      return { success: false, error: "Error al crear la orden" }
    }

    const orderId = orderData.id

    // 6. Insertar items
    const orderItems = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.productId.toString(),
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      bet_option_id: item.betOptionId,
      bet_name: item.betName,
      cashback_percentage: item.cashbakPercentage,
      order_id_client: item.order_id,
      bet_amount: item.bet_amount,
      size: item.size,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      return { success: false, error: "Error al guardar los items de la orden" }
    }

    // 7. Enviar email de confirmacion (fallo no bloquea el flujo)
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email!,
        subject: `¡Gracias por tu compra! Pedido #${orderId}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px; text-align: center;">
            <img src="${APP_URL}/img/logo.png" alt="CashBak Logo" style="max-width: 150px; margin-bottom: 30px;" />
            <div style="background-color: white; padding: 30px; border-radius: 10px; display: inline-block; max-width: 600px; text-align: left;">
              <h2 style="color: #333;">¡Gracias por tu compra!</h2>
              <p style="color: #555;">Hemos recibido tu pedido exitosamente.</p>
              <p style="font-size: 18px; margin: 20px 0;">
                <strong>Número de pedido:</strong>
                <span style="color: #1c7ed6;">${orderId}</span>
              </p>
              <p>Te avisaremos cuando tu pedido esté en camino.</p>
              <br/>
              <p style="font-size: 14px; color: #888;">Equipo CashBak</p>
            </div>
          </div>
        `,
      })
    } catch (emailError) {
      console.error("Error enviando email de confirmación (no crítico):", emailError)
      // No retornamos error — la orden se creó correctamente
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
    const supabase = await createSupabaseClientWithCookies()

    for (const item of cartItems) {
      const size = item.size

      // Leer el stock actual
      const { data: productData, error: fetchError } = await supabase
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

      // Actualizar solo si el stock sigue siendo el mismo que leimos (optimistic locking)
      const { error: updateError, count } = await supabase
        .from("products")
        .update({ stock: updatedStock })
        .eq("id", item.productId)
        .gte(`stock->>${size}`, item.quantity) // Solo actualiza si hay stock suficiente aun
        .select()

      if (updateError) {
        return { success: false, error: `Error al actualizar stock del producto ${item.productId}` }
      }

      // Si count === 0, otro proceso ya redujo el stock (race condition detectada)
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
