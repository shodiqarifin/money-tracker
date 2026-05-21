import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const client = await serverSupabaseClient(event)
  const wallet = await getWalletByUserId(event, user.id)

  const { data, error } = await client
    .from("transactions")
    .select("id, amount, description, date, created_at, category:categories(id, name, type)")
    .eq("wallet_id", wallet.id)
    .order("date", { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
