"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect } from "react"
import { useBetOption } from "@/hooks/use-bet-option"
import { useBets } from "@/context/bet-context"

type BetSelectorProps = {
  value: string
  onChange: (value: string) => void
}

export default function BetSelector({ value, onChange }: BetSelectorProps) {
  const { selectedOption, setSelectedOption } = useBetOption()
  const { bets, loading } = useBets()

  const activeBets = bets.filter((bet) => bet.active)
  const minIdBet = activeBets.reduce((min, bet) => (bet.id < min.id ? bet : min), activeBets[0])

  // Si no hay valor seleccionado, setear el mínimo id al cargar
  useEffect(() => {
    if (!value && minIdBet) {
      onChange(minIdBet.id.toString())
    }
  }, [value, minIdBet, onChange])

  if (loading) {
    return (
      <div className="mb-6 text-sm text-gray-500">
        Cargando opciones de eventos...
      </div>
    )
  }

  return (
    <div className="mb-6">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecciona una opción" />
        </SelectTrigger>
        <SelectContent>
          {activeBets.map((bet) => (
            <SelectItem key={bet.id} value={bet.id.toString()}>
              {bet.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
