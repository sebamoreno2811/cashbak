"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { createClient } from "@/utils/supabase/client"
import useSupabaseUser from "@/hooks/use-supabase-user"

export interface ShippingAddress {
  id: number
  user_id: string
  address_line1: string
  address_line2?: string | null
  city: string
  postal_code: string
  region: string
  phone: string
  // agrega más campos si tienes
}

interface ShippingContextType {
  address: ShippingAddress | null
  loading: boolean
  error: string | null
  hasShippingDetails: boolean | null
  setHasShippingDetails: React.Dispatch<React.SetStateAction<boolean | null>>
  refreshAddress: () => Promise<void>
  saveAddress: (newAddress: Omit<ShippingAddress, "id" | "user_id">) => Promise<void>
}

const ShippingContext = createContext<ShippingContextType | undefined>(undefined)

export function ShippingAddressProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const { user, loading: loadingUser } = useSupabaseUser()

  const [address, setAddress] = useState<ShippingAddress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado que indica si el usuario tiene dirección guardada o no
  const [hasShippingDetails, setHasShippingDetails] = useState<boolean | null>(null)

  // Función para cargar la dirección desde Supabase
  const fetchAddress = async () => {
    if (!user) {
      setAddress(null)
      setHasShippingDetails(false)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id") 
        .eq("email", user.email)
        .single()

        if (customerError || !customerData) {
        setError("No se encontró información del cliente.")
        return
    }

    const { data, error } = await supabase
      .from("customer_shipping_details")
      .select("*")
      .eq("customer_id", customerData.id)
      .single()

    if (error) {
      if (error.code === "PGRST116" || error.message.includes("No rows found")) {
        setAddress(null)
        setHasShippingDetails(false)
      } else {
        setError(error.message || "Error al cargar dirección")
        setHasShippingDetails(false)
      }
    } else {
      setAddress(data)
      setHasShippingDetails(true)
    }
    setLoading(false)
  }

  // Función para guardar o actualizar la dirección
  const saveAddress = async (newAddress: Omit<ShippingAddress, "id" | "user_id">) => {
    if (!user) {
      setError("Usuario no autenticado")
      return
    }

    setLoading(true)
    setError(null)

    const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id") 
        .eq("email", user.email)
        .single()

        if (customerError || !customerData) {
        setError("No se encontró información del cliente.")
        return
    }

    const { data, error } = await supabase
      .from("customer_shipping_details")
      .upsert({ customer_id: customerData.id, ...newAddress }, { onConflict: "user_id" })
      .select()
      .single()

    if (error) {
      setError(error.message || "Error guardando la dirección")
    } else {
      setAddress(data)
      setHasShippingDetails(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!loadingUser) {
      fetchAddress()
    }
  }, [user, loadingUser])

  return (
    <ShippingContext.Provider
      value={{
        address,
        loading,
        error,
        hasShippingDetails,
        setHasShippingDetails,
        refreshAddress: fetchAddress,
        saveAddress,
      }}
    >
      {children}
    </ShippingContext.Provider>
  )
}

export function useShipping() {
  const context = useContext(ShippingContext)
  if (!context) {
    throw new Error("useShippingAddress debe usarse dentro de ShippingAddressProvider")
  }
  return context
}
