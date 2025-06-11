"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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

  const availableBets = bets.filter(
    (bet) => new Date(bet.end_date) > nowChile
  )

  const groupedBets: Record<string, typeof availableBets> = availableBets.reduce((groups, bet) => {
    const category = bet.category || "Sin categoría"
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(bet)
    return groups
  }, {} as Record<string, typeof availableBets>)

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

  // Buscar la apuesta seleccionada para mostrar su nombre en SelectValue
  const selectedBet = bets.find((bet) => bet.id.toString() === value)

  return (
    <div className="mb-6">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecciona una opción">
            {selectedBet ? selectedBet.name : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedBets).map(([category, bets]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="px-3 text-sm font-medium">
                  {category}
                </AccordionTrigger>
                <AccordionContent>
                  {bets.map((bet) => (
                    <SelectItem
                      key={bet.id}
                      value={bet.id.toString()}
                      className="ml-3 border-b border-black last:border-b-0"
                    >
                      {bet.name}
                    </SelectItem>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SelectContent>
      </Select>
    </div>
  )
}
