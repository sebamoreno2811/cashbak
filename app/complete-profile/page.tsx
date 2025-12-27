import { createSupabaseClientWithCookies } from "@/utils/supabase/server";
import CompleteProfileForm from "./complete-profile-form";
import { redirect } from "next/navigation";

export default async function CompleteProfilePage() {
  const supabase = await createSupabaseClientWithCookies();

  // Obtenemos la sesión del usuario (cookie)
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("getSession error:", sessionError);
    // Si no hay sesión, mandamos al login
    redirect("/login");
  }

  const user = session?.user;

  if (!user) {
    redirect("/login");
  }

  // Comprobamos si ya existe customer (por si alguien llega aquí manualmente)
  const { data: existing, error: selectError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("Error comprobando customers:", selectError);
    // En caso de error, mandamos al home (evitamos dejar usuario bloqueado)
    redirect("/");
  }

  if (existing) {
    // Si ya existe, mandamos al home
    redirect("/");
  }

  // Renderizamos el formulario cliente y le pasamos datos iniciales
  const initialName =
    (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
    "";
  const initialEmail = user.email || "";

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <CompleteProfileForm
          userId={user.id}
          initialName={initialName}
          initialEmail={initialEmail}
        />
      </div>
    </div>
  );
}