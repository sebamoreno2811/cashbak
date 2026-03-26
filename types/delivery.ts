export type DeliveryOption = {
  id: string
  name: string
  price: number
  priceTBD?: boolean   // true = "por pagar" (costo se coordina por separado)
  type: "delivery" | "pickup"
}
