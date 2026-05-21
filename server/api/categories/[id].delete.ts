import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const id = getRouterParam(event, "id")
  if (!id) throw createError({ statusCode: 400, message: "Category ID wajib diisi" })

  const client = await serverSupabaseClient(event)
  const wallet = await getWalletByUserId(event, user.id)

  const { data: existing } = await client
    .from("categories")
    .select("id, type, is_system")
    .eq("id", id)
    .eq("wallet_id", wallet.id)
    .single()

  if (!existing) throw createError({ statusCode: 404, message: "Kategori tidak ditemukan" })
  if (existing.is_system) throw createError({ statusCode: 403, message: "Kategori sistem tidak bisa dihapus" })

  // Cari system category dengan type yang sama sebagai fallback
  const { data: uncategorized } = await client
    .from("categories")
    .select("id")
    .eq("wallet_id", wallet.id)
    .eq("is_system", true)
    .eq("type", existing.type)
    .single()

  if (!uncategorized) throw createError({ statusCode: 500, message: "System category tidak ditemukan" })

  // Reassign transaksi ke uncategorized, lalu hapus kategori
  const { error: reassignError } = await client
    .from("transactions")
    .update({ category_id: uncategorized.id })
    .eq("wallet_id", wallet.id)
    .eq("category_id", id)

  if (reassignError) throw createError({ statusCode: 500, message: reassignError.message })

  const { error: deleteError } = await client.from("categories").delete().eq("id", id)

  if (deleteError) throw createError({ statusCode: 500, message: deleteError.message })

  return { success: true }
})
