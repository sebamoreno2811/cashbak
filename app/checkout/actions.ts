"use server"

import { createSupabaseClientWithCookies, createSupabaseAdminClient } from "@/utils/supabase/server"
import type { CheckoutFormData } from "@/types/checkout"
import { checkAuthRateLimit } from "@/lib/rate-limit"

/**
 * Verifica que una orden ya haya sido creada server-side para el buyOrder dado.
 * Reemplaza la antigua saveCheckoutData que creaba la orden desde el cliente — eso ahora
 * vive exclusivamente en /api/webpay/commit con validación contra Transbank.
 */
export async function verifyOrderCreated(buyOrder: string): Promise<{ exists: boolean; orderId?: string }> {
  const supabase = await createSupabaseClientWithCookies()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { exists: false }

  const admin = createSupabaseAdminClient()
  const { data } = await admin
    .from("order_items")
    .select("order_id, orders!inner(customer_id)")
    .eq("order_id_client", buyOrder)
    .limit(1)
    .maybeSingle()

  if (!data) return { exists: false }
  const ownerId = (data as any).orders?.customer_id
  if (ownerId && ownerId !== user.id) {
    console.warn("[verifyOrderCreated] buyOrder pertenece a otro usuario", buyOrder)
    return { exists: false }
  }
  return { exists: true, orderId: data.order_id }
}

/**
 * @deprecated La creación de la orden ahora sucede server-side en /api/webpay/commit
 * después de un tx.commit() autorizado por Transbank. Esta función queda como stub
 * para evitar romper imports antiguos durante el rollout — devuelve siempre error.
 */
export async function saveCheckoutData(
  _formData: CheckoutFormData,
  _cartItems: any[],
  _cartTotal: number,
  _cashbakTotal: number,
  _deliveryType: string,
  _shippingCost: number = 0
) {
  console.error("[saveCheckoutData] llamada deprecada — la orden se crea desde /api/webpay/commit")
  return { success: false, error: "Flujo deprecado: la orden se crea desde el commit de Webpay." }
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
    // Rate limit por IP — previene spam de signups y abuso del bucket de Supabase Auth.
    const { success: rlOk } = await checkAuthRateLimit("signup")
    if (!rlOk) {
      return { success: false, error: "Demasiados intentos. Espera unos minutos antes de intentarlo de nuevo." }
    }

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
    // Rate limit por IP — defensa contra credential stuffing.
    const { success: rlOk } = await checkAuthRateLimit("signin")
    if (!rlOk) {
      return { success: false, error: "Demasiados intentos. Espera unos minutos antes de intentarlo de nuevo." }
    }

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
