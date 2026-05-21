import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const id = getRouterParam(event, "id")
  if (!id) throw createError({ statusCode: 400, message: "Transaction ID wajib diisi" })

  const client = await serverSupabaseClient(event)
  const wallet = await getWalletByUserId(event, user.id)

  // Verify ownership sebelum delete
  const { data: existing } = await client
    .from("transactions")
    .select("id")
    .eq("id", id)
    .eq("wallet_id", wallet.id)
    .single()

  if (!existing) throw createError({ statusCode: 404, message: "Transaksi tidak ditemukan" })

  const { error } = await client.from("transactions").delete().eq("id", id)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
