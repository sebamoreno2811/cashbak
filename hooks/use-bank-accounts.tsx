// hooks/use-bank-account.ts
import { useEffect, useState } from "react"
import { createClient } from '@/utils/supabase/client'
import useSupabaseUser from "@/hooks/use-supabase-user"

export function useBankAccount() {
  const [hasBankAccount, setHasBankAccount] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { user } = useSupabaseUser()

  useEffect(() => {

    const fetchBankData = async () => {

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }
        
        setLoading(true)

        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("email", user.email)
          .single()
        
        const { data, error } = await supabase
            .from("bank_accounts")
            .select("id")
            .eq("customer_id", customer.id)
            .maybeSingle()

        if (error) {
            console.error("Error al obtener cuenta bancaria:", error.message)
        }

        setHasBankAccount(!!data)
        setLoading(false)
    }

    fetchBankData()
  }, [user])

  return { hasBankAccount, loading }
}
