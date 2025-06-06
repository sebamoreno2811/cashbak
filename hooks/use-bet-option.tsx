"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useBets } from "@/context/bet-context"

// Definir el tipo para el contexto
interface BetOptionContextType {
  selectedOption: string
  setSelectedOption: (option: string) => void
}

// Crear el contexto
const BetOptionContext = createContext<BetOptionContextType | undefined>(undefined)

// Proveedor del contexto
export function BetOptionProvider({ children }: { children: ReactNode }) {
  const { bets, loading } = useBets()
  const [selectedOption, setSelectedOptionState] = useState<string>("")

  // Establecer la opción seleccionada desde localStorage o desde la apuesta válida con menor ID
  useEffect(() => {
    if (loading) return

    const savedOption = localStorage.getItem("selectedBetOption")
    if (savedOption) {
      setSelectedOptionState(savedOption)
      return
    }

    // Calcular la hora actual en Chile
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

    const validBets = bets.filter((bet) => new Date(bet.end_date) > nowChile)

    if (validBets.length > 0) {
      const minIdBet = validBets.reduce((min, bet) => (bet.id < min.id ? bet : min))
      setSelectedOptionState(minIdBet.id.toString())
      localStorage.setItem("selectedBetOption", minIdBet.id.toString())
    }
  }, [bets, loading])

  // Función para actualizar la opción seleccionada y guardarla en localStorage
  const setSelectedOption = (option: string) => {
    setSelectedOptionState(option)
    localStorage.setItem("selectedBetOption", option)
  }

  return (
    <BetOptionContext.Provider value={{ selectedOption, setSelectedOption }}>
      {children}
    </BetOptionContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useBetOption(): BetOptionContextType {
  const context = useContext(BetOptionContext)
  if (context === undefined) {
    throw new Error("useBetOption must be used within a BetOptionProvider")
  }
  return context
}
