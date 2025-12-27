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

    // Si viene el code, intercambiamos por sesión (Supabase guardará cookie)
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error("exchangeCodeForSession error:", exchangeError);
        return NextResponse.redirect(origin);
      }
    } else {
      // Sin code, redirigimos al destino (evitar 404)
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    // Obtenemos la sesión y el usuario autenticado
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

    // Intentamos ENSURE customer row: sólo crear si NO existe
    // Preferimos realizar esto server-side con service role (si está disponible).
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Datos a insertar (no obligatorios): no forzamos nombre/phone
    const full_name =
      user.user_metadata?.full_name || user.user_metadata?.name || null;
    const phone =
      user.user_metadata?.phone || user.user_metadata?.phone_number || null;
    const email = user.email || null;

    // Helper: chequear/crear usando un cliente (admin si existe, sino el cliente con cookies)
    const tryEnsureCustomer = async (client: ReturnType<typeof createClient> | typeof supabase) => {
      try {
        const { data: existing, error: selectError } = await client
          .from("customers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (selectError) {
          console.error("Error comprobando customers:", selectError);
          return false;
        }

        if (!existing) {
          const { error: insertError } = await client.from("customers").insert({
            id: user.id,
            email,
            full_name,
            phone,
            created_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error("Error insertando customer:", insertError);
            return false;
          }

          console.log("Customer creado automáticamente para user:", user.id);
        } else {
          // ya existía, nada que hacer
        }

        return true;
      } catch (err) {
        console.error("Excepción en tryEnsureCustomer:", err);
        return false;
      }
    };

    // 1) Intentar con admin (service role) si está disponible
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });

      const ok = await tryEnsureCustomer(supabaseAdmin);
      if (ok) {
        return NextResponse.redirect(`${origin}${nextPath}`);
      }
      // si falla, intentamos fallback con cliente que usa cookies (puede funcionar si RLS lo permite)
    }

    // 2) Fallback: intentar con el cliente que ya tiene la cookie (si las policies lo permiten)
    try {
      await tryEnsureCustomer(supabase);
    } catch (err) {
      console.error("Fallback ensure customer failed:", err);
    }

    // Siempre redirigimos al destino (no mostramos onboarding forzado)
    return NextResponse.redirect(`${origin}${nextPath}`);
  } catch (err) {
    console.error("Error en auth callback route:", err);
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}