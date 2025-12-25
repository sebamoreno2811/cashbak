// ARCHIVO: app/reset-password/page.tsx (o donde tengas esta página)
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client" // ✅ Tu import exacto

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    // Al llegar aquí, el usuario YA tiene sesión gracias al route handler (Paso 1).
    // Solo necesitamos actualizar el usuario.
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Opcional: Cerrar sesión para que se loguee con la nueva clave
    await supabase.auth.signOut()
    
    // Redirigir al login
    router.replace("/login")
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Restablecer contraseña</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label>Nueva contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Ingresa tu nueva contraseña"
              />
            </div>

            <div>
              <Label>Confirmar contraseña</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite la contraseña"
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-green-900 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Cambiar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}