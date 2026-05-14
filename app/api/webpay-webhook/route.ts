import { NextResponse } from "next/server"

/**
 * DEPRECATED — eliminado por seguridad.
 *
 * Este endpoint aceptaba cualquier POST sin validación de firma de Transbank y redirigía a
 * /checkout?status=success. Toda la confirmación de pagos ahora vive exclusivamente en
 * /api/webpay/commit, que llama a tx.commit() contra Transbank antes de crear la orden.
 *
 * Si Transbank empieza a enviar webhooks server-to-server en el futuro, hay que validar
 * firma/IP allowlist antes de confiar en el payload.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Endpoint deshabilitado. Usar /api/webpay/commit." },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json(
    { error: "Endpoint deshabilitado. Usar /api/webpay/commit." },
    { status: 410 }
  )
}
