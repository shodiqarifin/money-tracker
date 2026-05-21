import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const id = getRouterParam(event, "id")
  if (!id) throw createError({ statusCode: 400, message: "Transaction ID wajib diisi" })

  const body = await readBody(event)
  const client = await serverSupabaseClient(event)
  const wallet = await getWalletByUserId(event, user.id)

  const { data: existing } = await client
    .from("transactions")
    .select("id")
    .eq("id", id)
    .eq("wallet_id", wallet.id)
    .single()

  if (!existing) throw createError({ statusCode: 404, message: "Transaksi tidak ditemukan" })

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }

  if (body.amount !== undefined) {
    if (typeof body.amount !== "number" || body.amount <= 0) {
      throw createError({ statusCode: 400, message: "Amount harus angka positif" })
    }
    updates.amount = body.amount
  }

  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null
  }

  if (body.date !== undefined) {
    if (isNaN(new Date(body.date).getTime())) {
      throw createError({ statusCode: 400, message: "Date tidak valid" })
    }
    const transactionDate = new Date(body.date + "T00:00:00")
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (transactionDate > today) {
      throw createError({ statusCode: 400, message: "Tanggal transaksi tidak boleh di masa depan" })
    }
    updates.date = transactionDate.toISOString()
  }

  if (body.categoryId !== undefined) {
    const { data: category } = await client
      .from("categories")
      .select("id, wallet_id")
      .eq("id", body.categoryId)
      .single()

    if (!category || category.wallet_id !== wallet.id) {
      throw createError({ statusCode: 400, message: "Kategori tidak valid" })
    }
    updates.category_id = body.categoryId
  }

  const { error } = await client.from("transactions").update(updates).eq("id", id)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
