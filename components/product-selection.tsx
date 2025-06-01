"use client"
import { useState } from "react"
import { calculatecashbak } from "@/lib/cashbak-calculator"
import BetSelector from "./bet-selector"
import { useBetOption } from "@/hooks/use-bet-option"

export function ProductSelection() {
  const { selectedOption, setSelectedOption } = useBetOption()
  const [product, setProduct] = useState<any>(null)
  const [cashbak, setcashbak] = useState(0)

  const handleOptionChange = (value: string) => {
    setSelectedOption(value)

    // Update cashbak display
    const cashbakDisplay = document.getElementById("cashbak-display")
    if (cashbakDisplay) {
      cashbakDisplay.textContent = "Calculando CashBak..."

      // Get current slide
      const sliderContainer = document.querySelector("[data-porcentaje]")
      const slideCategory = sliderContainer
        ? Number.parseInt(sliderContainer.getAttribute("data-porcentaje") || "1")
        : 1

      // Calculate cashbak after a small delay
      setTimeout(() => {
        const cashbak = Math.trunc(calculatecashbak(Number.parseFloat(value), slideCategory))
        cashbakDisplay.textContent = `CashBak del: ${Math.trunc(cashbak)}%`
      }, 500)
    }
  }

  return (
    <div className="mb-6">
      <label htmlFor="option-select" className="block mb-2 text-xl font-bold">
        Selecciona tu promoción de CashBak:
      </label>
      <BetSelector value={selectedOption} onChange={handleOptionChange} />
    </div>
  )
}

export default ProductSelection
