import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  const orderId = searchParams.orderId || "desconocido"

  return (
    <div className="container px-4 py-16 mx-auto">
      <div className="max-w-md p-8 mx-auto text-center bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="mb-4 text-2xl font-bold text-green-900">¡Compra Exitosa!</h1>
        <p className="mb-6 text-gray-600">
          Tu orden ha sido procesada correctamente. Hemos registrado tus datos para el CashBak.
        </p>
        <div className="p-4 mb-6 bg-gray-50 rounded-md">
          <p className="mb-2 text-sm text-gray-500">Número de orden:</p>
          <p className="font-medium">{orderId}</p>
        </div>
        <p className="mb-8 text-sm text-gray-500">
          Te enviaremos un correo electrónico con los detalles de tu compra y la información sobre cómo reclamar tu
          CashBak en caso de ganar.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full bg-green-900 hover:bg-green-800">
            <Link href="/">Volver a la tienda</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/products">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
