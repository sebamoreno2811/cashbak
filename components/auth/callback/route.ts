import { NextResponse } from "next/server";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next") ?? "/";
    // Decodificamos next (%2F -> /)
    let nextPath = decodeURIComponent(nextParam);
    if (!nextPath.startsWith("/")) nextPath = `/${nextPath}`;

    const supabase = await createSupabaseClientWithCookies();

    if (!code) {
      // No code: redirigir al next/home
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    // Intercambiamos el code por sesión (seteando cookie en la respuesta)
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("exchangeCodeForSession error:", exchangeError);
      return NextResponse.redirect(origin);
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
      return NextResponse.redirect(origin);
    }

    // ---- Intentamos crear el profile server-side usando service_role (admin) ----
    // Esto evita problemas de RLS o fallos al insertar desde el cliente.
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_URL en env; no se podrá crear profile admin-side.");
      // Si no hay key admin, redirigimos al complete-profile para que el usuario ingrese datos
      return NextResponse.redirect(`${origin}/complete-profile`);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      // No persistir sesiones en este cliente admin
      auth: { persistSession: false },
    });

    try {
      // Comprobamos si ya existe
      const { data: existing, error: selectError } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (selectError) {
        console.error("Error comprobando customers (admin):", selectError);
        // Si falla la comprobación, mandamos al onboarding para no romper UX
        return NextResponse.redirect(`${origin}/complete-profile`);
      }

      if (!existing) {
        // Construimos datos para insertar (mismo esquema que el formulario)
        const fullName =
          (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
          user.email ||
          "Sin nombre";
        const phone =
          (user.user_metadata && (user.user_metadata.phone || user.user_metadata.phone_number)) ||
          null;

        const { error: insertError } = await supabaseAdmin.from("customers").insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          phone: phone,
          created_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Error insertando customer (admin):", insertError);
          // Si falla la inserción admin, redirigimos al complete-profile para que usuario lo complete manualmente.
          return NextResponse.redirect(`${origin}/complete-profile`);
        }

        console.log("Perfil creado en customers (admin) para usuario:", user.id);
      }

      // Si existe (o se creó con éxito), redirigimos al destino (ej: '/')
      return NextResponse.redirect(`${origin}${nextPath}`);
    } catch (err) {
      console.error("Error en creación/comprobación admin:", err);
      return NextResponse.redirect(`${origin}/complete-profile`);
    }
  } catch (err) {
    console.error("Error en auth callback route:", err);
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}