"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { products } from "@/lib/products"
import { calculateCashback } from "@/lib/cashback-calculator"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import BetSelector from "@/components/bet-selector"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [selectedOption, setSelectedOption] = useState("1")
  const [cashback, setCashback] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:\?v=|\/embed\/|\.be\/)([\w\-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
  };

  useEffect(() => {
    const productId = params.id
    const foundProduct = products.find((p) => p.id.toString() === productId)

    if (foundProduct) {
      setProduct(foundProduct)
      const initialCashback = calculateCashback(Number.parseFloat(selectedOption), foundProduct.category)
      setCashback(initialCashback)
    }
  }, [params.id, selectedOption])

  const handleOptionChange = (value: string) => {
    setSelectedOption(value)
    if (product) {
      const newCashback = calculateCashback(Number.parseFloat(value), product.category)
      setCashback(newCashback)
    }
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

          {/* Apuestas (modularizado) */}
          <BetSelector value={selectedOption} onChange={handleOptionChange} />

          <div className="p-4 mt-4 border rounded-lg border-emerald-200 bg-emerald-50">
            <p className="text-lg font-semibold text-green-900">CashBak del: {cashback.toFixed(0)}%</p>
            <p className="mt-1 text-sm text-green-800">
              Recibirás ${Math.ceil((product.price * cashback) / 100)} de vuelta, en caso de que se cumpla el evento seleccionado.
            </p>
          </div>

          <div className="flex items-center gap-4 mt-6 mb-6">
            <div className="w-24">
              <Select value={quantity.toString()} onValueChange={(val) => setQuantity(Number.parseInt(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Cantidad" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="flex-1 bg-green-900 hover:bg-emerald-700">
              <ShoppingCart className="mr-2 size-4" /> Añadir al carrito
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            <p>Envío gratis en compras superiores a $50.000</p>
            <p>Garantía de devolución de 30 días</p>
          </div>
        </div>
      </div>
      {product.videoUrl && (
        <div className="mt-8 mb-6">
          <h1 className="mb-4 text-3xl font-bold text-center text-gray-800">
            Mejores momentos de esta camiseta
          </h1>
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
      <div className="p-6 mt-12 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-2xl font-bold">Detalles del producto</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-medium">Características</h3>
            <ul className="pl-5 space-y-1 list-disc">
              <li>Material de alta calidad</li>
              <li>Diseño exclusivo</li>
              <li>Disponible en varios tamaños</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-lg font-medium">Especificaciones</h3>
            <ul className="pl-5 space-y-1 list-disc">
              <li>Marca: {product.brand}</li>
              <li>Categoría: {product.categoryName}</li>
              <li>Código: {product.id}</li>
              <li>Stock disponible: {product.stock} unidades</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
