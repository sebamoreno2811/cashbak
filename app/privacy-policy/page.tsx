import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad — CashBak",
  description: "Política de privacidad y términos sobre datos de usuario para CashBak.",
};

export default function PrivacyPolicyPage() {
  const effectiveDate = "30 de diciembre, 2025";

  return (
    <main className="max-w-4xl px-6 py-16 mx-auto text-slate-800">
      {/* Header */}
      <header className="pb-8 mb-12 border-b">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900">
          Política de Privacidad
        </h1>
        <p className="text-sm font-medium tracking-wider uppercase text-slate-500">
          Fecha de entrada en vigor: {effectiveDate}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
        {/* Sidebar Navigation - Desktop */}
        <aside className="hidden md:block">
          <nav className="sticky space-y-2 top-8">
            <p className="mb-4 text-xs font-bold uppercase text-slate-400">Secciones</p>
            {["Resumen", "Datos Accedidos", "Uso de Datos", "Seguridad", "Contacto"].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="block text-sm transition-colors text-slate-600 hover:text-blue-600"
              >
                {item}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="space-y-12 md:col-span-2">
          
            <section id="resumen">
                <h2 className="mb-4 text-2xl font-bold text-slate-900">Resumen de Privacidad</h2>
                <div className="space-y-4 leading-relaxed text-slate-600">
                    <p>
                    En <strong>CashBak</strong>, tu privacidad es nuestra prioridad. Esta política detalla cómo 
                    gestionamos tu información personal con un objetivo único: <strong>asegurar que recibas tus 
                    reembolsos de forma transparente y segura.</strong>
                    </p>
                    <p>
                    Para operar con transparencia y cumplir con los estándares de verificación de Google, 
                    hemos estructurado esta declaración en dos pilares fundamentales:
                    </p>
                    <div className="flex flex-col gap-4 mt-2 md:flex-row">
                    <div className="flex-1 p-4 bg-white border shadow-sm border-slate-200 rounded-xl">
                        <span className="block mb-1 font-bold text-blue-600">Data Accessed</span>
                        <p className="text-sm">Solo solicitamos los datos mínimos necesarios para identificarte y procesar tus pagos.</p>
                    </div>
                    <div className="flex-1 p-4 bg-white border shadow-sm border-slate-200 rounded-xl">
                        <span className="block mb-1 font-bold text-green-600">Data Usage</span>
                        <p className="text-sm">Tus datos nunca se venden; se usan exclusivamente para la logística de tu compra y tu CashBak.</p>
                    </div>
                    </div>
                </div>
            </section>

          <section id="datos-accedidos" className="p-6 border bg-slate-50 rounded-2xl border-slate-100">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-slate-900">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              Data Accessed (Datos accedidos)
            </h2>
            <p className="mb-4 text-slate-600">Accedemos a los siguientes datos mediante proveedores OAuth (Google, Microsoft) o entrada directa:</p>
            <ul className="grid grid-cols-1 gap-3 ml-4">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-500">•</span>
                <span><strong>Identidad:</strong> Email, nombre completo y foto de perfil.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-500">•</span>
                <span><strong>Metadatos:</strong> Identificador único del proveedor (OAuth ID).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-500">•</span>
                <span><strong>Datos Bancarios:</strong> Número de cuenta, tipo de cuenta y banco (proporcionados por el usuario).</span>
              </li>
            </ul>
            <blockquote className="p-4 mt-4 text-sm italic bg-white border-l-4 border-amber-400 text-slate-600">
              Importante: Nunca recopilamos contraseñas de terceros ni datos sensibles sin consentimiento explícito.
            </blockquote>
          </section>

          <section id="uso-de-datos">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-slate-900">
              <span className="w-2 h-6 bg-green-500 rounded-full"></span>
              Data Usage (Uso de los datos)
            </h2>
            <div className="space-y-4">
              <div className="pb-4 border-b">
                <h3 className="font-semibold text-slate-800">Datos Bancarios</h3>
                <p className="text-slate-600">Se utilizarán <strong>exclusivamente</strong> para gestionar el depósito del "CashBak" (reembolso) en caso de que el usuario lo consiga a través de nuestras promociones.</p>
              </div>
              <div className="pb-4 border-b">
                <h3 className="font-semibold text-slate-800">Email e Identidad</h3>
                <p className="text-slate-600">Usados para la autenticación, creación de perfil en la tabla <code>customers</code> y notificaciones transaccionales.</p>
              </div>
              <div className="pb-4">
                <h3 className="font-semibold text-slate-800">Finalidades generales</h3>
                <p className="text-slate-600">Prevención de fraudes, soporte técnico y cumplimiento de obligaciones legales en Chile.</p>
              </div>
            </div>
          </section>

          <section id="seguridad">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Seguridad y Almacenamiento</h2>
            <p className="leading-relaxed text-slate-600">
              Los datos se almacenan de forma segura en <strong>Supabase</strong>. 
              Implementamos encriptación en tránsito (TLS) y controles de acceso estrictos. 
              Conservamos tus datos mientras tu cuenta esté activa o sea necesario por motivos legales.
            </p>
          </section>

          <section id="contacto" className="p-8 text-white bg-blue-600 shadow-lg rounded-3xl shadow-blue-200">
            <h2 className="mb-2 text-2xl font-bold">¿Tienes dudas?</h2>
            <p className="mb-6 opacity-90">Puedes ejercer tus derechos de acceso, rectificación o eliminación contactándonos directamente.</p>
            <div className="space-y-3">
              <p className="flex items-center gap-3">
                <span className="font-semibold underline">cashbak.ops@gmail.com</span>
              </p>
              <Link href="/" className="inline-block px-6 py-2 font-bold text-blue-600 transition-colors bg-white rounded-full hover:bg-slate-100">
                Volver al inicio
              </Link>
            </div>
          </section>

          <footer className="pt-8 text-xs border-t text-slate-400">
            <p>
              Al utilizar CashBak, aceptas nuestra Política de Privacidad y nuestros{" "}
              <Link href="/terms" className="text-blue-500 hover:underline">Términos y Condiciones</Link>.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}