"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { saveShippingAddress } from "@/app/actions/shipping"

type Props = {
  onSaved?: () => void
}

export default function ShippingModalForm({ onSaved }: Props) {
  const [formData, setFormData] = useState({
    ciudad: "",
    comuna: "",
    calle: "",
    numero_calle: "",
    numero_casa_depto: "",
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const result = await saveShippingAddress(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      onSaved?.()
      window.location.reload()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="p-4 mt-2 space-y-4 bg-white border rounded-lg shadow-sm"
      >
        <h3 className="text-base font-semibold">Dirección de Envío</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="ciudad"
            placeholder="Ciudad"
            value={formData.ciudad}
            onChange={handleChange}
            required
            disabled={isSaving}
          />
          <Input
            name="comuna"
            placeholder="Comuna"
            value={formData.comuna}
            onChange={handleChange}
            required
            disabled={isSaving}
          />
          <Input
            name="calle"
            placeholder="Calle"
            value={formData.calle}
            onChange={handleChange}
            required
            disabled={isSaving}
          />
          <Input
            name="numero_calle"
            placeholder="Número de calle"
            value={formData.numero_calle}
            onChange={handleChange}
            required
            disabled={isSaving}
          />
          <Input
            name="numero_casa_depto"
            placeholder="Número casa/departamento"
            value={formData.numero_casa_depto}
            onChange={handleChange}
            required
            disabled={isSaving}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={isSaving} className="bg-green-900 hover:bg-emerald-700">
          {isSaving ? "Guardando..." : "Guardar dirección"}
        </Button>
      </form>
    </>
  )
}
