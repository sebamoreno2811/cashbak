"use server"

import { createServerClient } from "@/utils/supabase/server"
import type { CheckoutFormData } from "@/types/checkout"
import { revalidatePath } from "next/cache"

// Modificar la función saveCheckoutData para que no redirija automáticamente
// y solo guarde los datos en Supabase

export async function saveCheckoutData(
  formData: CheckoutFormData,
  cartItems: any[],
  cartTotal: number,
  cashbackTotal: number,
) {
  try {
    console.log("Iniciando guardado de datos de checkout:", formData)

    // Usar createServerClient para evitar problemas con las cookies
    const supabase = createServerClient()

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

    // Insertar cliente
    let customerId: string
    try {
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
            ignoreDuplicates: false,
          },
        )
        .select("id")
        .single()

      if (customerError) {
        console.error("Error al guardar cliente:", customerError)
        return { success: false, error: `Error al guardar cliente: ${customerError.message}` }
      }

      if (!customerData || !customerData.id) {
        // Si no se devolvió un ID, intentar obtener el cliente existente por email
        const { data: existingCustomer, error: fetchError } = await supabase
          .from("customers")
          .select("id")
          .eq("email", formData.email)
          .single()

        if (fetchError || !existingCustomer) {
          console.error("No se pudo obtener el ID del cliente:", fetchError)
          return { success: false, error: "No se pudo obtener el ID del cliente" }
        }

        customerId = existingCustomer.id
      } else {
        customerId = customerData.id
      }

      console.log("Cliente guardado/recuperado:", customerId)
    } catch (customerErr: any) {
      console.error("Error en operación de cliente:", customerErr)
      return { success: false, error: `Error en operación de cliente: ${customerErr.message}` }
    }

    // Insertar cuenta bancaria
    try {
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
            ignoreDuplicates: false,
          },
        )
        .select()

      if (bankError) {
        console.error("Error al guardar cuenta bancaria:", bankError)
        return { success: false, error: `Error al guardar cuenta bancaria: ${bankError.message}` }
      }

      console.log("Cuenta bancaria guardada:", bankData)
    } catch (bankErr: any) {
      console.error("Error en operación de cuenta bancaria:", bankErr)
      return { success: false, error: `Error en operación de cuenta bancaria: ${bankErr.message}` }
    }

    // Crear orden
    let orderId: string
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          order_total: cartTotal,
          cashback_amount: cashbackTotal,
          order_status: "completed", // Cambiado de "pending" a "completed" ya que el pago ya fue exitoso
          payment_status: "paid", // Cambiado de "pending" a "paid" ya que el pago ya fue exitoso
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
