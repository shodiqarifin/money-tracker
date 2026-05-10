import { and, desc, eq, gte, sql } from "drizzle-orm"
import { db } from "~~/server/utils/db"
import { transactions, categories } from "~~/server/database/schema"
import { getWalletByUserId } from "~~/server/utils/wallet"

export default defineEventHandler(async (event) => {
  const session = event.context.session
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }

  const wallet = await getWalletByUserId(session.user.id)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // All-time totals per category type
  const allTimeTotals = await db
    .select({
      type: categories.type,
      total: sql<number>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.walletId, wallet.id))
    .groupBy(categories.type)

  // This month totals per category type
  const monthTotals = await db
    .select({
      type: categories.type,
      total: sql<number>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.walletId, wallet.id), gte(transactions.date, monthStart)))
    .groupBy(categories.type)

  // Top 5 spending categories this month
  const topCategories = await db
    .select({
      name: categories.name,
      type: categories.type,
      total: sql<number>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.walletId, wallet.id),
        gte(transactions.date, monthStart),
        eq(categories.type, "expense")
      )
    )
    .groupBy(categories.id)
    .orderBy(sql`sum(${transactions.amount}) desc`)
    .limit(5)

  // Recent 5 transactions
  const recentTransactions = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
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
    .limit(5)

  const allTimeIncome = allTimeTotals.find((r) => r.type === "income")?.total ?? 0
  const allTimeExpense = allTimeTotals.find((r) => r.type === "expense")?.total ?? 0
  const monthIncome = monthTotals.find((r) => r.type === "income")?.total ?? 0
  const monthExpense = monthTotals.find((r) => r.type === "expense")?.total ?? 0

  return {
    allTime: {
      income: allTimeIncome,
      expense: allTimeExpense,
      balance: allTimeIncome - allTimeExpense,
    },
    thisMonth: {
      income: monthIncome,
      expense: monthExpense,
      net: monthIncome - monthExpense,
    },
    topCategories,
    recentTransactions,
  }
})
