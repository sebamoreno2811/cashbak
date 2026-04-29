"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { calculateProductCashbak } from "@/lib/cashbak-calculator"
import { useBetOption } from "@/hooks/use-bet-option"
import { useCart } from "@/hooks/use-cart"
import { ArrowLeft, ShoppingCart, Check, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react"
import BetSelector from "@/components/bet-selector"
import { toast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useProducts } from "@/context/product-context"
import type { Product } from "@/types/product"
import { useBets } from "@/context/bet-context"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import useSupabaseUser from "@/hooks/use-supabase-user"
import { useComments } from "@/context/comment-context"
import { useCustomers } from "@/context/customer-context"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  const months = Math.floor(days / 30)
  return `hace ${months} mes${months > 1 ? "es" : ""}`
}

// ─── Star components ──────────────────────────────────────────────────────────

function StarInput({ filled, onMouseEnter, onMouseLeave, onClick }: { filled: boolean; onMouseEnter: () => void; onMouseLeave: () => void; onClick: () => void }) {
  return (
    <svg
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      className={`h-6 w-6 cursor-pointer transition-colors ${filled ? "text-emerald-400" : "text-gray-300"}`}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.75l-6.172 3.245 1.179-6.872L2 9.75l6.914-1.005L12 2.75l3.086 6.005L22 9.75l-5.007 4.372 1.179 6.873z" />
    </svg>
  )
}

function StarDisplay({ rating, count, size = "sm" }: { rating: number; count?: number; size?: "sm" | "xs" }) {
  const sz = size === "xs" ? "w-3.5 h-3.5" : "w-4 h-4"
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} className={`${sz} fill-current ${i <= Math.round(rating) ? "text-emerald-400" : "text-gray-200"}`} viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.561-.955L10 0l2.949 5.955 6.561.955-4.755 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-sm text-gray-400">({count} {count === 1 ? "reseña" : "reseñas"})</span>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { products, loading, error } = useProducts()
  const [product, setProduct] = useState<Product | null>(null)
  const { selectedOption, setSelectedOption } = useBetOption()
  const [cashbak, setcashbak] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const [showStickyCart, setShowStickyCart] = useState(false)
  const addToCartRef = useRef<HTMLButtonElement>(null)

  const stockKeys = product ? Object.keys(product.stock ?? {}) : []
  const isSingleSize = stockKeys.length === 1 && stockKeys[0] === "Única"
  const availableSizes = isSingleSize ? [] : ["S", "M", "L", "XL"]
  const defaultSize = isSingleSize ? "Única" : (["S", "M", "L", "XL"].find(s => (product?.stock?.[s] ?? 0) > 0) ?? "L")
  const [size, setSize] = useState<string>(defaultSize)

  const { bets } = useBets()
  const [store, setStore] = useState<{ id: string; name: string; slug: string | null; logo_url: string | null } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const { comments, loading: commentsLoading, refreshComments } = useComments()
  const { customers } = useCustomers()
  const [commentData, setComment] = useState({ comment: "", stars: 0 })
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null)

  const productComments = comments.filter(c => c.product_id === product?.id)
  const avgRating = productComments.length > 0
    ? productComments.reduce((sum, c) => sum + (c.stars ?? 0), 0) / productComments.length
    : null

  const { user } = useSupabaseUser()
  const customer_active = customers.filter(c => c.id === user?.id)

  // Products from the same store
  const storeProducts = product?.store_id
    ? products.filter(p => p.store_id === product.store_id && p.id !== product.id).slice(0, 4)
    : []

  // Sticky cart: show when the add-to-cart button scrolls out of view
  useEffect(() => {
    const onScroll = () => setShowStickyCart(window.scrollY > 420)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!user || !product) { setHasPurchased(null); return }
    const supabase = createClient()
    supabase
      .from("order_items")
      .select("id, orders!inner(customer_id)")
      .eq("product_id", product.id)
      .eq("orders.customer_id", user.id)
      .limit(1)
      .then(({ data }: { data: { id: string }[] | null }) => {
        setHasPurchased((data?.length ?? 0) > 0)
      })
  }, [user, product])

  const { addItem, items } = useCart()

  useEffect(() => {
    if (!loading && products) {
      const foundProduct = products.find(p => p.id.toString() === params.id)
      if (foundProduct) {
        import("posthog-js").then(({ default: posthog }) => {
          posthog.capture("producto_visto", { product_id: foundProduct.id, product_name: foundProduct.name, price: foundProduct.price })
        })
      }
      setProduct(foundProduct ?? null)
      if (foundProduct) {
        const keys = Object.keys(foundProduct.stock ?? {})
        const single = keys.length === 1 && keys[0] === "Única"
        setSize(single ? "Única" : (["S", "M", "L", "XL"].find(s => (foundProduct.stock?.[s] ?? 0) > 0) ?? "L"))
        if (foundProduct.store_id) {
          createClient()
            .from("stores")
            .select("id, name, slug, logo_url")
            .eq("id", foundProduct.store_id)
            .single()
            .then(({ data }: { data: { id: string; name: string; slug: string | null; logo_url: string | null } | null }) => {
              if (data) setStore(data)
            })
        }
      }
    }
  }, [params.id, products, loading])

  useEffect(() => {
    if (product) {
      const bet = bets.find(b => b.id === Number.parseFloat(selectedOption))
      setcashbak(bet ? calculateProductCashbak(product, bet.odd) : 0)
    }
  }, [product, selectedOption, products])

  const availableStock = product?.stock?.[size] ?? 0
  const currentQuantityInCart = items
    .filter(item => item.productId === product?.id && item.size === size)
    .reduce((sum, item) => sum + item.quantity, 0)
  const remainingToAdd = Math.max(availableStock - currentQuantityInCart, 0)
  const maxQuantity = Math.min(10, remainingToAdd)
  const outOfStock = remainingToAdd <= 0

  useEffect(() => {
    if (quantity > maxQuantity) setQuantity(maxQuantity > 0 ? maxQuantity : 1)
  }, [size, availableStock, currentQuantityInCart, maxQuantity])

  const handleOptionChange = (value: string) => {
    setSelectedOption(value)
    if (product) {
      const bet = bets.find(b => b.id === Number.parseFloat(value))
      setcashbak(bet ? calculateProductCashbak(product, bet.odd) : 0)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    if (quantity > remainingToAdd) {
      toast({
        title: "Stock insuficiente",
        description: remainingToAdd === 0
          ? "Ya tienes todo el stock disponible en tu carrito."
          : `Solo puedes agregar ${remainingToAdd} unidad(es) más en talla ${size}.`,
        variant: "destructive",
      })
      return
    }
    addItem(product.id, quantity, selectedOption, size)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 1500)
    toast({ title: "Producto agregado al carrito", description: `${quantity} × ${product.name}` })
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    setCommentError(null)
    setIsLoading(true)
    try {
      if (!product?.id) throw new Error("Producto no definido")
      if (!commentData.comment.trim()) throw new Error("El comentario no puede estar vacío")
      const supabase = createClient()
      const { error } = await supabase.from("comments").insert([{
        product_id: product.id,
        content: commentData.comment.trim(),
        user_id: user?.id ?? null,
        user_name: customer_active[0].full_name,
        stars: commentData.stars,
      }])
      if (error) throw error
      toast({ title: "Comentario agregado", description: "Tu comentario fue publicado con éxito." })
      setComment({ comment: "", stars: 5 })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      setCommentError(message)
      toast({ title: "Error al agregar comentario", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
    await refreshComments()
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Button variant="ghost" className="mb-6" disabled>
          <ArrowLeft className="mr-2 size-4" /> Volver
        </Button>
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="w-full aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="w-3/4 h-8" />
            <Skeleton className="w-1/4 h-6" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />
            <Skeleton className="w-full h-10 mt-4" />
            <Skeleton className="w-full h-12 mt-4" />
          </div>
        </div>
      </div>
    )
  }

  if (error) return <div className="container flex justify-center px-4 py-16 mx-auto"><p>Error al cargar productos: {error}</p></div>
  if (!product) return <div className="container flex justify-center px-4 py-16 mx-auto"><p /></div>

  const imgs = product.images?.length ? product.images : product.image ? [product.image] : ["/placeholder.svg"]
  const currentImg = imgs[imgIndex] ?? "/placeholder.svg"

  return (
    <div className="container px-4 py-8 mx-auto max-w-6xl">
      <Button variant="ghost" className="mb-6 cursor-pointer" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 size-4" /> Volver
      </Button>

      <div className="grid gap-8 md:grid-cols-2">

        {/* ── Image gallery ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 aspect-square">
            <Image src={currentImg} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
            {imgs.length > 1 && (
              <>
                <button
                  onClick={() => setImgIndex(i => (i - 1 + imgs.length) % imgs.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={() => setImgIndex(i => (i + 1) % imgs.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {imgs.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all cursor-pointer ${i === imgIndex ? "bg-white w-4" : "bg-white/60"}`}
                      aria-label={`Ir a imagen ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {imgs.length > 1 && (
            <div className="flex gap-2">
              {imgs.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${i === imgIndex ? "border-green-700 shadow-sm" : "border-gray-200 hover:border-gray-400"}`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product info ───────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Store link */}
          {store && (
            <Link
              href={`/tienda/${store.slug ?? store.id}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-green-800 hover:text-green-600 transition-colors cursor-pointer"
            >
              {store.logo_url && (
                <Image src={store.logo_url} alt={store.name} width={20} height={20} className="rounded-full object-cover w-5 h-5" />
              )}
              {store.name}
              <span className="text-gray-400">→</span>
            </Link>
          )}

          {/* Name + rating */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {avgRating !== null && (
              <div className="mt-2">
                <StarDisplay rating={avgRating} count={productComments.length} />
              </div>
            )}
          </div>

          {/* Price */}
          <p className="text-2xl font-bold text-gray-900">
            ${product.price.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
          </p>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Descripción</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* ── Size selector (pill buttons) ── */}
          {!isSingleSize && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Talla</p>
              <div className="flex gap-2 flex-wrap">
                {availableSizes.map(talla => {
                  const stock = product.stock?.[talla] ?? 0
                  const isSelected = size === talla
                  const isOut = stock === 0
                  return (
                    <button
                      key={talla}
                      type="button"
                      onClick={() => !isOut && setSize(talla)}
                      disabled={isOut}
                      className={`w-14 h-11 rounded-xl border-2 text-sm font-semibold transition-all ${
                        isSelected
                          ? "border-green-800 bg-green-900 text-white shadow-sm"
                          : isOut
                          ? "border-gray-200 text-gray-300 line-through cursor-not-allowed bg-gray-50"
                          : "border-gray-300 text-gray-700 hover:border-green-700 hover:text-green-800 cursor-pointer bg-white"
                      }`}
                    >
                      {talla}
                    </button>
                  )
                })}
              </div>
              {remainingToAdd <= 2 && remainingToAdd > 0 && !outOfStock && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  Solo quedan {remainingToAdd} en talla {size}
                </p>
              )}
            </div>
          )}

          {/* ── Bet selector ── */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">
              Selecciona el evento — si ocurre, recibes el CashBak indicado abajo:
            </p>
            <BetSelector
              value={selectedOption}
              onChange={handleOptionChange}
              getCashback={(bet) => product ? calculateProductCashbak(product, bet.odd) : 0}
            />
          </div>

          {/* CashBak box */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
            <p className="text-lg font-bold text-green-900">
              CashBak del {cashbak.toLocaleString("es-CL", { maximumFractionDigits: 0 })}%
            </p>
            <p className="mt-1 text-sm text-green-800">
              Recibirás{" "}
              <span className="font-semibold">
                ${((product.price * cashbak) / 100).toLocaleString("es-CL", { maximumFractionDigits: 0 })}
              </span>{" "}
              de vuelta si se cumple el evento seleccionado.
            </p>
          </div>

          {/* ── Quantity + Add to cart ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {/* +/- quantity counter */}
              <div className="flex items-center rounded-xl border border-gray-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || outOfStock}
                  className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Reducir cantidad"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-12 h-11 flex items-center justify-center text-sm font-bold border-x border-gray-300 select-none">
                  {outOfStock ? "0" : quantity}
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                  disabled={quantity >= maxQuantity || outOfStock}
                  className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400">{outOfStock ? "Sin stock" : `Máx. ${maxQuantity}`}</p>
            </div>

            {/* Add to cart */}
            <button
              ref={addToCartRef}
              type="button"
              onClick={handleAddToCart}
              disabled={addedToCart || outOfStock}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:cursor-not-allowed ${
                addedToCart
                  ? "bg-emerald-600 text-white"
                  : outOfStock
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-green-900 text-white hover:bg-green-800 shadow-sm hover:shadow-md"
              }`}
            >
              {addedToCart ? (
                <><Check className="w-4 h-4" /> Agregado al carrito</>
              ) : outOfStock ? (
                "Sin stock"
              ) : (
                <><ShoppingCart className="w-4 h-4" /> Añadir al carrito</>
              )}
            </button>

            {/* Ver carrito */}
            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="w-full py-2.5 px-6 rounded-xl border-2 border-green-900 text-green-900 font-semibold text-sm hover:bg-green-50 transition-colors cursor-pointer"
            >
              Ver carrito
            </button>

            {/* WhatsApp share */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`¡Mira este producto en CashBak! ${product.name} — ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-white transition-colors bg-[#25D366] rounded-xl hover:bg-[#1ebe5d] cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Compartir por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ── More from this store ─────────────────────────────────────────────── */}
      {storeProducts.length > 0 && store && (
        <div className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Más de {store.name}</h2>
            <Link
              href={`/tienda/${store.slug ?? store.id}`}
              className="text-sm font-semibold text-green-800 hover:text-green-700 hover:underline cursor-pointer"
            >
              Ver todo →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {storeProducts.map(p => (
              <Link
                key={p.id}
                href={`/product/${p.id}/${slugify(p.name)}`}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="relative aspect-square bg-gray-50">
                  <Image
                    src={p.image ?? "/placeholder.svg"}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-green-900 transition-colors">
                    {p.name}
                  </p>
                  <p className="text-sm font-bold text-gray-700 mt-0.5">
                    ${p.price.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Comments ─────────────────────────────────────────────────────────── */}
      <div className="mt-14 space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Reseñas</h2>
          {avgRating !== null && (
            <StarDisplay rating={avgRating} count={productComments.length} />
          )}
        </div>

        {/* Comment form */}
        {!user ? (
          <p className="text-gray-500 text-sm">Debes iniciar sesión para dejar una reseña.</p>
        ) : hasPurchased === null ? (
          <p className="text-gray-400 text-sm">Verificando compra...</p>
        ) : !hasPurchased ? (
          <p className="text-gray-500 text-sm">Solo los compradores verificados pueden dejar una reseña.</p>
        ) : (
          <form onSubmit={handleComment} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Deja tu reseña</h3>

            <div>
              <Label>Calificación</Label>
              <div className="flex mt-1 gap-1">
                {Array.from({ length: 5 }, (_, i) => {
                  const starIndex = i + 1
                  return (
                    <StarInput
                      key={starIndex}
                      filled={starIndex <= (hoverRating ?? commentData.stars)}
                      onMouseEnter={() => setHoverRating(starIndex)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setComment({ ...commentData, stars: starIndex })}
                    />
                  )
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Tu comentario</Label>
              <textarea
                id="comment"
                rows={3}
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
                placeholder="¿Qué te pareció el producto?"
                value={commentData.comment}
                onChange={e => setComment({ ...commentData, comment: e.target.value })}
                disabled={isLoading}
              />
            </div>

            {commentError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{commentError}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !commentData.stars || !commentData.comment.trim()}
              className="px-5 py-2.5 bg-green-900 text-white rounded-lg font-semibold text-sm hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "Enviando..." : "Publicar reseña"}
            </button>
          </form>
        )}

        {/* Comment list */}
        {commentsLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : productComments.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No hay reseñas aún. Sé el primero en opinar.</p>
        ) : (
          <div className="space-y-4">
            {productComments.map((c, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-green-800">{getInitials(c.user_name ?? "?")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{c.user_name ?? "Anónimo"}</p>
                      <span className="text-xs text-gray-400">{c.created_at ? timeAgo(c.created_at) : ""}</span>
                    </div>
                    <div className="flex gap-0.5 mt-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <svg key={i} className={`w-3.5 h-3.5 fill-current ${i <= (c.stars ?? 0) ? "text-emerald-400" : "text-gray-200"}`} viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.561-.955L10 0l2.949 5.955 6.561.955-4.755 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sticky mobile CTA ─────────────────────────────────────────────────── */}
      {showStickyCart && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-2xl">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
            <p className="text-sm font-bold text-green-900">
              ${product.price.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addedToCart || outOfStock}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              addedToCart
                ? "bg-emerald-600 text-white cursor-default"
                : outOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-green-900 text-white hover:bg-green-800 cursor-pointer"
            }`}
          >
            {addedToCart
              ? <><Check className="w-4 h-4" /> Agregado</>
              : <><ShoppingCart className="w-4 h-4" /> Agregar</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
