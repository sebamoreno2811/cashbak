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

      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .eq("status", "approved")

      const approvedIds = (stores ?? []).map((s: { id: string }) => s.id)

      const query = supabase.from("products").select("*")
      const { data, error } = approvedIds.length > 0
        ? await query.or(`store_id.is.null,store_id.in.(${approvedIds.join(",")})`)
        : await query.is("store_id", null)

      if (error) setError(error.message)
      else setProducts(data as Product[])

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
