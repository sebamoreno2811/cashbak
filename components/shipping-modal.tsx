"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import useSupabaseUser from "@/hooks/use-supabase-user"
import { createClient } from "@/utils/supabase/client"

type Props = {
  onSaved?: () => void
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ShippingModalForm({ onSaved }: Props) {
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
        setError("Debes iniciar sesión para guardar una dirección.")
        return
      }

      const customer_id = user.id

      // Ensure customer record exists (FK requirement)
      await supabase.from("customers").upsert(
        {
          id: customer_id,
          email: user.email ?? "",
          full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "",
          created_at: new Date().toISOString(),
        },
        { onConflict: "id", ignoreDuplicates: true }
      )

      // Check if shipping record already exists
      const { data: existing } = await supabase
        .from("customer_shipping_details")
        .select("id")
        .eq("customer_id", customer_id)
        .maybeSingle()

      const { error: saveError } = existing
        ? await supabase
            .from("customer_shipping_details")
            .update({ ...formData })
            .eq("customer_id", customer_id)
        : await supabase
            .from("customer_shipping_details")
            .insert([{ customer_id, ...formData }])

      if (saveError) {
        setError(`Error al guardar la dirección: ${saveError.message}`)
        console.error(saveError)
        return
      }

      await sleep(500)

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
