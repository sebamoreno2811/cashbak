"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
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

type AuthEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY"

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // 🔴 Detectar error en URL
  useEffect(() => {
    const errorCode = searchParams.get("error_code")

    if (errorCode === "otp_expired") {
      setExpired(true)
      setError("El link expiró o ya fue usado. Solicita uno nuevo.")
    }
  }, [searchParams])

  // ✅ Escuchar evento correcto SOLO si no expiró
  useEffect(() => {
    if (expired) return

    const { data } = supabase.auth.onAuthStateChange(
      (event: AuthEvent) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true)
        }
      }
    )

    return () => {
      data.subscription.unsubscribe()
    }
  }, [supabase, expired])

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

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    router.replace("/")
  }

  // 🔴 Link expirado
  if (expired) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link expirado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El link de recuperación ya no es válido.
            </p>
            <Button
              className="w-full"
              onClick={() => router.replace("/login")}
            >
              Volver a recuperar contraseña
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ready) {
    return (
      <p className="mt-10 text-sm text-center text-muted-foreground">
        Validando link de recuperación…
      </p>
    )
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
              />
            </div>

            <div>
              <Label>Confirmar contraseña</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
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
