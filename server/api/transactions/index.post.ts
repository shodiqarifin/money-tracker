import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const body = await readBody(event)

  if (!body.amount || typeof body.amount !== "number" || body.amount <= 0) {
    throw createError({ statusCode: 400, message: "Amount harus angka positif" })
  }
  if (!body.categoryId || typeof body.categoryId !== "string") {
    throw createError({ statusCode: 400, message: "categoryId wajib diisi" })
  }
  if (!body.date || isNaN(new Date(body.date).getTime())) {
    throw createError({ statusCode: 400, message: "Date tidak valid" })
  }

  const transactionDate = new Date(body.date + "T00:00:00")
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (transactionDate > today) {
    throw createError({ statusCode: 400, message: "Tanggal transaksi tidak boleh di masa depan" })
  }

  const client = await serverSupabaseClient(event)
  const wallet = await getWalletByUserId(event, user.id)

  // Validasi: categoryId harus milik wallet ini
  const { data: category } = await client
    .from("categories")
    .select("id, wallet_id")
    .eq("id", body.categoryId)
    .single()

  if (!category || category.wallet_id !== wallet.id) {
    throw createError({ statusCode: 400, message: "Kategori tidak valid" })
  }

  const { data, error } = await client
    .from("transactions")
    .insert({
      wallet_id: wallet.id,
      category_id: body.categoryId,
      amount: body.amount,
      description: body.description?.trim() || null,
      date: transactionDate.toISOString(),
    })
    .select("id")
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true, id: data.id }
})
