"use client"

import ProductSlider from "@/components/product-slider"
import { ProductSelection } from "@/components/product-selection"
import { useProducts } from "@/context/product-context"
import BetSelector from "@/components/bet-selector"
import { calculateMaxcashbak } from "@/lib/cashbak-calculator"

export default function Home() {
  
  const { products } = useProducts()
  
  return (
    <main className="min-h-screen bg-white">
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-8 text-3xl font-bold text-center">
          <img src={"/img/logo.png"} alt={"hola"} className="mx-auto h-auto mix-blend-multiply w-72 sm:w-96 md:w-[30rem] lg:w-[36rem] mb-0 mt-0" />
        </h1>

        <div className="p-4 mb-8 bg-white rounded-lg shadow-lg">
          <ProductSelection />

          <div
            id="cashbak-display"
            className="flex items-center justify-center w-full h-20 mb-6 text-xl font-semibold bg-gray-100 rounded-lg"
          >
            Calculando CashBak...
          </div>

          <ProductSlider />
        </div>

        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Todos los Productos</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 overflow-y-auto max-h-[670px] pr-2">
            {products.length > 0 && products.map((product) => (
              <a key={product.id} href={`/product/${product.id}`} className="group">
                <div className="overflow-hidden transition-all duration-300 bg-white rounded-lg shadow-md hover:shadow-xl">
                  <div className="overflow-hidden aspect-square">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 text-lg font-semibold">{product.name}</h3>
                    <p className="text-gray-700">${product.price.toLocaleString()}</p>
                    <div className="mt-2 font-medium text-emerald-600">
                      CashBak: hasta {calculateMaxcashbak(product.category, products)}%
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
