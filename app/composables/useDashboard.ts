interface DashboardSummary {
  allTime: { income: number; expense: number; balance: number }
  thisMonth: { income: number; expense: number; net: number }
  topCategories: Array<{ id: string; name: string; total: number }>
  recentTransactions: Array<{
    id: string
    amount: number
    description: string | null
    date: string
    category: { id: string; name: string; type: 'income' | 'expense'; is_system: boolean } | null
  }>
}

type TxRow = {
  id: string
  amount: number
  description: string | null
  date: string
  category: { id: string; name: string; type: string; is_system: boolean } | null
}

export function useDashboard() {
  const supabase = useSupabaseClient()
  const activeWalletId = useState<string | null>('activeWalletId')

  const summary = ref<DashboardSummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSummary(): Promise<void> {
    const walletId = activeWalletId.value
    if (!walletId) return
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('transactions')
        .select('id, amount, description, date, category:categories(id, name, type, is_system)')
        .eq('wallet_id', walletId)
        .order('date', { ascending: false })
      if (err) throw err

      const transactions = ((data as TxRow[] | null) ?? []).map(t => ({
        ...t,
        category: t.category ? { ...t.category, type: t.category.type as 'income' | 'expense' } : null,
      }))

      let allIncome = 0, allExpense = 0
      for (const tx of transactions) {
        if (tx.category?.type === 'income') allIncome += Number(tx.amount)
        else if (tx.category?.type === 'expense') allExpense += Number(tx.amount)
      }

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const thisMonthTx = transactions.filter(tx => tx.date >= startOfMonth)

      let monthIncome = 0, monthExpense = 0
      for (const tx of thisMonthTx) {
        if (tx.category?.type === 'income') monthIncome += Number(tx.amount)
        else if (tx.category?.type === 'expense') monthExpense += Number(tx.amount)
      }

      const catMap = new Map<string, { id: string; name: string; total: number }>()
      for (const tx of thisMonthTx) {
        if (tx.category?.type === 'expense' && !tx.category.is_system) {
          const entry = catMap.get(tx.category.id) ?? { id: tx.category.id, name: tx.category.name, total: 0 }
          entry.total += Number(tx.amount)
          catMap.set(tx.category.id, entry)
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
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Gagal memuat dashboard'
    } finally {
      loading.value = false
    }
  }

  return { summary, loading, error, fetchSummary }
}
