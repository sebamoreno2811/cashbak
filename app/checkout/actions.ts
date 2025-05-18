"use server"

import { createClient } from "@/utils/supabase/server"
import type { CheckoutFormData } from "@/types/checkout"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export async function saveCheckoutData(
  formData: CheckoutFormData,
  cartItems: any[],
  cartTotal: number,
  cashbackTotal: number,
) {
  try {
    console.log("Iniciando guardado de datos de checkout:", formData)
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Verificar la conexión a Supabase
    const { data: connectionTest, error: connectionError } = await supabase.from("customers").select("count").limit(1)

    if (connectionError) {
      console.error("Error de conexión a Supabase:", connectionError)
      return { success: false, error: "Error de conexión a la base de datos. Por favor, intenta nuevamente." }
    }

    console.log("Conexión a Supabase exitosa:", connectionTest)

    // Insertar cliente
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .upsert(
        {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
        {
          onConflict: "email",
        },
      )
      .select("id")
      .single()

    if (customerError) {
      console.error("Error al guardar cliente:", customerError)
      return { success: false, error: `Error al guardar cliente: ${customerError.message}` }
    }

    if (!customerData || !customerData.id) {
      console.error("No se pudo obtener el ID del cliente")
      return { success: false, error: "No se pudo obtener el ID del cliente" }
    }

    const customerId = customerData.id
    console.log("Cliente guardado:", customerId)

    // Insertar cuenta bancaria
    const { data: bankData, error: bankError } = await supabase
      .from("bank_accounts")
      .upsert(
        {
          customer_id: customerId,
          bank_name: formData.bankName,
          account_type: formData.accountType,
          account_number: formData.accountNumber,
          rut: formData.rut,
        },
        {
          onConflict: "customer_id, bank_name, account_number",
        },
      )
      .select()

    if (bankError) {
      console.error("Error al guardar cuenta bancaria:", bankError)
      return { success: false, error: `Error al guardar cuenta bancaria: ${bankError.message}` }
    }

    console.log("Cuenta bancaria guardada:", bankData)

    // Crear orden
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        order_total: cartTotal,
        cashback_amount: cashbackTotal,
        order_status: "pending",
        payment_status: "pending",
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

    const orderId = orderData.id
    console.log("Orden creada:", orderId)

    // Insertar items de la orden
    const orderItems = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.productId.toString(),
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      bet_option_id: item.betOptionId,
      bet_name: item.betName,
      cashback_percentage: item.cashbackPercentage,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Error al guardar items de la orden:", itemsError)
      return { success: false, error: `Error al guardar items de la orden: ${itemsError.message}` }
    }

    console.log("Items de la orden guardados")

    revalidatePath("/checkout")
    return { success: true, orderId }
  } catch (error: any) {
    console.error("Error al guardar datos de checkout:", error)
    return {
      success: false,
      error: `Error al procesar la orden: ${error.message || "Error desconocido"}. Por favor, intenta nuevamente.`,
    }
  }
}

export async function processPayment(orderId: string) {
  // Aquí se implementaría la integración con el sistema de pagos
  // Por ahora, solo redirigimos a una página de éxito
  console.log("Procesando pago para la orden:", orderId)
  redirect("/checkout/success?orderId=" + orderId)
}
