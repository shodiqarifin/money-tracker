import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const client = await serverSupabaseClient(event)
  const wallet = await getWalletByUserId(event, user.id)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Semua transaksi dengan tipe kategori (untuk all-time totals)
  const { data: allTxs } = await client
    .from("transactions")
    .select("amount, category:categories(type)")
    .eq("wallet_id", wallet.id)

  // Transaksi bulan ini
  const { data: monthTxs } = await client
    .from("transactions")
    .select("amount, category:categories(id, name, type, is_system)")
    .eq("wallet_id", wallet.id)
    .gte("date", monthStart)

  // 5 transaksi terbaru
  const { data: recentTxs } = await client
    .from("transactions")
    .select("id, amount, description, date, category:categories(id, name, type)")
    .eq("wallet_id", wallet.id)
    .order("date", { ascending: false })
    .limit(5)

  // Hitung all-time totals
  const allTimeIncome = (allTxs ?? [])
    .filter((t: any) => t.category?.type === "income")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

  const allTimeExpense = (allTxs ?? [])
    .filter((t: any) => t.category?.type === "expense")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

  // Hitung bulan ini
  const monthIncome = (monthTxs ?? [])
    .filter((t: any) => t.category?.type === "income")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

  const monthExpense = (monthTxs ?? [])
    .filter((t: any) => t.category?.type === "expense")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

  // Top 5 kategori pengeluaran bulan ini (exclude system)
  const expenseTxs = (monthTxs ?? []).filter(
    (t: any) => t.category?.type === "expense" && !t.category?.is_system
  )

  const catMap = new Map<string, { name: string; type: string; total: number }>()
  for (const tx of expenseTxs) {
    if (!tx.category?.id) continue
    const key = tx.category.id
    if (!catMap.has(key)) {
      catMap.set(key, { name: tx.category.name, type: tx.category.type, total: 0 })
    }
    catMap.get(key)!.total += Number((tx as any).amount)
  }

  const topCategories = Array.from(catMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

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
    recentTransactions: recentTxs ?? [],
  }
})
