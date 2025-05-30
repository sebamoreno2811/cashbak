"use server"

import { createSupabaseClientWithCookies } from "@/utils/supabase/server"
import type { CheckoutFormData } from "@/types/checkout"

export async function saveCheckoutData(
  formData: CheckoutFormData,
  cartItems: any[],
  cartTotal: number,
  cashbackTotal: number,
) {
  try {
    console.log("Iniciando guardado de datos de checkout:", formData)

    const supabase = await createSupabaseClientWithCookies()

    // Verificar la conexión a Supabase
    try {
      const { data: connectionTest, error: connectionError } = await supabase.from("customers").select("count").limit(1)

      if (connectionError) {
        console.error("Error de conexión a Supabase:", connectionError)
        return { success: false, error: `Error de conexión a la base de datos: ${connectionError.message}` }
      }

      console.log("Conexión a Supabase exitosa:", connectionTest)
    } catch (connError: any) {
      console.error("Error al verificar conexión:", connError)
      return { success: false, error: `Error al verificar conexión: ${connError.message}` }
    }

    // Obtener el usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error al obtener usuario:", userError)
      return { success: false, error: "Usuario no autenticado" }
    }

    const { data: profile } = await supabase
      .from("customers")
      .select("*")
      .eq("email", user.email)
      .single()

    const customerId = profile.id
    console.log("Usuario autenticado:", customerId)

    // Crear orden directamente con el ID del usuario autenticado
    let orderId: string
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          order_total: cartTotal,
          cashback_amount: cashbackTotal,
          order_status: "completed",
          payment_status: "paid",
        })
        .select("id")
        .single()

      if (orderError) {
        console.error("Error al crear orden:", orderError)
        return { success: false, error: `Error al crear orden: ${orderError.message}` }
      }

      if (!orderData || !orderData.id) {
        console.error("No se pudo obtener el ID de la orden")
        return { success: false, error: "No se pudo obtener el ID de la orden" }
      }

      orderId = orderData.id
      console.log("Orden creada:", orderId)
    } catch (orderErr: any) {
      console.error("Error en operación de orden:", orderErr)
      return { success: false, error: `Error en operación de orden: ${orderErr.message}` }
    }

    // Insertar items de la orden
    try {
      const orderItems = cartItems.map((item) => ({
        order_id: orderId,
        product_id: item.productId.toString(),
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        bet_option_id: item.betOptionId,
        bet_name: item.betName,
        cashback_percentage: item.cashbackPercentage,
        order_id_client: item.order_id
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        console.error("Error al guardar items de la orden:", itemsError)
        return { success: false, error: `Error al guardar items de la orden: ${itemsError.message}` }
      }

      console.log("Items de la orden guardados")
    } catch (itemsErr: any) {
      console.error("Error en operación de items de orden:", itemsErr)
      return { success: false, error: `Error en operación de items de orden: ${itemsErr.message}` }
    }

    return { success: true, orderId }
  } catch (error: any) {
    console.error("Error al guardar datos de checkout:", error)
    return {
      success: false,
      error: `Error al procesar la orden: ${error.message || "Error desconocido"}. Por favor, intenta nuevamente.`,
    }
  }
}
//Error al procesar la orden: Cannot read properties of undefined (reading 'id'). Por favor, intenta nuevamente
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

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })

    if (authError) {
      console.error("Error al crear usuario:", authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "No se pudo crear el usuario" }
    }

    // Crear perfil del usuario
    const { error: profileError } = await supabase.from("customers").insert({
      id: authData.user.id,
      email: userData.email,
      full_name: userData.fullName,
      phone: userData.phone,
      created_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("Error al crear perfil:", profileError)
      return { success: false, error: "Error al crear el perfil del usuario" }
    }

    // Crear cuenta bancaria
    const { error: bankError } = await supabase.from("bank_accounts").insert({
      customer_id: authData.user.id,
      bank_name: userData.bankName,
      account_type: userData.accountType,
      account_number: userData.accountNumber,
      rut: userData.rut,
      created_at: new Date().toISOString(),
    })

    if (bankError) {
      console.error("Error al crear cuenta bancaria:", bankError)
      return { success: false, error: "Error al crear la cuenta bancaria" }
    }

    return { success: true, user: authData.user }
  } catch (error: any) {
    console.error("Error en createUserProfile:", error)
    return { success: false, error: error.message || "Error desconocido" }
  }
}

export async function signInUser(email: string, password: string) {
  try {
    const supabase = await createSupabaseClientWithCookies()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Error al iniciar sesión:", error)
      return { success: false, error: error.message }
    }

    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("Error en signInUser:", error)
    return { success: false, error: error.message || "Error desconocido" }
  }
}
