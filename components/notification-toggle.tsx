"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, CheckCircle, Loader2 } from "lucide-react"
import { subscribeAndSave } from "@/components/push-provider"

export default function NotificationToggle() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported" | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported")
    } else {
      setPermission(Notification.permission)
    }
  }, [])

  async function handleActivate() {
    setLoading(true)
    try {
      await navigator.serviceWorker.register("/sw.js")
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === "granted") {
        await subscribeAndSave()
      }
    } catch (err) {
      console.error("[push]", err)
    }
    setLoading(false)
  }

  if (permission === null) return null
  if (permission === "unsupported") return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
        <Bell className="w-4 h-4 text-green-700" />
        <h2 className="font-semibold text-gray-800">Notificaciones</h2>
      </div>
      <div className="px-5 py-5">
        {permission === "granted" ? (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Notificaciones activas. Te avisaremos cuando llegue tu CashBak o tu pedido sea enviado.</span>
          </div>
        ) : permission === "denied" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BellOff className="w-4 h-4 shrink-0" />
              <span>Notificaciones bloqueadas. Para activarlas, ve a la configuración de tu navegador y permite las notificaciones para este sitio.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Recibe alertas cuando llegue tu CashBak o tu pedido sea enviado.</p>
            <button
              onClick={handleActivate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-900 text-white text-sm font-semibold rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Activar notificaciones
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
