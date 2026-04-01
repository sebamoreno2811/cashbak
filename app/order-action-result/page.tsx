import Link from "next/link"

const MESSAGES: Record<string, { title: string; body: string; color: string; icon: string }> = {
  shipped: {
    title: "¡Pedido marcado como enviado!",
    body: "El cliente recibirá un email para confirmar la recepción.",
    color: "text-blue-700",
    icon: "📦",
  },
  confirmed: {
    title: "¡Recepción confirmada!",
    body: "Gracias por confirmar. El vendedor quedará notificado.",
    color: "text-green-700",
    icon: "✅",
  },
  already_used: {
    title: "Este link ya fue utilizado",
    body: "La acción ya fue realizada anteriormente.",
    color: "text-gray-600",
    icon: "ℹ️",
  },
  expired: {
    title: "Link expirado",
    body: "Este link ya no es válido. Por favor ingresa a tu cuenta para actualizar el estado.",
    color: "text-orange-600",
    icon: "⏰",
  },
  invalid: {
    title: "Link inválido",
    body: "No se encontró la acción solicitada.",
    color: "text-red-600",
    icon: "❌",
  },
}

export default async function OrderActionResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const msg = MESSAGES[status ?? "invalid"] ?? MESSAGES.invalid

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center shadow-sm">
        <p className="text-5xl mb-4">{msg.icon}</p>
        <h1 className={`text-2xl font-bold mb-2 ${msg.color}`}>{msg.title}</h1>
        <p className="text-gray-500 text-sm">{msg.body}</p>
        <Link
          href="/"
          className="inline-block mt-8 px-6 py-2.5 bg-green-900 text-white rounded-lg font-semibold text-sm hover:bg-green-800 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
