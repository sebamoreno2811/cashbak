"use client"

import { Button } from "@/components/ui/button"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-8 text-3xl font-bold text-center">Contáctanos</h1>

        <div className="max-w-xl p-6 mx-auto space-y-6 rounded-lg shadow-sm bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold">Correo Electrónico</h2>
            <p className="text-gray-700">cashbak.ops@gmail.com</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Redes Sociales</h2>
            <p className="text-gray-700">Instagram: <a href="https://instagram.com/cashbak.oficial" className="text-emerald-700 hover:underline">@cashbak.oficial</a></p>
          </div>

          <div className="pt-4">
            <Button asChild>
              <a href="/">Volver al inicio</a>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
