import { NextResponse } from "next/server";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Callback de OAuth (Next.js app router)
 * - intercambia code -> session (genera cookie con createSupabaseClientWithCookies)
 * - comprueba si existe fila en customers para user.id
 * - si NO existe, crea una fila mínima automáticamente (solo se hace una vez)
 * - siempre redirige al `next` decodificado (ej: "/"), evitando mostrar "complete-profile"
 */

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next") ?? "/";
    let nextPath = decodeURIComponent(nextParam);
    if (!nextPath.startsWith("/")) nextPath = `/${nextPath}`;

    const supabase = await createSupabaseClientWithCookies();

    // Si viene el code, intercambiamos por sesión (Supabase seteá cookie en la respuesta)
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error("exchangeCodeForSession error:", exchangeError);
        // Redirigir al home si falla el intercambio
        return NextResponse.redirect(origin);
      }
    } else {
      // Sin code, redirigir al destino (evita 404)
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    // Obtenemos la sesión y el usuario autenticado
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("getSession error:", sessionError);
      // Aun con error, no mostramos complete-profile; redirigimos al home/next
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    const user = session?.user ?? null;
    if (!user) {
      return NextResponse.redirect(`${origin}${nextPath}`);
    }

    // Datos a insertar (si están en user_metadata) — si no, quedan null
    const full_name =
      user.user_metadata?.full_name || user.user_metadata?.name || null;
    const phone =
      user.user_metadata?.phone || user.user_metadata?.phone_number || null;
    const email = user.email || null;

    // Preferimos crear la fila con service_role (admin) para evitar problemas de RLS.
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Helper para comprobar y crear customer
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
          // Insertamos fila mínima: email, full_name (si existe) y phone (si existe)
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
          // Si ya existe, nada que hacer
          console.log("Customer ya existía para user:", user.id);
        }

        return true;
      } catch (err) {
        console.error("Excepción en ensureCustomer:", err);
        return false;
      }
    };

    // 1) Intentar con admin (service role) si está configurado
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false },
        });

        const ok = await ensureCustomer(supabaseAdmin);
        if (ok) {
          return NextResponse.redirect(`${origin}${nextPath}`);
        }
        // si falla aunque tengamos service role, hacemos fallback al cliente con cookie
      } catch (err) {
        console.error("Error creando cliente admin supabase:", err);
      }
    }

    // 2) Fallback: intentar con el cliente que usa la cookie (si tus policies lo permiten)
    try {
      await ensureCustomer(supabase);
    } catch (err) {
      console.error("Fallback ensureCustomer error:", err);
    }

    // Importante: NO redirigimos a /complete-profile automáticamente.
    // Siempre redirigimos al destino para no interrumpir el login.
    return NextResponse.redirect(`${origin}${nextPath}`);
  } catch (err) {
    console.error("Error en auth callback route:", err);
    // Fallback final
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}