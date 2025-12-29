import { NextResponse } from "next/server";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next") ?? "/";
    let nextPath = decodeURIComponent(nextParam);
    if (!nextPath.startsWith("/")) nextPath = `/${nextPath}`;

    const supabase = await createSupabaseClientWithCookies();

    // Si viene code, intercambiamos por sesión (esto setea la cookie)
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error("exchangeCodeForSession error:", exchangeError);
        return NextResponse.redirect(origin);
      }
    } else {
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    // Obtenemos la sesión y el usuario
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("getSession error:", sessionError);
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    const user = session?.user ?? null;
    if (!user) {
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    // Comprobamos si existe fila en customers (usando el cliente servidor con cookies)
    try {
      const { data: existing, error: selectError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (selectError) {
        console.error("Error comprobando customers:", selectError);
        // En caso de error no bloqueante, redirigimos al home para buena UX
        return NextResponse.redirect(`${origin}${nextPath}`);
      }

      if (existing) {
        // Ya tiene profile → redirige al destino
        return NextResponse.redirect(`${origin}${nextPath}`);
      } else {
        // NO existe → redirigir al formulario para completar datos
        // Le pasamos userId, name y email como query (o puedes leer session en la página)
        const url = new URL(`${origin}/complete-profile`);
        url.searchParams.set("userId", user.id);
        if (user.email) url.searchParams.set("email", user.email);
        if (user.user_metadata?.name || user.user_metadata?.full_name) {
          const name = user.user_metadata?.full_name || user.user_metadata?.name;
          url.searchParams.set("name", name);
        }
        return NextResponse.redirect(url.toString());
      }
    } catch (err) {
      console.error("Error comprobando customers:", err);
      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  } catch (err) {
    console.error("Error en auth callback route:", err);
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}