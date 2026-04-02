"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, SlidersHorizontal, X, Trophy } from "lucide-react"
import { toSlug } from "@/lib/slug"
import { calculateProductCashbak, calculateMaxProductCashbak } from "@/lib/cashbak-calculator"
import { useProducts } from "@/context/product-context"
import { useBets } from "@/context/bet-context"
import { useBetOption } from "@/hooks/use-bet-option"
import { createClient } from "@/utils/supabase/client"
import type { Product } from "@/types/product"

interface Store {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

export default function ProductsPage() {
  const { products, loading } = useProducts()
  const { bets } = useBets()
  const { selectedOption, setSelectedOption } = useBetOption()
  const searchParams = useSearchParams()

  const [stores, setStores] = useState<Store[]>([])
  const [search, setSearch] = useState("")
  const [storeFilter, setStoreFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(
    () => searchParams.get("category")
  )
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    createClient()
      .from("stores")
      .select("id, name, slug, logo_url")
      .eq("status", "approved")
      .then(({ data }: { data: Store[] | null }) => { if (data) setStores(data) })
  }, [])

  const storeMap = useMemo(() =>
    Object.fromEntries(stores.map(s => [s.id, s])),
    [stores]
  )

  const nowChile = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Santiago", hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).format(new Date()).replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, "$3-$1-$2T$4:$5:$6")
  )
  const availableBets = bets.filter(b => new Date(b.end_date) > nowChile)
  const selectedBet = bets.find(b => b.id === Number(selectedOption))

  const categories = useMemo(() =>
    Array.from(new Set(products.map(p => p.category_name).filter(Boolean))).sort(),
    [products]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(p => {
      if (storeFilter && p.store_id !== storeFilter) return false
      if (categoryFilter && p.category_name !== categoryFilter) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.category_name?.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, search, storeFilter, categoryFilter])

  const activeFilters = [
    storeFilter ? storeMap[storeFilter]?.name : null,
  ].filter(Boolean) as string[]

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-green-700 rounded-full border-t-transparent animate-spin" />
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header buscador */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-700 transition"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${showFilters || activeFilters.length > 0 ? "bg-green-900 text-white border-green-900" : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFilters.length > 0 && (
              <span className="bg-white text-green-900 rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Barra de categorías */}
        <div className="container mx-auto max-w-5xl px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition whitespace-nowrap ${categoryFilter === null ? "bg-green-900 text-white border-green-900" : "border-gray-200 text-gray-600 bg-white hover:border-gray-400"}`}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition whitespace-nowrap ${categoryFilter === cat ? "bg-green-900 text-white border-green-900" : "border-gray-200 text-gray-600 bg-white hover:border-gray-400"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Panel filtro tienda */}
        {showFilters && (
          <div className="container mx-auto max-w-5xl px-4 pb-3">
            <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tienda</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setStoreFilter(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${storeFilter === null ? "bg-green-900 text-white border-green-900" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
              >
                Todas
              </button>
              {stores.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStoreFilter(storeFilter === s.id ? null : s.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${storeFilter === s.id ? "bg-green-900 text-white border-green-900" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra de evento */}
      {availableBets.length > 0 && (
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="container mx-auto max-w-5xl px-4 py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <Trophy className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Evento</span>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {availableBets.map(bet => (
                <button
                  key={bet.id}
                  onClick={() => setSelectedOption(bet.id.toString())}
                  className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition ${
                    selectedOption === bet.id.toString()
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                  }`}
                >
                  {bet.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Tags activos */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {storeFilter && (
              <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                {storeMap[storeFilter]?.name}
                <button onClick={() => setStoreFilter(null)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {categoryFilter && (
              <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                {categoryFilter}
                <button onClick={() => setCategoryFilter(null)}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Contador */}
        <p className="text-sm text-gray-500 mb-5">
          {filtered.length === 0
            ? "Sin resultados"
            : `${filtered.length} producto${filtered.length !== 1 ? "s" : ""}${search ? ` para "${search}"` : ""}`}
        </p>

        {/* Grilla */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                store={product.store_id ? storeMap[product.store_id] : undefined}
                bets={bets}
                selectedBetOdd={selectedBet?.odd ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500 text-lg font-medium">
              {search ? `No encontramos "${search}"` : "No hay productos con estos filtros"}
            </p>
            <button
              onClick={() => { setSearch(""); setStoreFilter(null); setCategoryFilter(null) }}
              className="mt-4 text-sm text-green-700 underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function ProductCard({
  product,
  store,
  bets,
  selectedBetOdd,
}: {
  product: Product
  store: Store | undefined
  bets: ReturnType<typeof useBets>["bets"]
  selectedBetOdd: number | null
}) {
  const maxCashbak = calculateMaxProductCashbak(product, bets)
  const selectedCashbak = selectedBetOdd ? calculateProductCashbak(product, selectedBetOdd) : null

  return (
    <Link href={`/product/${product.id}/${toSlug(product.name)}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {maxCashbak > 0 && (
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
              <div className="bg-green-900/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg">
                hasta {maxCashbak}% CB
              </div>
              {selectedCashbak != null && selectedCashbak > 0 && (
                <div className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                  {selectedCashbak}% con evento seleccionado
                </div>
              )}
            </div>
          )}
          {store && (
            <Link
              href={`/tienda/${store.slug ?? store.id}`}
              onClick={e => e.stopPropagation()}
              className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 hover:bg-white transition-colors"
            >
              {store.logo_url ? (
                <Image src={store.logo_url} alt={store.name} width={14} height={14} className="rounded-full object-cover w-3.5 h-3.5" />
              ) : (
                <Image src="/img/logo.png" alt="CashBak" width={14} height={14} className="rounded-full object-contain w-3.5 h-3.5" />
              )}
              <span className="text-[10px] font-semibold text-gray-700 leading-none">{store.name}</span>
            </Link>
          )}
        </div>

        <div className="p-3 flex flex-col flex-1">
          <p className="text-xs text-gray-400 mb-0.5">{product.category_name}</p>
          <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 flex-1">{product.name}</h3>
          <div className="mt-2">
            <span className="font-bold text-gray-900">${product.price.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
