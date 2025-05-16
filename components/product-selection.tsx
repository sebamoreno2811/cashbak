"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProductSelection } from "@/hooks/use-product-selection"
import { useState, useEffect } from "react"
import { calculateCashback } from "@/lib/cashback-calculator"
import BetSelector from "./bet-selector"
import { useBetOption } from "@/hooks/use-bet-option"


export function ProductSelection() {
  const { selectedOption, setSelectedOption } = useBetOption()
  const [product, setProduct] = useState<any>(null)
  const [cashback, setCashback] = useState(0)

  const handleOptionChange = (value: string) => {
    setSelectedOption(value)

    // Update cashback display
    const cashbackDisplay = document.getElementById("cashback-display")
    if (cashbackDisplay) {
      cashbackDisplay.textContent = "Calculando CashBak..."

      // Get current slide
      const sliderContainer = document.querySelector("[data-porcentaje]")
      const slideCategory = sliderContainer
        ? Number.parseInt(sliderContainer.getAttribute("data-porcentaje") || "1")
        : 1

      // Calculate cashback after a small delay
      setTimeout(() => {
      
        const cashback = Math.trunc(calculateCashback(Number.parseFloat(value), slideCategory))
        cashbackDisplay.textContent = `CashBak del: ${Math.trunc(cashback)}%`
      }, 500)
    }
  }

  return (
    <div className="mb-6">
      <label htmlFor="option-select" className="block mb-2 text-sm font-medium">
        Selecciona tu opción de CashBak:
      </label>
      <BetSelector value={selectedOption} onChange={handleOptionChange} />
    </div>
  )
}
