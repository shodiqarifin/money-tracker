import type { Transaction, CreateTransactionInput } from '~/types/transaction'

export function useTransactions() {
  const supabase = useSupabaseClient()
  const activeWalletId = useState<string | null>('activeWalletId')

  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTransactions() {
    const walletId = activeWalletId.value
    if (!walletId) return
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('transactions')
        .select('id, amount, description, date, created_at, category:categories(id, name, type)')
        .eq('wallet_id', walletId)
        .order('date', { ascending: false })
      if (err) throw err
      transactions.value = (data ?? []).map(t => ({
        ...t,
        createdAt: t.created_at,
        category: t.category as Transaction['category'],
      }))
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat transaksi'
    } finally {
      loading.value = false
    }
  }

  async function createTransaction(input: CreateTransactionInput) {
    const walletId = activeWalletId.value
    if (!walletId) throw new Error('Wallet belum dipilih')
    const { error: err } = await supabase.from('transactions').insert({
      wallet_id: walletId,
      category_id: input.categoryId,
      amount: input.amount,
      description: input.description || null,
      date: new Date(input.date).toISOString(),
    })
    if (err) throw err
    await fetchTransactions()
  }

  async function updateTransaction(id: string, input: Partial<CreateTransactionInput>) {
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (input.amount !== undefined) patch.amount = input.amount
    if (input.categoryId !== undefined) patch.category_id = input.categoryId
    if (input.description !== undefined) patch.description = input.description || null
    if (input.date !== undefined) patch.date = new Date(input.date).toISOString()

    const { error: err } = await supabase.from('transactions').update(patch).eq('id', id)
    if (err) throw err
    await fetchTransactions()
  }

  async function deleteTransaction(id: string) {
    const { error: err } = await supabase.from('transactions').delete().eq('id', id)
    if (err) throw err
    await fetchTransactions()
  }

  return { transactions, loading, error, fetchTransactions, createTransaction, updateTransaction, deleteTransaction }
}
