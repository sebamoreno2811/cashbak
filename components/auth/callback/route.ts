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

    // Cliente server que maneja cookies (asegúrate que existe en utils)
    const supabase = await createSupabaseClientWithCookies();

    // Si viene code, intercambiamos por sesión (guardará cookie en la respuesta)
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error("exchangeCodeForSession:", exchangeError);
        // Redirigimos al home si falla (no mostrar 404)
        return NextResponse.redirect(origin);
      }
    } else {
      // Si no hay code, redirigimos al next/home
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    // Obtenemos la sesión y usuario
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

    // Comprobar si ya existe customer (server-side)
    try {
      const { data: existing, error: selectError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (selectError) {
        console.error("Error comprobando customers:", selectError);
        // Si falla la comprobación, redirigimos al home para no romper UX
        return NextResponse.redirect(`${origin}${nextPath}`);
      }

      if (existing) {
        // Ya existe → redirige al next (home)
        return NextResponse.redirect(`${origin}${nextPath}`);
      } else {
        // No existe → redirige a /complete-profile
        // Le pasamos email y name en query para pre-fill (opcional)
        const url = new URL(`${origin}/complete-profile`);
        url.searchParams.set("userId", user.id);
        if (user.email) url.searchParams.set("email", user.email);
        const name = user.user_metadata?.full_name || user.user_metadata?.name;
        if (name) url.searchParams.set("name", name);
        // Puedes incluir nextPath si quieres retornar al checkout después
        url.searchParams.set("next", nextPath);
        return NextResponse.redirect(url.toString());
      }
    } catch (err) {
      console.error("Error verificando customer:", err);
      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  } catch (err) {
    console.error("Unhandled error en auth callback route:", err);
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}