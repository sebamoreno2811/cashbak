"use client"

import { useEffect, useState } from "react"
import { formatRut } from "@/lib/rut"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, Banknote, User, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveShippingAddress } from "@/app/actions/shipping"

const BANKS = [
  "Banco de Chile", "BancoEstado", "Santander", "BCI",
  "Itaú", "Scotiabank", "Falabella", "Ripley",
  "MACH", "Mercado Pago", "Otro",
]

const ACCOUNT_TYPES = ["Cuenta Corriente", "Cuenta Vista / RUT", "Cuenta de Ahorro"]

interface BankAccount {
  id?: string
  rut: string
  bank_name: string
  account_type: string
  account_number: string
}

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")

  const [form, setForm] = useState<BankAccount>({
    rut: "",
    bank_name: "",
    account_type: "",
    account_number: "",
  })

  const [shippingForm, setShippingForm] = useState({
    ciudad: "",
    comuna: "",
    calle: "",
    numero_calle: "",
    numero_casa_depto: "",
  })
  const [savingShipping, setSavingShipping] = useState(false)
  const [savedShipping, setSavedShipping] = useState(false)
  const [shippingError, setShippingError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/"); return }

      setUserEmail(user.email ?? "")
      setUserName(user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "")

      const { data } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("customer_id", user.id)
        .maybeSingle()

      if (data) {
        setForm({
          rut: data.rut ?? "",
          bank_name: data.bank_name ?? "",
          account_type: data.account_type ?? "",
          account_number: String(data.account_number ?? ""),
        })
      }

      const { data: shippingData } = await supabase
        .from("customer_shipping_details")
        .select("*")
        .eq("customer_id", user.id)
        .maybeSingle()

      if (shippingData) {
        setShippingForm({
          ciudad: shippingData.ciudad ?? "",
          comuna: shippingData.comuna ?? "",
          calle: shippingData.calle ?? "",
          numero_calle: shippingData.numero_calle ?? "",
          numero_casa_depto: shippingData.numero_casa_depto ?? "",
        })
      }

      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.rut.trim()) return setError("Ingresa tu RUT")
    if (!form.bank_name) return setError("Selecciona un banco")
    if (!form.account_type) return setError("Selecciona el tipo de cuenta")
    if (!form.account_number.trim()) return setError("Ingresa el número de cuenta")

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/"); return }

    const { error: err } = await supabase
      .from("bank_accounts")
      .upsert({
        customer_id: user.id,
        rut: form.rut.trim(),
        bank_name: form.bank_name,
        account_type: form.account_type,
        account_number: form.account_number.trim(),
      }, { onConflict: "customer_id" })

    setSaving(false)
    if (err) return setError(err.message)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault()
    setShippingError(null)
    if (!shippingForm.ciudad.trim()) return setShippingError("Ingresa la ciudad")
    if (!shippingForm.comuna.trim()) return setShippingError("Ingresa la comuna")
    if (!shippingForm.calle.trim()) return setShippingError("Ingresa la calle")
    if (!shippingForm.numero_calle.trim()) return setShippingError("Ingresa el número de calle")

    setSavingShipping(true)
    const result = await saveShippingAddress(shippingForm)
    setSavingShipping(false)
    if (result.error) return setShippingError(result.error)
    setSavedShipping(true)
    setTimeout(() => setSavedShipping(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-green-700" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mi Perfil</h1>
      <p className="text-sm text-gray-500 mb-8">Gestiona tus datos de transferencia para recibir tu CashBak</p>

      {/* Info de cuenta */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-900 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">{userName}</p>
          <p className="text-sm text-gray-500">{userEmail}</p>
        </div>
      </div>

      {/* Dirección de envío */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <MapPin className="w-4 h-4 text-green-700" />
          <h2 className="font-semibold text-gray-800">Dirección de envío</h2>
        </div>

        <form onSubmit={handleSaveShipping} className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ciudad</Label>
              <Input
                placeholder="Santiago"
                value={shippingForm.ciudad}
                onChange={e => setShippingForm(f => ({ ...f, ciudad: e.target.value }))}
              />
            </div>
            <div>
              <Label>Comuna</Label>
              <Input
                placeholder="Providencia"
                value={shippingForm.comuna}
                onChange={e => setShippingForm(f => ({ ...f, comuna: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Calle</Label>
            <Input
              placeholder="Av. Providencia"
              value={shippingForm.calle}
              onChange={e => setShippingForm(f => ({ ...f, calle: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Número</Label>
              <Input
                placeholder="1234"
                value={shippingForm.numero_calle}
                onChange={e => setShippingForm(f => ({ ...f, numero_calle: e.target.value }))}
              />
            </div>
            <div>
              <Label>Dpto / Casa</Label>
              <Input
                placeholder="Apto 5B"
                value={shippingForm.numero_casa_depto}
                onChange={e => setShippingForm(f => ({ ...f, numero_casa_depto: e.target.value }))}
              />
            </div>
          </div>

          {shippingError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{shippingError}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-green-900 hover:bg-green-800"
            disabled={savingShipping}
          >
            {savingShipping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : savedShipping ? <CheckCircle className="w-4 h-4 mr-2" /> : null}
            {savingShipping ? "Guardando..." : savedShipping ? "¡Guardado!" : "Guardar dirección"}
          </Button>
        </form>
      </div>

      {/* Datos bancarios */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <Banknote className="w-4 h-4 text-green-700" />
          <h2 className="font-semibold text-gray-800">Datos de transferencia</h2>
        </div>

        <form onSubmit={handleSave} className="px-5 py-5 space-y-4">
          <div>
            <Label>RUT</Label>
            <Input
              placeholder="12.345.678-9"
              value={form.rut}
              onChange={e => setForm(f => ({ ...f, rut: formatRut(e.target.value) }))}
            />
          </div>

          <div>
            <Label>Banco</Label>
            <select
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              value={form.bank_name}
              onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
            >
              <option value="">Selecciona un banco</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <Label>Tipo de cuenta</Label>
            <select
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              value={form.account_type}
              onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
            >
              <option value="">Selecciona el tipo</option>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <Label>Número de cuenta</Label>
            <Input
              placeholder="00012345678"
              value={form.account_number}
              onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-green-900 hover:bg-green-800"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4 mr-2" /> : null}
            {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar datos"}
          </Button>
        </form>
      </div>
    </div>
  )
}
