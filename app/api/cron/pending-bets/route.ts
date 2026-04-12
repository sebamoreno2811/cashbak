import { createSupabaseClientWithoutCookies } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_FROM = process.env.EMAIL_FROM || "support@cashbak.cl"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "cashbak.ops@gmail.com"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createSupabaseClientWithoutCookies()

  // Obtener order_items pendientes de apostar
  const { data: items } = await supabase
    .from("order_items")
    .select("id, bet_option_id, bet_amount, quantity")
    .eq("bet_placed", false)
    .not("bet_option_id", "is", null)

  if (!items || items.length === 0) {
    return NextResponse.json({ ok: true, message: "Sin apuestas pendientes" })
  }

  // Obtener los bets activos sin resultado
  const betIds = [...new Set(items.map((i: any) => i.bet_option_id))]
  const { data: bets } = await supabase
    .from("bets")
    .select("id, name, active, is_winner")
    .in("id", betIds)

  const betMap: Record<string, { name: string; active: boolean; is_winner: boolean | null }> = {}
  for (const b of bets ?? []) betMap[String(b.id)] = b

  // Agrupar por evento solo si activo y sin resultado
  const byEvent: Record<string, { name: string; total: number; count: number }> = {}
  for (const item of items) {
    const bet = betMap[String(item.bet_option_id)]
    if (!bet || !bet.active || bet.is_winner !== null) continue
    const key = String(item.bet_option_id)
    if (!byEvent[key]) byEvent[key] = { name: bet.name, total: 0, count: 0 }
    byEvent[key].total += (item.bet_amount ?? 0) * (item.quantity ?? 1)
    byEvent[key].count++
  }

  const eventos = Object.values(byEvent)
  if (eventos.length === 0) {
    return NextResponse.json({ ok: true, message: "Sin eventos activos pendientes" })
  }

  const totalGeneral = eventos.reduce((s, e) => s + e.total, 0)

  const rowsHtml = eventos
    .sort((a, b) => b.total - a.total)
    .map(e => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;">${e.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#6b7280;text-align:center;">${e.count} item${e.count !== 1 ? "s" : ""}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:700;color:#1d4ed8;text-align:right;">$${Math.round(e.total).toLocaleString("es-CL")}</td>
      </tr>
    `).join("")

  await resend.emails.send({
    from: EMAIL_FROM,
    to: ADMIN_EMAIL,
    subject: `🎯 ${eventos.length} evento${eventos.length !== 1 ? "s" : ""} con apuestas pendientes — $${Math.round(totalGeneral).toLocaleString("es-CL")} por colocar`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px;text-align:center;">
        <div style="background:#fff;padding:32px;border-radius:12px;display:inline-block;max-width:560px;text-align:left;width:100%;">
          <h2 style="color:#1e3a5f;margin-top:0;">🎯 Apuestas pendientes de colocar</h2>
          <p style="color:#555;font-size:14px;">Hay <strong>${eventos.length} evento${eventos.length !== 1 ? "s" : ""}</strong> con compras sin cubrir. Entra al dashboard para colocar las apuestas.</p>

          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Evento</th>
                <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Items</th>
                <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Monto</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
            <tfoot>
              <tr style="background:#eff6ff;">
                <td style="padding:10px 12px;font-weight:700;color:#1e3a5f;" colspan="2">Total a apostar</td>
                <td style="padding:10px 12px;font-weight:800;font-size:18px;color:#1d4ed8;text-align:right;">$${Math.round(totalGeneral).toLocaleString("es-CL")}</td>
              </tr>
            </tfoot>
          </table>

          <div style="text-align:center;margin-top:24px;">
            <a href="https://cashbak.cl/admin/dashboard" style="background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
              Ir al dashboard →
            </a>
          </div>

          <p style="color:#9ca3af;font-size:12px;margin-top:28px;text-align:center;">CashBak · cashbak.cl</p>
        </div>
      </div>
    `,
  })

  return NextResponse.json({ ok: true, eventos: eventos.length, total: totalGeneral })
}
