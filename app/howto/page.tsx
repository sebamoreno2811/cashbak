"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function cashbakInfoPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container px-4 py-12 mx-auto">
        <h1 className="mb-6 text-3xl font-bold text-center text-emerald-700">
          ¿Cómo funciona el cashbak?
        </h1>

        <div className="max-w-2xl mx-auto space-y-6 text-lg text-gray-800">

            <p>
                En nuestra tienda, cada compra que realizas puede devolverte hasta el <span className="font-bold text-emerald-600">100%</span> de el monto de tu compra. 
                A esto le llamamos <span className="font-semibold underline text-emerald-600 hover:text-emerald-400">cashbak</span>.
            </p>

            <p>
                Al realizar tu compra, podrás elegir uno de los eventos disponibles, los cuales se actualizan constantemente. Cada evento ofrece un porcentaje distinto de cashbak. 
            </p>
            
            <p>
                Si el evento que elegiste se cumple, ¡Recibirás el porcentaje de cashbak acordado!
                
            </p>
            
            <p>
                Recuerda que <span className="font-semibold text-emerald-600">SIEMPRE</span> recibirás los produtos de tu compra. El evento solo afecta el monto del Cashbak que obtendrás.
            </p>

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
