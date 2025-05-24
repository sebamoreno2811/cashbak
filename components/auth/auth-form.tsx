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

const BANK_OPTIONS = [
  "Banco de Chile",
  "Banco Estado",
  "Banco Santander",
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
  const [success, setSuccess] = useState<string | null>(null)

  // Estados para login
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  // Estados para registro
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (error) throw error

      setSuccess("¡Inicio de sesión exitoso!")
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

    // Validaciones
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

    if (!/^[0-9]+-[0-9K]$/.test(registerData.rut)) {
      setError("Formato de RUT inválido (ej: 12345678-9 o 12345678-K)")
      setIsLoading(false)
      return
    }

    try {
      // Registrar usuario en Supabase Auth
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
        // Insertar datos del cliente en la tabla customers
        const { error: customerError } = await supabase.from("customers").insert({
          id: authData.user.id,
          full_name: registerData.fullName,
          email: registerData.email,
          phone: registerData.phone,
        })

        if (customerError) {
          console.error("Error al crear perfil de cliente:", customerError)
        }

        // Insertar datos bancarios
        const { error: bankError } = await supabase.from("bank_accounts").insert({
          customer_id: authData.user.id,
          bank_name: registerData.bankName,
          account_type: registerData.accountType,
          account_number: registerData.accountNumber,
          rut: registerData.rut,
        })

        if (bankError) {
          console.error("Error al guardar datos bancarios:", bankError)
        }

        setSuccess("¡Registro exitoso! Revisa tu email para confirmar tu cuenta.")

        // Limpiar formulario
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
      }
    } catch (error: any) {
      setError(error.message || "Error al registrar usuario")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
          <TabsTrigger value="register">Registrarse</TabsTrigger>
        </TabsList>

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">{error}</div>
        )}

        {success && (
          <div className="p-3 mt-4 text-sm text-green-700 bg-green-100 border border-green-300 rounded-md">
            {success}
          </div>
        )}

        {/* Tab de Login */}
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>Ingresa tus credenciales para acceder a tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="login-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
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

                <Button type="submit" className="w-full bg-green-900 hover:bg-emerald-700" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Registro */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Crear Cuenta</CardTitle>
              <CardDescription>Completa todos los datos para crear tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Datos personales */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Datos Personales</h3>

                  <div>
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+569XXXXXXXX"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        value={registerData.password}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
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

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Datos bancarios */}
                <div className="pt-4 space-y-4 border-t">
                  <h3 className="text-sm font-medium text-gray-900">Datos Bancarios para CashBak</h3>

                  <div>
                    <Label htmlFor="bankName">Banco</Label>
                    <Select
                      value={registerData.bankName}
                      onValueChange={(value) => setRegisterData((prev) => ({ ...prev, bankName: value }))}
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
                    <Label htmlFor="accountType">Tipo de Cuenta</Label>
                    <Select
                      value={registerData.accountType}
                      onValueChange={(value) => setRegisterData((prev) => ({ ...prev, accountType: value }))}
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
                    <Label htmlFor="accountNumber">Número de Cuenta</Label>
                    <Input
                      id="accountNumber"
                      value={registerData.accountNumber}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="Solo números"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="rut">RUT</Label>
                    <Input
                      id="rut"
                      value={registerData.rut}
                      onChange={(e) => setRegisterData((prev) => ({ ...prev, rut: e.target.value }))}
                      placeholder="12345678-9"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-green-900 hover:bg-emerald-700" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    "Crear Cuenta"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
