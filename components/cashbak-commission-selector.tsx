"use client"

import { useState, useEffect, useRef } from "react"

const PRESETS = [8, 10, 12, 15, 20]

interface Props {
  price: number
  gananciaCLP: number
  onChange: (newGananciaCLP: number) => void
}

export default function CashbakCommissionSelector({ price, gananciaCLP, onChange }: Props) {
  const [otroMode, setOtroMode] = useState(false)
  const [customInput, setCustomInput] = useState("")
  const [inputError, setInputError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentPct = price > 0 ? Math.round((1 - gananciaCLP / price) * 100) : 15

  useEffect(() => {
    if (PRESETS.includes(currentPct)) setOtroMode(false)
  }, [currentPct])

  useEffect(() => {
    if (otroMode) inputRef.current?.focus()
  }, [otroMode])

  const apply = (pct: number) => {
    if (price === 0) return
    const clamped = Math.max(8, Math.min(92, Math.round(pct)))
    onChange(Math.round(price * (100 - clamped) / 100))
  }

  const handleCustomChange = (val: string) => {
    setCustomInput(val)
    if (val.includes(".") || val.includes(",")) {
      setInputError("Debe ser un número entero")
    } else {
      setInputError(null)
    }
  }

  const commitCustom = () => {
    const val = parseInt(customInput)
    if (!isNaN(val) && !inputError) {
      apply(val)
      setCustomInput(String(Math.max(8, Math.min(92, val))))
    }
  }

  const fmt = (n: number) => n.toLocaleString("es-CL")
  const commissionCLP = Math.max(0, price - gananciaCLP)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(pct => (
          <button
            key={pct}
            type="button"
            onClick={() => { setOtroMode(false); setInputError(null); apply(pct) }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${
              !otroMode && currentPct === pct
                ? "bg-green-900 text-white border-green-900"
                : "bg-white text-gray-700 border-gray-200 hover:border-green-700"
            }`}
          >
            {pct}%
          </button>
        ))}

        {/* Otro — cuando está activo se convierte en un chip editable */}
        {otroMode ? (
          <div className="flex items-center gap-1 bg-green-900 border border-green-900 rounded-lg px-3 py-2">
            <input
              ref={inputRef}
              type="number"
              min={8}
              max={92}
              step={1}
              value={customInput}
              onChange={e => handleCustomChange(e.target.value)}
              onBlur={commitCustom}
              onKeyDown={e => { if (e.key === "Enter") commitCustom() }}
              className="w-10 bg-transparent text-white text-sm font-bold text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="—"
            />
            <span className="text-white text-sm font-bold">%</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setOtroMode(true); setCustomInput(String(currentPct)) }}
            className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer bg-white text-gray-700 border-gray-200 hover:border-green-700"
          >
            Otro
          </button>
        )}
      </div>

      {inputError && (
        <p className="text-xs text-red-500">{inputError}</p>
      )}

      <div className="flex justify-between text-xs">
        <div>
          <p className="font-semibold text-green-900">Tu ingreso bruto · {100 - currentPct}%</p>
          <p className="text-gray-500">${fmt(gananciaCLP)} <span className="text-gray-400">· antes de tarifa de procesamiento</span></p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-emerald-600">Comisión CashBak · {currentPct}%</p>
          <p className="text-gray-500">${fmt(commissionCLP)}</p>
        </div>
      </div>
    </div>
  )
}
