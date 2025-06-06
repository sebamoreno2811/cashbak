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

  // Obtener la hora actual en Chile en cada render
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
      .replace(
        /(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/,
        "$3-$1-$2T$4:$5:$6"
      )
  )

  // Apuestas cuya fecha de finalización es mayor a la hora actual
  const availableBets = bets.filter((bet) => new Date(bet.end_date) > nowChile)

  // Seleccionar automáticamente la opción con menor ID si no hay valor seleccionado
  useEffect(() => {
    if (!value && availableBets.length > 0) {
      const minIdBet = availableBets.reduce((min, bet) =>
        bet.id < min.id ? bet : min
      )
      onChange(minIdBet.id.toString())
    }
  }, [value, availableBets, onChange])

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
          {availableBets.map((bet) => (
            <SelectItem key={bet.id} value={bet.id.toString()}>
              {bet.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
