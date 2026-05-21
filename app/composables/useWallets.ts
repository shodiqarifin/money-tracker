export interface Wallet {
  id: string
  name: string
  type: 'personal' | 'family'
  user_id: string
  role: 'owner' | 'member'
}

export function useWallets() {
  const supabase = useSupabaseClient()
  const activeWalletId = useState<string | null>('activeWalletId', () => null)
  const wallets = useState<Wallet[]>('wallets', () => [])
  const walletsLoading = ref(false)

  const activeWallet = computed(() => wallets.value.find(w => w.id === activeWalletId.value) ?? null)

  async function fetchWallets() {
    walletsLoading.value = true
    const user = useSupabaseUser()
    try {
      const { data, error } = await supabase
        .from('wallet_members')
        .select('role, wallet:wallets(id, name, type, user_id)')
        .eq('user_id', user.value?.id ?? '')
      if (error) throw error
      wallets.value = (data ?? []).map((m: any) => ({
        ...m.wallet,
        role: m.role,
      }))
      if (!activeWalletId.value && wallets.value.length > 0) {
        activeWalletId.value = wallets.value[0].id
      }
    } finally {
      walletsLoading.value = false
    }
  }

  function switchWallet(id: string) {
    activeWalletId.value = id
  }

  async function createWallet(name: string) {
    const user = useSupabaseUser()
    if (!user.value) throw new Error('Not authenticated')
    const id = crypto.randomUUID()
    const { error } = await supabase
      .from('wallets')
      .insert({ id, name: name.trim(), type: 'personal', user_id: user.value.id })
    if (error) throw error
    await fetchWallets()
    return id
  }

  async function renameWallet(walletId: string, name: string) {
    const { error } = await supabase
      .from('wallets')
      .update({ name: name.trim() })
      .eq('id', walletId)
    if (error) throw error
    const w = wallets.value.find(w => w.id === walletId)
    if (w) w.name = name.trim()
  }

  async function inviteMember(walletId: string, email: string) {
    const user = useSupabaseUser()
    if (!user.value) throw new Error('Not authenticated')
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('wallet_invitations')
      .upsert(
        { wallet_id: walletId, invited_email: email.trim().toLowerCase(), invited_by: user.value.id, token, status: 'pending', expires_at: expiresAt },
        { onConflict: 'wallet_id,invited_email' }
      )
      .select('token')
      .single()
    if (error) throw error
    return data.token
  }

  async function cancelInvitation(invitationId: string) {
    const { error } = await supabase.from('wallet_invitations').delete().eq('id', invitationId)
    if (error) throw error
  }

  async function removeMember(walletId: string, userId: string) {
    const { error } = await supabase
      .from('wallet_members')
      .delete()
      .eq('wallet_id', walletId)
      .eq('user_id', userId)
    if (error) throw error
    await fetchWallets()
  }

  async function leaveWallet(walletId: string) {
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

  async function fetchPendingInvitations() {
    const user = useSupabaseUser()
    if (!user.value?.email) return []
    const { data, error } = await supabase
      .from('wallet_invitations')
      .select('id, wallet_id, invited_email, status, expires_at, created_at, wallet:wallets(id, name)')
      .eq('invited_email', user.value.email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
    if (error) throw error
    return data ?? []
  }

  async function fetchWalletInvitations(walletId: string) {
    const { data, error } = await supabase
      .from('wallet_invitations')
      .select('id, invited_email, status, expires_at, created_at')
      .eq('wallet_id', walletId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  async function deleteWallet(walletId: string) {
    const { error } = await supabase.from('wallets').delete().eq('id', walletId)
    if (error) throw error
    wallets.value = wallets.value.filter(w => w.id !== walletId)
    if (activeWalletId.value === walletId) {
      activeWalletId.value = wallets.value[0]?.id ?? null
    }
  }

  async function fetchWalletMembers(walletId: string) {
    const { data, error } = await supabase
      .from('wallet_members')
      .select('user_id, role, joined_at, profile:profiles(name)')
      .eq('wallet_id', walletId)
    if (error) throw error
    return (data ?? []).map((m: any) => ({
      ...m,
      display_name: m.profile?.name || null,
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
