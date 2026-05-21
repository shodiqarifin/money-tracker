import { serverSupabaseClient } from "#supabase/server"

export async function getWalletByUserId(event: any, userId: string) {
  const client = await serverSupabaseClient(event)

  const { data: wallet } = await client
    .from("wallets")
    .select("id")
    .eq("user_id", userId)
    .single()

  if (!wallet) {
    throw createError({ statusCode: 404, message: "Wallet not found" })
  }

  return wallet
}
