import type { Product } from "@/types/product"
import type { Bet } from "@/context/bet-context"

const COMISION_PLATAFORMA = 20 / 100  // 20% del fondo cashback (gananciaBruta - margenVendedor)
const COMISION_MAXIMA_PCT = 0.035     // máximo 3.5% del precio de venta
const CASHBACK_MINIMO = 0.10          // 10% mínimo de cashback ofrecido
const CASHBACK_RECOMENDADO = 0.15     // 15% cashback recomendado
const CUOTA_MINIMA = 1.5              // cuota mínima considerada
const TARIFA_PROCESAMIENTO = 0.02     // 2% tarifa de procesamiento de pago (Transbank)

export interface ExternalCashbakResult {
  viable: boolean
  cashbackPct: number         // % que recibe el cliente si la apuesta gana
  cashbackMonto: number       // CLP que recibe el cliente si la apuesta gana
  montoApuesta: number        // CLP que se apuesta en DB (capado por cuota)
  comisionPlataforma: number  // CLP comisión total en DB (fija + exceso por cuota alta)
  // Valores para mostrar en UI (no varían con la cuota)
  comisionDisplay: number     // Comisión fija: 20% fondoBruto (mín 1% precio)
  montoApuestaDisplay: number // Seguro CashBak: fondoBruto - comisionFija
  margenVendedor: number      // CLP garantizados para el vendedor (bruto)
  tarifaProcesamiento: number // CLP tarifa de procesamiento de pago (2%)
  margenVendedorNeto: number  // CLP neto para el vendedor (margen - tarifa procesamiento)
  gananciaNeta: number        // CLP neta por venta (igual en ambos escenarios)
  margenVendedorMaxPct: number    // % máximo para que exista cashback mínimo
  margenVendedorMaxMonto: number  // en CLP
  margenRecomendadoPct: number    // % recomendado para cashbacks atractivos
  margenRecomendadoMonto: number  // en CLP
}

/**
 * Calcula el cashback que se puede ofrecer para un producto externo.
 *
 * Mecánica (basada en precio de venta, costo es solo ilustrativo):
 *  margenVendedor = margenVendedorPct × precioVenta   (lo que el vendedor se lleva)
 *  fondoBruto     = precioVenta - margenVendedor       (diferencia entre precio y ganancia del vendedor)
 *  comisión       = 20% × fondoBruto  (mín 1% del precio, máx 3.5% del precio)
 *  montoApuesta   = fondoBruto - comisión              (financia el cashback)
 *  cashback       = montoApuesta × cuota
 *
 *  El costo NO afecta los cálculos. Solo se usa para mostrar ganancia neta ilustrativa.
 */
export function calculateExternalCashbak(params: {
  precioVenta: number
  costo: number          // solo ilustrativo
  cuota: number
  margenVendedorPct: number // % del precio de venta que se lleva el vendedor
}): ExternalCashbakResult {
  const { precioVenta, costo, cuota, margenVendedorPct } = params

  const margenVendedor = margenVendedorPct * precioVenta
  const fondoBruto = Math.max(0, precioVenta - margenVendedor)

  // Comisión: 20% del fondoBruto, mínimo 1% del precio, máximo 3% del precio
  // Si el 20% supera el 3%, el exceso va al montoApuesta (más cashback)
  const comisionBase = COMISION_PLATAFORMA * fondoBruto
  const comisionMinima = 0.01 * precioVenta
  const comisionMaxima = COMISION_MAXIMA_PCT * precioVenta
  const comisionPlataforma = Math.max(comisionMinima, Math.min(comisionBase, comisionMaxima))

  const montoApuestaCalculado = Math.max(0, fondoBruto - comisionPlataforma)

  // Si la cuota es tan alta que con menos monto ya se cubre el 100% de cashback,
  // reducimos montoApuesta al máximo necesario y el exceso va a comisión.
  const montoApuestaMaximo = cuota > 0 ? precioVenta / cuota : montoApuestaCalculado
  const montoApuesta = Math.min(montoApuestaCalculado, montoApuestaMaximo)
  const excesoComision = montoApuestaCalculado - montoApuesta
  const comisionTotal = comisionPlataforma + excesoComision

  // Helper: dado un montoApuesta objetivo, calcula el fondoBruto necesario
  // considerando si aplica el cap de comisión o el 20% estándar
  const fondoBrutoParaMonto = (targetMonto: number): number => {
    const fondoSinCap = targetMonto / (1 - COMISION_PLATAFORMA)
    const comisionSinCap = COMISION_PLATAFORMA * fondoSinCap
    const comisionMax = COMISION_MAXIMA_PCT * precioVenta
    // Si sin cap la comisión no supera el máximo, usar fórmula estándar
    if (comisionSinCap <= comisionMax) return fondoSinCap
    // Si el cap aplica: fondoBruto = targetMonto + comisionMaxima
    return targetMonto + comisionMax
  }

  // Margen máximo para dar cashback mínimo (10% a cuota 1.5)
  const montoApuestaMinimo = (CASHBACK_MINIMO * precioVenta) / CUOTA_MINIMA
  const margenVendedorMaxMonto = precioVenta - fondoBrutoParaMonto(montoApuestaMinimo)
  const margenVendedorMaxPct = margenVendedorMaxMonto / precioVenta

  // Margen recomendado para dar cashback de 15% a cuota 1.5
  const montoApuestaRecomendado = (CASHBACK_RECOMENDADO * precioVenta) / CUOTA_MINIMA
  const margenRecomendadoMonto = precioVenta - fondoBrutoParaMonto(montoApuestaRecomendado)
  const margenRecomendadoPct = margenRecomendadoMonto / precioVenta

  const cashbackMonto = Math.round(montoApuesta * cuota)
  const cashbackPct = Math.min(100, Math.floor((cashbackMonto / precioVenta) * 100))
  const viable = true
  const tarifaProcesamiento = Math.round(TARIFA_PROCESAMIENTO * precioVenta)

  return {
    viable,
    cashbackPct,
    cashbackMonto,
    montoApuesta: Math.round(montoApuesta),
    comisionPlataforma: Math.round(comisionTotal),
    comisionDisplay: Math.round(comisionPlataforma),
    montoApuestaDisplay: Math.round(montoApuestaCalculado),
    margenVendedor: Math.round(margenVendedor),
    tarifaProcesamiento,
    margenVendedorNeto: Math.round(margenVendedor) - tarifaProcesamiento,
    gananciaNeta: Math.round(margenVendedor - tarifaProcesamiento - costo),  // margen - 2% Transbank - costo
    margenVendedorMaxPct,
    margenVendedorMaxMonto: Math.round(margenVendedorMaxMonto),
    margenRecomendadoPct,
    margenRecomendadoMonto: Math.round(margenRecomendadoMonto),
  }
}

const MARGEN_TIENDA_OFICIAL = 0.25  // margen neto por defecto para productos de CashBak

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