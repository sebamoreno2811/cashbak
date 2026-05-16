"use client"

import { useEffect, useState } from "react"
import { X, Download, Share } from "lucide-react"
import Image from "next/image"
import useSupabaseUser from "@/hooks/use-supabase-user"

const STORAGE_KEY = "cashbak_pwa_dismissed"

function isIos() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isAlreadyInstalled() {
  if (typeof window === "undefined") return true
  // @ts-ignore
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true
}

function isMobile() {
  if (typeof window === "undefined") return false
  return window.innerWidth < 768 || /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}

export default function PwaInstallBanner() {
  const { user } = useSupabaseUser()
  const [visible, setVisible] = useState(false)
  const [isIosDevice, setIsIosDevice] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (!user) return
    if (isAlreadyInstalled()) return
    if (!isMobile()) return
    if (localStorage.getItem(STORAGE_KEY)) return

    setIsIosDevice(isIos())

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener("beforeinstallprompt", handler)

    // Delay para no solapar con el modal de cuenta bancaria
    const timer = setTimeout(() => setVisible(true), 3000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      clearTimeout(timer)
    }
  }, [user])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1")
    setVisible(false)
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") localStorage.setItem(STORAGE_KEY, "1")
      setDeferredPrompt(null)
    }
    setVisible(false)
  }

  if (!visible) return null
  if (!isIosDevice && !deferredPrompt) return null

  return (
    // z-[55] queda sobre Baki (z-50); bottom-20 deja espacio sobre el botón de Baki
    <div className="fixed bottom-20 left-3 right-3 z-[55] flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header verde */}
        <div className="bg-green-900 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/15 flex items-center justify-center shrink-0">
            <Image
              src="/img/logo_no_text.png"
              alt="CashBak"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Agrega CashBak a tu pantalla</p>
            <p className="text-green-200 text-xs mt-0.5">Acceso rápido sin abrir el navegador</p>
          </div>
          <button
            onClick={dismiss}
            className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            Déjala en tu pantalla de inicio y recibe notificaciones del estado de tus pedidos y tus CashBaks directamente en tu teléfono.
          </p>

          {isIosDevice ? (
            <div className="mt-3 flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
              <Share className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Toca <strong className="text-gray-800">Compartir</strong> en Safari y luego{" "}
                <strong className="text-gray-800">Agregar a pantalla de inicio</strong>.
              </p>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-green-900 hover:bg-green-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Instalar app
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
