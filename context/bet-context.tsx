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
  date: string
  active: boolean
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

    const { data, error } = await supabase
      .from("bets")
      .select("*")
      .order("date", { ascending: true })

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
