"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useBets } from "@/context/bet-context"
import posthog from "posthog-js"

import type { Bet } from "@/context/bet-context"

type BetSelectorProps = {
  value: string
  onChange: (value: string) => void
  className?: string
  compact?: boolean
  getCashback?: (bet: Bet) => number
  getCashbackRange?: (bet: Bet) => { min: number; max: number } | null
}

type Step = "sport" | "category" | "event"
const STEP_LABELS: Record<Step, string> = {
  sport: "Deporte",
  category: "Categoría",
  event: "Evento",
}

export default function BetSelector({ value, onChange, className, compact, getCashback, getCashbackRange }: BetSelectorProps) {
  const { bets, loading } = useBets()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("sport")
  const [sliding, setSliding] = useState<"forward" | "back" | null>(null)
  const [selectedSport, setSelectedSport] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const availableBets = bets.filter((bet) => new Date(bet.end_date) > nowChile)
  const sports = Array.from(new Set(availableBets.map((bet) => bet.sport || "Otro")))

  const categoriesForSport = Array.from(
    new Set(
      availableBets
        .filter((bet) => (bet.sport || "Otro") === selectedSport)
        .map((bet) => bet.category || "Sin categoría")
    )
  )

  const eventsForCategory = availableBets.filter(
    (bet) =>
      (bet.sport || "Otro") === selectedSport &&
      (bet.category || "Sin categoría") === selectedCategory
  )

  const selectedBet = bets.find((bet) => bet.id.toString() === value)

  // Visible steps (skip sport if only one, skip category if only one)
  const visibleSteps: Step[] = [
    ...(sports.length > 1 ? ["sport" as Step] : []),
    ...(categoriesForSport.length > 1 ? ["category" as Step] : []),
    "event",
  ]
  const stepIndex = visibleSteps.indexOf(step)
  const totalSteps = visibleSteps.length

  // Auto-init on load
  useEffect(() => {
    if (sports.length > 0 && !selectedSport) {
      const firstSport = sports[0]
      setSelectedSport(firstSport)
      const cats = Array.from(
        new Set(
          availableBets
            .filter((b) => (b.sport || "Otro") === firstSport)
            .map((b) => b.category || "Sin categoría")
        )
      )
      if (cats.length > 0) setSelectedCategory(cats[0])
    }
  }, [sports.length])

  // Auto-select first event
  useEffect(() => {
    if (!value && eventsForCategory.length > 0) {
      const first = eventsForCategory.reduce((min, bet) => (bet.id < min.id ? bet : min))
      onChange(first.id.toString())
    }
  }, [selectedCategory])

  const updateDropdownPosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const dropdownWidth = compact ? Math.max(rect.width, 320) : rect.width
    const left = Math.min(rect.left, window.innerWidth - dropdownWidth - 8)
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: Math.max(8, left),
      width: dropdownWidth,
      zIndex: 9999,
    })
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = () => updateDropdownPosition()
    window.addEventListener("scroll", handler, true)
    window.addEventListener("resize", handler)
    return () => {
      window.removeEventListener("scroll", handler, true)
      window.removeEventListener("resize", handler)
    }
  }, [open])

  const goToStep = (next: Step, direction: "forward" | "back") => {
    setSliding(direction)
    setTimeout(() => {
      setStep(next)
      setSliding(null)
    }, 180)
  }

  const handleOpen = () => {
    if (!open) {
      updateDropdownPosition()
      posthog.capture("selector_evento_abierto")
      const firstStep = visibleSteps[0]
      setStep(firstStep)
    }
    setOpen((v) => !v)
  }

  const handleSelectSport = (sport: string) => {
    setSelectedSport(sport)
    const cats = Array.from(
      new Set(
        availableBets
          .filter((b) => (b.sport || "Otro") === sport)
          .map((b) => b.category || "Sin categoría")
      )
    )
    setSelectedCategory(cats[0] ?? "")
    if (cats.length > 1) goToStep("category", "forward")
    else goToStep("event", "forward")
  }

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat)
    goToStep("event", "forward")
  }

  const handleSelectEvent = (betId: string) => {
    const bet = bets.find((b) => b.id.toString() === betId)
    posthog.capture("evento_seleccionado", { bet_id: betId, bet_name: bet?.name })
    onChange(betId)
    setOpen(false)
  }

  const stepBack = () => {
    const idx = visibleSteps.indexOf(step)
    if (idx > 0) goToStep(visibleSteps[idx - 1], "back")
  }

  const canGoBack = visibleSteps.indexOf(step) > 0

  if (loading) {
    return <div className="mb-6 text-sm text-gray-400 animate-pulse">Cargando eventos...</div>
  }

  if (availableBets.length === 0) {
    return <div className="mb-6 text-sm text-gray-400">No hay eventos disponibles.</div>
  }

  return (
    <>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(18px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInLeft  { from { transform: translateX(-18px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .slide-in-right { animation: slideInRight 0.18s ease; }
        .slide-in-left  { animation: slideInLeft  0.18s ease; }
      `}</style>

      <div className={className ?? "mb-6"}>
        {/* Trigger */}
        <button
          ref={triggerRef}
          onClick={handleOpen}
          className={`w-full flex items-center justify-between gap-2 bg-white text-sm transition-all ${
            compact
              ? `px-3 py-1.5 rounded-lg border ${open ? "border-green-600 ring-1 ring-green-100" : "border-gray-200 hover:border-gray-300"}`
              : `px-4 py-3 rounded-xl border-2 shadow-sm ${open ? "border-green-700 ring-2 ring-green-100" : "border-gray-200 hover:border-gray-300"}`
          }`}
        >
          <span className={`truncate ${selectedBet ? (compact ? "font-medium text-gray-900" : "font-semibold text-gray-900") : "text-gray-400"}`}>
            {selectedBet ? selectedBet.name : "Selecciona un evento"}
          </span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              {canGoBack ? (
                <button
                  onClick={stepBack}
                  className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : (
                <div className="w-7 h-7 flex-shrink-0" />
              )}

              <div className="flex-1 flex flex-col items-center">
                <span className="text-xs font-semibold text-gray-700">
                  {STEP_LABELS[step]}
                </span>
              </div>

              {/* Step dots */}
              {totalSteps > 1 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {visibleSteps.map((s, i) => (
                    <div
                      key={s}
                      className={`rounded-full transition-all duration-200 ${
                        i === stepIndex
                          ? "w-4 h-1.5 bg-green-700"
                          : i < stepIndex
                          ? "w-1.5 h-1.5 bg-green-300"
                          : "w-1.5 h-1.5 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Options with slide animation */}
            <div
              key={step}
              className={sliding === "forward" ? "slide-in-right" : sliding === "back" ? "slide-in-left" : "slide-in-right"}
            >
              <div className="max-h-56 overflow-y-auto">
                {step === "sport" && sports.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => handleSelectSport(sport)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-800 hover:bg-green-50 hover:text-green-900 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <span>{sport}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                  </button>
                ))}

                {step === "category" && categoriesForSport.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleSelectCategory(cat)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-800 hover:bg-green-50 hover:text-green-900 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <span>{cat}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                  </button>
                ))}

                {step === "event" && eventsForCategory.map((bet) => {
                  const isSelected = bet.id.toString() === value
                  const cashback = getCashback ? getCashback(bet) : null
                  const range = getCashbackRange ? getCashbackRange(bet) : null
                  const refValue = cashback ?? range?.max ?? null
                  const cbColor = refValue === null ? "" :
                    refValue >= 90 ? "bg-green-600 text-white" :
                    refValue >= 70 ? "bg-green-500 text-white" :
                    refValue >= 50 ? "bg-green-400 text-white" :
                    refValue >= 30 ? "bg-green-200 text-green-900" :
                    "bg-green-100 text-green-700"
                  return (
                    <button
                      key={bet.id}
                      onClick={() => handleSelectEvent(bet.id.toString())}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors border-b border-gray-50 last:border-0 ${
                        isSelected
                          ? "bg-green-50 text-green-900 font-semibold"
                          : "text-gray-800 hover:bg-green-50 hover:text-green-900"
                      }`}
                    >
                      <span className="truncate">{bet.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {cashback !== null && cashback > 0 && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cbColor}`}>
                            {cashback}% CB
                          </span>
                        )}
                        {range !== null && range.max > 0 && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cbColor}`}>
                            {range.min === range.max ? `${range.min}%` : `${range.min}–${range.max}%`} CB
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            {step === "event" && (getCashback || getCashbackRange) && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <p className="text-[10px] text-gray-400">
                  {getCashbackRange
                    ? "CB = CashBak — el rango varía según el producto que elijas"
                    : "CB = CashBak — porcentaje que recibes si se cumple el evento"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
