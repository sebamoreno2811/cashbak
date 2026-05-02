"use client"

import { useEffect } from "react"
import useSupabaseUser from "@/hooks/use-supabase-user"

export default function PushProvider() {
  const { user } = useSupabaseUser()

  useEffect(() => {
    if (!user) return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

    async function register() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js")
        const permission = await Notification.requestPermission()
        if (permission !== "granted") return

        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          // Ya suscrito — asegurarse de que esté guardado en la BD
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(existing),
          })
          return
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        })
      } catch {
        // Silenciar errores — push es opcional, no debe romper la app
      }
    }

    register()
  }, [user])

  return null
}
