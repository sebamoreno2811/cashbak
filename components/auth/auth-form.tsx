"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { createClient } from "@/utils/supabase/client"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AuthFormProps {
  onSuccess?: () => void
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const supabase = createClient()

  const [mode, setMode] = useState<"login" | "forgot">("login")

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [forgotEmail, setForgotEmail] = useState("")

  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "+569",
  })

  // -------------------------
  // LOGIN
  // -------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword(loginData)

    if (error) {
      setError(error.message || "Error al iniciar sesión")
    } else {
      onSuccess?.()
    }

    setIsLoading(false)
  }

  // -------------------------
  // REGISTER
  // -------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (registerData.password !== registerData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (!/^\+569\d{8}$/.test(registerData.phone)) {
      setError("El número debe comenzar con +569 seguido de 8 dígitos")
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: registerData.email,
      password: registerData.password,
      options: {
        data: {
          full_name: registerData.fullName,
          phone: registerData.phone,
        },
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    if (data.user) {
      const { error: insertError } = await supabase
        .from("customers")
        .insert({
          id: data.user.id,
          full_name: registerData.fullName,
          email: registerData.email,
          phone: registerData.phone,
        })

      if (insertError) {
        setError("Error al guardar los datos del usuario")
        setIsLoading(false)
        return
      }

      setRegisterData({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        phone: "+569",
      })

      setShowSuccessModal(true)
    }

    setIsLoading(false)
  }

  // DENTRO DE TU COMPONENTE AuthForm

const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    // ✅ CAMBIO CLAVE: Usamos window.location.origin para que sirva en local y prod
    // y apuntamos al callback que creamos en el Paso 1
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage(
        "Si el correo existe, te enviamos un link para recuperar tu contraseña."
      )
    }

    setIsLoading(false)
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <>
      <div className="w-full max-w-md mx-auto">
        <Tabs
          defaultValue="login"
          onValueChange={() => {
            setMode("login")
            setError(null)
            setMessage(null)
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          {/* LOGIN */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>
                  {mode === "forgot"
                    ? "Recuperar contraseña"
                    : "Iniciar sesión"}
                </CardTitle>
                <CardDescription>
                  {mode === "forgot"
                    ? "Te enviaremos un link para restablecer tu contraseña"
                    : "Ingresa tus credenciales para acceder"}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {mode === "login" && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Contraseña</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-green-900 hover:bg-emerald-700"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Iniciar sesión
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot")
                        setError(null)
                      }}
                      className="w-full text-sm text-center text-muted-foreground hover:underline"
                    >
                      ¿Recuperar contraseña?
                    </button>
                  </form>
                )}

                {mode === "forgot" && (
                  <form
                    onSubmit={handleForgotPassword}
                    className="space-y-4"
                  >
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>

                    {error && (
                      <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                        {error}
                      </div>
                    )}

                    {message && (
                      <div className="p-3 text-sm text-green-700 bg-green-100 border border-green-300 rounded-md">
                        {message}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Enviar link
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("login")
                        setMessage(null)
                        setForgotEmail("")
                      }}
                      className="w-full text-sm text-center text-muted-foreground hover:underline"
                    >
                      Volver al login
                    </button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REGISTER */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Crear cuenta</CardTitle>
                <CardDescription>
                  Completa los datos para crear tu cuenta
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label>Nombre completo</Label>
                    <Input
                      value={registerData.fullName}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          fullName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={registerData.phone}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          phone: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Confirmar contraseña</Label>
                    <Input
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          confirmPassword: e.target.value,
                        })
                      }
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
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Crear cuenta
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* SUCCESS MODAL */}
      <Dialog
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Registro exitoso!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-700">
            Tu cuenta ha sido creada correctamente. Revisa tu correo para
            confirmarla.
          </p>
          <Button
            className="w-full bg-green-900 hover:bg-emerald-700"
            onClick={() => {
              setShowSuccessModal(false)
              onSuccess?.()
            }}
          >
            OK
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
