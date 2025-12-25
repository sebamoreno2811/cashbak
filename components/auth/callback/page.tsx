"use client"

import { useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

type SupabaseAuthEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY"

export default function AuthCallbackPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(
      (event: SupabaseAuthEvent) => {
        if (event === "PASSWORD_RECOVERY") {
          router.replace("/reset-password")
        } else {
          router.replace("/")
        }
      }
    )

    return () => {
      data.subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <p className="mt-10 text-sm text-center text-muted-foreground">
      Procesando autenticación…
    </p>
  )
}
