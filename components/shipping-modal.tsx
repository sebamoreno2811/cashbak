"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import useSupabaseUser from "@/hooks/use-supabase-user"
import { createClient } from "@/utils/supabase/client"

type Props = {
  onSaved?: () => void
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ShippingModalForm({ onSaved }: Props) {
  const router = useRouter()
  const { user } = useSupabaseUser()
  const supabase = createClient()

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
      if (!user?.id) {
        setError("No se encontró el usuario.")
        return
      }

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("email", user.email)
        .single()

      if (customerError || !customerData) {
        setError("No se encontró información del cliente.")
        return
      }

      const customer_id = customerData.id

      const { error: insertError } = await supabase
        .from("customer_shipping_details")
        .insert([
          {
            customer_id,
            ...formData,
          },
        ])

      if (insertError) {
        setError("Error al guardar la dirección.")
        console.error(insertError)
        return
      }

      await sleep(2000)

      onSaved?.()
      window.location.reload()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <style>{`
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
          margin-left: 8px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>

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
          {isSaving ? (
            <>
              Guardando...
              <span className="spinner" />
            </>
          ) : (
            "Guardar dirección"
          )}
        </Button>
      </form>
    </>
  )
}
