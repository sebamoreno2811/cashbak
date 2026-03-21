"use client"

import { useEffect, useState, useMemo } from "react"
import { useProducts } from "@/context/product-context"
import { useBets } from "@/context/bet-context"
import { useBetOption } from "@/hooks/use-bet-option"
import { calculateProductCashbak, calculateMaxProductCashbak } from "@/lib/cashbak-calculator"
import { createClient } from "@/utils/supabase/client"
import { ProductSelection } from "@/components/product-selection"
import { Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toSlug } from "@/lib/slug"
import type { Product } from "@/types/product"
import type { Bet } from "@/context/bet-context"

interface Store {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  category: string | null
}

export default function Home() {
  const { products } = useProducts()
  const { bets } = useBets()
  const { selectedOption } = useBetOption()
  const [stores, setStores] = useState<Store[]>([])
  const [search, setSearch] = useState("")
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("stores")
      .select("id, name, slug, description, logo_url, category")
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .then(({ data }: { data: Store[] | null }) => { if (data) setStores(data) })
  }, [])

  const filteredStores = useMemo(() =>
    stores.filter((s) =>
      search.trim() === "" || s.name.toLowerCase().includes(search.toLowerCase())
    )
  , [stores, search])

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Logo + selector de evento */}
      <div className="bg-white border-b border-gray-100 px-4 pt-8 pb-6">
        <div className="container mx-auto max-w-4xl">
          <Image
            src="/img/logo.png"
            alt="CashBak"
            width={576}
            height={200}
            priority
            className="mx-auto h-auto mix-blend-multiply w-64 sm:w-80 md:w-96 mb-6"
          />
          <ProductSelection />
        </div>
      </div>

      {/* Buscador y filtros */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tienda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
            />
          </div>
        </div>
      </div>

      {/* Tiendas con productos */}
      <div className="container mx-auto max-w-4xl px-4 py-10 space-y-12">
        {filteredStores.map((store) => {
          const storeProducts = products.filter(
            (p: Product) => p.store_id === store.id
          )
          if (storeProducts.length === 0) return null
          return (
            <StoreSection
              key={store.id}
              store={store}
              products={storeProducts}

              bets={bets}
              selectedOption={selectedOption}
            />
          )
        })}

        {filteredStores.length === 0 && stores.length > 0 && (
          <div className="text-center text-gray-400 py-16">No se encontraron tiendas.</div>
        )}
        {stores.length === 0 && (
          <div className="text-center text-gray-400 py-16">Cargando tiendas...</div>
        )}
      </div>
    </main>
  )
}

function StoreSection({
  store,
  products,
  bets,
  selectedOption,
}: {
  store: Store
  products: Product[]
  bets: Bet[]
  selectedOption: string
}) {
  const isCashbak = store.slug === "cashbak"
  const href = isCashbak ? "/products" : `/tienda/${store.slug}`

  return (
    <section>
      {/* Banner */}
      <div className={`rounded-2xl p-5 mb-5 flex items-center gap-4 ${isCashbak ? "bg-green-900 text-white" : "bg-white border border-gray-200 shadow-sm"}`}>
        <div className={`w-14 h-14 rounded-full shrink-0 overflow-hidden flex items-center justify-center ${isCashbak && !store.logo_url ? "bg-white/15" : isCashbak ? "bg-white" : "bg-gray-100"}`}>
          {store.logo_url ? (
            <Image src={store.logo_url} alt={store.name} width={56} height={56} className="object-cover w-full h-full" />
          ) : isCashbak ? (
            <span className="text-white font-extrabold text-lg tracking-tight">CB</span>
          ) : (
            <span className="text-2xl">🏪</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={`text-lg font-bold ${isCashbak ? "text-white" : "text-gray-900"}`}>{store.name}</h2>
            {isCashbak && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-medium">Oficial</span>}
            {store.category && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${isCashbak ? "bg-white/20 text-green-100" : "bg-gray-100 text-gray-500"}`}>
                {store.category}
              </span>
            )}
          </div>
          {store.description && (
            <p className={`text-sm mt-0.5 truncate ${isCashbak ? "text-green-200" : "text-gray-500"}`}>{store.description}</p>
          )}
          <p className={`text-xs mt-1 ${isCashbak ? "text-green-300" : "text-gray-400"}`}>{products.length} producto{products.length !== 1 ? "s" : ""}</p>
        </div>

        <Link
          href={href}
          className={`shrink-0 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
            isCashbak
              ? "border border-white/40 text-white hover:bg-white hover:text-green-900"
              : "bg-green-900 text-white hover:bg-green-800"
          }`}
        >
          Ver todo →
        </Link>
      </div>

      {/* Scroll horizontal de productos */}
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}

            bets={bets}
            selectedOption={selectedOption}
          />
        ))}
      </div>
    </section>
  )
}

function ProductCard({
  product,
  bets,
  selectedOption,
}: {
  product: Product
  bets: Bet[]
  selectedOption: string
}) {
  const maxCashbak = calculateMaxProductCashbak(product, bets)
  const selectedBet = bets.find(b => b.id === Number(selectedOption))
  const selectedCashbak = selectedBet ? calculateProductCashbak(product, selectedBet.odd) : 0

  return (
    <Link href={`/product/${product.id}/${toSlug(product.name)}`} className="group snap-start shrink-0 w-44 sm:w-52">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 h-full">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 176px, 208px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {maxCashbak > 0 && (
            <div className="absolute top-2 left-2 bg-green-900/60 text-white/90 text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              hasta {maxCashbak}% CashBak
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">{product.name}</p>
          <p className="text-sm font-bold text-gray-900 mt-1.5">
            ${product.price.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
          </p>
          {selectedCashbak > 0 && (
            <div className="mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-semibold text-emerald-700">{selectedCashbak}% con evento seleccionado</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
