"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const BANK_OPTIONS = [
  "Banco de Chile",
  "Banco Estado",
  "Banco Santander",
  "Mercado Pago",
  "Banco BCI",
  "Banco Itaú",
  "Banco Falabella",
  "Scotiabank",
  "Banco Security",
  "Otro",
]

const ACCOUNT_TYPES = ["Cuenta Corriente", "Cuenta Vista", "Cuenta de Ahorro", "Cuenta RUT"]

export default function BankForm({ onSuccess }: { onSuccess?: () => void }) {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [bankData, setBankData] = useState({
    bankName: "",
    accountType: "",
    accountNumber: "",
    rut: "",
  })

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) setUserId(data.user.id)
    }
    getSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!/^[0-9]+-[0-9Kk]$/.test(bankData.rut)) {
      setError("Formato de RUT inválido (ej: 12345678-9 o 12345678-K)")
      setIsLoading(false)
      return
    }

    try {
      if (!userId) throw new Error("Usuario no autenticado")

      await supabase.from("bank_accounts").insert({
        customer_id: userId,
        bank_name: bankData.bankName,
        account_type: bankData.accountType,
        account_number: bankData.accountNumber,
        rut: bankData.rut,
      })

      // Limpia el formulario
      setBankData({
        bankName: "",
        accountType: "",
        accountNumber: "",
        rut: "",
      })

      setShowSuccessModal(true)
    } catch (error: any) {
      setError(error.message || "Error al guardar datos bancarios")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-semibold">Datos Bancarios</h2>

        <div>
          <Label>Banco</Label>
          <Select value={bankData.bankName} onValueChange={(value) => setBankData({ ...bankData, bankName: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu banco" />
            </SelectTrigger>
            <SelectContent>
              {BANK_OPTIONS.map((bank) => (
                <SelectItem key={bank} value={bank}>
                  {bank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tipo de Cuenta</Label>
          <Select value={bankData.accountType} onValueChange={(value) => setBankData({ ...bankData, accountType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo de cuenta" />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Número de Cuenta</Label>
          <Input
            value={bankData.accountNumber}
            onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>RUT</Label>
          <Input
            value={bankData.rut}
            onChange={(e) => setBankData({ ...bankData, rut: e.target.value })}
            required
          />
        </div>

        {error && <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{error}</div>}

        <Button type="submit" className="w-full bg-green-900 hover:bg-emerald-700" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Guardar datos bancarios"}
        </Button>
      </form>

      <Dialog open={showSuccessModal} onOpenChange={() => setShowSuccessModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Datos guardados!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">Tu información bancaria se ha guardado correctamente.</p>
            <Button
              className="w-full bg-green-900 hover:bg-emerald-700"
              onClick={() => {
                setShowSuccessModal(false)
                onSuccess?.()
              }}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
