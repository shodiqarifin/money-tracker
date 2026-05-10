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

  // Cari Uncategorized milik wallet ini sebagai fallback
  const uncategorized = await db.query.categories.findFirst({
    where: and(eq(categories.walletId, wallet.id), eq(categories.isSystem, true)),
  })

  if (!uncategorized) {
    throw createError({ statusCode: 500, message: "System category tidak ditemukan" })
  }

  // Reassign semua transaksi ke Uncategorized
  await db
    .update(transactions)
    .set({ categoryId: uncategorized.id })
    .where(and(eq(transactions.walletId, wallet.id), eq(transactions.categoryId, id)))

  await db.delete(categories).where(eq(categories.id, id))

  return { success: true }
})
