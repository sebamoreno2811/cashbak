"use client"
import BetSelector from "./bet-selector"
import { useBetOption } from "@/hooks/use-bet-option"
import { useProducts } from "@/context/product-context"
import { calculateProductCashbak } from "@/lib/cashbak-calculator"
import type { Bet } from "@/context/bet-context"

export function ProductSelection() {
  const { selectedOption, setSelectedOption } = useBetOption()
  const { products } = useProducts()

  const getCashbackRange = (bet: Bet) => {
    if (products.length === 0) return null
    const values = products
      .map((p) => calculateProductCashbak(p, bet.odd))
      .filter((v) => v > 0)
    if (values.length === 0) return null
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  return (
    <div>
      <BetSelector
        value={selectedOption}
        onChange={setSelectedOption}
        getCashbackRange={getCashbackRange}
      />
    </div>
  )
}

export default ProductSelection
