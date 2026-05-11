import { and, eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { categories, transactions } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }

  const id = getRouterParam(event, "id")
  if (!id) {
    throw createError({ statusCode: 400, message: "Category ID wajib diisi" })
  }

  const wallet = await getWalletByUserId(session.user.id)

  const existing = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.walletId, wallet.id)),
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: "Kategori tidak ditemukan" })
  }

  if (existing.isSystem) {
    throw createError({ statusCode: 403, message: "Kategori sistem tidak bisa dihapus" })
  }

  // Cari system category dengan type yang sama — income tetap income, expense tetap expense
  const uncategorized = await db.query.categories.findFirst({
    where: and(
      eq(categories.walletId, wallet.id),
      eq(categories.isSystem, true),
      eq(categories.type, existing.type),
    ),
  })

  if (!uncategorized) {
    throw createError({ statusCode: 500, message: "System category tidak ditemukan" })
  }

  // Atomic: reassign + delete dalam satu transaction
  await db.transaction(async (tx) => {
    await tx
      .update(transactions)
      .set({ categoryId: uncategorized.id })
      .where(and(eq(transactions.walletId, wallet.id), eq(transactions.categoryId, id)))

    await tx.delete(categories).where(eq(categories.id, id))
  })

  return { success: true }
})
