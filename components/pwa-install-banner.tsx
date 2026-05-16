"use client"

import { useEffect, useState } from "react"
import { X, Download, Share } from "lucide-react"
import useSupabaseUser from "@/hooks/use-supabase-user"

const STORAGE_KEY = "cashbak_pwa_dismissed"

function isIos() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isAlreadyInstalled() {
  if (typeof window === "undefined") return true
  // @ts-ignore — navigator.standalone es solo Safari/iOS
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
  // deferredPrompt solo existe en Android/Chrome
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
      if (outcome === "accepted") {
        localStorage.setItem(STORAGE_KEY, "1")
      }
      setDeferredPrompt(null)
    }
    setVisible(false)
  }

  // En iOS no hay beforeinstallprompt — igual mostramos el banner con instrucciones
  // En Android esperamos el evento; si no llega (ya instalada / no soportado) no mostramos
  if (!visible) return null
  if (!isIosDevice && !deferredPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pointer-events-none">
      <div className="pointer-events-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex items-start gap-3 max-w-sm mx-auto">
        {/* Ícono app */}
        <div className="w-12 h-12 rounded-xl bg-green-900 flex items-center justify-center shrink-0">
          <span className="text-white text-lg font-extrabold leading-none">CB</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Agrega CashBak a tu pantalla</p>

          {isIosDevice ? (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Toca <Share className="w-3 h-3 inline mb-0.5" /> y luego{" "}
              <strong className="text-gray-700">Agregar a pantalla de inicio</strong> para acceso rápido.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">
              Instálala en tu teléfono y accede más rápido, sin buscar el navegador.
            </p>
          )}

          {!isIosDevice && (
            <button
              onClick={handleInstall}
              className="mt-2.5 flex items-center gap-1.5 bg-green-900 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar app
            </button>
          )}
        </div>

        <button
          onClick={dismiss}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0 -mt-0.5"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
