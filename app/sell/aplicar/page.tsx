"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { notifyStoreSubmitted } from "@/app/stores/actions"

const CATEGORIES = [
  "Ropa y accesorios",
  "Calzado",
  "Tecnología",
  "Relojes y joyería",
  "Deportes",
  "Hogar y decoración",
  "Belleza y cuidado personal",
  "Alimentación",
  "Juguetes y juegos",
  "Videojuegos",
  "Cartas y coleccionables",
  "Música",
  "Arte",
  "Manualidades y artesanías",
  "Otro",
]

export default function AplicarPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState<"loading" | "ok" | "no-auth">("loading")

  useEffect(() => {
    createClient().auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setAuthChecked(data.user ? "ok" : "no-auth")
    })
  }, [])

  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [instagram, setInstagram] = useState("")
  const [facebook, setFacebook] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError("El logo no puede superar los 2 MB.")
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login?redirect=/sell/aplicar")
      return
    }

    // Verificar que el usuario no tenga ya una tienda
    const { data: existing } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle()

    if (existing) {
      setError("Ya tienes una tienda registrada. Cada cuenta puede tener solo una tienda.")
      setLoading(false)
      return
    }

    // Subir logo si hay uno
    let logoUrl: string | null = null
    if (logoFile) {
      const ext = logoFile.name.split(".").pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("store-logos")
        .upload(path, logoFile, { upsert: true })

      if (uploadError) {
        setError("Error al subir el logo. Intenta nuevamente.")
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage.from("store-logos").getPublicUrl(path)
      logoUrl = urlData.publicUrl
    }

    const { error: insertError } = await supabase.from("stores").insert({
      owner_id: user.id,
      name: name.trim(),
      category: category || null,
      description: description.trim() || null,
      email: email.trim() || null,
      whatsapp: phone.trim() || null,
      instagram: instagram.trim() || null,
      facebook: facebook.trim() || null,
      tiktok: tiktok.trim() || null,
      logo_url: logoUrl,
    })

    if (insertError) {
      setError("Hubo un error al enviar tu solicitud. Intenta nuevamente.")
      setLoading(false)
      return
    }

    // Enviar emails (no bloquea si falla)
    const { data: newStore } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (newStore) {
      await notifyStoreSubmitted(newStore.id).catch(() => {})
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (authChecked === "loading") return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-green-700 rounded-full border-t-transparent animate-spin" />
    </div>
  )

  if (authChecked === "no-auth") return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">🏪</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Necesitas una cuenta</h2>
        <p className="text-gray-500 text-sm mb-6">
          Crea una cuenta o inicia sesión para solicitar la apertura de tu tienda en CashBak.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/login" className="w-full py-2.5 bg-green-900 text-white rounded-xl font-semibold text-sm hover:bg-green-800 transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/signup" className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:border-gray-400 transition-colors">
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  )

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800">¡Solicitud enviada!</h1>
          <p className="text-gray-600">
            Revisaremos tu solicitud y te contactaremos pronto para confirmar tu tienda en CashBak.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-3 bg-green-900 text-white rounded-md font-semibold hover:bg-green-800 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="py-14 bg-green-900 text-white text-center px-4">
        <h1 className="text-4xl font-bold mb-3">Abre tu tienda en CashBak</h1>
        <p className="text-green-200 text-lg max-w-xl mx-auto">
          Completa el formulario y revisaremos tu solicitud. ¿Quieres entender cómo funciona el cashback primero?
        </p>
        <Link
          href="/sell"
          className="inline-block mt-6 px-5 py-2.5 rounded-md border border-white text-white hover:bg-white hover:text-green-900 font-semibold text-sm transition-colors"
        >
          Ver simulador de cashback →
        </Link>
      </section>

      {/* Formulario */}
      <section className="container mx-auto px-4 py-12 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Datos principales */}
          <Card>
            <CardContent className="pt-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-800">Tu tienda</h2>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la tienda *</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Relojes X"
                  maxLength={80}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <select
                  id="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                >
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">¿Qué vendes? (opcional)</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe brevemente tus productos..."
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none"
                />
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo de la tienda (opcional)</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-5 flex flex-col items-center gap-3 hover:border-green-600 transition-colors"
                >
                  {logoPreview ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-200">
                      <Image src={logoPreview} alt="Logo preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
                      🏪
                    </div>
                  )}
                  <p className="text-sm text-gray-500 text-center">
                    {logoPreview ? "Haz clic para cambiar" : "Haz clic para subir tu logo"}<br />
                    <span className="text-xs text-gray-400">PNG, JPG o WEBP · Máx 2 MB</span>
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardContent className="pt-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-800">Contacto</h2>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Número de teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </CardContent>
          </Card>

          {/* Redes sociales */}
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Redes sociales</h2>
                <p className="text-sm text-gray-400">Opcional — aparecerán en tu tienda</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">@</span>
                  <Input
                    id="instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="tunombre"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">fb.com/</span>
                  <Input
                    id="facebook"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="tupagina"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">@</span>
                  <Input
                    id="tiktok"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="tunombre"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-800">
              Tu solicitud será revisada por el equipo de CashBak antes de publicarse.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !category || !email.trim() || !phone.trim()}
            className="w-full py-3 bg-green-900 text-white rounded-md font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Quieres simular el cashback antes?{" "}
          <Link href="/sell" className="text-green-700 font-semibold hover:underline">
            Ir al simulador
          </Link>
        </p>
      </section>
    </div>
  )
}
