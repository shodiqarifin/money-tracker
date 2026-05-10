import { and, eq } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { categories } from "~~/server/database/schema"
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

  const body = await readBody(event)
  const wallet = await getWalletByUserId(session.user.id)

  const existing = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.walletId, wallet.id)),
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: "Kategori tidak ditemukan" })
  }

  if (existing.isSystem) {
    throw createError({ statusCode: 403, message: "Kategori sistem tidak bisa diubah" })
  }

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    throw createError({ statusCode: 400, message: "Nama kategori wajib diisi" })
  }

  await db
    .update(categories)
    .set({ name: body.name.trim() })
    .where(eq(categories.id, id))

  return { success: true }
})
