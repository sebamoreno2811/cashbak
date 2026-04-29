"use client"

import { useEffect, useRef, useState, useMemo } from "react"
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
  categories: string[] | null
}

export default function Home() {
  const { products, loading } = useProducts()
  const { bets } = useBets()
  const { selectedOption } = useBetOption()
  const [stores, setStores] = useState<Store[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  useEffect(() => {
    createClient()
      .from("stores")
      .select("id, name, slug, logo_url, category, categories")
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

  // Categories for filter — based on store categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const p of sorted) {
      const store = p.store_id ? storeMap[p.store_id] : undefined
      if (!store) continue
      const storeCats = store.categories?.length ? store.categories : store.category ? [store.category] : []
      for (const cat of storeCats) cats.add(cat)
    }
    return Array.from(cats).sort()
  }, [sorted, storeMap])

  // Grid products filtered by store category
  const gridProducts = useMemo(() => {
    if (!categoryFilter) return sorted
    return sorted.filter((p: Product) => {
      const store = p.store_id ? storeMap[p.store_id] : undefined
      if (!store) return false
      const storeCats = store.categories?.length ? store.categories : store.category ? [store.category] : []
      return storeCats.includes(categoryFilter)
    })
  }, [sorted, categoryFilter, storeMap])

  if (loading) return <HomeSkeletonGrid />

  return (
    <main id="main" className="min-h-screen bg-gray-50">
      {/* H1 principal — oculto visualmente, visible para lectores de pantalla */}
      <h1 className="sr-only">CashBak — Marketplace chileno con CashBak deportivo</h1>

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

      {/* Selector de evento */}
      <section aria-labelledby="bet-selector-title" className="bg-green-900 px-4 py-8">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-emerald-600 px-5 py-4">
              <h2 id="bet-selector-title" className="text-white text-lg font-bold leading-tight">
                <span aria-hidden="true">🏆 </span>Elige tu evento deportivo
              </h2>
              <p className="text-white text-sm mt-0.5">El CashBak de cada producto varía según el evento que elijas</p>
            </div>
            <div className="px-5 pt-5 pb-4">
              <p id="bet-selector-question" className="text-lg font-bold text-gray-900 mb-0.5">¿Qué evento eliges hoy?</p>
              <p className="text-sm text-gray-600 mb-4">Selecciona uno y empieza a explorar los productos con su CashBak.</p>
              <ProductSelection ariaLabelledBy="bet-selector-question" />
            </div>
          </div>
        </div>
      </section>


      {/* Destacados — carrusel */}
      {featured.length > 0 && (
        <section aria-labelledby="destacados-title" className="pt-10 pb-4">
          <div className="container mx-auto max-w-5xl px-8 mb-4 flex items-center gap-3">
            <h2 id="destacados-title" className="bg-green-900 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              <span aria-hidden="true">⭐ </span>Destacados
            </h2>
            <div className="flex-1 h-px bg-gray-200" aria-hidden="true" />
            <span className="text-xs text-gray-600">Mayor CashBak disponible</span>
          </div>
          <CarouselRow
            items={featured}
            bets={bets}
            selectedBetOdd={selectedBet?.odd ?? null}
            storeMap={storeMap}
          />
        </section>
      )}

      {/* Filtro de categorías */}
      {categories.length > 0 && (
        <div
          className="bg-white border-y border-gray-100 px-4 py-3 mt-6"
          role="group"
          aria-label="Filtrar productos por categoría"
        >
          <div className="container mx-auto max-w-5xl overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max">
              <button
                type="button"
                onClick={() => setCategoryFilter(null)}
                aria-pressed={categoryFilter === null}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition whitespace-nowrap ${categoryFilter === null ? "bg-green-900 text-white border-green-900" : "border-gray-300 text-gray-700 bg-white hover:border-gray-500"}`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                  aria-pressed={categoryFilter === cat}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition whitespace-nowrap ${categoryFilter === cat ? "bg-green-900 text-white border-green-900" : "border-gray-300 text-gray-700 bg-white hover:border-gray-500"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid de productos */}
      <section aria-label="Lista de productos" className="container mx-auto max-w-5xl px-4 py-8">
        {gridProducts.length === 0 ? (
          <div className="text-center text-gray-600 py-20">
            <p className="text-4xl mb-4" aria-hidden="true">📦</p>
            <p>No hay productos con estos filtros.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 list-none p-0 m-0">
            {gridProducts.map(product => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  bets={bets}
                  selectedBetOdd={selectedBet?.odd ?? null}
                  store={product.store_id ? storeMap[product.store_id] : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

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
  const [userPaused, setUserPaused] = useState(false)
  const pausedRef = useRef(false)
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 })

  // Detectar prefers-reduced-motion para desactivar auto-scroll
  const [prefersReduced, setPrefersReduced] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // Check if single set overflows the container
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setAutoScroll(el.scrollWidth / 2 > el.clientWidth + 10)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [items])

  // Auto-scroll via rAF — se desactiva si el usuario lo pausó o si pide reducir motion
  useEffect(() => {
    if (!autoScroll || userPaused || prefersReduced) return
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
  }, [autoScroll, userPaused, prefersReduced])

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

  // Pausar al enfocar cualquier elemento dentro (WCAG 2.2.2 — teclado)
  const onFocusCapture = () => { pausedRef.current = true }
  const onBlurCapture = (e: React.FocusEvent) => {
    const next = e.relatedTarget as Node | null
    if (!ref.current || !next || !ref.current.contains(next)) {
      pausedRef.current = false
    }
  }

  // Navegación con flechas
  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = ref.current
    if (!el) return
    if (e.key === "ArrowRight") { el.scrollLeft += 200; e.preventDefault() }
    if (e.key === "ArrowLeft")  { el.scrollLeft -= 200; e.preventDefault() }
    if (e.key === "Home")       { el.scrollLeft = 0; e.preventDefault() }
    if (e.key === "End")        { el.scrollLeft = el.scrollWidth; e.preventDefault() }
  }

  const doubled = [...items, ...items]
  const showPauseButton = autoScroll && !prefersReduced

  return (
    <div className="relative">
      {showPauseButton && (
        <div className="container mx-auto max-w-5xl px-8 mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setUserPaused(p => !p)}
            aria-pressed={userPaused}
            className="text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-300 hover:border-gray-500 rounded-full px-3 py-1.5 transition-colors"
          >
            {userPaused ? "▶ Reanudar" : "⏸ Pausar carrusel"}
          </button>
        </div>
      )}
      <div
        ref={ref}
        role="region"
        aria-label="Carrusel de productos destacados. Usa las flechas izquierda y derecha para navegar."
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
        style={autoScroll && !userPaused && !prefersReduced ? {
          maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        } : {}}
        onMouseEnter={() => { if (!dragRef.current.active) pausedRef.current = true }}
        onMouseLeave={() => { pausedRef.current = false; dragRef.current.active = false }}
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <div className="flex gap-4 py-2 w-max px-8">
          {(autoScroll && !userPaused && !prefersReduced ? doubled : items).map((product, idx) => (
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
  const maxCashbak = calculateMaxProductCashbak(product, bets)
  const selectedCashbak = selectedBetOdd ? calculateProductCashbak(product, selectedBetOdd) : 0
  const productHref = `/product/${product.id}/${toSlug(product.name)}`
  const priceLabel = `$${product.price.toLocaleString("es-CL", { maximumFractionDigits: 0 })}`

  // Accesibilidad: se usa el patrón "card con link de nombre que se expande".
  // El <Link> de la tienda queda por encima (z-index) para que su click no
  // sea interceptado por el link principal del producto.
  return (
    <article className="group relative h-full">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200 h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.image || "/placeholder.svg"}
            alt=""
            aria-hidden="true"
            fill
            sizes="176px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {maxCashbak > 0 && (
            <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
              <div className="bg-green-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                hasta {maxCashbak}% CB
              </div>
              {selectedCashbak > 0 && (
                <div className="bg-emerald-700 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {selectedCashbak}% seleccionado
                </div>
              )}
            </div>
          )}
          {store && (
            <Link
              href={`/tienda/${store.slug ?? store.id}`}
              className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 bg-white backdrop-blur-sm rounded-full px-2 py-1 hover:bg-gray-50 transition-colors"
              aria-label={`Ir a la tienda ${store.name}`}
            >
              {store.logo_url ? (
                <Image src={store.logo_url} alt="" aria-hidden="true" width={14} height={14} className="rounded-full object-cover w-3.5 h-3.5" />
              ) : (
                <Image src="/img/logo.png" alt="" aria-hidden="true" width={14} height={14} className="rounded-full object-contain w-3.5 h-3.5" />
              )}
              <span className="text-xs font-semibold text-gray-800 leading-none">{store.name}</span>
            </Link>
          )}
        </div>
        <div className="p-3 flex flex-col flex-1">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">
            <Link
              href={productHref}
              className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-emerald-600 focus-visible:after:ring-offset-2 focus-visible:after:rounded-2xl"
              aria-label={`${product.name}, precio ${priceLabel}${maxCashbak > 0 ? `, hasta ${maxCashbak}% de CashBak` : ""}`}
            >
              {product.name}
            </Link>
          </h3>
          <p className="font-bold text-gray-900 text-sm mt-2" aria-hidden="true">
            {priceLabel}
          </p>
        </div>
      </div>
    </article>
  )
}

function HomeSkeletonGrid() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Carousel skeleton */}
      <div className="bg-white border-b border-gray-100 px-4 pt-8 pb-6">
        <div className="container mx-auto max-w-4xl flex justify-center">
          <div className="h-16 w-72 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>

      <div className="pt-10 pb-4">
        <div className="container mx-auto max-w-5xl px-8 mb-4 flex items-center gap-3">
          <div className="h-7 w-28 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex gap-4 px-8 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-48 shrink-0 bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div className="bg-white border-y border-gray-100 px-4 py-3 mt-6">
        <div className="container mx-auto max-w-5xl flex gap-2">
          {[60, 80, 70, 90, 65, 75].map((w, i) => (
            <div key={i} style={{ width: w }} className="h-9 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
