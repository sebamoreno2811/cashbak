"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useProducts } from "@/context/product-context"
import { useBets } from "@/context/bet-context"
import { useBetOption } from "@/hooks/use-bet-option"
import { calculateProductCashbak, calculateMaxProductCashbak } from "@/lib/cashbak-calculator"
import { createClient } from "@/utils/supabase/client"
import { ProductSelection } from "@/components/product-selection"
import HowItWorks from "@/components/how-it-works"
import Image from "next/image"
import Link from "next/link"
import { toSlug } from "@/lib/slug"
import type { Product } from "@/types/product"

interface Store {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  category: string | null
}

export default function Home() {
  const { products } = useProducts()
  const { bets } = useBets()
  const { selectedOption } = useBetOption()
  const [stores, setStores] = useState<Store[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  useEffect(() => {
    createClient()
      .from("stores")
      .select("id, name, slug, logo_url, category")
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .then(({ data }: { data: Store[] | null }) => { if (data) setStores(data) })
  }, [])

  const selectedBet = bets.find(b => b.id === Number(selectedOption))

  const storeMap = useMemo(() =>
    Object.fromEntries(stores.map(s => [s.id, s])),
    [stores]
  )

  // All products sorted by cashback desc
  const sorted = useMemo(() =>
    [...products].sort((a: Product, b: Product) => {
      const cbA = calculateMaxProductCashbak(a, bets)
      const cbB = calculateMaxProductCashbak(b, bets)
      if (cbB !== cbA) return cbB - cbA
      return b.id - a.id
    }),
    [products, bets]
  )

  // Top 12 for featured carousel — round-robin por tienda para diversidad
  const featured = useMemo(() => {
    if (sorted.length === 0) return []
    // Agrupar por tienda manteniendo orden por cashback
    const byStore = new Map<string, Product[]>()
    for (const p of sorted) {
      const key = p.store_id ?? "cashbak-oficial"
      if (!byStore.has(key)) byStore.set(key, [])
      byStore.get(key)!.push(p)
    }
    const stores = Array.from(byStore.values())
    const result: Product[] = []
    let round = 0
    while (result.length < 12) {
      let added = false
      for (const prods of stores) {
        if (prods[round]) {
          result.push(prods[round])
          added = true
          if (result.length >= 12) break
        }
      }
      if (!added) break
      round++
    }
    return result
  }, [sorted])

  // Categories for filter
  const categories = useMemo(() =>
    Array.from(new Set(sorted.map((p: Product) => p.category_name).filter(Boolean))).sort() as string[],
    [sorted]
  )

  // Grid products filtered by category
  const gridProducts = useMemo(() =>
    categoryFilter ? sorted.filter((p: Product) => p.category_name === categoryFilter) : sorted,
    [sorted, categoryFilter]
  )

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header: logo */}
      <div className="bg-white border-b border-gray-100 px-4 pt-8 pb-6">
        <div className="container mx-auto max-w-4xl">
          <Image
            src="/img/logo.png"
            alt="CashBak"
            width={576}
            height={200}
            priority
            className="mx-auto h-auto mix-blend-multiply w-64 sm:w-80 md:w-96"
          />
        </div>
      </div>

      {/* Cómo funciona */}
      <HowItWorks />

      {/* CTA + Selector de evento */}
      <div className="bg-green-900 text-white px-4 py-10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1">¿Listo para empezar?</h2>
          <p className="text-green-200 text-sm mb-6">Elige tu evento y explora los productos disponibles.</p>
          <div className="flex justify-center mb-2">
            <svg className="animate-bounce text-emerald-400" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M12 5v14M12 19l-5-5M12 19l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="bg-white rounded-2xl px-4 py-4">
            <ProductSelection />
          </div>
        </div>
      </div>


      {/* Destacados — carrusel */}
      {featured.length > 0 && (
        <div className="pt-10 pb-4">
          <div className="container mx-auto max-w-5xl px-8 mb-4 flex items-center gap-3">
            <span className="bg-green-900 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              ⭐ Destacados
            </span>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">Mayor cashback disponible</span>
          </div>
          <CarouselRow
            items={featured}
            bets={bets}
            selectedBetOdd={selectedBet?.odd ?? null}
            storeMap={storeMap}
          />
        </div>
      )}

      {/* Filtro de categorías */}
      {categories.length > 0 && (
        <div className="bg-white border-y border-gray-100 px-4 py-3 mt-6">
          <div className="container mx-auto max-w-5xl overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition whitespace-nowrap ${categoryFilter === null ? "bg-green-900 text-white border-green-900" : "border-gray-200 text-gray-600 bg-white hover:border-gray-400"}`}
              >
                Todos
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
        </div>
      )}

      {/* Grid de productos */}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {gridProducts.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <p className="text-4xl mb-4">📦</p>
            <p>No hay productos con estos filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {gridProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                bets={bets}
                selectedBetOdd={selectedBet?.odd ?? null}
                store={product.store_id ? storeMap[product.store_id] : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ver más */}
      <div className="text-center pb-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-green-900 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-green-800 transition-colors"
        >
          Ver todos los productos
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </div>
    </main>
  )
}

function CarouselRow({
  items,
  bets,
  selectedBetOdd,
  storeMap,
}: {
  items: Product[]
  bets: ReturnType<typeof useBets>["bets"]
  selectedBetOdd: number | null
  storeMap: Record<string, Store>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(false)
  const pausedRef = useRef(false)
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 })

  // Check if single set overflows the container
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setAutoScroll(el.scrollWidth / 2 > el.clientWidth + 10)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [items])

  // Auto-scroll via rAF
  useEffect(() => {
    if (!autoScroll) return
    const el = ref.current
    if (!el) return
    let rafId: number
    const tick = () => {
      if (!pausedRef.current) {
        el.scrollLeft += 0.6
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft -= el.scrollWidth / 2
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [autoScroll])

  const onMouseDown = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    dragRef.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    pausedRef.current = true
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active) return
    const el = ref.current
    if (!el) return
    el.scrollLeft = dragRef.current.scrollLeft - (e.pageX - el.offsetLeft - dragRef.current.startX) * 1.2
  }
  const onMouseUp = () => { dragRef.current.active = false; pausedRef.current = false }

  const doubled = [...items, ...items]

  return (
    <div
      ref={ref}
      className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
      style={autoScroll ? {
        maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      } : {}}
      onMouseEnter={() => { if (!dragRef.current.active) pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false; dragRef.current.active = false }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <div className="flex gap-4 py-2 w-max px-8">
        {(autoScroll ? doubled : items).map((product, idx) => (
          <div key={`${product.id}-${idx}`} className="w-48 shrink-0">
            <ProductCard
              product={product}
              bets={bets}
              selectedBetOdd={selectedBetOdd}
              store={product.store_id ? storeMap[product.store_id] : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductCard({
  product,
  bets,
  selectedBetOdd,
  store,
}: {
  product: Product
  bets: ReturnType<typeof useBets>["bets"]
  selectedBetOdd: number | null
  store: Store | undefined
}) {
  const router = useRouter()
  const maxCashbak = calculateMaxProductCashbak(product, bets)
  const selectedCashbak = selectedBetOdd ? calculateProductCashbak(product, selectedBetOdd) : 0
  const productHref = `/product/${product.id}/${toSlug(product.name)}`

  return (
    <div onClick={() => router.push(productHref)} className="group cursor-pointer h-full">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="176px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {maxCashbak > 0 && (
            <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
              <div className="bg-green-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                hasta {maxCashbak}% CB
              </div>
              {selectedCashbak > 0 && (
                <div className="bg-emerald-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {selectedCashbak}% seleccionado
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
          <h3 className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 flex-1">{product.name}</h3>
          <p className="font-bold text-gray-900 text-sm mt-2">
            ${product.price.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  )
}
