"use client"

import { useState, useTransition } from "react"
import { markBetWinner, markBetLost, reactivateBet } from "./actions"
import { Trophy, X, RotateCcw, Loader2, Calendar, TrendingUp } from "lucide-react"

interface Bet {
  id: number
  name: string
  odd: number
  end_date: string
  active: boolean
  is_winner: boolean | null
  category: string | null
}

type FilterType = "todos" | "pendiente" | "ganado" | "perdido"

function getStatus(bet: Bet): FilterType {
  if (bet.is_winner === true) return "ganado"
  if (bet.is_winner === false) return "perdido"
  return "pendiente"
}

function StatusBadge({ status }: { status: FilterType }) {
  const map = {
    pendiente: "bg-yellow-100 text-yellow-800",
    ganado: "bg-green-100 text-green-800",
    perdido: "bg-red-100 text-red-800",
    todos: "",
  }
  const labels = { pendiente: "Pendiente", ganado: "Ganado", perdido: "Perdido", todos: "" }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>
      {labels[status]}
    </span>
  )
}

function BetRow({ bet }: { bet: Bet }) {
  const [isPending, startTransition] = useTransition()
  const status = getStatus(bet)

  // Activo solo si active=true Y aún no han pasado 3h desde end_date
  const isEffectivelyActive =
    bet.active && Date.now() < new Date(bet.end_date).getTime() + 3 * 60 * 60 * 1000

  const act = (fn: () => Promise<{ error?: string; success?: boolean }>) => {
    startTransition(async () => { await fn() })
  }

  const date = new Date(bet.end_date).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
      status === "ganado" ? "bg-green-50 border-green-200" :
      status === "perdido" ? "bg-red-50 border-red-200" :
      "bg-white border-gray-200"
    }`}>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <StatusBadge status={status} />
          {!isEffectivelyActive && status === "pendiente" && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Listo para resolver</span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-800 leading-tight">{bet.name}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> cuota {bet.odd}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {date}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        ) : isEffectivelyActive && status === "pendiente" ? (
          <span className="text-xs text-gray-400 italic">Evento en curso</span>
        ) : (
          <>
            {status !== "ganado" && (
              <button
                onClick={() => act(() => markBetWinner(bet.id))}
                title="Marcar como ganado"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-900 text-white hover:bg-green-800 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5" /> Ganado
              </button>
            )}
            {status !== "perdido" && (
              <button
                onClick={() => act(() => markBetLost(bet.id))}
                title="Marcar como perdido"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Perdido
              </button>
            )}
            {status !== "pendiente" && (
              <button
                onClick={() => act(() => reactivateBet(bet.id))}
                title="Reactivar evento"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function EventsPanel({ bets }: { bets: Bet[] }) {
  const [filter, setFilter] = useState<FilterType>("pendiente")

  const counts = {
    todos: bets.length,
    pendiente: bets.filter(b => getStatus(b) === "pendiente").length,
    ganado: bets.filter(b => getStatus(b) === "ganado").length,
    perdido: bets.filter(b => getStatus(b) === "perdido").length,
  }

  const filtered = filter === "todos" ? bets : bets.filter(b => getStatus(b) === filter)

  // Agrupar por categoría
  const grouped = filtered.reduce<Record<string, Bet[]>>((acc, bet) => {
    const cat = bet.category ?? "Sin categoría"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(bet)
    return acc
  }, {})

  const FILTERS: { value: FilterType; label: string; color: string }[] = [
    { value: "pendiente", label: "Pendientes", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { value: "ganado", label: "Ganados", color: "bg-green-100 text-green-800 border-green-200" },
    { value: "perdido", label: "Perdidos", color: "bg-red-100 text-red-800 border-red-200" },
    { value: "todos", label: "Todos", color: "bg-gray-100 text-gray-700 border-gray-200" },
  ]

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === f.value
                ? "bg-green-900 text-white border-green-900"
                : `${f.color} hover:opacity-80`
            }`}
          >
            {f.label}
            <span className={`ml-2 text-xs font-bold ${filter === f.value ? "text-white/70" : ""}`}>
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Grupos */}
      {Object.keys(grouped).length === 0 && (
        <p className="text-center py-12 text-gray-400">No hay eventos con este filtro</p>
      )}
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, bets]) => (
          <div key={category}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{category}</p>
            <div className="space-y-2">
              {bets.map(bet => <BetRow key={bet.id} bet={bet} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
