import Link from "next/link"

export const metadata = {
  title: "Términos y Condiciones — CashBak",
  description: "Términos y condiciones de uso de la plataforma CashBak",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">{title}</h2>
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">{children}</div>
    </section>
  )
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <div className="text-gray-700 space-y-1">{children}</div>
    </div>
  )
}

export default function TerminosPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="text-xs text-green-700 hover:underline mb-4 inline-block">← Volver al inicio</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-gray-500">Última actualización: abril de 2026</p>
        <p className="mt-4 text-sm text-gray-600">
          Al registrarte y utilizar la plataforma CashBak, ya sea como comprador o como vendedor, aceptas los presentes términos y condiciones en su totalidad. Te recomendamos leerlos cuidadosamente antes de realizar cualquier transacción.
        </p>
      </div>

      {/* 1 */}
      <Section title="1. Qué es CashBak">
        <p>
          CashBak es una plataforma de comercio electrónico que conecta vendedores independientes con compradores, incorporando un sistema de recompensas condicionadas a eventos deportivos. Al realizar una compra, el cliente puede recibir un porcentaje del valor del producto de vuelta (<strong>CashBak</strong>) si el evento deportivo seleccionado al momento de la compra resulta a su favor.
        </p>
        <p>
          CashBak actúa como intermediario entre vendedores y compradores, facilitando la transacción, el sistema de pagos y la gestión del CashBak. CashBak no fabrica, almacena ni distribuye los productos publicados por los vendedores.
        </p>
      </Section>

      {/* 2 */}
      <Section title="2. Registro y cuenta de usuario">
        <p>Para acceder a las funciones de la plataforma es necesario crear una cuenta. Al registrarte, te comprometes a:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Proporcionar información veraz, completa y actualizada.</li>
          <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
          <li>Notificar a CashBak de cualquier uso no autorizado de tu cuenta.</li>
        </ul>
        <p>CashBak se reserva el derecho de suspender o eliminar cuentas que infrinjan estos términos o que presenten actividad fraudulenta.</p>
      </Section>

      {/* 3 */}
      <Section title="3. Proceso de compra">
        <Sub title="3.1 Selección y pago">
          <p>El comprador selecciona el producto, elige un evento deportivo disponible y completa el pago a través de la plataforma de pagos Transbank, que acepta tarjetas de débito y crédito emitidas en Chile. El precio mostrado en la plataforma es el precio final en pesos chilenos (CLP).</p>
        </Sub>
        <Sub title="3.2 Tarifa de procesamiento">
          <p>Todas las transacciones están sujetas a una tarifa de procesamiento de pago del 2% del valor de la venta, cobrada por Transbank. Esta tarifa cubre todos los medios de pago disponibles y es descontada del monto que recibe el vendedor.</p>
        </Sub>
        <Sub title="3.3 Confirmación de compra">
          <p>Una vez realizado el pago, el comprador recibirá un correo electrónico de confirmación con el resumen de su pedido. El vendedor también será notificado automáticamente para dar inicio a la preparación del pedido.</p>
        </Sub>
      </Section>

      {/* 4 */}
      <Section title="4. Entrega y estado del pedido">
        <Sub title="4.1 Métodos de entrega">
          <p>Cada vendedor define sus propias opciones de entrega, que pueden incluir despacho a domicilio o retiro en un punto físico. En el caso de retiro, el vendedor debe indicar obligatoriamente la dirección de retiro al momento de configurar esa opción.</p>
        </Sub>
        <Sub title="4.2 Estados del pedido">
          <p>Los pedidos pasan por los siguientes estados:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>Preparando pedido:</strong> el vendedor ha recibido la orden y está preparándola.</li>
            <li><strong>Listo para entrega:</strong> el pedido está disponible para ser retirado en el punto indicado por el vendedor.</li>
            <li><strong>Enviado:</strong> el pedido fue despachado al domicilio del comprador.</li>
            <li><strong>Entregado:</strong> el pedido fue recibido y confirmado por el comprador.</li>
          </ul>
        </Sub>
        <Sub title="4.3 Notificación automática al cliente">
          <p>
            Cuando el vendedor cambia el estado del pedido a <strong>Listo para entrega</strong> o <strong>Enviado</strong>, CashBak notifica automáticamente al comprador mediante un correo electrónico. El correo incluye un enlace directo para confirmar la recepción del pedido sin necesidad de iniciar sesión.
          </p>
        </Sub>
      </Section>

      {/* 5 — POLÍTICA DE RESGUARDO */}
      <Section title="5. Política de resguardo del cliente y liberación de fondos al vendedor">
        <p>
          Con el fin de proteger tanto al comprador como al vendedor, CashBak retiene los fondos de cada compra hasta que el pedido sea considerado exitosamente completado. El pago al vendedor se libera únicamente una vez que se cumple alguna de las siguientes condiciones:
        </p>

        <Sub title="5.1 Confirmación activa por parte del comprador">
          <p>
            El pedido se considera completado cuando el comprador confirma haber recibido su pedido. Esto puede hacerse de dos formas:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Haciendo clic en el enlace de confirmación incluido en el correo electrónico que CashBak envía automáticamente al actualizarse el estado del pedido a <em>Listo para entrega</em> o <em>Enviado</em>. Este enlace es de un solo uso y no requiere que el comprador inicie sesión.</li>
            <li>Utilizando el botón <strong>"Confirmar recibo"</strong> disponible en la sección <em>Mis pedidos</em> dentro de su cuenta en CashBak.</li>
          </ul>
        </Sub>

        <Sub title="5.2 Recordatorio y confirmación automática por inacción">
          <p>
            Si el comprador no confirma la recepción del pedido, CashBak aplicará el siguiente proceso escalonado:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>A los 5 días corridos</strong> desde la notificación, CashBak enviará un correo electrónico de recordatorio al comprador solicitando que confirme la recepción o el retiro de su pedido.</li>
            <li><strong>A los 10 días corridos</strong> desde la notificación, si el comprador aún no ha confirmado, el pedido se considerará automáticamente como completado y los fondos serán liberados al vendedor.</li>
          </ul>
          <p>
            El plazo comienza a contarse desde el momento en que CashBak envía el correo de notificación al comprador, lo que ocurre automáticamente cuando el vendedor actualiza el estado del pedido a <em>Enviado</em> o <em>Listo para entrega</em>. La liberación automática de fondos se realiza sin perjuicio del derecho del comprador a presentar un reclamo si correspondiera.
          </p>
        </Sub>

        <Sub title="5.3 Responsabilidad del vendedor en la actualización de estado">
          <p>
            El vendedor es responsable de actualizar oportunamente el estado del pedido en la plataforma. Sin esta actualización, CashBak no puede notificar al comprador ni dar inicio al plazo de confirmación. Un pedido que permanezca en estado <em>Preparando pedido</em> de forma indefinida no generará la liberación de fondos.
          </p>
        </Sub>

        <Sub title="5.4 Monto recibido por el vendedor">
          <p>
            El monto que recibe el vendedor corresponde al precio de venta menos la tarifa de procesamiento de pago (2%) y la comisión de CashBak. Este monto queda fijado al momento de la compra y no varía independiente de que se cumpla el evento elegido o no. El CashBak es financiado por el margen que el vendedor declara en la plataforma y no afecta el ingreso neto del vendedor.
          </p>
        </Sub>
      </Section>

      {/* 6 */}
      <Section title="6. Sistema de CashBack">
        <Sub title="6.1 Cómo funciona">
          <p>
            Al momento de la compra, el cliente selecciona un evento deportivo activo en la plataforma por cada producto en su pedido. Si ese evento ocurre según lo esperado (p. ej., gana el equipo elegido), el comprador recibe un porcentaje del valor de la compra como CashBak mediante transferencia bancaria a la cuenta que haya registrado en la plataforma. Si el evento no ocurre, el CashBak no se entrega, sin afectar la validez de la compra ni el pago al vendedor.
          </p>
        </Sub>
        <Sub title="6.2 Momento de la transferencia del CashBak">
          <p>
            El CashBak de un pedido se transfiere en un <strong>único pago</strong> una vez que <strong>todos los eventos asociados a esa orden hayan sido confirmados</strong> (ganados o perdidos). Si el pedido contiene productos con distintos eventos y alguno de ellos aún no tiene resultado definitivo, la transferencia del CashBak ganado espera hasta que el último evento quede resuelto. Esto garantiza que se realice una sola transferencia consolidada por pedido.
          </p>
        </Sub>
        <Sub title="6.3 CashBak es condicional">
          <p>
            El CashBak no está garantizado. Su entrega depende exclusivamente del resultado del evento deportivo vinculado a la compra. CashBak no es responsable del resultado de eventos deportivos de terceros.
          </p>
        </Sub>
        <Sub title="6.4 Uso del CashBak">
          <p>
            El CashBak acumulado puede ser utilizado para futuras compras dentro de la plataforma, sujeto a las condiciones vigentes al momento de su uso. CashBak se reserva el derecho de modificar las condiciones de uso del CashBak con aviso previo.
          </p>
        </Sub>
        <Sub title="6.5 Evento perdido">
          <p>
            Si el evento deportivo seleccionado resulta desfavorable para el comprador, el estado del CashBak asociado al pedido pasará automáticamente a <em>Evento perdido</em>. El comprador conserva el producto adquirido y el vendedor recibe el pago correspondiente con normalidad.
          </p>
        </Sub>
      </Section>

      {/* 7 */}
      <Section title="7. Responsabilidades del vendedor">
        <p>Al publicar productos en CashBak, el vendedor acepta y se compromete a:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Vender únicamente productos de su propiedad o sobre los cuales tiene autorización para comercializar.</li>
          <li>Publicar información veraz sobre el producto: descripción, precio, stock, imágenes y condiciones de entrega.</li>
          <li>Cumplir con los plazos de entrega indicados en la plataforma o acordados con el comprador.</li>
          <li>Actualizar el estado del pedido de forma oportuna para que CashBak pueda notificar al comprador.</li>
          <li>Proporcionar una dirección válida y accesible cuando ofrezca la opción de retiro en tienda.</li>
          <li>No publicar productos prohibidos por la legislación chilena vigente.</li>
          <li>Responder a los reclamos del comprador de buena fe y en un plazo razonable.</li>
        </ul>
        <p>
          CashBak puede suspender la cuenta de un vendedor que acumule reclamos fundados, incumpla reiteradamente con los tiempos de entrega o infrinja cualquiera de estas obligaciones.
        </p>
      </Section>

      {/* 8 */}
      <Section title="8. Devoluciones y reclamos">
        <p>
          Las políticas de devolución son definidas por cada vendedor y deben estar claramente indicadas en su tienda. Sin perjuicio de lo anterior, CashBak respalda los derechos del consumidor según la Ley N° 19.496 de Chile (Ley del Consumidor), incluyendo el derecho a retracto dentro de los plazos legales aplicables.
        </p>
        <p>
          Para presentar un reclamo, el comprador debe contactar directamente al vendedor en primera instancia. Si no obtiene respuesta en un plazo de 48 horas hábiles, puede escalar el reclamo a CashBak a través del canal de soporte disponible en la plataforma.
        </p>
        <p>
          CashBak se reserva el derecho de retener la liberación de fondos al vendedor mientras se encuentre en curso un reclamo fundado relacionado con un pedido.
        </p>
      </Section>

      {/* 9 */}
      <Section title="9. Comisiones y pagos">
        <p>
          CashBak cobra una comisión por cada venta realizada a través de la plataforma. Esta comisión se descuenta automáticamente del monto a transferir al vendedor y es informada de forma transparente al momento de publicar un producto en el simulador de ganancias.
        </p>
        <p>
          La comisión varía según el margen declarado por el vendedor y las condiciones de la venta, con un mínimo del 1% y un máximo del 3,5% del precio de venta. Adicionalmente, se aplica la tarifa de procesamiento Transbank del 2%.
        </p>
        <p>
          Los pagos a vendedores se realizarán una vez completadas las condiciones indicadas en la sección 5 (liberación de fondos). CashBak informará los plazos y métodos de transferencia disponibles al vendedor en su panel de administración.
        </p>
      </Section>

      {/* 10 */}
      <Section title="10. Privacidad y datos personales">
        <p>
          CashBak recopila y trata los datos personales de sus usuarios de acuerdo con la legislación chilena vigente en materia de protección de datos. Los datos recabados (nombre, correo electrónico, dirección, historial de compras) son utilizados exclusivamente para la operación de la plataforma, la comunicación con el usuario y el cumplimiento de obligaciones legales.
        </p>
        <p>
          Los datos no serán vendidos ni cedidos a terceros sin consentimiento expreso del usuario, salvo requerimiento legal. Los vendedores acceden únicamente a los datos del comprador que sean estrictamente necesarios para concretar la entrega del pedido.
        </p>
      </Section>

      {/* 11 */}
      <Section title="11. Limitación de responsabilidad">
        <p>
          CashBak no se hace responsable de los daños directos o indirectos derivados de:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>El incumplimiento de los vendedores en la entrega de productos.</li>
          <li>La calidad, autenticidad o estado de los productos comercializados por vendedores independientes.</li>
          <li>El resultado de eventos deportivos que determinen la entrega o no del CashBak.</li>
          <li>Interrupciones del servicio por causas de fuerza mayor, fallas técnicas de terceros o mantenciones programadas.</li>
          <li>El uso indebido de la plataforma por parte del usuario.</li>
        </ul>
        <p>
          La responsabilidad máxima de CashBak frente a cualquier reclamación se limita al valor de la transacción específica involucrada.
        </p>
      </Section>

      {/* 12 */}
      <Section title="12. Modificaciones a los términos">
        <p>
          CashBak puede actualizar estos términos y condiciones en cualquier momento. Las modificaciones serán comunicadas a los usuarios registrados por correo electrónico con al menos 10 días de anticipación a su entrada en vigencia. El uso continuado de la plataforma tras ese plazo implica la aceptación de los nuevos términos.
        </p>
      </Section>

      {/* 13 */}
      <Section title="13. Jurisdicción y legislación aplicable">
        <p>
          Estos términos se rigen por las leyes de la República de Chile. Cualquier controversia derivada del uso de la plataforma será sometida a la jurisdicción de los tribunales ordinarios de justicia de la ciudad de Santiago, sin perjuicio de los derechos del consumidor ante el Servicio Nacional del Consumidor (SERNAC).
        </p>
      </Section>

      {/* 14 */}
      <Section title="14. Contacto">
        <p>
          Para consultas, reclamos o cualquier comunicación relacionada con estos términos, puedes escribirnos a{" "}
          <a href="mailto:cashbak.ops@gmail.com" className="text-green-700 hover:underline font-medium">cashbak.ops@gmail.com</a>.
        </p>
      </Section>

      <div className="mt-10 pt-6 border-t border-gray-200 text-center">
        <Link href="/" className="text-sm text-green-700 hover:underline">← Volver al inicio</Link>
      </div>
    </div>
  )
}
