// file: app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    const target = origin; // https://www.cashbak.cl

    // Intentamos intercambiar code -> session (no bloqueante)
    try {
      const supabase = await createSupabaseClientWithCookies();

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("exchangeCodeForSession error:", error);
          // seguimos para redirigir al home
        }
      }
    } catch (err) {
      console.error("Error al intentar exchangeCodeForSession:", err);
      // seguimos para redirigir al home
    }

    // Siempre redirigimos al home
    return NextResponse.redirect(target);
  } catch (err) {
    console.error("Unhandled error en auth callback route:", err);
    return NextResponse.redirect("https://www.cashbak.cl/");
  }
}