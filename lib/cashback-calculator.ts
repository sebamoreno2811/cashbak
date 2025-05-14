/**
 * Calculates the cashback percentage based on the selected option and product category
 *
 * @param option - The selected option value (1-4)
 * @param category - The product category (1-3)
 * @returns The calculated cashback percentage
 */
// Función para calcular descuento basado en cuota y margen

import { bets } from "@/lib/bets"

export function descuentoSegunCuota(cuota: number, margen: number): number {
  const resultado = 0.6 * margen * cuota - margen
  return Math.min(1, Math.max(0, resultado))
}

// Función para calcular cashback basado en opción y categoría
export function calculateCashback(option: number, category: number): number {
  // Define cuota basada en la opción
  const bet = bets.find((b) => b.id === option)
  const cuota = bet?.odd ?? 0 // Si no se encuentra, usar 0

  // Define margen basado en la categoría
  let margen = 0
  switch (category) {
    case 1:
      margen = 0.57
      break
    case 2:
      margen = 0.5625
      break
    case 3:
      margen = 0.6
      break
    default:
      margen = 0
  }

  // Calcular cashback usando la función descuentoSegunCuota
  return Math.floor(descuentoSegunCuota(cuota, margen) * 100)
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