"use client"

import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/utils/supabase/client"
import { User, LogOut, ShoppingBag, Shield, Building2, LayoutDashboard, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import BankAccountReminderModal from "@/components/bank-account-reminder-modal"


interface UserMenuProps {
  onAuthRequired?: () => void
}

export default function UserMenu({ onAuthRequired }: UserMenuProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasStore, setHasStore] = useState(false)
  const [showBankReminder, setShowBankReminder] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const [{ data: customer }, { data: store }] = await Promise.all([
          supabase.from("customers").select("role").eq("id", user.id).single(),
          supabase.from("stores").select("id").eq("owner_id", user.id).eq("status", "approved").maybeSingle(),
        ])
        setIsAdmin(customer?.role === "admin")
        setHasStore(!!store)
      }
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: { user: any }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Mostrar recordatorio si no tiene cuenta bancaria
      // SIGNED_IN = login fresco, INITIAL_SESSION = sesión existente al cargar página
      if (event === "SIGNED_OUT") {
        sessionStorage.removeItem("bank_reminder_shown")
      }

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        const alreadyShown = sessionStorage.getItem("bank_reminder_shown")
        if (alreadyShown) return

        const { data } = await supabase
          .from("bank_accounts")
          .select("id")
          .eq("customer_id", session.user.id)
          .maybeSingle()

        if (!data) {
          setShowBankReminder(true)
          sessionStorage.setItem("bank_reminder_shown", "1")
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    window.location.href = "/"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
  }

  if (!user) {
    return (
      <button
        onClick={onAuthRequired}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-full px-3 py-1.5 text-sm font-medium transition-all"
      >
        <User className="w-4 h-4" />
        <span className="hidden min-[1000px]:inline">Iniciar Sesión</span>
      </button>
    )
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario"

  return (
    <>
    <BankAccountReminderModal
      open={showBankReminder}
      onClose={() => setShowBankReminder(false)}
      context="login"
    />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full pl-1 pr-3 py-1 transition-all outline-none">
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="text-white bg-green-700 text-xs font-bold">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium text-white max-w-[120px] truncate leading-none">{displayName}</span>
          <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-white/60 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator/>
        <DropdownMenuItem onClick={() => router.push("/perfil")}>
          <User className="w-4 h-4 mr-2" />
          <span>Mi Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/orders")}>
          <ShoppingBag className="w-4 h-4 mr-2" />
          <span>Mis Pedidos</span>
        </DropdownMenuItem>
        {hasStore && (
          <DropdownMenuItem onClick={() => router.push("/mi-tienda")}>
            <Building2 className="w-4 h-4 mr-2" />
            <span>Mi Tienda</span>
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/dashboard")}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin/tiendas")}>
              <Shield className="w-4 h-4 mr-2" />
              <span>Tiendas</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin/pedidos")}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              <span>Pedidos</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin/eventos")}>
              <Shield className="w-4 h-4 mr-2" />
              <span>Eventos</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
