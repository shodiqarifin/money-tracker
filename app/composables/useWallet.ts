let _walletId: string | null = null

export function useWallet() {
  const supabase = useSupabaseClient()

  async function getWalletId(): Promise<string> {
    if (_walletId) return _walletId
    const { data, error } = await supabase.from('wallets').select('id').single()
    if (error || !data) throw new Error('Wallet tidak ditemukan')
    _walletId = data.id
    return _walletId
  }

  function clearWalletCache() {
    _walletId = null
  }

  return { getWalletId, clearWalletCache }
}
