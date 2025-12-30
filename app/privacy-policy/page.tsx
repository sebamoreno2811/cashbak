import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad — CashBak",
  description: "Política de privacidad y términos sobre datos de usuario para CashBak.",
};

export default function PrivacyPolicyPage() {
  const effectiveDate = "2025-12-30";

  return (
    <main className="max-w-3xl px-6 py-12 mx-auto">
      <h1 className="mb-4 text-3xl font-bold">Política de privacidad</h1>
      <p className="mb-6 text-sm text-gray-600">Fecha de entrada en vigor: {effectiveDate}</p>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Resumen</h2>
        <p>
          En CashBak (en adelante "nosotros", "nuestro" o "la aplicación") respetamos tu
          privacidad. Esta política describe qué datos obtenemos de los usuarios, cómo los
          usamos y con quién los compartimos. Esta página incluye las secciones requeridas para
          la verificación de Google: "Data Accessed" y "Data Usage".
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Data Accessed (Datos accedidos)</h2>
        <p>Durante el proceso de inicio de sesión mediante proveedores OAuth (Google, Microsoft/Outlook) podemos acceder a los siguientes datos proporcionados por el proveedor:</p>
        <ul className="mt-2 ml-6 list-disc">
          <li>Email (correo electrónico) del usuario.</li>
          <li>Nombre completo (display name) y nombre de usuario.</li>
          <li>Foto de perfil (avatar), si el proveedor la comparte.</li>
          <li>Metadata pública de la cuenta (p.ej. identificador único del usuario otorgado por el proveedor).</li>
          <li>En ningún caso recopilamos contraseñas de terceros: la autenticación la realiza el proveedor (OAuth).</li>
        </ul>
        <p className="mt-2 text-sm text-gray-600">
          Nota: No solicitamos ni almacenamos datos sensibles de Google (como correo de G Suite de terceros sin consentimiento adicional) ni datos que el usuario no consienta compartir.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Data Usage (Uso de los datos)</h2>
        <p>Resumen de cómo utilizamos cada dato:</p>
        <ul className="mt-2 ml-6 list-disc">
          <li><strong>Email:</strong> usado como identificador de cuenta y para notificaciones/transacciones relacionadas con la cuenta (recuperación, comunicaciones administrativas).</li>
          <li><strong>Nombre y foto:</strong> mostrados en la UI (perfil, recibos, comunicación dentro de la plataforma) para personalizar la experiencia.</li>
          <li><strong>ID del proveedor (user id):</strong> asociado a la fila en la tabla <code>customers</code> para identificar al usuario de forma única en nuestra base de datos.</li>
          <li><strong>Teléfono:</strong> normalmente no es proporcionado por el proveedor; si no lo recibe, solicitamos al usuario que lo ingrese en el formulario de completado de perfil y lo almacenamos en la tabla <code>customers</code>.</li>
        </ul>

        <p className="mt-3">Finalidades concretas:</p>
        <ol className="mt-2 ml-6 list-decimal">
          <li>Autenticación y autorización del usuario en la aplicación.</li>
          <li>Creación y mantenimiento del perfil de usuario en nuestra base de datos (tabla <code>customers</code>).</li>
          <li>Comunicación relacionada con el servicio (facturas, avisos, soporte).</li>
          <li>Prevención de fraudes y cumplimiento de obligaciones legales.</li>
          <li>Mejora del servicio y análisis interno (agregado y anonimizado cuando sea posible).</li>
        </ol>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Cómo guardamos los datos</h2>
        <p>
          Los datos personales que recopilamos se almacenan en nuestra base de datos administrada por
          Supabase. Solo el personal autorizado y nuestros servicios internos pueden acceder a ellos.
          Utilizamos buenas prácticas de seguridad (encriptación en tránsito TLS, claves de servicio
          seguras en el servidor) para proteger la información.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Terceros con los que compartimos datos</h2>
        <p>Podemos compartir datos con:</p>
        <ul className="mt-2 ml-6 list-disc">
          <li><strong>Proveedores de identidad (Google, Microsoft):</strong> actúan como origen de autenticación.</li>
          <li><strong>Supabase:</strong> plataforma de backend y base de datos donde se almacenan los registros (<code>customers</code>).</li>
          <li><strong>Servicios de correo y notificaciones:</strong> para enviar emails transaccionales (p. ej. facturas, confirmaciones).</li>
        </ul>
        <p className="mt-2 text-sm text-gray-600">
          Antes de compartir con terceros adicionales nos aseguramos de que apliquen estándares de seguridad adecuados.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Retención y eliminación</h2>
        <p>
          Conservamos los datos del usuario mientras la cuenta exista o durante el tiempo necesario para
          cumplir obligaciones legales o resolver disputas. Si deseas que eliminemos tus datos, contáctanos
          usando la información de contacto abajo y procesaremos la solicitud conforme a la legislación aplicable.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Derechos del usuario</h2>
        <p>
          Puedes solicitar acceso, rectificación, portabilidad o supresión de tus datos personales. Para
          ejercer estos derechos contacta a: <strong>privacidad@cashbak.cl</strong> (o usa el formulario de contacto del sitio).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Seguridad</h2>
        <p>
          Implementamos controles técnicos y organizativos razonables para proteger los datos personales.
          No obstante, ninguna medida es 100% infalible; en caso de incidente relevante te informaremos
          conforme a la normativa aplicable.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Contacto</h2>
        <p>
          Si tienes preguntas sobre esta política, puedes contactarnos en:
        </p>
        <ul className="mt-2 ml-6 list-disc">
          <li>Email: <strong>privacidad@cashbak.cl</strong></li>
          <li>Sitio web: <Link href="/"><a className="text-blue-600">https://www.cashbak.cl</a></Link></li>
        </ul>
      </section>

      <section className="mt-8">
        <p className="text-sm text-gray-600">
          Esta política se complementa con nuestros <Link href="/terms"><a className="text-blue-600">Términos y condiciones</a></Link>. Al usar CashBak aceptas esta Política de privacidad.
        </p>
      </section>
    </main>
  );
}