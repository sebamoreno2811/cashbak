"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Definir el tipo para el contexto
interface BetOptionContextType {
  selectedOption: string
  setSelectedOption: (option: string) => void
}

// Crear el contexto
const BetOptionContext = createContext<BetOptionContextType | undefined>(undefined)

// Proveedor del contexto
export function BetOptionProvider({ children }: { children: ReactNode }) {
  // Estado para la opción seleccionada, inicializado con "1" por defecto
  const [selectedOption, setSelectedOptionState] = useState<string>("1")

  // Cargar la opción guardada desde localStorage cuando el componente se monta
  useEffect(() => {
    const savedOption = localStorage.getItem("selectedBetOption")
    if (savedOption) {
      setSelectedOptionState(savedOption)
    }
  }, [])

  // Función para actualizar la opción seleccionada y guardarla en localStorage
  const setSelectedOption = (option: string) => {
    setSelectedOptionState(option)
    localStorage.setItem("selectedBetOption", option)
  }

  return <BetOptionContext.Provider value={{ selectedOption, setSelectedOption }}>{children}</BetOptionContext.Provider>
}

// Hook personalizado para usar el contexto
export function useBetOption(): BetOptionContextType {
  const context = useContext(BetOptionContext)
  if (context === undefined) {
    throw new Error("useBetOption must be used within a BetOptionProvider")
  }
  return context
}
