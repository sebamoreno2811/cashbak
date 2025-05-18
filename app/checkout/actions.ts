"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import type { CheckoutFormData } from "@/types/checkout"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function saveCheckoutData(
  formData: CheckoutFormData,
  cartItems: any[],
  cartTotal: number,
  cashbackTotal: number,
) {
  try {
    console.log("Iniciando guardado de datos de checkout:", formData)
    const supabase = createServerSupabaseClient()

    // Insertar cliente
    const customerResponse = await supabase
      .from("customers")
      .upsert(
        {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
        {
          onConflict: "email",
          returning: "representation",
        },
      )
      .select("id")
      .single()

    if (customerResponse.error) {
      console.error("Error al guardar cliente:", customerResponse.error)
      throw customerResponse.error
    }

    const customerId = customerResponse.data.id
    console.log("Cliente guardado:", customerId)

    // Insertar cuenta bancaria
    const bankResponse = await supabase
      .from("bank_accounts")
      .upsert(
        {
          customer_id: customerId,
          bank_name: formData.bankName,
          account_type: formData.accountType,
          account_number: Number.parseInt(formData.accountNumber),
          rut: formData.rut,
        },
        {
          onConflict: "customer_id, bank_name, account_number",
          returning: "representation",
        },
      )
      .select()

    if (bankResponse.error) {
      console.error("Error al guardar cuenta bancaria:", bankResponse.error)
      throw bankResponse.error
    }

    console.log("Cuenta bancaria guardada:", bankResponse.data)

    // Crear orden
    const orderResponse = await supabase
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

    if (orderResponse.error) {
      console.error("Error al crear orden:", orderResponse.error)
      throw orderResponse.error
    }

    const orderId = orderResponse.data.id
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

    const itemsResponse = await supabase.from("order_items").insert(orderItems)

    if (itemsResponse.error) {
      console.error("Error al guardar items de la orden:", itemsResponse.error)
      throw itemsResponse.error
    }

    console.log("Items de la orden guardados")

    revalidatePath("/checkout")
    return { success: true, orderId }
  } catch (error) {
    console.error("Error al guardar datos de checkout:", error)
    return { success: false, error: "Error al procesar la orden. Por favor, intenta nuevamente." }
  }
}

export async function processPayment(orderId: string) {
  // Aquí se implementaría la integración con el sistema de pagos
  // Por ahora, solo redirigimos a una página de éxito
  console.log("Procesando pago para la orden:", orderId)
  redirect("/checkout/success?orderId=" + orderId)
}
