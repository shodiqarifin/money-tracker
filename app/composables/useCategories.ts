export function useCategories() {
  const supabase = useSupabaseClient()
  const { getWalletId } = useWallet()

  async function fetchCategories() {
    const walletId = await getWalletId()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, type, is_preset, is_system')
      .eq('wallet_id', walletId)
      .eq('is_system', false)
      .order('type')
      .order('name')
    if (error) throw error
    return (data ?? []).map(c => ({
      id: c.id,
      name: c.name,
      type: c.type as 'income' | 'expense',
      isPreset: c.is_preset,
      isSystem: c.is_system,
    }))
  }

  async function createCategory(name: string, type: 'income' | 'expense') {
    const walletId = await getWalletId()
    const { error } = await supabase
      .from('categories')
      .insert({ wallet_id: walletId, name: name.trim(), type, is_preset: false, is_system: false })
    if (error) throw error
  }

  async function updateCategory(id: string, name: string) {
    const { error } = await supabase
      .from('categories')
      .update({ name: name.trim() })
      .eq('id', id)
    if (error) throw error
  }

  async function deleteCategory(id: string, type: 'income' | 'expense') {
    const walletId = await getWalletId()
    const { data: systemCat, error: sysErr } = await supabase
      .from('categories')
      .select('id')
      .eq('wallet_id', walletId)
      .eq('is_system', true)
      .eq('type', type)
      .single()
    if (sysErr || !systemCat) throw new Error('System category tidak ditemukan')

    const { error: reassignErr } = await supabase
      .from('transactions')
      .update({ category_id: systemCat.id })
      .eq('category_id', id)
    if (reassignErr) throw reassignErr

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  }

  return { fetchCategories, createCategory, updateCategory, deleteCategory }
}
