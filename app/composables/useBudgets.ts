export interface Budget {
  id: string
  wallet_id: string
  category_id: string
  amount: number
  month: string
}

export function useBudgets() {
  const supabase = useSupabaseClient()
  const activeWalletId = useState<string | null>('activeWalletId')

  const budgets = ref<Budget[]>([])
  const budgetMap = computed(() => {
    const map: Record<string, Budget> = {}
    for (const b of budgets.value) map[b.category_id] = b
    return map
  })

  function currentMonthDate() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }

  async function fetchBudgets(month?: string) {
    const walletId = activeWalletId.value
    if (!walletId) return
    const targetMonth = month ?? currentMonthDate()
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('wallet_id', walletId)
      .eq('month', targetMonth)
    if (error) throw error
    budgets.value = data ?? []
  }

  async function upsertBudget(categoryId: string, amount: number, month?: string) {
    const walletId = activeWalletId.value
    if (!walletId) throw new Error('Wallet belum dipilih')
    const targetMonth = month ?? currentMonthDate()
    const { error } = await supabase.from('budgets').upsert(
      { wallet_id: walletId, category_id: categoryId, amount, month: targetMonth },
      { onConflict: 'category_id,month' }
    )
    if (error) throw error
    await fetchBudgets(targetMonth)
  }

  async function deleteBudget(id: string) {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) throw error
    budgets.value = budgets.value.filter(b => b.id !== id)
  }

  return { budgets, budgetMap, fetchBudgets, upsertBudget, deleteBudget, currentMonthDate }
}
