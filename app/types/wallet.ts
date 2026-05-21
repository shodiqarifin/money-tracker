export interface Wallet {
  id: string
  name: string
  type: 'personal' | 'family'
  user_id: string
  role: 'owner' | 'member'
}

export interface WalletMember {
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  display_name: string | null
}

export interface WalletInvitation {
  id: string
  invited_email: string
  status: string
  expires_at: string
  created_at: string
}

export interface PendingInvitation {
  id: string
  wallet_id: string
  invited_email: string
  status: string
  expires_at: string
  created_at: string
  wallet: { id: string; name: string } | null
}
