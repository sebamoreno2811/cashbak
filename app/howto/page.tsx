import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "¿Qué es CashBak? — Cómo funciona el cashback en Chile",
  description: "Descubre cómo funciona CashBak: compra productos en tiendas chilenas, elige un evento deportivo y recupera hasta el 100% de tu dinero si se cumple. El cashback más innovador de Chile.",
  keywords: ["qué es cashback", "cómo funciona cashback Chile", "cashbak explicación", "recuperar dinero compras Chile"],
  openGraph: {
    title: "¿Qué es CashBak? Cómo funciona el cashback en Chile",
    description: "Compra, elige tu evento deportivo y recupera hasta el 100% de tu dinero. Así funciona CashBak.",
    url: "https://cashbak.cl/howto",
  },
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-green-900 text-white flex items-center justify-center text-sm font-bold mt-0.5">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <div className="text-gray-600 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-gray-100 rounded-2xl p-6 space-y-5">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  )
}

export default function HowToPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-green-900 text-white px-6 py-14 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">¿Qué es CashBak?</h1>
        <p className="text-green-200 text-lg max-w-xl mx-auto leading-relaxed">
          Una plataforma de comercio electrónico chilena donde puedes comprar productos y recibir dinero de vuelta si se cumple el evento deportivo que elegiste.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        {/* Concepto central */}
        <Section title="La idea en una línea">
          <p className="text-gray-700 leading-relaxed">
            Compras un producto, eliges un <strong>evento deportivo activo</strong> y pagas normalmente. Si ese evento se cumple, CashBak te devuelve un porcentaje de tu compra por transferencia bancaria. Si no se cumple, igual recibes tu producto — sin penalización ni costo extra.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 font-medium">
            Tu producto siempre llega. El cashback es el premio extra si aciertas con el evento.
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            <strong>Tu compra es segura:</strong> el pago al vendedor solo se libera cuando tú confirmas que recibiste el pedido — ya sea manualmente desde tu cuenta o el email que te enviamos, o de forma automática tras 10 días si no indicas lo contrario.
          </div>
        </Section>

        {/* Para compradores */}
        <Section title="Cómo funciona para compradores">
          <div className="space-y-5">
            <Step number={1} title="Elige un producto">
              Navega el catálogo en <Link href="/products" className="text-green-700 underline font-medium">Productos</Link> o explora las tiendas disponibles. Cada producto muestra el cashback que puedes ganar según el evento que elijas.
            </Step>
            <Step number={2} title="Elige tu evento deportivo">
              En la página del producto, selecciona un evento activo. Cada evento tiene una probabilidad distinta de cumplirse, por eso el porcentaje de cashback varía. El porcentaje exacto aparece en pantalla antes de agregar al carrito.
            </Step>
            <Step number={3} title="Paga con WebPay">
              El pago es con tarjeta de débito o crédito a través de WebPay (Transbank). Todos los precios son en pesos chilenos (CLP). Recibes un email de confirmación con el número de tu pedido.
            </Step>
            <Step number={4} title="Recibe tu pedido y confírmalo">
              Cuando el vendedor despacha tu pedido, te avisamos por email. Confirma la recepción haciendo clic en el enlace del email — o desde <strong>Mis Pedidos</strong> en tu cuenta. Si no confirmas en 10 días, el sistema lo confirma automáticamente.
            </Step>
            <Step number={5} title="Recibe tu cashback">
              Si el evento que elegiste se cumplió, CashBak te transfiere el cashback a tu cuenta bancaria. Para recibirlo, debes tener tus <strong>datos bancarios registrados en tu perfil</strong> (banco, tipo de cuenta, número y RUT). Sin esa información no podemos hacer la transferencia.
            </Step>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
            <strong>Importante:</strong> el carrito solo acepta productos de una tienda a la vez. Si quieres comprar en tiendas distintas, debes hacer un pedido separado por cada una.
          </div>
        </Section>

        {/* Para vendedores */}
        <Section title="Cómo funciona para vendedores">
          <p className="text-gray-600">
            Como vendedor defines el precio de venta y cuánto quieres recibir por cada venta. La diferencia financia el cashback del cliente y la comisión de CashBak. Tu ingreso es fijo y garantizado — gane o pierda el evento el comprador, tú siempre recibes lo acordado.
          </p>

          <div className="space-y-5">
            <Step number={1} title="Simula antes de publicar">
              Usa el simulador en <Link href="/sell" className="text-green-700 underline font-medium">Vende con nosotros</Link>. Ingresa el precio de venta y haz clic en <strong>"Valor recomendado"</strong> — CashBak calcula automáticamente el ingreso óptimo para ofrecer un cashback atractivo sin sacrificar tu margen.
            </Step>
            <Step number={2} title="Publica tu producto">
              Desde <strong>Mi Tienda → Productos</strong>, agrega tu producto con nombre, descripción, precio, categorías, stock por talla y el monto que quieres recibir. El costo es opcional — solo lo necesitas si quieres ver tu ganancia neta en el simulador.
            </Step>
            <Step number={3} title="Gestiona tus pedidos">
              Cuando llega una venta te notificamos por email. Desde <strong>Mi Tienda → Pedidos</strong> puedes ver los detalles y actualizar el estado: Preparando → Listo para entrega → Enviado. Al marcar como Enviado, el comprador recibe un email automático.
            </Step>
            <Step number={4} title="Recibe tu pago">
              Una vez que el comprador confirma la recepción (o se confirma automáticamente a los 10 días), CashBak transfiere el monto a tu cuenta bancaria registrada en <strong>Mi Tienda → Datos de pago</strong>.
            </Step>
          </div>

          <div className="pt-2">
            <Link href="/sell">
              <Button className="bg-green-900 hover:bg-green-800 text-white font-semibold">
                Simular mis márgenes
              </Button>
            </Link>
          </div>
        </Section>

        {/* Preguntas frecuentes */}
        <Section title="Preguntas frecuentes">
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900">¿Siempre recibo mi producto?</p>
              <p>Sí. El evento solo determina si recibes cashback o no. El producto se despacha y llega siempre, sin importar el resultado del evento.</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="font-semibold text-gray-900">¿Cómo recibo el cashback?</p>
              <p>Por transferencia bancaria a la cuenta que registres en tu perfil. Si no tienes cuenta bancaria registrada, no podemos enviarlo aunque el evento se cumpla.</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="font-semibold text-gray-900">¿Por qué el % de cashback varía entre eventos?</p>
              <p>Cada evento tiene una probabilidad distinta de cumplirse. Un evento más difícil de acertar ofrece un cashback mayor como incentivo. Tú eliges el equilibrio que prefieres.</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="font-semibold text-gray-900">¿Puedo comprar en varias tiendas a la vez?</p>
              <p>No en un mismo pedido. El carrito acepta una tienda a la vez. Para comprar en tiendas distintas, haz pedidos separados.</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="font-semibold text-gray-900">¿Tengo que confirmar la recepción del pedido?</p>
              <p>Sí, o esperar 10 días desde la notificación. Puedes confirmar desde el email que te enviamos o desde <strong>Mis Pedidos</strong> en tu cuenta. El pago al vendedor solo se libera cuando confirmas — esto protege tu compra.</p>
            </div>
          </div>
        </Section>

        {/* CTA final */}
        <div className="text-center space-y-3 pt-4">
          <p className="text-gray-500 text-sm">¿Tienes más dudas? Pregúntale a Baki, nuestro asistente virtual.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products">
              <Button className="bg-green-900 hover:bg-green-800 text-white font-semibold w-full sm:w-auto">
                Ver productos
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-green-900 text-green-900 hover:bg-green-50 font-semibold w-full sm:w-auto">
                Contactarnos
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
