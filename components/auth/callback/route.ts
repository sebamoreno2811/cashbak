import { NextResponse } from "next/server";
import { createSupabaseClientWithCookies } from "@/utils/supabase/server"; // ✅ Importa tu cliente de servidor

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    // 1. Usamos tu cliente de servidor (que sabe manejar cookies)
    const supabase = await createSupabaseClientWithCookies();
    
    // 2. Intercambiamos el código. 
    // Como usamos el cliente de servidor, esto guardará la cookie de sesión automáticamente.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 3. Redirigimos. El navegador recibirá el header 'Set-Cookie' aquí.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si hay error, vuelta al login
  return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}