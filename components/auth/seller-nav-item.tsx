"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { Building2 } from "lucide-react"

export default function SellerNavItem({ onClick }: { onClick?: () => void }) {
  const [hasStore, setHasStore] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (!user) return
      const { data } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .eq("status", "approved")
        .maybeSingle()
      setHasStore(!!data)
    })
  }, [])

  if (!hasStore) return null

  return (
    <Link
      href="/mi-tienda"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-green-800/50 hover:bg-green-800 text-green-100 hover:text-white transition-colors border border-green-700/50"
    >
      <Building2 className="w-4 h-4" aria-hidden="true" />
      Mi Tienda
    </Link>
  )
}
