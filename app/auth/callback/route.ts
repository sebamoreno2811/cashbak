import { NextResponse } from "next/server"
import { createSupabaseClientWithCookies } from "@/utils/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const nextParam = searchParams.get("next") ?? "/"
    let nextPath = decodeURIComponent(nextParam)
    if (!nextPath.startsWith("/")) nextPath = `/${nextPath}`

    if (!code) {
      return NextResponse.redirect(`${origin}${nextPath}`)
    }

    const supabase = await createSupabaseClientWithCookies()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("exchangeCodeForSession error:", error)
      return NextResponse.redirect(origin)
    }

    return NextResponse.redirect(`${origin}${nextPath}`)
  } catch (err) {
    console.error("Unhandled error in auth callback:", err)
    return NextResponse.redirect("https://www.cashbak.cl/")
  }
}
