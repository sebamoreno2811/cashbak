import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  
  // Si tienes un parametro "next", úsalo, si no, manda al home o donde prefieras
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = cookies();

    // 1. Creamos el cliente de servidor "al vuelo" para poder setear cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore).get(name)?.value;
          },
          async set(name: string, value: string, options: any) {
            (await cookieStore).set({ name, value, ...options });
          },
          async remove(name: string, options: any) {
            (await cookieStore).delete({ name, ...options });
          },
        },
      }
    );

    // 2. Intercambiamos el código por la sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 3. Redirigimos al usuario a la pantalla de reset con la cookie de sesión ya puesta
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si algo falla, redirigimos a login con error
  return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}