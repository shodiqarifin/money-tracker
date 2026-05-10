import { eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }

  const wallet = await getWalletByUserId(session.user.id)

  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.walletId, wallet.id))
    .orderBy(categories.type, categories.name)

  return result
})
