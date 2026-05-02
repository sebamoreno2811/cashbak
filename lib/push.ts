import webpush from "web-push"
import { createSupabaseAdminClient } from "@/utils/supabase/server"

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  const admin = createSupabaseAdminClient()
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", userId)

  if (!subs || subs.length === 0) return

  const stale: string[] = []
  await Promise.allSettled(
    subs.map(async (row: { subscription: any }) => {
      try {
        await webpush.sendNotification(row.subscription, JSON.stringify(payload))
      } catch (err: any) {
        // 410 Gone / 404 = suscripción expirada, limpiar
        if (err.statusCode === 410 || err.statusCode === 404) {
          stale.push(row.subscription.endpoint)
        }
      }
    })
  )

  if (stale.length > 0) {
    await admin.from("push_subscriptions").delete().in("endpoint", stale)
  }
}
