"use client"

import { useRouter } from "next/navigation"
import { Banknote, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  onClose: () => void
  context?: "login" | "purchase"
}

export default function BankAccountReminderModal({ open, onClose, context = "login" }: Props) {
  const router = useRouter()

  if (!open) return null

  const isPurchase = context === "purchase"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header verde */}
        <div className="bg-green-900 px-5 pt-6 pb-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/15 mx-auto mb-3">
            <Banknote className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-white font-bold text-lg text-center">
            {isPurchase ? "¡Compra exitosa! 🎉" : "Asegura tu CashBak"}
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-gray-700 text-sm text-center leading-relaxed">
            {isPurchase
              ? "Tu compra está confirmada. Para poder recibir tu CashBak si aciertas en el evento, necesitas registrar tus datos de transferencia."
              : "Para poder recibir tu CashBak cuando aciertes en el evento de tu compra, necesitas registrar tus datos de transferencia."}
          </p>
          <p className="text-gray-400 text-xs text-center mt-2">
            Sin ellos no podremos transferirte el dinero.
          </p>

          <div className="mt-5 space-y-2">
            <Button
              className="w-full bg-green-900 hover:bg-green-800"
              onClick={() => {
                onClose()
                router.push("/perfil")
              }}
            >
              Ir a mi perfil
            </Button>
            <Button variant="ghost" className="w-full text-gray-500" onClick={onClose}>
              Lo haré después
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
