import { desc, eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { transactions, categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }

  const wallet = await getWalletByUserId(session.user.id)

  const result = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
      createdAt: transactions.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        type: categories.type,
      },
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.walletId, wallet.id))
    .orderBy(desc(transactions.date))

  return result
})