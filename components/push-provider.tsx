"use client"

import { useEffect, useState } from "react"
import useSupabaseUser from "@/hooks/use-supabase-user"

export default function PushProvider() {
  const { user } = useSupabaseUser()
  const [showBanner, setShowBanner] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!user) return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    if (!("Notification" in window)) return

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      setRegistration(reg)

      // Si ya tiene permiso, suscribir silenciosamente
      if (Notification.permission === "granted") {
        subscribeAndSave(reg)
        return
      }

      // Si aún no ha decidido, mostrar el banner
      if (Notification.permission === "default") {
        setShowBanner(true)
      }
    }).catch(() => {})
  }, [user])

  async function subscribeAndSave(reg: ServiceWorkerRegistration) {
    try {
      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      })
    } catch {}
  }

  async function handleActivate() {
    setShowBanner(false)
    if (!registration) return
    try {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        await subscribeAndSave(registration)
      }
    } catch {}
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex items-start gap-3">
        <span className="text-2xl shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Activar notificaciones</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Recibe alertas cuando llegue tu CashBak o tu pedido sea enviado.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleActivate}
              className="flex-1 py-1.5 bg-green-900 text-white text-xs font-semibold rounded-lg hover:bg-green-800 transition-colors"
            >
              Activar
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="flex-1 py-1.5 border border-gray-200 text-gray-500 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
