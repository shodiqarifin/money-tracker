import { and, eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { transactions } from "~~/server/database/schema"
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

  const wallet = await getWalletByUserId(session.user.id)

  // Verify ownership sebelum delete
  const existing = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.id, id),
      eq(transactions.walletId, wallet.id)
    ),
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: "Transaksi tidak ditemukan" })
  }

  await db.delete(transactions).where(eq(transactions.id, id))

  return { success: true }
})