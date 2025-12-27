import { redirect } from "next/navigation";

export default function CompleteProfilePage() {
  // Eliminada la página de "Completa tu perfil".
  // Redirigimos al home para evitar que quede una ruta pública.
  redirect("/");
}