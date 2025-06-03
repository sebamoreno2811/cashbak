"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import type { Product } from "@/types/product"
import { supabase } from "@/utils/supabase/supabase"

interface ProductsContextType {
  products: Product[]  // ❌ sin | null
  loading: boolean
  error: string | null
}

const ProductsContext = createContext<ProductsContextType>({
  products: [],  // ✅ arreglo vacío por defecto
  loading: false,
  error: null,
})

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("products")
        .select("*")

      if (error) {
        setError(error.message)
      } else {
        setProducts(data as Product[])
      }

      setLoading(false)
    }

    if (products.length === 0) {
      fetchProducts()
    }
  }, [products])

  return (
    <ProductsContext.Provider value={{ products, loading, error }}>
      {children}
    </ProductsContext.Provider>
  )
}

export const useProducts = () => useContext(ProductsContext)
