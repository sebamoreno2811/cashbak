"use client"

import { useState } from "react"
import { products } from "@/lib/products"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { calculateMaxcashbak } from "@/lib/cashbak-calculator"

// Get unique categories from products
const categories = Array.from(new Set(products.map((product) => product.categoryName)))

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter products based on selected category
  const filteredProducts = selectedCategory
    ? products.filter((product) => product.categoryName === selectedCategory)
    : products

  return (
    <main className="min-h-screen bg-white">
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-8 text-3xl font-bold text-center">Todos los Productos</h1>

        {/* Category filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            className={selectedCategory === null ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={selectedCategory === category ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="group">
              <div className="overflow-hidden transition-all duration-300 bg-white rounded-lg shadow-md hover:shadow-xl">
                <div className="overflow-hidden aspect-square">
                  <img
                    src={product.image || "/placeholder.svg?height=300&width=300"}
                    alt={product.name}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-lg font-semibold">{product.name}</h3>
                  <p className="text-gray-700">${product.price.toLocaleString()}</p>
                  <div className="mt-2 font-medium text-emerald-600">CashBak: hasta {calculateMaxcashbak(product.category)}%</div>
                  <div className="mt-1 text-sm text-gray-500">Categoría: {product.categoryName}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-8 mt-4 text-center bg-gray-100 rounded-lg">
            <p className="text-lg text-gray-600">No se encontraron productos en esta categoría.</p>
          </div>
        )}
      </div>
    </main>
  )
}