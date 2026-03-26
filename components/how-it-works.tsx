"use client"

import { useEffect, useState } from "react"

const DEMO_OPTIONS = [
  { name: "Italia clasificará al Mundial", emoji: "🇮🇹", cashback: 20 },
  { name: "Illia Topuria ganará a Justin Gaethje", emoji: "🥊", cashback: 10 },
  { name: "Chile le ganará a Argentina", emoji: "🇨🇱", cashback: 75 },
]

const SELECTED = DEMO_OPTIONS[2] // Chile — siempre termina aquí
const PRODUCT_PRICE = 29990
type MatchPhase = "upcoming" | "live" | "goal" | "won"

// Posición vertical del cursor sobre cada opción (px desde top del listado)
const CURSOR_TOPS = [-24, 10, 52, 94]

export default function HowItWorks() {
  // Panel 1 — cursor
  const [cursorPhase, setCursorPhase] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [clicking, setClicking] = useState(false)

  // Panel 2 — partido
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("upcoming")

  // Panel 3 — cashback
  const [cashbackAmount, setCashbackAmount] = useState(0)
  const [cashbackVisible, setCashbackVisible] = useState(false)

  const targetCashback = Math.round(PRODUCT_PRICE * (SELECTED.cashback / 100))

  // Ciclo del cursor (panel 1)
  useEffect(() => {
    const runCursor = () => {
      setCursorPhase(0)
      setClicking(false)
      const t1 = setTimeout(() => setCursorPhase(1), 300)
      const t2 = setTimeout(() => setCursorPhase(2), 800)
      const t3 = setTimeout(() => setCursorPhase(3), 1300)
      const t4 = setTimeout(() => { setClicking(true); setTimeout(() => setClicking(false), 150) }, 1700)
      const t5 = setTimeout(() => setCursorPhase(4), 1850)
      return [t1, t2, t3, t4, t5]
    }
    const timers = runCursor()
    const cycle = setInterval(runCursor, 3000)
    return () => { timers.forEach(clearTimeout); clearInterval(cycle) }
  }, [])

  // Ciclo del partido (panel 2)
  useEffect(() => {
    const runMatch = () => {
      setMatchPhase("upcoming")
      setCashbackVisible(false)
      setCashbackAmount(0)
      const t1 = setTimeout(() => setMatchPhase("live"), 1800)
      const t2 = setTimeout(() => setMatchPhase("goal"), 3800)
      const t3 = setTimeout(() => { setMatchPhase("won"); setCashbackVisible(true) }, 5800)
      return [t1, t2, t3]
    }
    const timers = runMatch()
    const cycle = setInterval(runMatch, 9000)
    return () => { timers.forEach(clearTimeout); clearInterval(cycle) }
  }, [])

  // Count-up cashback (panel 3)
  useEffect(() => {
    if (!cashbackVisible) return
    let count = 0
    const increment = targetCashback / 35
    const interval = setInterval(() => {
      count += increment
      if (count >= targetCashback) { count = targetCashback; clearInterval(interval) }
      setCashbackAmount(Math.round(count))
    }, 40)
    return () => clearInterval(interval)
  }, [cashbackVisible, targetCashback])

  const selected = cursorPhase === 4

  return (
    <div className="bg-white">
      <style>{`
        @media (min-width: 768px) {
          .hiw-arrow-right { clip-path: polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%); }
          .hiw-arrow-left  { clip-path: polygon(15% 0, 100% 0, 100% 100%, 15% 100%, 0 50%); }
        }
        .cursor-svg { transition: top 0.55s cubic-bezier(.4,0,.2,1), opacity 0.3s, transform 0.12s; }
      `}</style>

      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="container mx-auto max-w-5xl">
          <p className="text-base font-semibold text-gray-700 uppercase tracking-widest text-center">¿Cómo funciona?</p>
        </div>
      </div>

      {/* ── ROW 1 — texto izquierda (→), animación derecha ── */}
      <div className="flex flex-col md:flex-row min-h-[520px]">

        <div className="hiw-arrow-right md:w-1/2 bg-green-900 text-white flex items-center">
          <div className="px-10 py-14 md:pl-20 md:pr-32">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-7">
              <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-sm font-semibold text-emerald-300">Primer paso</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold mb-5 leading-snug">
              Elige un producto y tu evento
            </h3>
            <p className="text-green-200 text-lg leading-relaxed">
              Elige un producto y un evento deportivo. Pagas y recibes tu compra siempre — sin importar el resultado. El evento solo determina si recibes cashback o no.
            </p>
          </div>
        </div>

        <div className="md:w-1/2 bg-white flex items-center justify-center px-10 py-14 md:px-16">
          <div className="w-full max-w-sm flex flex-col gap-4">

            {/* Mini product card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 text-gray-900">
              <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-36 flex items-center justify-center">
                <span className="text-6xl select-none">👕</span>
                <div className={`absolute top-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-full transition-all duration-500 ${selected ? "bg-emerald-600 scale-105" : "bg-green-900/80"}`}>
                  {selected ? `${SELECTED.cashback}% CashBak` : "hasta 62% CashBak"}
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-gray-400">Ropa deportiva</p>
                <p className="text-sm font-semibold">Polera Deportiva Oficial</p>
                <p className="font-bold text-base mt-1">$29.990</p>
              </div>
            </div>

            {/* Event list with cursor */}
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2 ml-1">Selecciona tu evento:</p>
              <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">

                {DEMO_OPTIONS.map((opt, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 transition-colors duration-200 ${
                      selected && i === 2
                        ? "bg-emerald-50"
                        : cursorPhase === i + 1
                        ? "bg-gray-50"
                        : "bg-white"
                    }`}
                  >
                    <span className="text-base">{opt.emoji}</span>
                    <span className={`text-sm flex-1 leading-snug transition-colors duration-200 ${selected && i === 2 ? "font-bold text-green-900" : "text-gray-700"}`}>
                      {opt.name}
                    </span>
                    <span className="text-xs text-gray-400 tabular-nums">{opt.cashback}%</span>
                    {selected && i === 2 && (
                      <span className="text-emerald-600 text-sm font-bold">✓</span>
                    )}
                  </div>
                ))}

                {/* Cursor SVG */}
                <div
                  className="cursor-svg absolute pointer-events-none z-10"
                  style={{
                    top: CURSOR_TOPS[Math.min(cursorPhase, 3)],
                    left: -10,
                    opacity: cursorPhase === 0 ? 0 : cursorPhase === 4 ? 0 : 1,
                    transform: clicking ? "scale(0.82)" : "scale(1)",
                  }}
                >
                  <svg viewBox="0 0 14 20" width="20" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1 1 L1 16 L4.5 13 L7 18.5 L9 17.5 L6.5 12 L11 12 Z"
                      fill="white"
                      stroke="#1f2937"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Selected event confirmation */}
            <div className={`bg-green-900 rounded-2xl px-5 py-4 text-white transition-all duration-500 ${selected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest mb-1.5">Evento seleccionado</p>
              <p className="font-bold text-base leading-snug">{SELECTED.emoji} {SELECTED.name}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-emerald-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {SELECTED.cashback}% cashback
                </span>
                <span className="text-green-300 text-sm">si se cumple</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── ROW 2 — animación izquierda, texto derecha (←) ── */}
      <div className="flex flex-col md:flex-row min-h-[520px]">

        <div className="md:w-1/2 bg-white flex items-center justify-center px-10 py-14 md:px-16 order-2 md:order-1">
          <div className="w-full max-w-sm">
            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl text-white">
              <div className="px-5 py-3 bg-white/10 flex items-center justify-between">
                <span className="text-[11px] text-green-300 font-semibold uppercase tracking-widest">Copa América · Grupo A</span>
                {matchPhase === "upcoming" && <span className="text-[11px] text-gray-400">Próximamente</span>}
                {(matchPhase === "live" || matchPhase === "goal") && (
                  <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    EN VIVO
                  </span>
                )}
                {matchPhase === "won" && (
                  <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ✓ FINALIZADO
                  </span>
                )}
              </div>
              <div className="px-5 py-10 flex items-center justify-between">
                <div className="text-center flex-1">
                  <span className="text-5xl block mb-3">🇨🇱</span>
                  <p className="font-bold text-lg">Chile</p>
                </div>
                <div className="text-center px-2">
                  {matchPhase === "upcoming" && (<><p className="text-4xl font-bold text-white/30">vs</p><p className="text-green-400 text-xs mt-2">20:00 hrs</p></>)}
                  {matchPhase === "live" && (<><p className="text-4xl font-bold tabular-nums">0 – 0</p><p className="text-gray-400 text-xs mt-2">37&apos;</p></>)}
                  {matchPhase === "goal" && (<><p className="text-4xl font-bold tabular-nums">1 – 0</p><p className="text-emerald-400 text-xs font-bold mt-2 animate-pulse">⚽ ¡GOOOL! 64&apos;</p></>)}
                  {matchPhase === "won" && (<><p className="text-4xl font-bold tabular-nums">1 – 0</p><p className="text-emerald-400 text-xs font-bold mt-2">¡Tu evento se cumplió!</p></>)}
                </div>
                <div className="text-center flex-1">
                  <span className="text-5xl block mb-3">🇦🇷</span>
                  <p className="font-bold text-lg">Argentina</p>
                </div>
              </div>
              <div className="px-5 py-3 bg-white/5 text-center">
                <p className="text-gray-400 text-xs">Tu compra ya está registrada. Solo queda esperar.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hiw-arrow-left md:w-1/2 bg-green-900 text-white flex items-center order-1 md:order-2">
          <div className="px-10 py-14 md:pl-28 md:pr-20">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-7">
              <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">2</span>
              <span className="text-sm font-semibold text-emerald-300">Segundo paso</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold mb-5 leading-snug">
              Espera a que tu evento se resuelva
            </h3>
            <p className="text-green-200 text-lg leading-relaxed">
              Disfruta el evento sabiendo que si se da, recibes dinero de vuelta. Un poco más de razones para alentar.
            </p>
          </div>
        </div>
      </div>

      {/* ── ROW 3 — texto izquierda (→), animación derecha ── */}
      <div className="flex flex-col md:flex-row min-h-[520px]">

        <div className="hiw-arrow-right md:w-1/2 bg-green-900 text-white flex items-center">
          <div className="px-10 py-14 md:pl-20 md:pr-32">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-7">
              <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">3</span>
              <span className="text-sm font-semibold text-emerald-300">Tercer paso</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold mb-5 leading-snug">
              Recibe el dinero en tu cuenta
            </h3>
            <p className="text-green-200 text-lg leading-relaxed">
              Si tu evento se cumple, el cashback llega automáticamente a tu cuenta. Sin trámites, sin vueltas. Si no se cumple, igual recibes tu compra — sin riesgo, sin letras chicas.
            </p>
          </div>
        </div>

        <div className="md:w-1/2 bg-white flex items-center justify-center px-10 py-14 md:px-16">
          <div className="w-full max-w-sm" style={{ display: "grid" }}>

            {/* Waiting state */}
            <div
              style={{ gridArea: "1/1" }}
              className={`bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-center transition-all duration-500 ${cashbackVisible ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}
            >
              <span className="text-5xl">⏳</span>
              <p className="text-gray-500 text-base font-medium">Esperando resultado...</p>
              <p className="text-gray-400 text-sm">Chile vs Argentina · En vivo</p>
            </div>

            {/* Cashback card */}
            <div
              style={{ gridArea: "1/1" }}
              className={`bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 text-gray-900 transition-all duration-500 ${cashbackVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-green-900 flex items-center justify-center shrink-0">
                  <span className="text-lg">💸</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-green-900 leading-none">CashBak</p>
                  <p className="text-xs text-gray-400 mt-0.5">Transferencia recibida · ahora</p>
                </div>
                <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">✓ Recibido</span>
              </div>
              <div className="text-center py-4 border-y border-gray-100">
                <p className="text-5xl font-bold text-emerald-600 tabular-nums">
                  ${cashbackAmount.toLocaleString("es-CL")}
                </p>
                <p className="text-sm text-gray-400 mt-2">{SELECTED.cashback}% de $29.990</p>
              </div>
              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Polera Deportiva Oficial</span>
                  <span>$29.990</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-600">
                  <span>CashBak ({SELECTED.cashback}%)</span>
                  <span>+${Math.round(PRODUCT_PRICE * SELECTED.cashback / 100).toLocaleString("es-CL")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Cashback recibido</span>
                  <span className="text-emerald-600">${Math.round(PRODUCT_PRICE * SELECTED.cashback / 100).toLocaleString("es-CL")}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
