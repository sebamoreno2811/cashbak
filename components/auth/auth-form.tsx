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

  const [mode, setMode] = useState<"login" | "register">("login")

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

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
  // Google OAuth
  // -------------------------
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Redirige a tu ruta de callback que ya tienes implementada
      const redirectTo = `${window.location.origin}/auth/callback?next=/`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      })

      if (error) {
        setError(error.message || "Error iniciando sesión con Google")
        setIsLoading(false)
      }
      // Si no hay error, Supabase redirigirá hacia Google.
    } catch (err: any) {
      setError(err?.message || "Error iniciando sesión con Google")
      setIsLoading(false)
    }
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
                <CardTitle>Iniciar sesión</CardTitle>
                <CardDescription>
                  Ingresa tus credenciales para acceder
                </CardDescription>
              </CardHeader>

              <CardContent>
                {mode === "login" && (
                  <>
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
                    </form>

                    {/* Separador */}
                    <div className="flex items-center gap-2 my-4">
                      <hr className="flex-1 border-t border-gray-200" />
                      <span className="text-sm text-gray-500">o</span>
                      <hr className="flex-1 border-t border-gray-200" />
                    </div>

                    {/* Botón Google */}
                    <div>
                      <Button
                        type="button"
                        className="flex items-center justify-center w-full gap-2 text-black bg-white border"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        aria-label="Continuar con Google"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirigiendo...
                          </>
                        ) : (
                          <>
                            {/* Google SVG */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 48 48"
                              width="18"
                              height="18"
                              className="inline-block"
                            >
                              <path fill="#fff" d="M0 0h48v48H0z" />
                              <path
                                fill="#EA4335"
                                d="M24 12.48c3.54 0 6.18 1.54 7.6 2.82l5.56-5.56C34.3 6.06 29.64 4 24 4 14.64 4 6.88 9.82 3.88 18.24l6.77 5.26C12.73 16.3 17.8 12.48 24 12.48z"
                              />
                              <path
                                fill="#34A853"
                                d="M46.5 24.5c0-1.6-.14-2.8-.45-4.07H24v8.02h12.74c-.56 3-2.9 6.6-7.54 8.86l6.02 4.66C43.9 37.04 46.5 31.64 46.5 24.5z"
                              />
                              <path
                                fill="#4A90E2"
                                d="M10.65 29.5A14.95 14.95 0 0 1 9.5 24.5c0-1.5.26-2.94.75-4.27L3.48 15 3.47 15 3.47 15l.01.01 6.77 5.26c1.05-3.35 3.4-6.22 6.25-8.03l.01.01 6.77-5.26z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M24 44c5.64 0 10.3-1.96 13.82-5.34l-6.02-4.66C30.18 34.44 27.54 35.5 24 35.5c-6.2 0-11.27-3.82-13.35-9.76L3.88 28.76C6.88 37.18 14.64 44 24 44z"
                              />
                            </svg>
                            Continuar con Google
                          </>
                        )}
                      </Button>
                    </div>
                  </>
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