"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/utils/supabase/client"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const BANK_OPTIONS = [
  "Banco de Chile",
  "Banco Estado",
  "Banco Santander",
  "Mercado Pago",
  "Banco BCI",
  "Banco Itaú",
  "Banco Falabella",
  "Scotiabank",
  "Banco Security",
  "Otro",
]

const ACCOUNT_TYPES = ["Cuenta Corriente", "Cuenta Vista", "Cuenta de Ahorro", "Cuenta RUT"]

interface AuthFormProps {
  onSuccess?: () => void
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    bankName: "",
    accountType: "",
    accountNumber: "",
    rut: "",
  })

  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

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

    if (registerData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    if (!/^\+569\d{8}$/.test(registerData.phone)) {
      setError("El número debe comenzar con +569 seguido de 8 dígitos")
      setIsLoading(false)
      return
    }

    if (!/^[0-9]+-[0-9Kk]$/.test(registerData.rut)) {
      setError("Formato de RUT inválido (ej: 12345678-9 o 12345678-K)")
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

      if (authError) throw authError

      if (authData.user) {
        await supabase.from("customers").insert({
          id: authData.user.id,
          full_name: registerData.fullName,
          email: registerData.email,
          phone: registerData.phone,
        })

        await supabase.from("bank_accounts").insert({
          customer_id: authData.user.id,
          bank_name: registerData.bankName,
          account_type: registerData.accountType,
          account_number: registerData.accountNumber,
          rut: registerData.rut,
        })

        setRegisterData({
          email: "",
          password: "",
          confirmPassword: "",
          fullName: "",
          phone: "+569",
          bankName: "",
          accountType: "",
          accountNumber: "",
          rut: "",
        })

        setShowSuccessModal(true)
      }
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

                  {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{error}</div>
                  )}

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
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Datos Personales</h3>

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
                  </div>

                  <div className="pt-4 space-y-4 border-t">
                    <h3 className="text-sm font-medium text-gray-900">Datos Bancarios para CashBak</h3>
                    <p className="px-3 py-1 mt-1 text-xs text-green-900 bg-green-100 rounded-md">
                      Es necesario que ingreses esta información para que podamos depositarte el CashBak respectivo de tu compra!.
                    </p>

                    <div>
                      <Label>Banco</Label>
                      <Select
                        value={registerData.bankName}
                        onValueChange={(value) => setRegisterData({ ...registerData, bankName: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {BANK_OPTIONS.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                              {bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tipo de Cuenta</Label>
                      <Select
                        value={registerData.accountType}
                        onValueChange={(value) => setRegisterData({ ...registerData, accountType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCOUNT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Número de Cuenta</Label>
                      <Input
                        value={registerData.accountNumber}
                        onChange={(e) => setRegisterData({ ...registerData, accountNumber: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label>RUT</Label>
                      <Input
                        value={registerData.rut}
                        onChange={(e) => setRegisterData({ ...registerData, rut: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{error}</div>
                  )}

                  <Button type="submit" className="w-full bg-green-900 hover:bg-emerald-700" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Crear Cuenta"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de éxito */}
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
                onSuccess?.() // Cierra el modal externo
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
