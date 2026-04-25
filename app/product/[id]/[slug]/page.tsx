"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateProductCashbak } from "@/lib/cashbak-calculator"
import { useBetOption } from "@/hooks/use-bet-option"
import { useCart } from "@/hooks/use-cart"
import { ArrowLeft, ShoppingCart, Check, ChevronLeft, ChevronRight } from "lucide-react"
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

function Star({ filled, onMouseEnter, onMouseLeave, onClick }: { filled: boolean, onMouseEnter: () => void, onMouseLeave: () => void, onClick: () => void }) {
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
  const stockKeys = product ? Object.keys(product.stock ?? {}) : []
  const isSingleSize = stockKeys.length === 1 && stockKeys[0] === "Única"
  const availableSizes = isSingleSize ? [] : ["S", "M", "L", "XL"]
  const defaultSize = isSingleSize ? "Única" : (["S","M","L","XL"].find(s => (product?.stock?.[s] ?? 0) > 0) ?? "L")
  const [size, setSize] = useState<string>(defaultSize)
  const { bets } = useBets()
  const [store, setStore] = useState<{ id: string; name: string; slug: string | null; logo_url: string | null } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const { comments, loading: commentsLoading, refreshComments } = useComments()
  const { customers } = useCustomers()
  const [commentData, setComment] = useState({
    comment: "",
    stars: 0,
  })

  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null)

  const productComments = comments.filter((c) => c.product_id === product?.id)

  const { user } = useSupabaseUser()

  const customer_active = customers.filter((c) => c.id === user?.id)

  useEffect(() => {
    if (!user || !product) {
      setHasPurchased(null)
      return
    }
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
        setSize(single ? "Única" : (["S","M","L","XL"].find(s => (foundProduct.stock?.[s] ?? 0) > 0) ?? "L"))
        if (foundProduct.store_id) {
          createClient()
            .from("stores")
            .select("id, name, slug, logo_url")
            .eq("id", foundProduct.store_id)
            .single()
            .then(({ data }: { data: { id: string; name: string; slug: string | null; logo_url: string | null } | null }) => { if (data) setStore(data) })
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
  const quantityOptions = Array.from({ length: maxQuantity }, (_, i) => i + 1)
  const outOfStock = remainingToAdd <= 0

  useEffect(() => {
    if (quantity > maxQuantity) {
      setQuantity(maxQuantity > 0 ? maxQuantity : 1)
    }
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
          ? `Ya tienes todo el stock disponible de esta talla en tu carrito.`
          : `Solo puedes agregar ${remainingToAdd} unidad(es) más en talla ${size}.`,
        variant: "destructive",
      })
      return
    }

    addItem(product.id, quantity, selectedOption, size)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 1500)

    toast({
      title: "Producto agregado al carrito",
      description: `${quantity} x ${product.name}`,
    })
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    setCommentError(null)
    setIsLoading(true)

    try {
      if (!product?.id) {
        throw new Error("Producto no definido")
      }
      if (!commentData.comment.trim()) {
        throw new Error("El comentario no puede estar vacío")
      }
      const supabase = createClient()
      if (!product) return

      const { error } = await supabase
        .from("comments")
        .insert([
          {
            product_id: product.id,
            content: commentData.comment.trim(),
            user_id: user?.id ?? null,
            user_name: customer_active[0].full_name,
            stars: commentData.stars
          },
        ])

      if (error) throw error

      toast({
        title: "Comentario agregado",
        description: "Tu comentario fue publicado con éxito.",
      })

      setComment({ comment: "", stars: 5 })

    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      setCommentError(message)
      toast({
        title: "Error al agregar comentario",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }

    await refreshComments()
  }

  const handleGoToCart = () => router.push("/cart")

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:\?v=|\/embed\/|\.be\/)([\w-]{11})/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : ""
  }

  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Button variant="ghost" className="mb-6" disabled>
          <ArrowLeft className="mr-2 size-4" /> Volver
        </Button>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden bg-white rounded-lg shadow-lg">
            <Skeleton className="w-full h-[400px] rounded-lg" />
          </div>

          <div className="p-6 space-y-4 bg-white rounded-lg shadow-lg">
            <Skeleton className="w-3/4 h-8" />
            <Skeleton className="w-1/4 h-6" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />
            <Skeleton className="w-full h-10 mt-4" />
            <Skeleton className="w-1/2 h-10" />
            <Skeleton className="w-full h-8 mt-6" />
          </div>
        </div>

        <div className="mt-8 mb-6">
          <Skeleton className="w-1/2 h-8 mx-auto mb-4" />
          <Skeleton className="w-full h-[300px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container flex justify-center px-4 py-16 mx-auto">
        <p>Error al cargar productos: {error}</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container flex justify-center px-4 py-16 mx-auto">
        <p></p>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 size-4" /> Volver
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Galería con slider */}
        {(() => {
          const imgs = product.images?.length ? product.images : product.image ? [product.image] : ["/placeholder.svg"]
          const current = imgs[imgIndex] ?? "/placeholder.svg"
          return (
            <div className="space-y-2">
              <div className="relative overflow-hidden bg-white rounded-lg shadow-lg aspect-square">
                <Image src={current} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
                {imgs.length > 1 && (
                  <>
                    <button onClick={() => setImgIndex(i => (i - 1 + imgs.length) % imgs.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setImgIndex(i => (i + 1) % imgs.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {imgs.length > 1 && (
                <div className="flex gap-2">
                  {imgs.map((img, i) => (
                    <button key={i} onClick={() => setImgIndex(i)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${i === imgIndex ? "border-green-700" : "border-transparent"}`}>
                      <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        <div className="p-6 bg-white rounded-lg shadow-lg">
          {store && (
            <Link
              href={`/tienda/${store.slug ?? store.id}`}
              className="inline-flex items-center gap-2 mb-3 text-sm font-semibold text-green-800 hover:text-green-600 transition-colors"
            >
              {store.logo_url && (
                <Image src={store.logo_url} alt={store.name} width={20} height={20} className="rounded-full object-cover w-5 h-5" />
              )}
              {store.name}
              <span className="text-gray-400">→</span>
            </Link>
          )}
          <h1 className="mb-4 text-3xl font-bold">{product.name}</h1>
          <p className="mb-6 text-xl font-semibold">
            ${ product.price.toLocaleString("es-CL", { maximumFractionDigits: 0 }) }
          </p>

          <div className="mb-6">
            <h3 className="mb-2 text-lg font-medium">Descripción</h3>
            <p className="text-gray-700">{product.description}</p>
          </div>

          <div className="mb-1">
            <p className="text-sm font-semibold text-gray-800 mb-2">Selecciona el evento — si ocurre, recibes el CashBak indicado abajo:</p>
            <BetSelector
              value={selectedOption}
              onChange={handleOptionChange}
              getCashback={(bet) => product ? calculateProductCashbak(product, bet.odd) : 0}
            />
          </div>

          <div className="p-4 mt-4 border rounded-lg border-emerald-200 bg-emerald-50">
            <p className="text-lg font-semibold text-green-900">CashBak del: {cashbak.toLocaleString("es-CL", { maximumFractionDigits: 0 })}%</p>
            <p className="mt-1 text-sm text-green-800">
              Recibirás ${((product.price * cashbak) / 100).toLocaleString("es-CL", { maximumFractionDigits: 0 })} de vuelta, en caso de que se cumpla el evento seleccionado.
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-6 mb-6">
          <div className="flex gap-4">
            <div className="w-32">
              <Select
                value={outOfStock ? "0" : quantity.toString()}
                onValueChange={(val) => {
                  if (!outOfStock) {
                    const parsed = Number.parseInt(val)
                    const safeValue = Math.min(parsed, maxQuantity)
                    setQuantity(safeValue)
                  }
                }}
                disabled={outOfStock}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cantidad" />
                </SelectTrigger>
                <SelectContent>
                  {outOfStock ? (
                    <SelectItem value="0" disabled>
                      Agotada
                    </SelectItem>
                  ) : (
                    quantityOptions.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {!isSingleSize && (
            <div className="w-16">
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Talla" />
                </SelectTrigger>
                <SelectContent>
                  {availableSizes.map((talla) => {
                    const stockDisponible = product.stock?.[talla] ?? 0
                    return (
                      <SelectItem key={talla} value={talla} disabled={stockDisponible === 0}>
                        {stockDisponible === 0 ? `${talla} (agotado)` : talla}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            )}
          </div>

          <Button
            className={`flex-1 ${addedToCart ? "bg-emerald-600 rounded-md border-2 border-black" : "bg-green-900 ounded-md border-2 border-black hover:bg-green-700 hover:shadow-lg"}`}
            onClick={handleAddToCart}
            disabled={addedToCart || outOfStock}
          >
            {addedToCart ? (
              <>
                <Check className="mr-2 size-4" /> Agregado
              </>
            ) : outOfStock ? (
              <>Sin stock</>
            ) : (
              <>
                <ShoppingCart className="mr-2 size-4" /> Añadir al carrito
              </>
            )}
          </Button>
        </div>

          {remainingToAdd <= 2 && remainingToAdd >= 0 && !outOfStock && (
            <p className="mt-2 text-sm font-semibold text-red-600">
              Stock limitado: queda(n) {remainingToAdd} unidad(es) disponible(s) en talla {size}
            </p>
          )}

          <Button
            variant="outline"
            className="w-full mt-2 text-green-900 border-green-900 hover:bg-green-50"
            onClick={handleGoToCart}
          >
            Ver carrito
          </Button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(`¡Mira esta camiseta en CashBak! 👕 ${product.name} — ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-2 text-sm font-medium text-white transition-colors bg-[#25D366] rounded-md hover:bg-[#1ebe5d]"
          >
            <svg viewBox="0 0 24 24" className="size-4 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartir por WhatsApp
          </a>

        </div>
      </div>

      {product.video_url && (
        <div className="mt-8 mb-6">
          <h1 className="mb-4 text-3xl font-bold text-center text-gray-800">Mejores momentos de esta camiseta</h1>
          <div className="overflow-hidden shadow-lg aspect-video rounded-xl">
            <iframe
              className="w-full h-full"
              src={getYouTubeEmbedUrl(product.video_url)}
              title="YouTube video"
              style={{ border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      <div className="mt-12 space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">Comentarios</h2>

        {!user ? (
          <p className="text-gray-500 text-sm">Debes iniciar sesión para dejar un comentario.</p>
        ) : hasPurchased === null ? (
          <p className="text-gray-400 text-sm">Verificando compra...</p>
        ) : !hasPurchased ? (
          <p className="text-gray-500 text-sm">Solo los compradores verificados pueden dejar una reseña.</p>
        ) : (
          <form onSubmit={handleComment} className="space-y-4">
            <Label htmlFor="comment">Agrega tu comentario</Label>
            <textarea
              id="comment"
              rows={4}
              className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Escribe aquí tu comentario..."
              value={commentData.comment}
              onChange={(e) => setComment({ ...commentData, comment: e.target.value })}
              disabled={isLoading}
            />

            <div>
              <Label>Calificación</Label>
              <div className="flex mt-1">
                {Array.from({ length: 5 }, (_, i) => {
                  const starIndex = i + 1
                  return (
                    <Star
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

            {commentError && <p className="text-red-600">{commentError}</p>}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar comentario"}
            </Button>
          </form>
        )}

        {commentsLoading ? (
          <p>Cargando comentarios...</p>
        ) : productComments.length === 0 ? (
          <p className="text-gray-600">No hay comentarios aún. Sé el primero en opinar.</p>
        ) : (
          <div className="space-y-6">
            {productComments.map((c, idx) => (
              <div key={idx} className="p-4 border rounded-lg shadow-sm bg-gray-50">
                <div className="flex items-center mb-2">
                  <div className="flex text-emerald-400">
                    {Array.from({ length: 5 }, (_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 fill-current ${i < (c.stars ?? 0) ? "text-emerald-400" : "text-gray-200"}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.561-.955L10 0l2.949 5.955 6.561.955-4.755 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <p className="ml-4 text-sm text-gray-500">Usuario: {c.user_name ?? "Anónimo"}</p>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
