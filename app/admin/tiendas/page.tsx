import { redirect } from "next/navigation"
import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import AdminStoreActions from "./actions"
import { AdminDeleteStore, AdminStoreProducts } from "./AdminDeleteActions"

interface Store {
  id: string
  name: string
  description: string | null
  category: string | null
  email: string | null
  whatsapp: string | null
  status: "pending" | "approved" | "rejected"
  reject_reason: string | null
  created_at: string
  owner_id: string
}

export default async function AdminTiendasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Verificar que es admin
  const { data: customer } = await supabase
    .from("customers")
    .select("role")
    .eq("id", user.id)
    .single()

  if (customer?.role !== "admin") redirect("/")

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: false })

  const pending = stores?.filter((s: Store) => s.status === "pending") ?? []
  const approved = stores?.filter((s: Store) => s.status === "approved") ?? []
  const rejected = stores?.filter((s: Store) => s.status === "rejected") ?? []

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de tiendas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pending.length} pendiente{pending.length !== 1 ? "s" : ""} · {approved.length} aprobada{approved.length !== 1 ? "s" : ""} · {rejected.length} rechazada{rejected.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Pendientes */}
        {pending.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Pendientes</h2>
            {pending.map((store: Store) => (
              <StoreCard key={store.id} store={store} showActions />
            ))}
          </section>
        )}

        {/* Aprobadas */}
        {approved.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Aprobadas</h2>
            {approved.map((store: Store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </section>
        )}

        {/* Rechazadas */}
        {rejected.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide">Rechazadas</h2>
            {rejected.map((store: Store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </section>
        )}

        {stores?.length === 0 && (
          <div className="text-center text-gray-400 py-20">No hay solicitudes aún.</div>
        )}
      </div>
    </div>
  )
}

function StoreCard({ store, showActions = false }: { store: Store; showActions?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-800">{store.name}</p>
          {store.category && (
            <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1">{store.category}</span>
          )}
          {store.description && (
            <p className="text-sm text-gray-500 mt-1">{store.description}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
            {store.email && (
              <a href={`mailto:${store.email}`} className="text-xs text-emerald-700 hover:underline font-medium">{store.email}</a>
            )}
            {store.whatsapp && (
              <p className="text-xs text-gray-400">WhatsApp: {store.whatsapp}</p>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Solicitada el {new Date(store.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <StatusBadge status={store.status} />
      </div>

      {store.reject_reason && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">
          Razón de rechazo: {store.reject_reason}
        </p>
      )}

      {showActions && <AdminStoreActions storeId={store.id} />}

      <AdminStoreProducts storeId={store.id} />

      <div className="flex justify-end pt-1">
        <AdminDeleteStore storeId={store.id} storeName={store.name} />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Store["status"] }) {
  const styles = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-700",
  }
  const labels = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" }
  return (
    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
