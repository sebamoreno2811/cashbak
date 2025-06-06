"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function cashbakInfoPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container px-4 py-12 mx-auto">
        <h1 className="mb-6 text-3xl font-bold text-center text-emerald-700">
          ¿Qué es CashBak?
        </h1>

        <div className="max-w-2xl mx-auto space-y-6 text-lg text-gray-800">

            <p> 
              En <strong>Cashbak</strong>, cada compra es una oportunidad. No solo te llevas tus productos, 
              <span className="font-bold text-emerald-600">¡también puedes recuperar hasta el 100% de tu dinero!</span> 
            </p> 
            <p> 
              Al comprar, puedes elegir un <strong>evento deportivo</strong>. Si se cumple, <span className="font-semibold text-emerald-600">te devolvemos una parte o incluso el total de tu compra</span>. ¡Así de simple!
            </p>

            <p> 
              Cada evento tiene un <strong>porcentaje de cashbak</strong>. Si se cumple, <span className="font-semibold text-emerald-600">¡te devolvemos ese porcentaje del total de tu compra!</span> 
            </p> 
            <p> 
              Por ejemplo, si seleccionas un evento con un 80% de cashbak y aciertas, <span className="font-bold text-emerald-600">recuperas el 80%</span> del monto pagado. 
            </p> 
            <p> 
              ¿Lo mejor? <span className="font-semibold text-emerald-600">Siempre recibes tus productos.</span> El cashbak es un premio extra por confiar y participar. 
            </p> 
            <p className="mt-4 text-lg font-semibold text-center text-emerald-700"> 🎉 ¡Compra, juega y gana con Cashbak! 🎉 </p>
            <div className="pt-6 text-center">
                <Link href="/products">
                <Button className="font-semibold text-white bg-green-900 hover:bg-emerald-700">
                    Ver productos con cashbak
                </Button>
                    </Link>
            </div>
        </div>
      </div>
    </main>
  )
}
