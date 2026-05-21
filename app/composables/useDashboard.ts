export function useDashboard() {
  const supabase = useSupabaseClient()
  const { getWalletId } = useWallet()

  const summary = ref<any>(null)
  const pending = ref(false)

  async function fetchSummary() {
    pending.value = true
    try {
      const walletId = await getWalletId()

      const { data: allTx } = await supabase
        .from('transactions')
        .select('id, amount, description, date, category:categories(id, name, type, is_system)')
        .eq('wallet_id', walletId)
        .order('date', { ascending: false })

      const transactions = allTx ?? []

      let allIncome = 0, allExpense = 0
      for (const tx of transactions) {
        const type = (tx.category as any)?.type
        if (type === 'income') allIncome += Number(tx.amount)
        else if (type === 'expense') allExpense += Number(tx.amount)
      }

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const thisMonthTx = transactions.filter(tx => tx.date >= startOfMonth)

      let monthIncome = 0, monthExpense = 0
      for (const tx of thisMonthTx) {
        const type = (tx.category as any)?.type
        if (type === 'income') monthIncome += Number(tx.amount)
        else if (type === 'expense') monthExpense += Number(tx.amount)
      }

      const catMap = new Map<string, { name: string; total: number }>()
      for (const tx of thisMonthTx) {
        const cat = tx.category as any
        if (cat?.type === 'expense' && !cat?.is_system) {
          const entry = catMap.get(cat.id) ?? { name: cat.name, total: 0 }
          entry.total += Number(tx.amount)
          catMap.set(cat.id, entry)
        }
      }
      const topCategories = [...catMap.values()]
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

      summary.value = {
        allTime: { income: allIncome, expense: allExpense, balance: allIncome - allExpense },
        thisMonth: { income: monthIncome, expense: monthExpense, net: monthIncome - monthExpense },
        topCategories,
        recentTransactions: transactions.slice(0, 5),
      }
    } finally {
      pending.value = false
    }
  }

  return { summary, pending, fetchSummary }
}
