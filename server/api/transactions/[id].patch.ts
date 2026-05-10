import { and, eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { transactions, categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }

  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, message: "Transaction ID wajib diisi" })
  }

  const body = await readBody(event)
  const wallet = await getWalletByUserId(session.user.id)

  // Verifikasi transaksi milik user ini
  const existing = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.id, id),
      eq(transactions.walletId, wallet.id)
    ),
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: "Transaksi tidak ditemukan" })
  }

  // Build update object — hanya update field yang dikirim
  const updates: Partial<typeof existing> = {
    updatedAt: new Date(),
  }

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
    updates.date = transactionDate
  }

  if (body.categoryId !== undefined) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, body.categoryId),
    })
    if (!category || category.walletId !== wallet.id) {
      throw createError({ statusCode: 400, message: "Kategori tidak valid" })
    }
    updates.categoryId = body.categoryId
  }

  await db
    .update(transactions)
    .set(updates)
    .where(eq(transactions.id, id))

  return { success: true }
})