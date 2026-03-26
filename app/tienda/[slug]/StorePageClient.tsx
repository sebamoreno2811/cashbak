"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { toSlug } from "@/lib/slug"
import { calculateMaxProductCashbak, calculateProductCashbak } from "@/lib/cashbak-calculator"
import { useBets } from "@/context/bet-context"
import { useBetOption } from "@/hooks/use-bet-option"
import type { Product } from "@/types/product"

interface Store {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  categories: string[] | null
  logo_url: string | null
}

export default function StorePageClient({ store, products }: { store: Store; products: Product[] }) {
  const { bets } = useBets()
  const { selectedOption } = useBetOption()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const selectedBet = bets.find(b => b.id === Number(selectedOption))

  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const p of products) {
      const pCats = p.category_names?.length ? p.category_names : p.category_name ? [p.category_name] : []
      for (const c of pCats) cats.add(c)
    }
    return Array.from(cats).sort()
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(p => {
      if (categoryFilter) {
        const pCats = p.category_names?.length ? p.category_names : p.category_name ? [p.category_name] : []
        if (!pCats.includes(categoryFilter)) return false
      }
      if (q && !p.name.toLowerCase().includes(q) && !p.category_name?.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, search, categoryFilter])

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header tienda */}
      <div className="bg-green-900 text-white">
        <div className="container mx-auto max-w-5xl px-4 py-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
            {store.logo_url ? (
              <Image src={store.logo_url} alt={store.name} width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              <Image src="/img/logo.png" alt="CashBak" width={64} height={64} className="object-contain w-12 h-12" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{store.name}</h1>
            {(store.categories?.length ? store.categories : store.category ? [store.category] : []).map(cat => (
              <span key={cat} className="inline-block text-xs bg-white/20 text-green-100 px-2.5 py-0.5 rounded-full mt-1 mr-1">{cat}</span>
            ))}
            {store.description && (
              <p className="text-green-200 text-sm mt-1.5 max-w-xl">{store.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Buscador + categorías */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en esta tienda..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-700 transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {categories.length > 1 && (
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
        )}
      </div>

      {/* Productos */}
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <p className="text-sm text-gray-500 mb-5">
          {filtered.length === 0
            ? "Sin resultados"
            : `${filtered.length} producto${filtered.length !== 1 ? "s" : ""}${search ? ` para "${search}"` : ""}`}
        </p>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
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
              onClick={() => { setSearch(""); setCategoryFilter(null) }}
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
  bets,
  selectedBetOdd,
}: {
  product: Product
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
