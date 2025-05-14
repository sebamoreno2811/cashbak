"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { products } from "@/lib/products"
import { useProductSelection } from "@/hooks/use-product-selection"
import { calculateCashback } from "@/lib/cashback-calculator"

export default function ProductSlider() {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [totalSlides, setTotalSlides] = useState(3)
  const { selectedOption } = useProductSelection()
  

  // Group products by category for slides
  const slideProducts = [
    products.filter((p) => p.category === 1), // Retro corta
    products.filter((p) => p.category === 2), // Retro larga
    products.filter((p) => p.category === 3), // Actual
  ]

  useEffect(() => {
    // Update cashback display when slide or option changes
    const cashbackDisplay = document.getElementById("cashback-display")
    if (cashbackDisplay) {
      cashbackDisplay.textContent = "Calculando CashBak..."

      setTimeout(() => {
        const cashback = calculateCashback(Number.parseFloat(selectedOption), currentSlide + 1)
        cashbackDisplay.textContent = `CashBak del: ${cashback.toFixed(0)}%`
      }, 500)
    }
  }, [currentSlide, selectedOption])

  const scrollToSlide = (index: number) => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.clientWidth
      sliderRef.current.scrollTo({
        left: slideWidth * index,
        behavior: "smooth",
      })
      setCurrentSlide(index)
    }
  }

  const handleScroll = () => {
    if (sliderRef.current) {
      const scrollPosition = sliderRef.current.scrollLeft
      const slideWidth = sliderRef.current.clientWidth
      const newSlide = Math.round(scrollPosition / slideWidth)

      if (newSlide !== currentSlide) {
        setCurrentSlide(newSlide)
      }
    }
  }

  return (
    <div className="relative">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Productos por Categoría</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSlide(Math.min(totalSlides - 1, currentSlide + 1))}
            disabled={currentSlide === totalSlides - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={sliderRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
        onScroll={handleScroll}
      >
        {slideProducts.map((slideItems, slideIndex) => (
          <div key={slideIndex} className="flex-shrink-0 w-full snap-center" data-porcentaje={slideIndex + 1}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {slideItems.map((product) => (
                <a key={product.id} href={`/product/${product.id}`} className="block group">
                  <div className="overflow-hidden transition-all duration-300 bg-white rounded-lg shadow-sm hover:shadow-md">
                    <div className="overflow-hidden aspect-square">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium truncate">{product.name}</h3>
                      <p className="text-sm text-gray-700">${product.price.toLocaleString()}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full ${currentSlide === index ? "bg-green-900" : "bg-gray-300"}`}
            onClick={() => scrollToSlide(index)}
          />
        ))}
      </div>
    </div>
  )
}
