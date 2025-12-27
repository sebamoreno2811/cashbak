"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { Loader2 } from "lucide-react"
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

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // -------------------------
  // Google OAuth only
  // -------------------------
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Asegúrate que redirect apunta a la ruta de callback del app router
      const redirectTo = `${window.location.origin}/auth/callback?next=/`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      })

      if (error) {
        setError(error.message || "Error iniciando sesión con Google")
        setIsLoading(false)
      }
      // Si todo OK, Supabase redirige hacia Google (no llegamos a este punto)
    } catch (err: any) {
      setError(err?.message || "Error iniciando sesión con Google")
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="w-full max-w-md mx-auto">
        <Tabs defaultValue="login" onValueChange={() => setError(null)}>
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Iniciar sesión</CardTitle>
                <CardDescription>
                  Ingresa a tu cuenta usando Google
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Botón Google */}
                <div className="mt-4">
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

                {error && (
                  <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal opcional */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Hecho!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-700">Operación completada.</p>
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