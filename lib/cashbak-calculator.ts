import type { Product } from "@/types/product"
import type { Bet } from "@/context/bet-context"

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

  console.log(`cuota: ${bet?.id ?? 30}`)
  console.log(`priceAndCost: ${price}`)
  console.log(`cashbak: ${cashbak}`)

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