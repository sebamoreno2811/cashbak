// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server"; // si lo tienes
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next") ?? "/";
    let nextPath = decodeURIComponent(nextParam);
    if (!nextPath.startsWith("/")) nextPath = `/${nextPath}`;

    // 1) Si tienes createSupabaseClientWithCookies (server util), úsalo para intercambiar code
    try {
      const supabase = await createSupabaseClientWithCookies();

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("exchangeCodeForSession error:", exchangeError);
          // no bloqueamos, redirigimos al home
          return NextResponse.redirect(origin);
        }
      } else {
        return NextResponse.redirect(`${origin}${nextPath}`);
      }

      // 2) Obtenemos la sesión y usuario
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("getSession error:", sessionError);
        return NextResponse.redirect(`${origin}${nextPath}`);
      }
      const user = session?.user;
      if (!user) return NextResponse.redirect(`${origin}${nextPath}`);

      // 3) Comprobamos si existe en customers (server-side)
      const { data: existing, error: selectError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (selectError) {
        console.error("Error comprobando customers:", selectError);
        return NextResponse.redirect(`${origin}${nextPath}`);
      }

      if (existing) {
        // ya existe -> home (o next)
        return NextResponse.redirect(`${origin}${nextPath}`);
      } else {
        // no existe -> manda a formulario para completar datos
        const url = new URL(`${origin}/complete-profile`);
        url.searchParams.set("userId", user.id);
        if (user.email) url.searchParams.set("email", user.email);
        const name = user.user_metadata?.full_name || user.user_metadata?.name;
        if (name) url.searchParams.set("name", name);
        url.searchParams.set("next", nextPath);
        return NextResponse.redirect(url.toString());
      }
    } catch (err) {
      console.error("Callback error:", err);
      // Si no tienes createSupabaseClientWithCookies o algo falla, redirigimos al home (no 404)
      return NextResponse.redirect(origin);
    }
  } catch (err) {
    console.error("Unhandled error in auth callback route:", err);
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}