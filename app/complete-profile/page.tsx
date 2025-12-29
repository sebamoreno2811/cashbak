import CompleteProfileForm from "./complete-profile-form";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function CompleteProfilePage({ searchParams }: { searchParams?: { [key: string]: string } }) {
  const supabase = await createSupabaseClientWithCookies();

  // Obtenemos la sesión (la cookie fue seteada en callback)
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("getSession error:", sessionError);
    // no hay sesión -> redirect a login
    redirect("/login");
  }

  const user = session?.user;
  if (!user) {
    redirect("/login");
  }

  // Si ya existe customer, redirigimos al home
  const { data: existing, error: selectError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("Error comprobando customers:", selectError);
    // fallback: redirect home
    redirect("/");
  }

  if (existing) {
    // profile ya creado → no mostrar formulario
    redirect("/");
  }

  // Initial values: preferimos datos de user metadata o query params
  // (la queryParams pueden venir del callback redirect)
  const initialName =
    (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
    "";
  const initialEmail = user.email || "";

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <CompleteProfileForm userId={user.id} initialName={initialName} initialEmail={initialEmail} />
      </div>
    </div>
  );
}