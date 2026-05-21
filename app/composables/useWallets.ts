import type { Wallet, WalletMember, WalletInvitation, PendingInvitation } from '~/types/wallet'

export function useWallets() {
  const supabase = useSupabaseClient()
  const activeWalletId = useState<string | null>('activeWalletId', () => null)
  const wallets = useState<Wallet[]>('wallets', () => [])
  const walletsLoading = ref(false)

  const activeWallet = computed(() => wallets.value.find(w => w.id === activeWalletId.value) ?? null)

  async function fetchWallets(): Promise<void> {
    walletsLoading.value = true
    const user = useSupabaseUser()
    try {
      const { data, error } = await supabase
        .from('wallet_members')
        .select('role, wallet:wallets(id, name, type, user_id)')
        .eq('user_id', user.value?.id ?? '')
      if (error) throw error
      type MemberRow = { role: string; wallet: { id: string; name: string; type: string; user_id: string } | null }
      const rows = (data as MemberRow[] | null) ?? []
      wallets.value = rows.flatMap(m => {
        if (!m.wallet) return []
        return [{ ...m.wallet, type: m.wallet.type as Wallet['type'], role: m.role as Wallet['role'] }]
      })
      if (!activeWalletId.value && wallets.value.length > 0) {
        activeWalletId.value = wallets.value[0].id
      }
    } finally {
      walletsLoading.value = false
    }
  }

  function switchWallet(id: string): void {
    activeWalletId.value = id
  }

  async function createWallet(name: string): Promise<string> {
    const user = useSupabaseUser()
    if (!user.value) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('wallets')
      .insert({ name: name.trim(), type: 'personal', user_id: user.value.id } as never)
      .select('id')
      .single()
    if (error) throw error
    const result = data as { id: string } | null
    if (!result) throw new Error('Gagal mendapatkan ID wallet baru')
    await fetchWallets()
    return result.id
  }

  async function renameWallet(walletId: string, name: string): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .update({ name: name.trim() } as never)
      .eq('id', walletId)
    if (error) throw error
    const w = wallets.value.find(w => w.id === walletId)
    if (w) w.name = name.trim()
  }

  async function inviteMember(walletId: string, email: string): Promise<string> {
    const user = useSupabaseUser()
    if (!user.value) throw new Error('Not authenticated')
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('wallet_invitations')
      .upsert(
        { wallet_id: walletId, invited_email: email.trim().toLowerCase(), invited_by: user.value.id, token, status: 'pending', expires_at: expiresAt } as never,
        { onConflict: 'wallet_id,invited_email' }
      )
      .select('token')
      .single()
    if (error) throw error
    const result = data as { token: string } | null
    if (!result) throw new Error('Gagal membuat token undangan')
    return result.token
  }

  async function cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase.from('wallet_invitations').delete().eq('id', invitationId)
    if (error) throw error
  }

  async function removeMember(walletId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('wallet_members')
      .delete()
      .eq('wallet_id', walletId)
      .eq('user_id', userId)
    if (error) throw error
    await fetchWallets()
  }

  async function leaveWallet(walletId: string): Promise<void> {
    const user = useSupabaseUser()
    if (!user.value) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('wallet_members')
      .delete()
      .eq('wallet_id', walletId)
      .eq('user_id', user.value.id)
    if (error) throw error
    if (activeWalletId.value === walletId) activeWalletId.value = null
    await fetchWallets()
  }

  async function fetchPendingInvitations(): Promise<PendingInvitation[]> {
    const user = useSupabaseUser()
    if (!user.value?.email) return []
    const { data, error } = await supabase
      .from('wallet_invitations')
      .select('id, wallet_id, invited_email, status, expires_at, created_at, wallet:wallets(id, name)')
      .eq('invited_email', user.value.email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
    if (error) throw error
    type InvRow = Omit<PendingInvitation, 'wallet'> & { wallet: PendingInvitation['wallet'] }
    return ((data as InvRow[] | null) ?? [])
  }

  async function fetchWalletInvitations(walletId: string): Promise<WalletInvitation[]> {
    const { data, error } = await supabase
      .from('wallet_invitations')
      .select('id, invited_email, status, expires_at, created_at')
      .eq('wallet_id', walletId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as WalletInvitation[] | null) ?? []
  }

  async function deleteWallet(walletId: string): Promise<void> {
    const { error } = await supabase.from('wallets').delete().eq('id', walletId)
    if (error) throw error
    wallets.value = wallets.value.filter(w => w.id !== walletId)
    if (activeWalletId.value === walletId) {
      activeWalletId.value = wallets.value[0]?.id ?? null
    }
  }

  async function fetchWalletMembers(walletId: string): Promise<WalletMember[]> {
    const { data, error } = await supabase
      .from('wallet_members')
      .select('user_id, role, joined_at, profile:profiles(name)')
      .eq('wallet_id', walletId)
    if (error) throw error
    type MemberRow = { user_id: string; role: string; joined_at: string; profile: { name: string } | null }
    const rows = (data as MemberRow[] | null) ?? []
    return rows.map(m => ({
      user_id: m.user_id,
      role: m.role as 'owner' | 'member',
      joined_at: m.joined_at,
      display_name: m.profile?.name ?? null,
    }))
  }

  return {
    wallets,
    activeWalletId,
    activeWallet,
    walletsLoading,
    fetchWallets,
    switchWallet,
    createWallet,
    deleteWallet,
    renameWallet,
    inviteMember,
    cancelInvitation,
    removeMember,
    leaveWallet,
    fetchPendingInvitations,
    fetchWalletInvitations,
    fetchWalletMembers,
  }
}
