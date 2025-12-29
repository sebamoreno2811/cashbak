import CompleteProfileForm from "./complete-profile-form";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function CompleteProfilePage({ searchParams }: { searchParams?: { [key: string]: string } }) {
  const supabase = await createSupabaseClientWithCookies();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    // no session -> enviar a login
    redirect("/login");
  }

  const user = session.user;

  // Comprueba si ya existe customer
  const { data: existing, error: selectError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("Error comprobando customers:", selectError);
    redirect("/");
  }

  if (existing) {
    // Ya tiene profile -> no mostrar formulario
    redirect("/");
  }

  // Datos iniciales: metadata o query params
  const initialName = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || (searchParams?.name ?? "");
  const initialEmail = user.email || (searchParams?.email ?? "");

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <CompleteProfileForm userId={user.id} initialName={initialName} initialEmail={initialEmail} next={searchParams?.next ?? "/"} />
      </div>
    </div>
  );
}