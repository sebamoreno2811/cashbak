import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones — CashBak",
  description: "Condiciones legales y reglas de uso de la plataforma CashBak.",
};

export default function TermsPage() {
  const lastUpdate = "30 de diciembre, 2025";

  return (
    <main className="max-w-4xl px-6 py-16 mx-auto text-slate-800">
      {/* Header */}
      <header className="pb-8 mb-12 border-b">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900">
          Términos y Condiciones
        </h1>
        <p className="text-sm font-medium tracking-wider uppercase text-slate-500">
          Última actualización: {lastUpdate}
        </p>
      </header>

      <div className="space-y-10">
        
        {/* Sección Crítica: El modelo de CashBak */}
        <section className="p-8 border border-blue-100 bg-blue-50 rounded-2xl">
          <h2 className="mb-4 text-2xl font-bold text-blue-900">1. Funcionamiento del Servicio</h2>
          <p className="mb-4 leading-relaxed">
            CashBak es una plataforma que permite a los usuarios adquirir productos o servicios con un beneficio adicional basado en eventos específicos. Al utilizar nuestro servicio, aceptas la siguiente premisa:
          </p>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">✓</span>
              <span><strong>Garantía de Entrega:</strong> Al realizar una transacción, el usuario <strong>siempre recibirá el producto o servicio adquirido</strong>, independiente del resultado de cualquier evento externo.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">✓</span>
              <span><strong>CashBak Condicional:</strong> El reembolso o "CashBak" prometido está <strong>estrictamente sujeto</strong> a que el evento elegido (deportivo, climático, u otro) se cumpla según las condiciones establecidas en la promoción vigente al momento de la compra.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">2. Registro y Cuenta</h2>
          <p className="leading-relaxed text-slate-600">
            Para acceder a los beneficios, el usuario debe registrarse mediante los métodos proporcionados. Es responsabilidad del usuario:
          </p>
          <ul className="mt-2 ml-6 space-y-2 list-disc text-slate-600">
            <li>Proporcionar información real, incluyendo <strong>datos bancarios correctos</strong> para recibir reembolsos.</li>
            <li>Mantener la seguridad de su cuenta y no compartir sus credenciales de acceso.</li>
            <li>Ser mayor de edad según la legislación vigente en su país de residencia.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">3. Pagos y Reembolsos (CashBak)</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-5 border border-slate-200 rounded-xl">
              <h3 className="mb-2 text-xs font-bold uppercase text-slate-400">Sobre el Pago</h3>
              <p className="text-sm text-slate-600">Los pagos se procesan a través de pasarelas seguras. CashBak no almacena números de tarjetas de crédito.</p>
            </div>
            <div className="p-5 border border-slate-200 rounded-xl">
              <h3 className="mb-2 text-xs font-bold uppercase text-slate-400">Sobre el Depósito</h3>
              <p className="text-sm text-slate-600">Si el evento se cumple, el CashBak se depositará en la cuenta bancaria registrada en un plazo máximo de [X] días hábiles.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">4. Limitación de Responsabilidad</h2>
          <p className="italic leading-relaxed text-slate-600">
            CashBak no se hace responsable por errores en los datos bancarios ingresados por el usuario. Asimismo, los resultados de los eventos externos son determinados por fuentes oficiales y no son apelables a menos que exista un error evidente de nuestra parte.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">5. Propiedad Intelectual</h2>
          <p className="leading-relaxed text-slate-600">
            Todo el contenido, logotipos, código fuente y diseño de CashBak son propiedad exclusiva de la empresa y están protegidos por las leyes de propiedad intelectual.
          </p>
        </section>

        <section className="p-8 text-white bg-slate-900 rounded-3xl">
          <h2 className="mb-4 text-xl font-bold">Modificaciones de los Términos</h2>
          <p className="mb-6 text-sm opacity-80">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en esta página. El uso continuado de la aplicación implica la aceptación de los nuevos términos.
          </p>
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <Link 
              href="/privacy-policy" 
              className="font-semibold text-blue-400 transition-colors hover:text-blue-300"
            >
              Leer Política de Privacidad
            </Link>
            <span className="hidden md:inline text-slate-700">|</span>
            <p className="text-xs text-slate-500">¿Preguntas legales? contacto@cashbak.cl</p>
          </div>
        </section>

      </div>
    </main>
  );
}