import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const client = await serverSupabaseClient(event)
  const wallet = await getWalletByUserId(event, user.id)

  const { data, error } = await client
    .from("categories")
    .select("id, wallet_id, name, type, is_preset, is_system, created_at")
    .eq("wallet_id", wallet.id)
    .eq("is_system", false)
    .order("type")
    .order("name")

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Map snake_case → camelCase untuk konsistensi dengan frontend
  return (data ?? []).map((cat) => ({
    id: cat.id,
    walletId: cat.wallet_id,
    name: cat.name,
    type: cat.type,
    isPreset: cat.is_preset,
    isSystem: cat.is_system,
    createdAt: cat.created_at,
  }))
})
