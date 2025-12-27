"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface Props {
  userId: string
  initialName?: string
  initialEmail?: string
}

export default function CompleteProfileForm({ userId, initialName = "", initialEmail = "" }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [fullName, setFullName] = useState(initialName)
  const [phone, setPhone] = useState("+569")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones mínimas
    if (!fullName || fullName.trim().length < 2) {
      setError("Ingresa un nombre válido")
      return
    }
    if (!/^\+569\d{8}$/.test(phone)) {
      setError("El número debe comenzar con +569 seguido de 8 dígitos")
      return
    }

    setIsLoading(true)

    const { error: insertError } = await supabase.from("customers").insert({
      id: userId,
      email: initialEmail || null,
      full_name: fullName,
      phone,
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Error insertando customer:", insertError)
      setError("Ocurrió un error guardando tus datos. Intenta nuevamente.")
      setIsLoading(false)
      return
    }

    // Al terminar, redirigimos al home (o a la ruta que prefieras)
    router.push("/")
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white rounded-md shadow">
      <h2 className="mb-2 text-lg font-medium">Completa tu perfil</h2>
      <p className="mb-4 text-sm text-gray-600">Sólo necesitamos algunos datos para completar tu cuenta.</p>

      <div>
        <Label>Nombre completo</Label>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div>
        <Label>Email</Label>
        <Input
          value={initialEmail}
          readOnly
          disabled
        />
      </div>

      <div>
        <Label>Teléfono</Label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full bg-green-900 hover:bg-emerald-700" disabled={isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Guardar y continuar"}
      </Button>
    </form>
  )
}