"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { createClient } from "@/utils/supabase/client"

export interface Customer {
  id: string
  full_name: string
  email: string
  phone: string
  created_at: string | null
  updated_at: string | null
}

interface CustomerContextType {
  customers: Customer[]
  loading: boolean
  error: string | null
  refreshCustomers: () => Promise<void>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export function CustomerProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching customers:", error)
      setError(error.message || "Error desconocido al cargar clientes")
      setCustomers([])
    } else {
      setCustomers(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  return (
    <CustomerContext.Provider
      value={{
        customers,
        loading,
        error,
        refreshCustomers: fetchCustomers,
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomers() {
  const context = useContext(CustomerContext)
  if (!context) {
    throw new Error("useCustomers must be used within a CustomerProvider")
  }
  return context
}
