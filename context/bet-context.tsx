"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { createClient } from "@/utils/supabase/client"

export interface Bet {
  id: number
  name: string
  odd: number
  category: string
  end_date: string
  is_winner: boolean | null
}

interface BetContextType {
  bets: Bet[]
  loading: boolean
  error: string | null
  refreshBets: () => Promise<void>
}

const BetContext = createContext<BetContextType | undefined>(undefined)

export function BetProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBets = async () => {
    setLoading(true)
    setError(null) // Reinicia el error antes de cada fetch

    // Solo bets activos y cuyo end_date no haya pasado hace más de 3 horas
    const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from("bets")
      .select("*")
      .eq("active", true)
      .gt("end_date", cutoff)
      .order("end_date", { ascending: true })

    if (error) {
      console.error("Error fetching bets:", error)
      setError(error.message || "Error desconocido al cargar apuestas")
      setBets([])
    } else if (data) {
      setBets(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchBets()
  }, [])

  return (
    <BetContext.Provider value={{ bets, loading, error, refreshBets: fetchBets }}>
      {children}
    </BetContext.Provider>
  )
}

export function useBets() {
  const context = useContext(BetContext)
  if (!context) {
    throw new Error("useBets must be used within a BetProvider")
  }
  return context
}
