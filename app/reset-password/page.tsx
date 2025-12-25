"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

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
  const searchParams = useSearchParams()

  // 🔒 Evita que el code se consuma más de una vez (Strict Mode)
  const exchangedRef = useRef(false)

  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expired, setExpired] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // ✅ ÚNICO efecto de auth permitido
  useEffect(() => {
    const code = searchParams.get("code")

    if (!code) {
      setExpired(true)
      return
    }

    if (exchangedRef.current) return
    exchangedRef.current = true

    const exchange = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Exchange error:", error)
        setExpired(true)
        return
      }

      setReady(true)
    }

    exchange()
  }, [searchParams, supabase])

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
    router.replace("/login")
  }

  // 🔴 Estado: link inválido / expirado
  if (expired) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link expirado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El link de recuperación ya no es válido o ya fue utilizado.
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

  // ⏳ Estado: validando OTP
  if (!ready) {
    return (
      <p className="mt-10 text-sm text-center text-muted-foreground">
        Validando link de recuperación…
      </p>
    )
  }

  // ✅ Estado: form válido
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
