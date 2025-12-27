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

    // Intercambiamos code -> session y cookie (si existe code)
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error("exchangeCodeForSession error:", exchangeError);
        return NextResponse.redirect(origin);
      }
    } else {
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    // Obtenemos sesión y usuario
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

    // Datos a insertar (si vienen en user_metadata), si no, quedan null
    const full_name = user.user_metadata?.full_name || user.user_metadata?.name || null;
    const phone = user.user_metadata?.phone || user.user_metadata?.phone_number || null;
    const email = user.email || null;

    // Preferimos crear la fila server-side con service_role (si está configurada)
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
          console.log("Customer ya existía para user:", user.id);
        }

        return true;
      } catch (err) {
        console.error("Excepción en ensureCustomer:", err);
        return false;
      }
    };

    // 1) Intentar con service_role si está disponible
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false },
        });

        const ok = await ensureCustomer(supabaseAdmin);
        if (ok) return NextResponse.redirect(`${origin}${nextPath}`);
      } catch (err) {
        console.error("Error creando cliente admin supabase:", err);
      }
    }

    // 2) Fallback: intentar con el cliente que tiene cookie (si las policies lo permiten)
    try {
      await ensureCustomer(supabase);
    } catch (err) {
      console.error("Fallback ensureCustomer error:", err);
    }

    // Siempre redirigimos al destino; NUNCA al /complete-profile automáticamente
    return NextResponse.redirect(`${origin}${nextPath}`);
  } catch (err) {
    console.error("Error en auth callback route:", err);
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}