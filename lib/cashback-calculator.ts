/**
 * Calculates the cashback percentage based on the selected option and product category
 *
 * @param option - The selected option value (1-4)
 * @param category - The product category (1-3)
 * @returns The calculated cashback percentage
 */
// Función para calcular descuento basado en cuota y margen

import { bets } from "@/lib/bets"
import { products } from "@/lib/products"

function getPricesAndCostsByCategory(category: number): { price: number, cost: number } | undefined {
  const product = products.find(product => product.category === category)
  return product ? { price: product.price, cost: product.cost } : undefined
}

export function descuentoSegunCuota(cuota: number, precioVenta: number, precioCompra: number): number {
  //const resultado = 0.6 * margen * cuota - margen

  const resultado = (cuota / precioVenta) * (precioVenta - precioCompra - (0.4*precioCompra))
  return Math.min(1, Math.max(0, resultado))
}

// Función para calcular cashback basado en opción y categoría
export function calculateCashback(option: number, category: number): number {
  // Define cuota basada en la opción
  const bet = bets.find((b) => b.id === option)
  const cuota = bet?.odd ?? 0 // Si no se encuentra, usar 0

  // Define margen basado en la categoría
  const priceAndCost = getPricesAndCostsByCategory(category)
  const precioVenta = priceAndCost?.price ?? 0
  const precioCompra = priceAndCost?.cost ?? 0
  // Calcular cashback usando la función descuentoSegunCuota
  return Math.floor(descuentoSegunCuota(cuota,  precioVenta, precioCompra) * 100)
}

export function calcularMontoApostar(option: number, category: number): number {
  const bet = bets.find((b) => b.id === option)
  const cuota = bet?.odd ?? 0
  const priceAndCost = getPricesAndCostsByCategory(category)
  const precioVenta = priceAndCost?.price ?? 0
  const precioCompra = priceAndCost?.cost ?? 0
  const cashbak = descuentoSegunCuota(cuota,  precioVenta, precioCompra)
  return  ((cashbak * precioVenta)) / cuota  
}

// Obtener todas las opciones de apuesta disponibles
export function getAllBettingOptions(): number[] {
  return [1, 2, 3] // Opciones disponibles: 1, 2, 3
}

// Calcular el máximo cashback posible para una categoría de producto
export function calculateMaxCashback(category: number): number {
  const options = getAllBettingOptions()

  // Calcular cashback para todas las opciones y encontrar el máximo
  const cashbacks = options.map((option) => calculateCashback(option, category))
  return Math.max(...cashbacks)
}