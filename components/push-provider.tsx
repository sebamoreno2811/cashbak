"use client"

import { useEffect, useState } from "react"
import useSupabaseUser from "@/hooks/use-supabase-user"

async function subscribeAndSave() {
  const reg = await navigator.serviceWorker.ready
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
}

export default function PushProvider() {
  const { user } = useSupabaseUser()
  const [showBanner, setShowBanner] = useState(false)
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    if (!user) return
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return

    navigator.serviceWorker.register("/sw.js").then(() => {
      if (Notification.permission === "granted") {
        subscribeAndSave().catch(console.error)
      } else if (Notification.permission === "default") {
        setShowBanner(true)
      }
    }).catch(console.error)
  }, [user])

  async function handleActivate() {
    setShowBanner(false)
    try {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        await subscribeAndSave()
      } else {
        setShowManual(true)
      }
    } catch (err) {
      console.error("[push] Error al activar notificaciones:", err)
    }
  }

  if (!showBanner && !showManual) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 sm:top-auto sm:bottom-4 sm:left-4 sm:right-auto sm:w-80">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex items-start gap-3">
        <span className="text-2xl shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          {showManual ? (
            <>
              <p className="text-sm font-semibold text-gray-900">Activa las notificaciones</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Tu navegador bloqueó el diálogo. Para activarlas manualmente: haz clic en el <strong>🔒 candado</strong> (o nombre del sitio) en la barra de direcciones → <strong>Notificaciones</strong> → <strong>Permitir</strong>.
              </p>
              <button
                onClick={() => setShowManual(false)}
                className="mt-3 w-full py-1.5 border border-gray-200 text-gray-500 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Entendido
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
