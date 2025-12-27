import { redirect } from "next/navigation"

export default function ResetPasswordPage() {
  // La recuperación de contraseña ha sido deshabilitada.
  // Redirigimos al home para evitar que quede una ruta pública.
  redirect("/")
}