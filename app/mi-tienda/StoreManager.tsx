"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import { calculateExternalCashbak } from "@/lib/cashbak-calculator"
import { addProduct, updateProduct, deleteProduct, updateStoreDeliveryOptions, updateStoreBankAccount } from "./actions"
import { Pencil, Trash2, Plus, X, Truck, MapPin, Package, ShoppingBag, Banknote, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import type { DeliveryOption } from "@/types/delivery"

function selectVariedBets(bets: Bet[], maxCount = 4): Bet[] {
  if (bets.length <= maxCount) return bets
  const sorted = [...bets].sort((a, b) => a.odd - b.odd)
  const seen = new Set<number>()
  const result: Bet[] = []
  for (let i = 0; i < maxCount; i++) {
    const bet = sorted[Math.round(i * (sorted.length - 1) / (maxCount - 1))]
    if (!seen.has(bet.id)) { seen.add(bet.id); result.push(bet) }
  }
  return result
}

interface Bet {
  id: number
  name: string
  odd: number
  end_date: string
}

interface Store {
  id: string
  name: string
  description: string | null
  category: string | null
  categories: string[] | null
  logo_url: string | null
  delivery_options: DeliveryOption[] | null
  bank_name: string | null
  account_type: string | null
  account_number: string | null
  account_holder: string | null
  rut: string | null
}

const PRODUCT_CATEGORIES: { group: string; items: string[] }[] = [
  { group: "Ropa y accesorios", items: ["Poleras y camisas", "Pantalones y jeans", "Vestidos y faldas", "Chaquetas y abrigos", "Ropa interior y pijamas", "Bolsos y carteras", "Cinturones y billeteras", "Gorros y sombreros", "Bufandas y guantes"] },
  { group: "Calzado", items: ["Zapatillas", "Zapatos", "Botas y botines", "Sandalias y ojotas"] },
  { group: "Tecnología", items: ["Celulares y smartphones", "Computadores y laptops", "Tablets", "Audífonos y parlantes", "Accesorios tech", "Smartwatches"] },
  { group: "Relojes y joyería", items: ["Relojes", "Anillos y pulseras", "Collares y cadenas", "Aretes y aros"] },
  { group: "Deportes", items: ["Ropa deportiva", "Calzado deportivo", "Equipamiento deportivo", "Suplementos deportivos"] },
  { group: "Hogar y decoración", items: ["Muebles", "Decoración", "Utensilios de cocina", "Iluminación", "Ropa de cama y baño"] },
  { group: "Belleza y cuidado personal", items: ["Maquillaje", "Skincare", "Perfumes y colonias", "Cuidado del cabello", "Cuidado corporal"] },
  { group: "Alimentación", items: ["Snacks y dulces", "Bebidas", "Alimentos saludables"] },
  { group: "Juguetes y juegos", items: ["Juguetes para niños", "Juegos de mesa", "Puzzles"] },
  { group: "Videojuegos", items: ["Consolas", "Juegos físicos", "Accesorios gaming", "Merchandising gaming"] },
  { group: "Cartas y coleccionables", items: ["Cartas TCG", "Figuras y coleccionables", "Cómics y manga"] },
  { group: "Música", items: ["Instrumentos", "Accesorios musicales", "Vinilos y CDs"] },
  { group: "Arte y manualidades", items: ["Pinturas y lienzos", "Lápices y marcadores", "Acuarelas y gouache", "Materiales de modelado", "Artesanías", "Fotografía", "Papelería creativa"] },
]

interface StoreProduct {
  id: number
  name: string
  price: number
  cost: number
  margin_pct: number | null
  category_name: string | null
  category_names: string[] | null
  description: string | null
  image: string | null
  images?: string[] | null
  stock: Record<string, number> | null
}

const SIZES = ["S", "M", "L", "XL"]

const FMT = (n: number) => n.toLocaleString("es-CL", { maximumFractionDigits: 0 })

export default function StoreManager({
  store,
  initialProducts,
}: {
  store: Store
  initialProducts: StoreProduct[]
}) {
  const [products, setProducts] = useState<StoreProduct[]>(initialProducts)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<StoreProduct | null>(null)
  const [activeTab, setActiveTab] = useState<"productos" | "entregas" | "pago">("productos")

  // Bank account state
  const [bank, setBank] = useState({
    bank_name: store.bank_name ?? "",
    account_type: store.account_type ?? "",
    account_number: store.account_number ?? "",
    account_holder: store.account_holder ?? "",
    rut: store.rut ?? "",
  })
  const [savingBank, setSavingBank] = useState(false)
  const [bankSaved, setBankSaved] = useState(false)
  const [bankError, setBankError] = useState<string | null>(null)
  const bankComplete = !!(store.bank_name && store.account_number && store.rut)

  // Delivery options state
  const [savedDeliveryOptions, setSavedDeliveryOptions] = useState<DeliveryOption[]>(store.delivery_options ?? [])
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>(store.delivery_options ?? [])
  const [showAddOpt, setShowAddOpt] = useState(false)
  const [newOptName, setNewOptName] = useState("")
  const [newOptPrice, setNewOptPrice] = useState("")
  const [newOptPriceTBD, setNewOptPriceTBD] = useState(false)
  const [newOptType, setNewOptType] = useState<"delivery" | "pickup" | null>(null)
  const [newOptAddress, setNewOptAddress] = useState("")
  const [savingDelivery, setSavingDelivery] = useState(false)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)
  const [deliverySaved, setDeliverySaved] = useState(false)
  const newOptNameRef = useRef<HTMLInputElement>(null)

  const deliveryHasChanges = JSON.stringify(deliveryOptions) !== JSON.stringify(savedDeliveryOptions)

  function openAddOpt() {
    setNewOptType(null)
    setNewOptName("")
    setNewOptPrice("")
    setNewOptPriceTBD(false)
    setNewOptAddress("")
    setShowAddOpt(true)
  }

  function confirmAddOpt() {
    if (!newOptName.trim() || !newOptType) return
    if (newOptType === "pickup" && !newOptAddress.trim()) return
    const opt: DeliveryOption = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      name: newOptName.trim(),
      price: newOptPriceTBD ? 0 : Math.max(0, Number(newOptPrice) || 0),
      priceTBD: newOptPriceTBD || undefined,
      type: newOptType,
      address: newOptType === "pickup" ? newOptAddress.trim() : undefined,
    }
    setDeliveryOptions(prev => [...prev, opt])
    setDeliverySaved(false)
    setShowAddOpt(false)
  }

  function removeDeliveryOption(id: string) {
    setDeliveryOptions(prev => prev.filter(o => o.id !== id))
    setDeliverySaved(false)
  }

  async function saveDeliveryOptions() {
    setSavingDelivery(true)
    setDeliveryError(null)
    const res = await updateStoreDeliveryOptions(deliveryOptions)
    if (res.error) {
      setDeliveryError(res.error)
    } else {
      setSavedDeliveryOptions(deliveryOptions)
      setDeliverySaved(true)
      setTimeout(() => setDeliverySaved(false), 3000)
    }
    setSavingDelivery(false)
  }

  function openAdd() {
    setEditing(null)
    setShowForm(true)
  }
  function openEdit(p: StoreProduct) {
    setEditing(p)
    setShowForm(true)
  }
  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  async function handleSaved(updated: StoreProduct) {
    if (editing) {
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } else {
      // Refetch to get the new ID
      const supabase = createClient()
      const { data } = await supabase
        .from("products")
        .select("id, name, price, cost, margin_pct, category_name, category_names, description, image")
        .eq("store_id", store.id)
        .order("id", { ascending: false })
      if (data) setProducts(data)
    }
    closeForm()
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este producto?")) return
    const res = await deleteProduct(id)
    if (res.error) {
      alert(res.error)
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-900 text-white px-4 pt-8 pb-0">
        <div className="max-w-4xl mx-auto flex items-center gap-4 pb-6">
          <div className="w-14 h-14 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0">
            {store.logo_url ? (
              <Image src={store.logo_url} alt={store.name} width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              <Image src="/img/logo.png" alt="CashBak" width={56} height={56} className="object-contain w-10 h-10" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{store.name}</h1>
            {(store.categories?.length ? store.categories : store.category ? [store.category] : []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {(store.categories?.length ? store.categories : store.category ? [store.category] : []).map(cat => (
                  <span key={cat} className="text-xs bg-white/20 text-green-100 px-2 py-0.5 rounded-full">{cat}</span>
                ))}
              </div>
            )}
            {store.description && <p className="text-green-200 text-sm mt-0.5 line-clamp-1">{store.description}</p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto flex gap-1">
          <button
            onClick={() => setActiveTab("productos")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === "productos"
                ? "bg-gray-50 text-green-900"
                : "text-green-200 hover:text-white hover:bg-green-800"
            }`}
          >
            <Package className="w-4 h-4" />
            Productos
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-normal ${activeTab === "productos" ? "bg-green-100 text-green-800" : "bg-green-800 text-green-200"}`}>
              {products.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("entregas")}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === "entregas"
                ? "bg-gray-50 text-green-900"
                : "text-green-200 hover:text-white hover:bg-green-800"
            }`}
          >
            <Truck className="w-4 h-4" />
            Entregas
            {deliveryHasChanges && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("pago")}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === "pago"
                ? "bg-gray-50 text-green-900"
                : "text-green-200 hover:text-white hover:bg-green-800"
            }`}
          >
            <Banknote className="w-4 h-4" />
            Datos de pago
            {!bankComplete && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
            )}
          </button>
          <Link
            href="/mi-tienda/pedidos"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors text-green-200 hover:text-white hover:bg-green-800"
          >
            <ShoppingBag className="w-4 h-4" />
            Pedidos
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Tab: Productos */}
        {activeTab === "productos" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                Mis productos <span className="text-gray-400 font-normal text-base">({products.length})</span>
              </h2>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-green-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar producto
              </button>
            </div>
            {products.length === 0 && !showForm && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-4xl mb-4">📦</p>
                <p>Aún no tienes productos. Agrega el primero.</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p) => (
                <ProductRow key={p.id} product={p} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}

        {/* Tab: Datos de pago */}
        {activeTab === "pago" && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 max-w-lg">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Datos bancarios</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Aquí recibirás el pago de tus ventas una vez que el pedido sea confirmado por el cliente.
              </p>
            </div>

            {!bankComplete && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <span className="text-red-500 shrink-0">⚠️</span>
                <p className="text-xs text-red-700 font-medium">
                  Sin datos bancarios no podremos transferirte el pago de tus ventas.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nombre del titular</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  placeholder="Como aparece en tu cuenta bancaria"
                  value={bank.account_holder}
                  onChange={e => setBank(b => ({ ...b, account_holder: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">RUT</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  placeholder="12345678-9"
                  value={bank.rut}
                  onChange={e => setBank(b => ({ ...b, rut: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Banco</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
                  value={bank.bank_name}
                  onChange={e => setBank(b => ({ ...b, bank_name: e.target.value }))}
                >
                  <option value="">Selecciona tu banco</option>
                  {["Banco de Chile", "Banco Estado", "Banco Santander", "Mercado Pago", "Banco BCI", "Banco Itaú", "Banco Falabella", "Scotiabank", "Banco Security", "Otro"].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Tipo de cuenta</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
                  value={bank.account_type}
                  onChange={e => setBank(b => ({ ...b, account_type: e.target.value }))}
                >
                  <option value="">Selecciona el tipo</option>
                  {["Cuenta Corriente", "Cuenta Vista", "Cuenta de Ahorro", "Cuenta RUT"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Número de cuenta</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  placeholder="Número de tu cuenta"
                  value={bank.account_number}
                  onChange={e => setBank(b => ({ ...b, account_number: e.target.value }))}
                />
              </div>
            </div>

            {bankError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{bankError}</p>
            )}

            <button
              onClick={async () => {
                setSavingBank(true)
                setBankError(null)
                const res = await updateStoreBankAccount(bank)
                if (res.error) {
                  setBankError(res.error)
                } else {
                  setBankSaved(true)
                  setTimeout(() => setBankSaved(false), 2500)
                }
                setSavingBank(false)
              }}
              disabled={savingBank || !bank.bank_name || !bank.account_number || !bank.rut || !bank.account_holder}
              className="w-full py-3 bg-green-900 text-white rounded-xl font-bold hover:bg-green-800 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {savingBank ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : bankSaved ? (
                <><CheckCircle2 className="w-4 h-4" /> ¡Guardado!</>
              ) : (
                "Guardar datos bancarios"
              )}
            </button>
          </div>
        )}

        {/* Tab: Entregas */}
        {activeTab === "entregas" && (
          <div className={`bg-white rounded-xl border p-5 space-y-4 ${deliveryHasChanges ? "border-amber-300 shadow-amber-100 shadow-md" : "border-gray-200"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Opciones de entrega</h2>
                <p className="text-xs text-gray-400 mt-0.5">Estas son las formas en que tus clientes podrán recibir sus pedidos.</p>
              </div>
              {deliverySaved && !deliveryHasChanges && (
                <span className="shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">✓ Cambios guardados</span>
              )}
            </div>

            {/* Lista de opciones */}
            {deliveryOptions.length === 0 && !showAddOpt ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                Sin opciones de entrega tus clientes no podrán finalizar una compra.
              </p>
            ) : (
              <div className="space-y-2">
                {deliveryOptions.map(opt => (
                  <div key={opt.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                    <div className="flex items-center gap-2.5">
                      {opt.type === "delivery"
                        ? <Truck className="w-4 h-4 text-gray-400 shrink-0" />
                        : <MapPin className="w-4 h-4 text-gray-400 shrink-0" />}
                      <div>
                        <p className="text-sm font-medium text-gray-800">{opt.name}</p>
                        <p className="text-xs text-gray-500">
                          {opt.type === "delivery" ? "Envío a domicilio" : "Retiro presencial"} · {opt.priceTBD ? "Por pagar" : opt.price > 0 ? `$${FMT(opt.price)}` : "Gratis"}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeDeliveryOption(opt.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario nueva opción */}
            {showAddOpt ? (
              <div className="border border-green-200 rounded-xl bg-green-50 p-4 space-y-4">
                {/* Paso 1: tipo */}
                <p className="text-sm font-semibold text-gray-700">¿Qué tipo de entrega es?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => { setNewOptType("pickup"); setTimeout(() => newOptNameRef.current?.focus(), 50) }}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-medium text-sm transition-all ${newOptType === "pickup" ? "border-green-700 bg-white text-green-900 shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
                    <MapPin className="w-6 h-6" />
                    Retiro presencial
                  </button>
                  <button type="button" onClick={() => { setNewOptType("delivery"); setTimeout(() => newOptNameRef.current?.focus(), 50) }}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-medium text-sm transition-all ${newOptType === "delivery" ? "border-green-700 bg-white text-green-900 shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
                    <Truck className="w-6 h-6" />
                    Envío a domicilio
                  </button>
                </div>

                {/* Paso 2: nombre y precio (aparece al elegir tipo) */}
                {newOptType && (
                  <div className="space-y-3 pt-1">
                    <input
                      ref={newOptNameRef}
                      value={newOptName}
                      onChange={e => setNewOptName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && confirmAddOpt()}
                      placeholder={newOptType === "pickup" ? "Ej: Retiro en tienda, Metro Baquedano..." : "Ej: Despacho Starken, Chilexpress..."}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                    />
                    {newOptType === "pickup" && (
                      <input
                        value={newOptAddress}
                        onChange={e => setNewOptAddress(e.target.value)}
                        placeholder="Dirección de retiro (obligatorio)"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                      />
                    )}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-600">Costo para el cliente</p>
                      <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs">
                        <button type="button" onClick={() => setNewOptPriceTBD(false)}
                          className={`flex-1 py-2 font-medium transition-colors ${!newOptPriceTBD ? "bg-green-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                          Monto fijo
                        </button>
                        <button type="button" onClick={() => setNewOptPriceTBD(true)}
                          className={`flex-1 py-2 font-medium transition-colors ${newOptPriceTBD ? "bg-green-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                          Por pagar
                        </button>
                      </div>
                      {!newOptPriceTBD ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input type="number" min="0" value={newOptPrice}
                            onChange={e => setNewOptPrice(e.target.value)}
                            placeholder="0 = gratis"
                            className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                          El costo se coordina directamente con el cliente, no se suma al total de la compra.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={confirmAddOpt}
                    disabled={!newOptName.trim() || !newOptType || (newOptType === "pickup" && !newOptAddress.trim())}
                    className="flex-1 py-2.5 bg-green-900 text-white rounded-lg font-semibold text-sm hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Confirmar
                  </button>
                  <button type="button" onClick={() => setShowAddOpt(false)}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={openAddOpt}
                className="flex items-center gap-2 text-sm font-semibold text-green-800 hover:text-green-900 border border-dashed border-green-300 hover:border-green-500 rounded-lg px-4 py-2.5 w-full justify-center transition-colors bg-white">
                <Plus className="w-4 h-4" /> Nueva opción de entrega
              </button>
            )}

            {/* Guardar */}
            {deliveryHasChanges && !showAddOpt && (
              <div className="border-t border-amber-200 pt-4 space-y-3">
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <span className="text-amber-500 text-base shrink-0">⚠️</span>
                  <p className="text-xs text-amber-800 font-medium">
                    Tienes cambios sin guardar. Guarda para que tus clientes vean las opciones actualizadas.
                  </p>
                </div>
                {deliveryError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{deliveryError}</p>
                )}
                <button onClick={saveDeliveryOptions} disabled={savingDelivery}
                  className="w-full py-3 bg-green-900 text-white rounded-xl font-bold hover:bg-green-800 transition-colors disabled:opacity-50 text-sm">
                  {savingDelivery ? "Guardando..." : "Guardar opciones de entrega"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <ProductFormModal
          storeId={store.id}
          initial={editing}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: StoreProduct
  onEdit: (p: StoreProduct) => void
  onDelete: (id: number) => void
}) {
  const marginPct = product.margin_pct ?? 0
  const ganancia = Math.round(marginPct * product.price) - Math.round(0.02 * product.price)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {product.image ? (
          <Image src={product.image} alt={product.name} width={64} height={64} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{product.name}</p>
        <p className="text-sm text-gray-600">${FMT(product.price)}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-xs text-emerald-700 font-semibold">
            Ganas ${FMT(ganancia)} por venta
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={() => onEdit(product)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function ProductFormModal({
  storeId,
  initial,
  onClose,
  onSaved,
}: {
  storeId: string
  initial: StoreProduct | null
  onClose: () => void
  onSaved: (p: StoreProduct) => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [price, setPrice] = useState(initial?.price.toString() ?? "")
  const [cost, setCost] = useState(initial?.cost.toString() ?? "")
  const [categoryNames, setCategoryNames] = useState<string[]>(() => {
    if (initial?.category_names?.length) return initial.category_names
    if (initial?.category_name) return [initial.category_name]
    return []
  })
  const [description, setDescription] = useState(initial?.description ?? "")
  const calcularRecomendado = (p: number) => Math.max(0, Math.round(p - (0.15 * p / 1.5) / 0.80))
  const [gananciaCLP, setGananciaCLP] = useState<number>(() =>
    initial?.margin_pct != null && initial.price > 0
      ? Math.round(initial.margin_pct * initial.price)
      : calcularRecomendado(Number(initial?.price ?? 0))
  )
  const initStockMode = (): "sizes" | "single" => {
    if (!initial?.stock) return "sizes"
    const keys = Object.keys(initial.stock)
    return keys.length === 1 && keys[0] === "Única" ? "single" : "sizes"
  }
  const [stockMode, setStockMode] = useState<"sizes" | "single">(initStockMode)
  const [stockSizes, setStockSizes] = useState<Record<string, number>>(() => {
    if (!initial?.stock || initStockMode() === "single") return { S: 0, M: 0, L: 0, XL: 0 }
    return { S: initial.stock.S ?? 0, M: initial.stock.M ?? 0, L: initial.stock.L ?? 0, XL: initial.stock.XL ?? 0 }
  })
  const [stockSingle, setStockSingle] = useState<number>(() =>
    initial?.stock?.["Única"] ?? 0
  )
  // Multi-image: lista de {url: string (existente o objectURL), file: File|null}
  const [imageSlots, setImageSlots] = useState<{ url: string; file: File | null }[]>(() => {
    const existing: string[] = initial?.images?.length ? initial.images : initial?.image ? [initial.image] : []
    return existing.map(url => ({ url, file: null }))
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bets, setBets] = useState<Bet[]>([])
  const [selectedBetId, setSelectedBetId] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("bets")
      .select("id, name, odd, end_date")
      .eq("active", true)
      .gt("end_date", new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())
      .order("end_date", { ascending: true })
      .then(({ data }: { data: Bet[] | null }) => {
        if (data && data.length > 0) {
          const selected = selectVariedBets(data, 4)
          setBets(selected)
          setSelectedBetId(selected[0].id)
        }
      })
  }, [])

  const selectedBet = bets.find((b) => b.id === selectedBetId) ?? null
  const cuota = selectedBet?.odd ?? 2.0

  const priceNum = Number(price) || 0
  const costNum = Number(cost) || 0
  const valid = priceNum > costNum && costNum > 0

  // Recomendación del slider
  const pricing = useMemo(() => {
    if (!valid) return null
    const recMonto = calcularRecomendado(priceNum)
    const recFallbackMonto = Math.round(priceNum - 0.35 * (priceNum - costNum))
    const actualRec = recMonto > costNum ? recMonto : (recFallbackMonto > costNum ? recFallbackMonto : null)
    return { recMonto: actualRec }
  }, [priceNum, costNum, valid])

  // Máximo cashback posible con el monto recomendado y los eventos activos
  const maxCashbackAtRec = useMemo(() => {
    if (!valid || !pricing?.recMonto || bets.length === 0) return null
    return bets.reduce((acc, bet) => {
      const r = calculateExternalCashbak({
        precioVenta: priceNum,
        costo: costNum,
        cuota: bet.odd,
        margenVendedorPct: pricing.recMonto! / priceNum,
      })
      return Math.max(acc, r.cashbackPct)
    }, 0)
  }, [valid, pricing, bets, priceNum, costNum])

  // Cuando cambia el precio y es producto nuevo, pre-selecciona el monto recomendado
  useEffect(() => {
    if (!initial) setGananciaCLP(calcularRecomendado(priceNum))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceNum])

  const sliderMax = Math.round(priceNum * 0.98)
  const sliderStep = Math.max(1, 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, sliderMax))) - 2))
  const tarifaProcesamientoEstimada = Math.round(0.02 * priceNum)
  const ingresoNetoEstimado = gananciaCLP - tarifaProcesamientoEstimada
  const gananciaBajoElCosto = costNum > 0 && ingresoNetoEstimado < costNum

  const sim = useMemo(() => {
    if (!valid) return null
    return calculateExternalCashbak({
      precioVenta: priceNum,
      costo: costNum,
      cuota,
      margenVendedorPct: priceNum > 0 ? gananciaCLP / priceNum : 0,
    })
  }, [priceNum, costNum, gananciaCLP, cuota, valid])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const remaining = 4 - imageSlots.length
    const toAdd = files.slice(0, remaining)
    for (const file of toAdd) {
      if (file.size > 5 * 1024 * 1024) { setError("Cada imagen no puede superar los 5 MB."); return }
    }
    setImageSlots(prev => [...prev, ...toAdd.map(f => ({ url: URL.createObjectURL(f), file: f }))])
    setError(null)
    e.target.value = ""
  }

  function removeImageSlot(index: number) {
    setImageSlots(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setSaving(true)
    setError(null)

    const supabase = createClient()

    // Subir imágenes nuevas (file !== null), conservar URLs existentes
    setUploading(true)
    const finalImages: string[] = []
    for (const slot of imageSlots) {
      if (!slot.file) { finalImages.push(slot.url); continue }
      const ext = slot.file.name.split(".").pop()
      const path = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, slot.file, { upsert: true })
      if (upErr) {
        setError(`Error al subir imagen: ${upErr.message}`)
        setUploading(false)
        setSaving(false)
        return
      }
      finalImages.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl)
    }
    setUploading(false)
    const imageUrl = finalImages[0] ?? null

    const stockPayload: Record<string, number> = stockMode === "sizes"
      ? { S: stockSizes.S, M: stockSizes.M, L: stockSizes.L, XL: stockSizes.XL }
      : { "Única": stockSingle }

    if (Object.values(stockPayload).reduce((a, b) => a + b, 0) === 0) {
      setError("Debes agregar al menos 1 unidad de stock.")
      setSaving(false)
      return
    }

    const payload = {
      name,
      price: priceNum,
      cost: costNum,
      margin_pct: priceNum > 0 ? gananciaCLP / priceNum : 0,
      net_margin: sim?.margenVendedor ?? 0,
      category_name: categoryNames[0] ?? "",
      category_names: categoryNames,
      description,
      image_url: imageUrl,
      images: finalImages,
      stock: stockPayload,
    }

    const res = initial
      ? await updateProduct(initial.id, payload)
      : await addProduct(payload)

    if (res.error) {
      setError(res.error)
      setSaving(false)
      return
    }

    onSaved({
      id: initial?.id ?? 0,
      name: payload.name,
      price: payload.price,
      cost: payload.cost,
      margin_pct: payload.margin_pct,
      category_name: payload.category_name,
      category_names: payload.category_names,
      description: payload.description || null,
      image: imageUrl,
      images: finalImages,
      stock: stockPayload,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{initial ? "Editar producto" : "Nuevo producto"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
          {/* Imágenes (máx 4) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fotos del producto <span className="text-gray-400 font-normal">({imageSlots.length}/4)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {imageSlots.map((slot, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <Image src={slot.url} alt="" fill className="object-cover" sizes="96px" />
                  <button
                    type="button"
                    onClick={() => removeImageSlot(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-green-800 text-white px-1.5 py-0.5 rounded">Principal</span>}
                </div>
              ))}
              {imageSlots.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-green-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-green-700 transition-colors"
                >
                  <span className="text-xl">📷</span>
                  <span className="text-[10px] font-medium">Agregar</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">PNG, JPG · Máx 5 MB por foto · La primera foto es la principal</p>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="Ej: Camiseta Real Madrid 2024"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categorías * <span className="text-gray-400 font-normal">(máx. 3)</span>
            </label>
            {categoryNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {categoryNames.map(cat => (
                  <span key={cat} className="flex items-center gap-1 bg-green-900 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    {cat}
                    <button type="button" onClick={() => setCategoryNames(categoryNames.filter(c => c !== cat))} className="hover:text-green-300 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            {categoryNames.length < 3 && (
              <select
                value=""
                onChange={(e) => { if (e.target.value && !categoryNames.includes(e.target.value)) setCategoryNames([...categoryNames, e.target.value]) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
              >
                <option value="">Agregar categoría...</option>
                {PRODUCT_CATEGORIES.map(({ group, items }) => (
                  <optgroup key={group} label={group}>
                    {items.filter(item => !categoryNames.includes(item)).map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>

          {/* Precio y Costo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio de venta *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="20000"
                  className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu costo *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="10000"
                  className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>
            </div>
          </div>

          {/* Simulador de margen */}
          {valid ? (
            <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">

              {/* Selector de evento */}
              {bets.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Simular con evento real</p>
                  <div className="flex flex-col gap-1.5">
                    {bets.map((bet) => (
                      <button
                        key={bet.id}
                        type="button"
                        onClick={() => setSelectedBetId(bet.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left text-sm transition-colors ${
                          selectedBetId === bet.id
                            ? "bg-green-900 border-green-900 text-white"
                            : "bg-white border-gray-200 text-gray-700 hover:border-green-700"
                        }`}
                      >
                        <span className="font-medium truncate">{bet.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Slider ¿Cuánto quieres recibir? */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">¿Cuánto quieres recibir por venta?</label>
                  <span className="text-sm font-bold text-green-900">${FMT(gananciaCLP)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  step={sliderStep}
                  value={Math.min(gananciaCLP, sliderMax)}
                  onChange={(e) => setGananciaCLP(Number(e.target.value))}
                  className="w-full accent-green-900"
                />

                {/* Alerta si ganancia bajo el costo */}
                {gananciaBajoElCosto && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ⚠️ Estás eligiendo recibir menos que tu costo declarado (${FMT(costNum)}). Estarías vendiendo a pérdida.
                  </p>
                )}

                {/* Recomendación con botón Aplicar */}
                {pricing?.recMonto && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-emerald-800">
                      💡 Recibiendo <strong>${FMT(pricing.recMonto)}</strong> puedes ofrecer hasta{" "}
                      <strong>{maxCashbackAtRec ?? 0}% de cashback</strong> con los eventos actuales.
                    </p>
                    <button
                      type="button"
                      onClick={() => setGananciaCLP(pricing.recMonto!)}
                      className="ml-3 shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>

              {sim && (
                <>
                  {/* Desglose */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-500">Tu ingreso por venta</span>
                        <p className="text-xs text-gray-400">Bruto, antes del costo de procesamiento</p>
                      </div>
                      <span className="font-semibold text-gray-800">${FMT(sim.margenVendedor)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-500">Costo procesamiento Transbank</span>
                        <p className="text-xs text-gray-400">Cubre todos los medios de pago</p>
                      </div>
                      <span className="text-gray-600">- ${FMT(sim.tarifaProcesamiento)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5">
                      <div>
                        <span className="text-gray-800">Tu ingreso neto por venta</span>
                        <p className="text-xs text-gray-400 font-normal">Monto exacto que recibirás, sin variaciones</p>
                      </div>
                      <span className="text-emerald-700">${FMT(sim.margenVendedorNeto)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                      <span className="text-gray-500">Comisión CashBak</span>
                      <span className="text-gray-600">${FMT(sim.comisionDisplay)}</span>
                    </div>
                    <div className="flex justify-between text-sm gap-3">
                      <div className="min-w-0">
                        <span className="text-gray-500">CashBak al cliente</span>
                        <p className="text-xs text-gray-400 mt-0.5">Simulación con el evento seleccionado.<br/>Varía según el evento que elija el cliente,<br/>pero nunca afecta tu ingreso neto.</p>
                      </div>
                      <span className="font-semibold text-gray-800 shrink-0">{sim.cashbackPct}% · ${FMT(sim.cashbackMonto)}</span>
                    </div>
                    <div className={`flex justify-between text-sm py-1.5 rounded ${sim.margenVendedorNeto < costNum ? "px-2 bg-red-50 border border-red-200" : ""}`}>
                      <div>
                        <span className={sim.margenVendedorNeto < costNum ? "text-red-600 font-semibold" : "text-gray-500"}>Ganancia neta estimada</span>
                        <p className="text-xs text-gray-400">Ilustrativo — descontando tu costo declarado</p>
                        {sim.margenVendedorNeto < costNum && <p className="text-xs text-red-500">⚠️ Tu ingreso neto es menor que tu costo declarado. Estarías vendiendo a pérdida.</p>}
                      </div>
                      <span className={`font-semibold ${sim.margenVendedorNeto < costNum ? "text-red-600" : "text-gray-600"}`}>
                        {sim.gananciaNeta < 0 ? `-$${FMT(Math.abs(sim.gananciaNeta))}` : `$${FMT(sim.gananciaNeta)}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                      {selectedBet
                        ? `Simulado con el evento "${selectedBet.name}".`
                        : "Selecciona un evento para simular."}{" "}
                      El cashback varía según el evento activo.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (priceNum > 0 || costNum > 0) ? (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              El precio de venta debe ser mayor al costo.
            </p>
          ) : null}

          {/* Stock */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Stock disponible</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs">
                <button type="button"
                  onClick={() => setStockMode("sizes")}
                  className={`px-3 py-1.5 font-medium transition-colors ${stockMode === "sizes" ? "bg-green-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                >
                  Con tallas
                </button>
                <button type="button"
                  onClick={() => setStockMode("single")}
                  className={`px-3 py-1.5 font-medium transition-colors ${stockMode === "single" ? "bg-green-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                >
                  Sin tallas
                </button>
              </div>
            </div>

            {stockMode === "sizes" ? (
              <div className="grid grid-cols-4 gap-2">
                {SIZES.map((s) => (
                  <div key={s} className="text-center">
                    <div className="text-xs text-gray-500 mb-1 font-medium">{s}</div>
                    <input
                      type="number" min={0} max={999}
                      value={stockSizes[s]}
                      onChange={(e) => setStockSizes(prev => ({ ...prev, [s]: Math.max(0, Number(e.target.value)) }))}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-700"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Cantidad disponible</label>
                <input
                  type="number" min={0} max={9999}
                  value={stockSingle}
                  onChange={(e) => setStockSingle(Math.max(0, Number(e.target.value)))}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Describe el producto brevemente..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || !valid || !name.trim() || categoryNames.length === 0}
            className="w-full py-3 bg-green-900 text-white rounded-xl font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Subiendo imagen..." : saving ? "Guardando..." : initial ? "Guardar cambios" : "Agregar producto"}
          </button>
        </form>
      </div>
    </div>
  )
}
