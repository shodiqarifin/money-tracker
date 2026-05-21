import type { Transaction, CreateTransactionInput } from '~/types/transaction'

export function useTransactions() {
  const supabase = useSupabaseClient()
  const activeWalletId = useState<string | null>('activeWalletId')

  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTransactions(): Promise<void> {
    const walletId = activeWalletId.value
    if (!walletId) return
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('transactions')
        .select('id, amount, description, date, created_at, updated_at, category:categories(id, name, type), creator:created_by(name), editor:updated_by(name)')
        .eq('wallet_id', walletId)
        .order('date', { ascending: false })
      if (err) throw err
      type TxRow = {
        id: string
        amount: number
        description: string | null
        date: string
        created_at: string
        category: { id: string; name: string; type: string } | null
        creator: { name: string } | null
        editor: { name: string } | null
      }
      transactions.value = ((data as TxRow[] | null) ?? []).map(t => ({
        id: t.id,
        amount: t.amount,
        description: t.description,
        date: t.date,
        createdAt: t.created_at,
        category: t.category ? { ...t.category, type: t.category.type as 'income' | 'expense' } : null,
        creatorName: t.creator?.name ?? null,
        editorName: t.editor?.name ?? null,
      }))
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Gagal memuat transaksi'
    } finally {
      loading.value = false
    }
  }

  async function createTransaction(input: CreateTransactionInput): Promise<void> {
    const walletId = activeWalletId.value
    const user = useSupabaseUser()
    if (!walletId) throw new Error('Wallet belum dipilih')
    const { error: err } = await supabase.from('transactions').insert({
      wallet_id: walletId,
      category_id: input.categoryId,
      amount: input.amount,
      description: input.description || null,
      date: new Date(input.date).toISOString(),
      created_by: user.value?.id ?? null,
    } as never)
    if (err) throw err
    await fetchTransactions()
  }

  async function updateTransaction(id: string, input: Partial<CreateTransactionInput>): Promise<void> {
    const user = useSupabaseUser()
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.value?.id ?? null,
    }
    if (input.amount !== undefined) patch.amount = input.amount
    if (input.categoryId !== undefined) patch.category_id = input.categoryId
    if (input.description !== undefined) patch.description = input.description || null
    if (input.date !== undefined) patch.date = new Date(input.date).toISOString()

    const { error: err } = await supabase.from('transactions').update(patch as never).eq('id', id)
    if (err) throw err
    await fetchTransactions()
  }

  async function deleteTransaction(id: string): Promise<void> {
    const { error: err } = await supabase.from('transactions').delete().eq('id', id)
    if (err) throw err
    await fetchTransactions()
  }

  return { transactions, loading, error, fetchTransactions, createTransaction, updateTransaction, deleteTransaction }
}
