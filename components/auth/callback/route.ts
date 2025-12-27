import { NextResponse } from "next/server";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server"; // ✅ Importa tu cliente de servidor

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const nextPath = decodeURIComponent(nextParam); // <-- decodificamos 'next' para evitar '/%2F'

  const supabase = await createSupabaseClientWithCookies();

  if (code) {
    // Intercambiamos el código por sesión. El cliente de servidor guarda la cookie automáticamente.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirigimos al 'next' decodificado (por ejemplo '/' para home)
      return NextResponse.redirect(`${origin}${nextPath}`);
    } else {
      console.error("Error exchanging code for session:", error);
      // Si ocurrió algún error, redirigimos al home (puedes cambiar a /login si prefieres)
      return NextResponse.redirect(origin);
    }
  }

  // Si no hay 'code', mandamos al home
  return NextResponse.redirect(origin);
}