"use client"

import { useRef, useCallback } from "react"
import { GripVertical } from "lucide-react"

interface Props {
  price: number
  gananciaCLP: number
  onChange: (newGananciaCLP: number) => void
}

export default function CashbakFundBar({ price, gananciaCLP, onChange }: Props) {
  const barRef = useRef<HTMLDivElement>(null)

  const sellerPct = price > 0 ? Math.max(2, Math.min(98, Math.round(gananciaCLP / price * 100))) : 80
  const fondoPct = 100 - sellerPct
  const fondoCLP = Math.max(0, price - gananciaCLP)
  const fmt = (n: number) => n.toLocaleString("es-CL")

  const applyDrag = useCallback((clientX: number) => {
    if (!barRef.current || price === 0) return
    const rect = barRef.current.getBoundingClientRect()
    const raw = (clientX - rect.left) / rect.width
    const pct = Math.max(2, Math.min(98, Math.round(raw * 100)))
    onChange(Math.round(price * pct / 100))
  }, [price, onChange])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    applyDrag(e.clientX)
    const move = (ev: MouseEvent) => applyDrag(ev.clientX)
    const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up) }
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", up)
  }, [applyDrag])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    applyDrag(e.touches[0].clientX)
    const move = (ev: TouchEvent) => applyDrag(ev.touches[0].clientX)
    const end = () => { document.removeEventListener("touchmove", move); document.removeEventListener("touchend", end) }
    document.addEventListener("touchmove", move, { passive: true })
    document.addEventListener("touchend", end)
  }, [applyDrag])

  return (
    <div className="space-y-3 select-none">
      {/* Bar */}
      <div
        ref={barRef}
        className="relative h-3 flex rounded-full cursor-col-resize"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div
          className="bg-green-900 rounded-l-full"
          style={{ width: `${sellerPct}%` }}
        />
        <div className="bg-emerald-400 rounded-r-full flex-1" />

        {/* Drag handle */}
        <div
          className="absolute z-10 flex items-center justify-center pointer-events-none"
          style={{ left: `${sellerPct}%`, top: "50%", transform: "translate(-50%, -50%)" }}
          aria-hidden
        >
          <div className="w-5 h-5 bg-white rounded-full shadow-md border border-gray-300 flex items-center justify-center">
            <GripVertical className="w-2.5 h-2.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Labels below */}
      <div className="flex justify-between items-start text-xs gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-green-900">Tu ingreso bruto · {sellerPct}%</p>
          <p className="text-gray-500">${fmt(gananciaCLP)} <span className="text-gray-400">· antes de tarifa de procesamiento</span></p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-emerald-600">Fondo CashBak · {fondoPct}%</p>
          <p className="text-gray-500">${fmt(fondoCLP)}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400">A mayor inversión en el fondo, más atractivos son tus productos y más ventas obtienes.</p>
    </div>
  )
}
