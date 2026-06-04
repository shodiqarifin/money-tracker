import webpush from "npm:web-push@3.6.7"

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") ?? "mailto:admin@example.com"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? ""

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

interface PushSubscription {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

Deno.serve(async (req) => {
  // Protect endpoint - require CRON_SECRET if set
  if (CRON_SECRET) {
    const authHeader = req.headers.get("Authorization")
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 })
    }
  }

  const now = new Date()
  const currentUtcTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`

  // Ambil semua subscriptions yang reminder_time_utc-nya cocok dengan sekarang
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?reminder_time_utc=eq.${currentUtcTime}&select=id,endpoint,p256dh,auth`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  )

  const subscriptions: PushSubscription[] = await res.json()

  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0, time: currentUtcTime }), {
      headers: { "Content-Type": "application/json" },
    })
  }

  const payload = JSON.stringify({
    title: "Money Tracker - Pengingat Harian",
    body: "Jangan lupa catat pengeluaran dan pemasukanmu hari ini! 💰",
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  // Hapus subscriptions yang sudah expired (endpoint invalid)
  const expiredIds: string[] = []
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const err = result.reason as any
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        expiredIds.push(subscriptions[i].id)
      }
    }
  })

  if (expiredIds.length > 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?id=in.(${expiredIds.join(",")})`, {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    })
  }

  const sent = results.filter((r) => r.status === "fulfilled").length

  return new Response(JSON.stringify({ sent, total: subscriptions.length, time: currentUtcTime }), {
    headers: { "Content-Type": "application/json" },
  })
})
