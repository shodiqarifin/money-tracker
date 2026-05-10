import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "~~/server/utils/db";
import { transactions, categories } from "~~/server/database/schema";
import { getWalletByUserId } from "~~/server/utils/wallet";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);

  // Validasi manual — kita tidak pakai Zod biar tidak tambah dependency
  if (!body.amount || typeof body.amount !== "number" || body.amount <= 0) {
    throw createError({
      statusCode: 400,
      message: "Amount harus angka positif",
    });
  }
  if (!body.categoryId || typeof body.categoryId !== "string") {
    throw createError({ statusCode: 400, message: "categoryId wajib diisi" });
  }
  if (!body.date || isNaN(new Date(body.date).getTime())) {
    throw createError({ statusCode: 400, message: "Date tidak valid" });
  }

  // Validasi: tidak boleh future date
  const transactionDate = new Date(body.date + "T00:00:00");
  const today = new Date();
  today.setHours(23, 59, 59, 999); // end of today
  if (transactionDate > today) {
    throw createError({
      statusCode: 400,
      message: "Tanggal transaksi tidak boleh di masa depan",
    });
  }

  const wallet = await getWalletByUserId(session.user.id);

  // Validasi: categoryId harus milik wallet ini
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, body.categoryId),
  });
  if (!category || category.walletId !== wallet.id) {
    throw createError({ statusCode: 400, message: "Kategori tidak valid" });
  }

  const newTransaction = {
    id: nanoid(),
    walletId: wallet.id,
    categoryId: body.categoryId,
    amount: body.amount,
    description: body.description?.trim() || null,
    date: transactionDate,
  };

  await db.insert(transactions).values(newTransaction);

  return { success: true, id: newTransaction.id };
});
