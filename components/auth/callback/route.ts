import { NextResponse } from "next/server";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next") ?? "/";
    // Decodificamos next (p. ej. "%2F" -> "/")
    let nextPath = decodeURIComponent(nextParam);
    if (!nextPath.startsWith("/")) nextPath = `/${nextPath}`;

    const supabase = await createSupabaseClientWithCookies();

    if (!code) {
      return NextResponse.redirect(origin);
    }

    // 1) Intercambiamos el código por sesión (guarda cookie en la respuesta)
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("exchangeCodeForSession error:", exchangeError);
      return NextResponse.redirect(origin);
    }

    // 2) Obtenemos la sesión y el usuario
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("getSession error:", sessionError);
      // Si hay problema, redirigimos a nextPath igual (no bloquear)
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    const user = session?.user ?? null;

    if (!user) {
      return NextResponse.redirect(origin);
    }

    // 3) Comprobamos si existe profile en 'customers'
    try {
      const { data: existing, error: selectError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (selectError) {
        console.error("Error comprobando customers:", selectError);
        // Si hay error al comprobar, mandamos al nextPath para no bloquear al usuario
        return NextResponse.redirect(`${origin}${nextPath}`);
      }

      if (!existing) {
        // Si NO existe, redirigimos al onboarding para completar profile
        // No insertamos automáticamente porque necesitamos phone/full_name exactos
        return NextResponse.redirect(`${origin}/complete-profile`);
      }

      // Si existe, redirigimos al nextPath (home o lo que venga en next)
      return NextResponse.redirect(`${origin}${nextPath}`);
    } catch (err) {
      console.error("Error en verificación customers:", err);
      return NextResponse.redirect(origin);
    }
  } catch (err) {
    console.error("Error en auth callback route:", err);
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}