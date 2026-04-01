"use client"

import { useState, useMemo, useEffect } from "react"
import { calculateExternalCashbak, getAllBettingOptions } from "@/lib/cashbak-calculator"
import type { Bet } from "@/context/bet-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

function formatCLP(value: number) {
  return value.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
}

function selectVariedBets(bets: Bet[], maxCount = 4): Bet[] {
  if (bets.length <= maxCount) return bets
  const sorted = [...bets].sort((a, b) => a.odd - b.odd)
  const seen = new Set<number>()
  const result: Bet[] = []
  for (let i = 0; i < maxCount; i++) {
    const bet = sorted[Math.round(i * (sorted.length - 1) / (maxCount - 1))]
    if (!seen.has(bet.id)) { seen.add(bet.id); result.push(bet) }
  }
  return result
}

export default function SellPage() {
  const [precioVenta, setPrecioVenta] = useState<string>("20000")
  const [costo, setCosto] = useState<string>("10000")
  const calcularRecomendado = (p: number) => Math.max(0, Math.round(p - (0.15 * p / 1.5) / 0.80))
  const [gananciaCLP, setGananciaCLP] = useState<number>(() => calcularRecomendado(20000))
  const [bets, setBets] = useState<Bet[]>([])
  const [selectedBetId, setSelectedBetId] = useState<number | null>(null)

  const precio = Number(precioVenta)
  const costoNum = Number(costo)
  const inputsValidos = precio > 0

  const sliderMax = Math.round(precio * 0.98)
  const sliderStep = Math.max(1, 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, sliderMax))) - 2))
  const margenVendedorPct = precio > 0 ? gananciaCLP / precio : 0
  const gananciaBajoElCosto = costoNum > 0 && gananciaCLP < costoNum

  useEffect(() => {
    // Cuando cambia el precio, mantener el mismo % aproximado
    setGananciaCLP(calcularRecomendado(precio))
  }, [precio])

  // Fetch apuestas activas
  useEffect(() => {
    const supabase = createClient()
    const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    supabase.from("bets").select("*").eq("active", true).gt("end_date", cutoff).order("end_date", { ascending: true }).then(({ data }: { data: Bet[] | null }) => {
      if (!data) return
      const activeBets = data.filter((b: Bet) => getAllBettingOptions(data).includes(b.id))
      const selected = selectVariedBets(activeBets, 4)
      setBets(selected)
      if (selected.length > 0) setSelectedBetId(selected[0].id)
    })
  }, [])

  const selectedBet = bets.find((b) => b.id === selectedBetId)
  const cuota = selectedBet?.odd ?? 1.5

  const resultado = useMemo(() => {
    if (!inputsValidos) return null
    return calculateExternalCashbak({
      precioVenta: precio,
      costo: costoNum,
      cuota,
      margenVendedorPct,
    })
  }, [precio, costoNum, margenVendedorPct, cuota, inputsValidos])

  const bestCuota = bets.length > 0 ? Math.max(...bets.map(b => b.odd)) : cuota

  // Recomendación fallback: deja 35% del margen declarado (precio-costo) para cashback
  const recFallbackMonto = costoNum > 0 ? Math.round(precio - 0.35 * (precio - costoNum)) : null

  const recMonto = resultado && resultado.margenRecomendadoMonto > costoNum
    ? resultado.margenRecomendadoMonto
    : (recFallbackMonto && recFallbackMonto > costoNum ? recFallbackMonto : null)

  const cashbackAtRec = useMemo(() => {
    if (!inputsValidos || !recMonto) return 0
    return calculateExternalCashbak({
      precioVenta: precio,
      costo: costoNum,
      cuota: bestCuota,
      margenVendedorPct: recMonto / precio,
    }).cashbackPct
  }, [precio, costoNum, bestCuota, recMonto, inputsValidos])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="py-14 bg-green-900 text-white text-center px-4">
        <h1 className="text-4xl font-bold mb-3">Vende con nosotros</h1>
        <p className="text-green-200 text-lg max-w-xl mx-auto">
          Simula cómo funcionaría vender tu producto en CashBak. Ingresa tu precio y costo y descubre cuánto cashback puedes ofrecer a tus clientes.
        </p>
      </section>

      {/* Simulator */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Inputs */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Tu producto</h2>

              <div className="space-y-2">
                <Label htmlFor="precio">Precio de venta (CLP)</Label>
                <Input
                  id="precio"
                  type="number"
                  min={1}
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  placeholder="Ej: 20000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo">Tu costo de producto (CLP) <span className="text-gray-400 font-normal">(ilustrativo)</span></Label>
                <Input
                  id="costo"
                  type="number"
                  min={1}
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  placeholder="Ej: 10000"
                />
                <p className="text-xs text-gray-400">Solo para mostrarte tu ganancia neta estimada. No afecta el cashback ni la comisión — ingresa tu costo real para que el cálculo sea preciso.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>¿Cuánto quieres recibir por venta?</Label>
                  <span className="text-xl font-bold text-green-900">{formatCLP(gananciaCLP)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  step={sliderStep}
                  value={gananciaCLP}
                  onChange={(e) => setGananciaCLP(Number(e.target.value))}
                  className="w-full accent-green-900"
                />
                {gananciaBajoElCosto && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ⚠️ Estás eligiendo recibir menos que tu costo declarado ({formatCLP(costoNum)}). Estarías vendiendo a pérdida.
                  </p>
                )}
                {recMonto && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-emerald-800">
                      💡 Recibiendo <strong>{formatCLP(recMonto)}</strong> por venta puedes ofrecer hasta <strong>{cashbackAtRec}% de cashback</strong> con los eventos disponibles hoy — muy atractivo para compradores.
                    </p>
                    <button
                      type="button"
                      onClick={() => setGananciaCLP(recMonto)}
                      className="ml-3 shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Evento activo</Label>
                {bets.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay eventos activos en este momento.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {bets.map((bet) => (
                      <button
                        key={bet.id}
                        type="button"
                        onClick={() => setSelectedBetId(bet.id)}
                        className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                          selectedBetId === bet.id
                            ? "border-green-700 bg-green-50 text-green-900"
                            : "border-gray-200 hover:border-green-400"
                        }`}
                      >
                        <p className="font-semibold text-sm">{bet.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Vence {formatDate(bet.end_date)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <div className="space-y-4">
            {!inputsValidos ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-400 py-16">
                  <p className="text-5xl mb-4">📊</p>
                  <p>Ingresa un precio de venta válido para ver la simulación.</p>
                </CardContent>
              </Card>
            ) : resultado ? (
              <>
                {/* Cashback highlight */}
                <div className="bg-emerald-600 text-white rounded-xl p-6 text-center shadow">
                  <p className="text-emerald-100 text-sm mb-1">Cashback que ofreces a tus clientes</p>
                  <p className="text-6xl font-bold">{resultado.cashbackPct}%</p>
                  <p className="text-emerald-100 text-sm mt-1">
                    hasta {formatCLP(resultado.cashbackMonto)} de vuelta al cliente
                  </p>
                </div>

                {/* Desglose */}
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold text-gray-700">Desglose por venta</h3>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <span className="text-gray-600">Tu ingreso por venta</span>
                        <p className="text-xs text-gray-400">Bruto, antes de tarifa de procesamiento de pago</p>
                      </div>
                      <span className="font-bold text-green-900">{formatCLP(resultado.margenVendedor)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <span className="text-gray-600">Costo procesamiento de pago Transbank</span>
                        <p className="text-xs text-gray-400">Cubre todos los medios de pago: débito, prepago y crédito</p>
                      </div>
                      <span className="font-semibold text-gray-500">- {formatCLP(resultado.tarifaProcesamiento)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <span className="text-gray-700 font-semibold">Tu ingreso neto por venta</span>
                        <p className="text-xs text-gray-400">Monto exacto que recibirás por cada venta, sin variaciones</p>
                      </div>
                      <span className="font-bold text-emerald-700">{formatCLP(resultado.margenVendedorNeto)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Comisión CashBak</span>
                      <span className="font-semibold text-gray-500">- {formatCLP(resultado.comisionDisplay)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <span className="text-gray-600">Seguro CashBak</span>
                        <p className="text-xs text-gray-400">Prima que financia el cashback al cliente</p>
                      </div>
                      <span className="font-semibold text-gray-500">- {formatCLP(resultado.montoApuestaDisplay)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <span className="text-gray-600">CashBak al cliente</span>
                        <p className="text-xs text-gray-400">Simulación con los eventos disponibles. Varía según el evento que elija el cliente, pero nunca afecta tu ingreso neto.</p>
                      </div>
                      <span className="font-semibold text-gray-500">{resultado.cashbackPct}%</span>
                    </div>

                    <div className={`flex justify-between items-center py-2 rounded-lg ${resultado.gananciaNeta < 0 ? "px-2 bg-red-50 border border-red-200" : ""}`}>
                      <div>
                        <span className={`text-sm ${resultado.gananciaNeta < 0 ? "text-red-600 font-semibold" : "text-gray-500"}`}>Tu ganancia neta estimada</span>
                        <p className="text-xs text-gray-400">Ilustrativo — descontando tu costo declarado ({formatCLP(costoNum)})</p>
                        {resultado.gananciaNeta < 0 && <p className="text-xs text-red-500 mt-0.5">⚠️ Estarías vendiendo a pérdida</p>}
                      </div>
                      <span className={`font-semibold ${resultado.gananciaNeta < 0 ? "text-red-600" : "text-gray-700"}`}>{formatCLP(resultado.gananciaNeta)}</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>

        {/* Propuesta de valor */}
        {inputsValidos && resultado?.viable && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col gap-2">
              <span className="text-2xl">🎯</span>
              <p className="font-semibold text-gray-800">Oferta más atractiva</p>
              <p className="text-sm text-gray-600">
                Un cashback de hasta <strong className="text-emerald-700">{resultado.cashbackPct}%</strong> convierte visitantes indecisos en compradores. Pocos competidores pueden ofrecer algo similar.
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col gap-2">
              <span className="text-2xl">📣</span>
              <p className="font-semibold text-gray-800">Más visibilidad</p>
              <p className="text-sm text-gray-600">
                Tus productos aparecen en la plataforma CashBak, exponiéndote a clientes que ya están buscando comprar con recompensa. Sin costo adicional de publicidad.
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col gap-2">
              <span className="text-2xl">🔁</span>
              <p className="font-semibold text-gray-800">Clientes que vuelven</p>
              <p className="text-sm text-gray-600">
                El cashback crea una experiencia memorable. Los clientes que reciben dinero de vuelta tienen muchas más probabilidades de volver a comprar.
              </p>
            </div>
          </div>
        )}

        {/* CTA intermedio */}
        <div className="mt-10 bg-green-900 rounded-2xl p-8 text-white text-center space-y-4">
          <p className="text-2xl font-bold">¿Listo para vender con CashBak?</p>
          <p className="text-green-200 text-sm max-w-sm mx-auto">
            Solicita tu tienda en minutos. El equipo de CashBak revisará tu solicitud y te avisamos.
          </p>
          <Link
            href="/sell/aplicar"
            className="inline-flex items-center justify-center px-7 py-3 rounded-md bg-white text-green-900 font-bold hover:bg-green-100 transition-colors text-sm"
          >
            Crear mi tienda en CashBak →
          </Link>
        </div>

        {/* ¿Cómo funciona? */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <h3 className="font-bold text-gray-800 mb-4">¿Cómo funciona el Seguro CashBak?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="flex flex-col gap-2">
                <span className="text-2xl">🛒</span>
                <p className="font-semibold text-gray-800">El cliente compra</p>
                <p>Al comprar, CashBak contrata automáticamente un seguro en nombre del cliente ligado a un evento deportivo.</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-2xl">🏆</span>
                <p className="font-semibold text-gray-800">Si el evento ocurre</p>
                <p>El seguro se activa y el cliente recibe el cashback prometido. Tu ganancia no cambia.</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-2xl">🛡️</span>
                <p className="font-semibold text-gray-800">Si no ocurre</p>
                <p>No se paga cashback. La prima del seguro cubre los costos operativos. Tu ganancia tampoco cambia.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="bg-green-900 text-white py-14 text-center px-4">
        <h2 className="text-3xl font-bold mb-3">¿Te convence? Abre tu tienda.</h2>
        <p className="text-green-200 mb-8 max-w-md mx-auto">
          Envía tu solicitud y el equipo de CashBak la revisará. Si tienes dudas, escríbenos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sell/aplicar"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-white text-green-900 font-semibold hover:bg-green-100 transition-colors"
          >
            Solicitar mi tienda
          </Link>
          <a
            href="https://wa.me/56912345678?text=Hola%2C%20quiero%20vender%20en%20CashBak"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white text-white hover:bg-white hover:text-green-900 font-semibold transition-colors"
          >
            Formulario de contacto
          </Link>
        </div>
      </section>
    </div>
  )
}
