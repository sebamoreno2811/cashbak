"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, X, Building2 } from "lucide-react"

interface StoreItem {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  category: string | null
  categories: string[] | null
  description: string | null
  productCount: number
}

export default function TiendasClient({ stores }: { stores: StoreItem[] }) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    for (const s of stores) {
      const storeCats = s.categories?.length ? s.categories : s.category ? [s.category] : []
      for (const c of storeCats) cats.add(c)
    }
    return Array.from(cats).sort()
  }, [stores])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return stores.filter(s => {
      if (q && !s.name.toLowerCase().includes(q)) return false
      if (categoryFilter) {
        const storeCats = s.categories?.length ? s.categories : s.category ? [s.category] : []
        if (!storeCats.includes(categoryFilter)) return false
      }
      return true
    })
  }, [stores, search, categoryFilter])

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-green-900 text-white px-4 py-12">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Tiendas</h1>
          <p className="text-green-200 text-sm sm:text-base max-w-md mx-auto">
            Compra en cualquiera de estas tiendas, elige tu evento y si se cumple, recuperas tu CashBak.
          </p>
        </div>
      </div>

      {/* Buscador + filtros — sticky debajo del navbar global (h-16 = top-16) */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-20 shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tienda..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-700 transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {allCategories.length > 0 && (
          <div className="container mx-auto max-w-5xl px-4 pb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === null
                    ? "bg-green-900 text-white border-green-900"
                    : "border-gray-200 text-gray-600 bg-white hover:border-gray-400"
                }`}
              >
                Todas
              </button>
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition whitespace-nowrap cursor-pointer ${
                    categoryFilter === cat
                      ? "bg-green-900 text-white border-green-900"
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-gray-500 mb-6">
          {filtered.length === 0
            ? "Sin resultados"
            : `${filtered.length} tienda${filtered.length !== 1 ? "s" : ""}${search ? ` para "${search}"` : ""}`}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4">
              <Building2 className="w-12 h-12 text-gray-300" />
            </div>
            <p className="text-gray-500 text-lg font-medium">No encontramos tiendas con esos filtros</p>
            <button
              onClick={() => { setSearch(""); setCategoryFilter(null) }}
              className="mt-4 text-sm text-green-700 underline cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map(store => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function StoreCard({ store }: { store: StoreItem }) {
  const href = `/tienda/${store.slug ?? store.id}`
  const storeCats = store.categories?.length ? store.categories : store.category ? [store.category] : []

  return (
    <Link href={href} className="group cursor-pointer">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
        {/* Logo */}
        <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden p-4">
          <Image
            src={store.logo_url ?? "/img/logo.png"}
            alt={store.name}
            width={120}
            height={120}
            className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 mb-1.5">
            {store.name}
          </h3>

          {storeCats.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {storeCats.slice(0, 2).map(cat => (
                <span key={cat} className="text-[10px] font-medium bg-green-50 text-green-800 px-1.5 py-0.5 rounded-full">
                  {cat}
                </span>
              ))}
              {storeCats.length > 2 && (
                <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  +{storeCats.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {store.productCount} producto{store.productCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xs font-semibold text-green-700 group-hover:underline">
              Ver →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
