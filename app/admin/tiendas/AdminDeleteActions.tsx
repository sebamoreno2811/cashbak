"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, ChevronDown, ChevronUp, Package } from "lucide-react"
import { adminDeleteStore, adminDeleteProduct } from "@/app/stores/actions"
import { createClient } from "@/utils/supabase/client"

interface Product {
  id: number
  name: string
  price: number
  category_name: string | null
}

// Botón + modal para eliminar tienda
export function AdminDeleteStore({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const res = await adminDeleteStore(storeId)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> Eliminar tienda
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !loading && setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Eliminar tienda</p>
                <p className="text-xs text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Se eliminarán la tienda <strong>{storeName}</strong> y todos sus productos de forma permanente.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Escribe <strong>{storeName}</strong> para confirmar</label>
              <input
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder={storeName}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleDelete}
                disabled={confirm !== storeName || loading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
              <button
                onClick={() => { setOpen(false); setConfirm(""); setError(null) }}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Sección expandible de productos con botón eliminar por cada uno
export function AdminStoreProducts({ storeId }: { storeId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const router = useRouter()

  async function load() {
    if (products !== null) { setExpanded(v => !v); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("products")
      .select("id, name, price, category_name")
      .eq("store_id", storeId)
      .order("id", { ascending: false })
    setProducts(data ?? [])
    setExpanded(true)
    setLoading(false)
  }

  async function handleDeleteProduct(productId: number) {
    if (!confirm("¿Eliminar este producto?")) return
    setDeletingId(productId)
    const res = await adminDeleteProduct(productId)
    setDeletingId(null)
    if (res.error) { alert(res.error); return }
    setProducts(prev => prev?.filter(p => p.id !== productId) ?? [])
    router.refresh()
  }

  return (
    <div className="border-t border-gray-100 pt-3">
      <button
        onClick={load}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Package className="w-3.5 h-3.5" />
        {loading ? "Cargando..." : expanded ? "Ocultar productos" : "Ver productos"}
        {!loading && (expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
      </button>

      {expanded && products !== null && (
        <div className="mt-2 space-y-1.5">
          {products.length === 0 ? (
            <p className="text-xs text-gray-400 pl-1">Sin productos.</p>
          ) : products.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400">
                  ${p.price.toLocaleString("es-CL")} {p.category_name ? `· ${p.category_name}` : ""}
                </p>
              </div>
              <button
                onClick={() => handleDeleteProduct(p.id)}
                disabled={deletingId === p.id}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
