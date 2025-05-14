// components/bet-selector.tsx
"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { bets } from "@/lib/bets"

type BetSelectorProps = {
  value: string
  onChange: (value: string) => void
}

export default function BetSelector({ value, onChange }: BetSelectorProps) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-lg font-medium">Selecciona tu CashBak</h3>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecciona una opción" />
        </SelectTrigger>
        <SelectContent>
          {bets.map((bet) => (
            <SelectItem key={bet.id} value={bet.id.toString()}>
              {bet.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
