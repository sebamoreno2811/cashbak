import { NextResponse } from "next/server";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next") ?? "/";
    // Decodificamos next (%2F -> /)
    let nextPath = decodeURIComponent(nextParam);
    if (!nextPath.startsWith("/")) nextPath = `/${nextPath}`;

    const supabase = await createSupabaseClientWithCookies();

    // Si viene el code, intercambiamos por sesión (Supabase guardará cookie)
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("exchangeCodeForSession error:", exchangeError);
        // En caso de fallo en el intercambio, redirigimos al home
        return NextResponse.redirect(origin);
      }

      // Intercambio OK -> redirigir al next (por ejemplo '/')
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    // Si no hay code (p. ej. redirección sin params), simplemente redirigimos al next/home
    return NextResponse.redirect(`${origin}${nextPath}`);
  } catch (err) {
    console.error("Error en auth callback route:", err);
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}