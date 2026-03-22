import { redirect } from "next/navigation"
import { createSupabaseClientWithCookies as createClient } from "@/utils/supabase/server"
import StoreManager from "./StoreManager"

export default async function MiTiendaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/mi-tienda")

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, description, category, logo_url, status, delivery_options")
    .eq("owner_id", user.id)
    .single()

  if (!store) redirect("/sell/aplicar")
  if (store.status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">⏳</div>
          <h1 className="text-2xl font-bold text-gray-800">Solicitud en revisión</h1>
          <p className="text-gray-500">
            Tu solicitud para abrir <strong>{store.name}</strong> está siendo revisada por el equipo de CashBak.
            Te avisaremos por correo cuando sea aprobada.
          </p>
        </div>
      </div>
    )
  }
  if (store.status === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">❌</div>
          <h1 className="text-2xl font-bold text-gray-800">Solicitud rechazada</h1>
          <p className="text-gray-500">
            Tu solicitud para <strong>{store.name}</strong> no fue aprobada. Contáctanos para más información.
          </p>
        </div>
      </div>
    )
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, cost, margin_pct, category_name, description, image, stock")
    .eq("store_id", store.id)
    .order("id", { ascending: false })

  return (
    <StoreManager
      store={store}
      initialProducts={products ?? []}
    />
  )
}
