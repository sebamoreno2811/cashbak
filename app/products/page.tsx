"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Search } from "lucide-react"
import { toSlug } from "@/lib/slug"
import { calculateProductCashbak, calculateMaxProductCashbak } from "@/lib/cashbak-calculator"
import { useProducts } from "@/context/product-context"
import { useBets } from "@/context/bet-context"
import { useBetOption } from "@/hooks/use-bet-option"

export default function ProductsPage() {
  const { products, loading, error } = useProducts()
  const { bets } = useBets()
  const { selectedOption } = useBetOption()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const categories = Array.from(new Set(products.map((p) => p.category_name)))

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === null || p.category_name === selectedCategory
    const matchesSearch = search.trim() === "" || p.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const countByCategory = (cat: string | null) =>
    products.filter((p) => (cat === null ? true : p.category_name === cat)).length

  if (loading) return <div>Cargando productos...</div>
  if (error) return <div>Error al cargar productos: {error}</div>

  return (
    <main className="min-h-screen bg-white">
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-8 text-3xl font-bold text-center">Todos los Productos</h1>

        {/* Buscador */}
        <div className="relative max-w-md mx-auto mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar camiseta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </div>

        {/* Filtros con conteo */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            className={selectedCategory === null ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setSelectedCategory(null)}
          >
            Todos ({countByCategory(null)})
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={selectedCategory === category ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={() => setSelectedCategory(category)}
            >
              {category} ({countByCategory(category)})
            </Button>
          ))}
        </div>

        {/* Grilla de productos */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.id}/${toSlug(product.name)}`} className="group">
              <div className="overflow-hidden transition-all duration-300 bg-white rounded-lg shadow-md hover:shadow-xl">
                <div className="relative overflow-hidden aspect-square">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-lg font-semibold">{product.name}</h3>
                  <p className="text-gray-700">${product.price.toLocaleString("es-CL", { maximumFractionDigits: 0 })}</p>
                  <div className="mt-2 flex flex-col gap-1">
                    {selectedOption && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-sm font-semibold text-emerald-700">
                          {calculateProductCashbak(product, bets.find(b => b.id === Number(selectedOption))?.odd ?? 0)}% con evento seleccionado
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      Hasta {calculateMaxProductCashbak(product, bets)}% con el mejor evento
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">{product.category_name}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mensaje si no hay productos */}
        {filteredProducts.length === 0 && (
          <div className="p-8 mt-4 text-center bg-gray-100 rounded-lg">
            <p className="text-lg text-gray-600">
              {search ? `No se encontraron resultados para "${search}".` : "No se encontraron productos en esta categoría."}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
