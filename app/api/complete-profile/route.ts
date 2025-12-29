import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, email, full_name, phone } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL");
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Comprobamos si ya existe
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (selectError) {
      console.error("Error checking customers:", selectError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ ok: true });
    }

    const { error: insertError } = await supabaseAdmin.from("customers").insert({
      id,
      email: email || null,
      full_name: full_name || null,
      phone: phone || null,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error inserting customer:", insertError);
      return NextResponse.json({ error: "Insert error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unhandled error in /api/complete-profile:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}