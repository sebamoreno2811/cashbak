import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import EventsPanel from "./EventsPanel"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AdminEventosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/admin/eventos")

  const { data: customer } = await supabase
    .from("customers")
    .select("role")
    .eq("id", user.id)
    .single()

  if (customer?.role !== "admin") redirect("/")

  const { data: bets } = await supabase
    .from("bets")
    .select("id, name, odd, end_date, active, is_winner, category")
    .order("end_date", { ascending: false })

  const pending = (bets ?? []).filter((b: { is_winner: boolean | null }) => b.is_winner === null).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/tiendas" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-sm text-gray-500">
            {bets?.length ?? 0} eventos · {pending} pendientes de resolver
          </p>
        </div>
      </div>

      <EventsPanel bets={bets ?? []} />
    </div>
  )
}
