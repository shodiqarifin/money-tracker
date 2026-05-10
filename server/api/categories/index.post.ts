import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db } from "~~/server/utils/db"
import { categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }

  const body = await readBody(event)

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    throw createError({ statusCode: 400, message: "Nama kategori wajib diisi" })
  }
  if (!body.type || !["income", "expense"].includes(body.type)) {
    throw createError({ statusCode: 400, message: "Type harus income atau expense" })
  }

  const wallet = await getWalletByUserId(session.user.id)

  const newCategory = {
    id: nanoid(),
    walletId: wallet.id,
    name: body.name.trim(),
    type: body.type as "income" | "expense",
    isPreset: false,
    isSystem: false,
  }

  await db.insert(categories).values(newCategory)

  return { success: true, id: newCategory.id }
})
