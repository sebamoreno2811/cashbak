"use client"

import { useState, useMemo, useRef } from "react"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import { calculateExternalCashbak } from "@/lib/cashbak-calculator"
import { addProduct, updateProduct, deleteProduct } from "./actions"
import { Pencil, Trash2, Plus, X } from "lucide-react"

interface Store {
  id: string
  name: string
  description: string | null
  category: string | null
  logo_url: string | null
}

interface StoreProduct {
  id: number
  name: string
  price: number
  cost: number
  margin_pct: number | null
  category_name: string | null
  description: string | null
  image: string | null
}

const DEFAULT_CUOTA = 2.0
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
        .select("id, name, price, cost, margin_pct, category_name, description, image")
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
      <div className="bg-green-900 text-white px-4 py-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0">
            {store.logo_url ? (
              <Image src={store.logo_url} alt={store.name} width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              <span className="text-2xl">🏪</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{store.name}</h1>
            {store.category && <p className="text-green-300 text-sm">{store.category}</p>}
            {store.description && <p className="text-green-200 text-sm mt-0.5 line-clamp-1">{store.description}</p>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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

        {/* Product list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((p) => (
            <ProductRow key={p.id} product={p} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
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
  const ganancia = Math.round(marginPct * product.price)

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
  const [categoryName, setCategoryName] = useState(initial?.category_name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [marginPct, setMarginPct] = useState(
    initial?.margin_pct != null ? Math.round(initial.margin_pct * 100) : 20
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image ?? null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const priceNum = Number(price) || 0
  const costNum = Number(cost) || 0
  const valid = priceNum > costNum && costNum > 0

  const sim = useMemo(() => {
    if (!valid) return null
    return calculateExternalCashbak({
      precioVenta: priceNum,
      costo: costNum,
      cuota: DEFAULT_CUOTA,
      margenVendedorPct: marginPct / 100,
    })
  }, [priceNum, costNum, marginPct, valid])

  const maxMarginSlider = sim ? Math.min(Math.floor(sim.margenVendedorMaxPct * 100), 99) : 99

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5 MB.")
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setSaving(true)
    setError(null)

    const supabase = createClient()
    let imageUrl: string | null = initial?.image ?? null

    if (imageFile) {
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      const ext = imageFile.name.split(".").pop()
      const path = `${storeId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, imageFile, { upsert: true })
      if (upErr) {
        setError("Error al subir la imagen.")
        setUploading(false)
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path)
      imageUrl = urlData.publicUrl
      setUploading(false)
    }

    const payload = {
      name,
      price: priceNum,
      cost: costNum,
      margin_pct: marginPct / 100,
      category_name: categoryName,
      description,
      image_url: imageUrl,
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
      description: payload.description || null,
      image: imageUrl,
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
          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto del producto</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-green-600 transition-colors"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                {imagePreview ? (
                  <Image src={imagePreview} alt="" width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-2xl">📷</span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {imagePreview ? "Haz clic para cambiar" : "Subir foto"}<br />
                <span className="text-xs text-gray-400">PNG, JPG · Máx 5 MB</span>
              </p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <input
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ej: Camisetas, Calzado, Accesorios..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
            />
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
          {valid && sim ? (
            <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-gray-700">Tu margen por venta</label>
                  <span className="text-base font-bold text-gray-900">{marginPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxMarginSlider}
                  step={1}
                  value={Math.min(marginPct, maxMarginSlider)}
                  onChange={(e) => setMarginPct(Number(e.target.value))}
                  className="w-full accent-green-700"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>0%</span>
                  <span>Máx. {maxMarginSlider}%</span>
                </div>
              </div>

              {/* Resultado principal: ganancia vendedor */}
              <div className={`rounded-lg px-4 py-3 ${sim.viable ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                {sim.viable ? (
                  <>
                    <p className="text-xs text-emerald-600 font-medium mb-1">Tu ganancia garantizada por venta</p>
                    <p className="text-2xl font-bold text-emerald-700">${FMT(sim.margenVendedor)}</p>
                    <p className="text-xs text-emerald-500 mt-0.5">
                      Este monto es tuyo independiente de si el evento se gana o se pierde.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-red-600 font-medium">
                      Con este margen no hay fondo suficiente para ofrecer al menos 10% de cashback.
                      Baja el margen a {maxMarginSlider}% o menos.
                    </p>
                  </>
                )}
              </div>

              {/* Desglose */}
              {sim.viable && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">CashBak que recibirá el cliente</span>
                    <span className="font-semibold text-gray-800">{sim.cashbackPct}% · ${FMT(sim.cashbackMonto)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Comisión CashBak</span>
                    <span className="text-gray-600">${FMT(sim.comisionPlataforma)}</span>
                  </div>
                  <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                    Simulado con evento de cuota {DEFAULT_CUOTA}. El cashback varía según el evento activo.
                  </p>
                </div>
              )}
            </div>
          ) : valid === false && (priceNum > 0 || costNum > 0) ? (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              El precio de venta debe ser mayor al costo.
            </p>
          ) : null}

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
            disabled={saving || !valid || !sim?.viable || !name.trim() || !categoryName.trim()}
            className="w-full py-3 bg-green-900 text-white rounded-xl font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Subiendo imagen..." : saving ? "Guardando..." : initial ? "Guardar cambios" : "Agregar producto"}
          </button>
        </form>
      </div>
    </div>
  )
}
