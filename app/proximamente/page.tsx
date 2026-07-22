"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { LAUNCH_TS } from "@/config/launch"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(): TimeLeft | null {
  const diff = LAUNCH_TS - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-20 w-16 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15 sm:h-28 sm:w-24">
        <span className="font-mono text-3xl font-bold tabular-nums text-white sm:text-5xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-xs font-medium uppercase tracking-widest text-emerald-200/80 sm:text-sm">
        {label}
      </span>
    </div>
  )
}

export default function ProximamentePage() {
  // Empieza en null para evitar mismatch de hidratación; se calcula al montar.
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTimeLeft(getTimeLeft())
    const interval = setInterval(() => {
      const next = getTimeLeft()
      setTimeLeft(next)
      // Al llegar a cero, recarga para que el gate (ya vencido) deje pasar.
      if (next === null) {
        clearInterval(interval)
        window.location.href = "/"
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 px-6 py-12 text-center">
      {/* Glow decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center">
        <Image
          src="/img/logo.png"
          alt="CashBak"
          width={200}
          height={64}
          priority
          className="mb-8 h-auto w-40 sm:w-52"
        />

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Muy pronto
        </p>
        <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
          Estamos a poco de lanzar
        </h1>
        <p className="mb-10 max-w-md text-base text-emerald-100/80 sm:text-lg">
          Compra lo que quieras y recupera hasta el 100% de tu dinero. El
          lanzamiento es el 21 de octubre a las 18:00 hrs.
        </p>

        {mounted && timeLeft ? (
          <div className="flex items-start gap-3 sm:gap-5">
            <Unit value={timeLeft.days} label="Días" />
            <span className="pt-5 text-3xl font-bold text-emerald-500/60 sm:pt-8 sm:text-5xl">
              :
            </span>
            <Unit value={timeLeft.hours} label="Horas" />
            <span className="pt-5 text-3xl font-bold text-emerald-500/60 sm:pt-8 sm:text-5xl">
              :
            </span>
            <Unit value={timeLeft.minutes} label="Min" />
            <span className="pt-5 text-3xl font-bold text-emerald-500/60 sm:pt-8 sm:text-5xl">
              :
            </span>
            <Unit value={timeLeft.seconds} label="Seg" />
          </div>
        ) : (
          // Placeholder de igual altura mientras hidrata, evita salto de layout.
          <div className="h-[104px] sm:h-[136px]" />
        )}

        <div className="mt-12 flex flex-col items-center gap-4">
          <a
            href="https://www.instagram.com/cashbak.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Síguenos en Instagram
          </a>
          <Link
            href="/login"
            className="text-sm text-emerald-200/70 underline-offset-4 transition hover:text-emerald-100 hover:underline"
          >
            ¿Eres vendedor? Ingresa aquí
          </Link>
        </div>
      </div>
    </main>
  )
}
