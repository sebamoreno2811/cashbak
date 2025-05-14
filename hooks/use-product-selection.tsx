"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type ProductSelectionContextType = {
  selectedOption: string
  setSelectedOption: (option: string) => void
}

const ProductSelectionContext = createContext<ProductSelectionContextType | undefined>(undefined)

export function ProductSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedOption, setSelectedOption] = useState("1")

  return (
    <ProductSelectionContext.Provider value={{ selectedOption, setSelectedOption }}>
      {children}
    </ProductSelectionContext.Provider>
  )
}

export function useProductSelection() {
  const context = useContext(ProductSelectionContext)
  if (context === undefined) {
    throw new Error("useProductSelection must be used within a ProductSelectionProvider")
  }
  return context
}
