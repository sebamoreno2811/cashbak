"use client"

import { useState } from "react"
import { approveStore, rejectStore } from "@/app/stores/actions"

export default function AdminStoreActions({ storeId }: { storeId: string }) {
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    await approveStore(storeId)
    setLoading(false)
  }

  async function handleReject() {
    if (!rejectReason.trim()) return
    setLoading(true)
    await rejectStore(storeId, rejectReason.trim())
    setLoading(false)
  }

  return (
    <div className="space-y-3 pt-2 border-t border-gray-100">
      {!showReject ? (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Aprobar"}
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={loading}
            className="px-4 py-2 border border-red-300 text-red-600 text-sm font-semibold rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Indica el motivo del rechazo (se enviará al vendedor por email)..."
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading || !rejectReason.trim()}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Confirmar rechazo"}
            </button>
            <button
              onClick={() => { setShowReject(false); setRejectReason("") }}
              className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
