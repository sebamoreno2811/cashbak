"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/utils/supabase/client"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AuthFormProps {
  onSuccess?: () => void
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "+569",
  })

  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword(loginData)
      if (error) throw error
      onSuccess?.()
    } catch (error: any) {
      setError(error.message || "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

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

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName,
            phone: registerData.phone,
          },
        },
      })

      if (authError) {
        const msg = authError.message.toLowerCase()
        if (
          msg.includes("user already registered") ||
          (msg.includes("email") && msg.includes("already"))
        ) {
          setError("Ya existe una cuenta con este correo electrónico")
        } else {
          setError(authError.message || "Error al registrar usuario")
        }
        return
      }

      if (!authData.user) {
        setError("No se pudo crear el usuario. Intenta nuevamente.")
        return
      }

      const { error: insertError } = await supabase.from("customers").insert({
        id: authData.user.id,
        full_name: registerData.fullName,
        email: registerData.email,
        phone: registerData.phone,
      })

      if (insertError) {
        if (insertError.message.toLowerCase().includes("duplicate key")) {
          setError("Ya existe un usuario registrado con estos datos.")
        } else {
          setError("Ocurrió un error al guardar los datos del usuario.")
        }
        return
      }

      // Limpia el formulario y muestra el modal de éxito
      setRegisterData({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        phone: "+569",
      })

      setShowSuccessModal(true)

    } catch (error: any) {
      setError(error.message || "Error al registrar usuario")
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <>
      <div className="w-full max-w-md mx-auto">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          {/* Login */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Iniciar Sesión</CardTitle>
                <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Contraseña</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {error && <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{error}</div>}

                  <Button type="submit" className="w-full bg-green-900 hover:bg-emerald-700" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Iniciar Sesión"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registro */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Crear Cuenta</CardTitle>
                <CardDescription>Completa los datos para crear tu cuenta</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label>Nombre Completo</Label>
                    <Input
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Contraseña</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Confirmar Contraseña</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  {error && <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{error}</div>}

                  <Button type="submit" className="w-full bg-green-900 hover:bg-emerald-700" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Crear Cuenta"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={() => setShowSuccessModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Registro exitoso!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">Tu cuenta ha sido creada correctamente. Revisa tu correo para confirmarla.</p>
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
