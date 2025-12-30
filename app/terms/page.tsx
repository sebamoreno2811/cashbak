import Link from "next/link";

export const metadata = {
  title: "Términos y condiciones — CashBak",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl px-6 py-12 mx-auto">
      <h1 className="mb-4 text-3xl font-bold">Términos y condiciones</h1>

      <section className="mb-6">
        <p>
          Bienvenido a CashBak. Estas son las condiciones legales que rigen el uso del servicio.
          (Aquí pega o adapta tu texto legal completo.)
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">1. Aceptación</h2>
        <p>Al utilizar CashBak aceptas estos términos...</p>
      </section>

      {/* Añade el contenido legal que necesites */}

      <section className="mt-8">
        <p className="text-sm text-gray-600">
          Consulta nuestra <Link href="/privacy-policy" className="text-blue-600">Política de privacidad</Link>.
        </p>
      </section>
    </main>
  );
}