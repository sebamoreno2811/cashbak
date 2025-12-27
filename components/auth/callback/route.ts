// file: app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // siempre redirigimos al root, ignoramos 'next' por ahora para forzar '/'
    const target = origin; // https://www.cashbak.cl

    const supabase = await createSupabaseClientWithCookies();

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error("exchangeCodeForSession error:", exchangeError);
        return NextResponse.redirect(target);
      }
    } else {
      // Sin 'code' -> redirigir al home
      return NextResponse.redirect(target);
    }

    // (Opcional) intenta crear customer si es nuevo (puedes quitar este bloque si no quieres)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (user) {
        // Si quieres, aquí aseguras customer (llama a tu lógica existente).
        // Si no quieres insertar nada, comenta/borra el siguiente bloque.
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false },
          });
          // comprueba e inserta si no existe (mínimo: id, email)
          const { data: existing } = await supabaseAdmin
            .from("customers")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();
          if (!existing) {
            await supabaseAdmin.from("customers").insert({
              id: user.id,
              email: user.email || null,
              full_name: user.user_metadata?.full_name || null,
              phone: user.user_metadata?.phone || null,
              created_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.error("Warning: fallo al crear customer (no bloqueante):", err);
    }

    // siempre al home
    return NextResponse.redirect(target);
  } catch (err) {
    console.error("Error en auth callback route:", err);
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}