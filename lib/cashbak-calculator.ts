import type { Product } from "@/types/product"
import type { Bet } from "@/context/bet-context"

const COMISION_PLATAFORMA = 20 / 100  // 20% del fondo cashback (gananciaBruta - margenVendedor)
const CASHBACK_MINIMO = 0.10          // 10% mínimo de cashback ofrecido
const CASHBACK_RECOMENDADO = 0.25     // 25% cashback recomendado
const CUOTA_MINIMA = 1.5              // cuota mínima considerada

export interface ExternalCashbakResult {
  viable: boolean
  cashbackPct: number         // % que recibe el cliente si la apuesta gana
  cashbackMonto: number       // CLP que recibe el cliente si la apuesta gana
  montoApuesta: number        // CLP que se apuesta (costo fijo por venta)
  comisionPlataforma: number  // CLP garantizados para CashBak
  margenVendedor: number      // CLP garantizados para el vendedor
  gananciaNeta: number        // CLP neta por venta (igual en ambos escenarios)
  margenVendedorMaxPct: number    // % máximo para que exista cashback mínimo
  margenVendedorMaxMonto: number  // en CLP
  margenRecomendadoPct: number    // % recomendado para cashbacks atractivos
  margenRecomendadoMonto: number  // en CLP
}

/**
 * Calcula el cashback que se puede ofrecer para un producto externo.
 *
 * Mecánica:
 *  fondoBruto    = gananciaBruta - margenVendedor   (el vendedor no toca esto)
 *  comisión      = 20% × fondoBruto                 (sale del fondo, no del vendedor)
 *  fondoNeto     = fondoBruto × 80%                 (financia el cashback)
 *  cashback      = fondoNeto × cuota
 */
export function calculateExternalCashbak(params: {
  precioVenta: number
  costo: number
  cuota: number
  margenVendedorPct: number // ej: 0.20 = 20% del precio de venta
}): ExternalCashbakResult {
  const { precioVenta, costo, cuota, margenVendedorPct } = params

  const gananciaBruta = precioVenta - costo
  const margenVendedor = margenVendedorPct * precioVenta
  const fondoBruto = Math.max(0, gananciaBruta - margenVendedor)

  // Comisión: 20% del fondoBruto, con mínimo del 2% del margen bruto
  const comisionBase = COMISION_PLATAFORMA * fondoBruto
  const comisionMinima = 0.02 * gananciaBruta
  const comisionPlataforma = Math.max(comisionBase, comisionMinima)

  const montoApuesta = Math.max(0, fondoBruto - comisionPlataforma)

  const montoApuestaMinimo = (CASHBACK_MINIMO * precioVenta) / CUOTA_MINIMA
  const margenVendedorMaxMonto = gananciaBruta - montoApuestaMinimo / (1 - COMISION_PLATAFORMA)
  const margenVendedorMaxPct = margenVendedorMaxMonto / precioVenta

  const montoApuestaRecomendado = (CASHBACK_RECOMENDADO * precioVenta) / CUOTA_MINIMA
  const margenRecomendadoMonto = gananciaBruta - montoApuestaRecomendado / (1 - COMISION_PLATAFORMA)
  const margenRecomendadoPct = margenRecomendadoMonto / precioVenta

  // Siempre calcula cashback real (mínimo 0)
  const cashbackMonto = Math.round(montoApuesta * cuota)
  const cashbackPct = Math.min(100, Math.floor((cashbackMonto / precioVenta) * 100))
  const viable = montoApuesta >= montoApuestaMinimo

  return {
    viable,
    cashbackPct,
    cashbackMonto,
    montoApuesta: Math.round(montoApuesta),
    comisionPlataforma: Math.round(comisionPlataforma),
    margenVendedor: Math.round(margenVendedor),
    gananciaNeta: 0,
    margenVendedorMaxPct,
    margenVendedorMaxMonto: Math.round(margenVendedorMaxMonto),
    margenRecomendadoPct,
    margenRecomendadoMonto: Math.round(margenRecomendadoMonto),
  }
}

const MARGEN_TIENDA_OFICIAL = 0.40  // margen neto por defecto para productos de CashBak

/**
 * Calcula el cashback de un producto usando la fórmula unificada.
 * Si el producto no tiene margin_pct definido, asume 40% (tienda oficial CashBak).
 */
export function calculateProductCashbak(
  product: Product,
  cuota: number,
  hasPrint = false
): number {
  if (cuota <= 0) return 0
  const price = hasPrint ? product.price + 2990 : product.price
  const cost = hasPrint ? product.cost + 2500 : product.cost
  const margenVendedorPct = product.margin_pct ?? MARGEN_TIENDA_OFICIAL
  const result = calculateExternalCashbak({ precioVenta: price, costo: cost, cuota, margenVendedorPct })
  return result.cashbackPct
}

/**
 * Retorna el máximo cashback posible para un producto con los eventos activos.
 */
export function calculateMaxProductCashbak(
  product: Product,
  bets: Bet[],
  hasPrint = false
): number {
  const active = getAllBettingOptions(bets)
  if (active.length === 0) return 0
  return Math.max(...active.map(id => {
    const bet = bets.find(b => b.id === id)
    return bet ? calculateProductCashbak(product, bet.odd, hasPrint) : 0
  }))
}

function getPricesAndCostsByCategory(category: number, products: Product[] = []): { price: number, cost: number } | undefined {
  if (!products || products.length === 0) return undefined

  const categoryIndex = category - 1
  const categories = [...new Set(products.map((p) => p.category))]
  const selectedCategory = categories[categoryIndex]
  const product = products.find((p) => p.category === selectedCategory)

  if (!product) return undefined

  return { price: product.price, cost: product.cost }
}

function descuentoSegunCuota(cuota: number, precioVenta: number, precioCompra: number, hasPrint: boolean = false): number {
  const margen = hasPrint ?  (precioCompra * 0.4) / (precioCompra + 2500) : 0.4;
  const resultado = (cuota / precioVenta) * (precioVenta - precioCompra - (0.4 * precioCompra))
  const resultado2 = (cuota / precioVenta) * (precioVenta - precioCompra - (margen * precioCompra))
  return Math.min(1, Math.max(0, resultado2))
}

export function calculatecashbak(
  option: number,
  category: number,
  products: Product[] = [],
  bets: Bet[] = [],
  hasPrint: boolean = false
): number {
  const bet = bets.find((b) => b.id === option)
  const cuota = bet?.odd ?? 0

  const priceAndCost = getPricesAndCostsByCategory(category, products)
  if (!priceAndCost) return 0

  let { price, cost } = priceAndCost

  if (hasPrint) {
    price += 2990
    cost += 2500
  }

  const cashbak = descuentoSegunCuota(cuota, price, cost, hasPrint)
  return Math.floor(cashbak * 100)
}


export function calcularMontoApostar(option: number, category: number, products: Product[] = [], bets: Bet[] = [], hasPrint: boolean = false): number {
  const bet = bets.find((b) => b.id === option)
  const cuota = bet?.odd ?? 0

  const priceAndCost = getPricesAndCostsByCategory(category, products)
  if (!priceAndCost) return 0

  let { price, cost } = priceAndCost

  if (hasPrint) {
    price += 2990
    cost += 2500
  }

  const cashbak = descuentoSegunCuota(cuota, price, cost, hasPrint)

  return ((cashbak) * price) / cuota
}

export function getAllBettingOptions(bets: Bet[]): number[] {
  const nowChile = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Santiago",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .format(new Date())
      .replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, "$3-$1-$2T$4:$5:$6")
  )

  return bets
    .filter((bet) => new Date(bet.end_date) > nowChile)
    .map((bet) => bet.id)
}



export function calculateMaxcashbak(category: number, products: Product[] = [], bets: Bet[] = []): number {
  const options = getAllBettingOptions(bets)
  const cashbaks = options.map((option) => calculatecashbak(option, category, products, bets))
  return Math.max(...cashbaks)
}