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
        // Redirigimos al home para no mostrar UI de complete-profile
        return NextResponse.redirect(origin);
      }
    } else {
      // Sin code, redirigimos al destino (evita 404)
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

    // Datos a insertar (si están en user_metadata) — si no, quedan null
    const full_name = user.user_metadata?.full_name || user.user_metadata?.name || null;
    const phone = user.user_metadata?.phone || user.user_metadata?.phone_number || null;
    const email = user.email || null;

    // Intentamos crear la fila en customers SÓLO si no existe.
    // Preferimos service_role (admin) para evitar problemas RLS.
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const ensureCustomer = async (client: ReturnType<typeof createClient> | typeof supabase) => {
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
          // Ya existe, nothing to do
        }

        return true;
      } catch (err) {
        console.error("Excepción en ensureCustomer:", err);
        return false;
      }
    };

    // 1) Intentar con admin (service role) si está disponible
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false },
        });

        const ok = await ensureCustomer(supabaseAdmin);
        if (ok) {
          // Creado/existente: redirigimos al destino
          return NextResponse.redirect(`${origin}${nextPath}`);
        }
        // si falla, fallback al cliente con cookie
      } catch (err) {
        console.error("Error creando cliente admin supabase:", err);
      }
    }

    // 2) Fallback: intentar con el cliente que usa la cookie (si las policies lo permiten)
    try {
      await ensureCustomer(supabase);
    } catch (err) {
      console.error("Fallback ensureCustomer error:", err);
    }

    // NO redirigimos nunca a /complete-profile; siempre a next/home
    return NextResponse.redirect(`${origin}${nextPath}`);
  } catch (err) {
    console.error("Error en auth callback route:", err);
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}