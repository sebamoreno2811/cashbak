"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { products } from "@/lib/products"
import { calculatecashbak } from "@/lib/cashbak-calculator"
import { useBetOption } from "@/hooks/use-bet-option"
import { useCart } from "@/hooks/use-cart"
import { ArrowLeft, ShoppingCart, Check } from "lucide-react"
import BetSelector from "@/components/bet-selector"
import { toast } from "@/hooks/use-toast"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const { selectedOption, setSelectedOption } = useBetOption()
  const [cashbak, setcashbak] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [size, setSize] = useState<string>("L")

  const { addItem, items } = useCart()

  // Stock disponible para la talla seleccionada
  const availableStock = product?.stock?.[size] ?? 0

  // Cantidad ya en carrito para este producto y talla
  const currentQuantityInCart = items
    .filter(item => item.productId === product?.id && item.size === size)
    .reduce((sum, item) => sum + item.quantity, 0)

  // Stock restante real que se puede añadir
  const remainingStock = availableStock - currentQuantityInCart

  // Cantidad máxima para seleccionar (máximo 10 o lo que quede en stock)
  const maxQuantity = Math.min(10, Math.max(remainingStock, 0))
  const quantityOptions = Array.from({ length: maxQuantity }, (_, i) => i + 1)

  // Cuando no hay stock disponible para añadir (ya sea físico o en carrito)
  const outOfStock = remainingStock <= 0

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:\?v=|\/embed\/|\.be\/)([\w-]{11})/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : ""
  }

  useEffect(() => {
    const productId = params.id
    const foundProduct = products.find((p) => p.id.toString() === productId)

    if (foundProduct) {
      setProduct(foundProduct)
      const initialcashbak = calculatecashbak(Number.parseFloat(selectedOption), foundProduct.category)
      setcashbak(initialcashbak)
    }
  }, [params.id, selectedOption])

  // Ajusta la cantidad si excede el máximo permitido al cambiar talla o stock
  useEffect(() => {
    if (quantity > maxQuantity) {
      setQuantity(maxQuantity > 0 ? maxQuantity : 1)
    }
  }, [size, availableStock, currentQuantityInCart])

  const handleOptionChange = (value: string) => {
    setSelectedOption(value)
    if (product) {
      const newcashbak = calculatecashbak(Number.parseFloat(value), product.category)
      setcashbak(newcashbak)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    // Recalcula cantidad en carrito para evitar añadir más de lo disponible
    const currentQuantityInCart = items
      .filter(item => item.productId === product.id && item.size === size)
      .reduce((sum, item) => sum + item.quantity, 0)

    const totalQuantity = currentQuantityInCart + quantity

    if (totalQuantity > availableStock) {
      toast({
        title: "Stock insuficiente",
        description: `No puedes agregar ${quantity} unidades. Ya tienes ${currentQuantityInCart} en el carrito y solo hay ${availableStock} disponibles para la talla ${size}.`,
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

  const handleGoToCart = () => {
    router.push("/cart")
  }

  if (!product) {
    return (
      <div className="container flex justify-center px-4 py-16 mx-auto">
        <div className="animate-pulse">Cargando producto...</div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 size-4" /> Volver
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden bg-white rounded-lg shadow-lg">
          <img src={product.image || "/placeholder.svg"} alt={product.name} className="object-cover w-full h-auto" />
        </div>

        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h1 className="mb-4 text-3xl font-bold">{product.name}</h1>
          <p className="mb-6 text-xl font-semibold">${product.price.toLocaleString()}</p>

          <div className="mb-6">
            <h3 className="mb-2 text-lg font-medium">Descripción</h3>
            <p className="text-gray-700">{product.description}</p>
          </div>

          <BetSelector value={selectedOption} onChange={handleOptionChange} />

          <div className="p-4 mt-4 border rounded-lg border-emerald-200 bg-emerald-50">
            <p className="text-lg font-semibold text-green-900">CashBak del: {cashbak.toFixed(0)}%</p>
            <p className="mt-1 text-sm text-green-800">
              Recibirás ${Math.ceil((product.price * cashbak) / 100)} de vuelta, en caso de que se cumpla el evento
              seleccionado.
            </p>
          </div>

          <div className="flex items-center gap-4 mt-6 mb-6">
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

            <div className="w-16">
              <Select value={size} onValueChange={(val) => setSize(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Talla" />
                </SelectTrigger>
                <SelectContent>
                  {["S", "M", "L", "XL"].map((talla) => {
                    const stockDisponible = product.stock?.[talla] ?? 0
                    const agotado = stockDisponible === 0

                    return (
                      <SelectItem key={talla} value={talla} disabled={agotado}>
                        {agotado ? `${talla} (agotado)` : talla}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              className={`flex-1 ${addedToCart ? "bg-emerald-600" : "bg-green-900 hover:bg-emerald-700"}`}
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

          {remainingStock <= 2 && remainingStock >= 0 && (
            <p className="mt-2 text-sm font-semibold text-red-600">
              Stock limitado: queda(n) {remainingStock} unidad(es) disponible(s) en talla {size}
            </p>
          )}

          <Button
            variant="outline"
            className="w-full mt-2 text-green-900 border-green-900 hover:bg-green-50"
            onClick={handleGoToCart}
          >
            Ver carrito
          </Button>

          <div className="mt-4 text-sm text-gray-500">
            <p>Envío gratis en compras superiores a $50.000</p>
            <p>Garantía de devolución de 30 días</p>
          </div>
        </div>
      </div>

      {product.videoUrl && (
        <div className="mt-8 mb-6">
          <h1 className="mb-4 text-3xl font-bold text-center text-gray-800">Mejores momentos de esta camiseta</h1>
          <div className="overflow-hidden shadow-lg aspect-video rounded-xl">
            <iframe
              className="w-full h-full"
              src={getYouTubeEmbedUrl(product.videoUrl)}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  )
}
