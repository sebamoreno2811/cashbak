// ARCHIVO: app/auth/callback/route.ts
import { createClient } from "@/utils/supabase/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // "next" es la página a la que iremos después (ej: /reset-password)
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    
    // Intercambiamos el código por una sesión en el servidor
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Redirigimos al usuario ya logueado a la página de cambio de pass
      const forwardedHost = request.headers.get("x-forwarded-host"); // Para soporte de proxy/load balancers
      const isLocalEnv = process.env.NODE_ENV === "development";
      
      if (isLocalEnv) {
        // En local usamos el origin normal
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // En producción aseguramos usar el dominio correcto
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Si falla, redirigimos al login con error
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}