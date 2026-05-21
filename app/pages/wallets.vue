<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const {
  wallets,
  activeWalletId,
  fetchWallets,
  createWallet,
  renameWallet,
  inviteMember,
  cancelInvitation,
  removeMember,
  leaveWallet,
  fetchPendingInvitations,
  fetchWalletInvitations,
  fetchWalletMembers,
} = useWallets()

const user = useSupabaseUser()

const loading = ref(false)
const error = ref<string | null>(null)

const showCreateModal = ref(false)
const newWalletName = ref('')
const createLoading = ref(false)

const expandedWalletId = ref<string | null>(null)
const walletMembers = ref<Record<string, any[]>>({})
const walletInvitations = ref<Record<string, any[]>>({})

const pendingInvitations = ref<any[]>([])

const editingWalletId = ref<string | null>(null)
const editingWalletName = ref('')

function startRename(wallet: any) {
  editingWalletId.value = wallet.id
  editingWalletName.value = wallet.name
}

async function confirmRename(walletId: string) {
  if (!editingWalletName.value.trim()) return
  try {
    await renameWallet(walletId, editingWalletName.value)
  } catch (e: any) {
    alert(e?.message || 'Gagal ubah nama wallet')
  } finally {
    editingWalletId.value = null
  }
}

const showInviteModal = ref(false)
const inviteWalletId = ref<string | null>(null)
const inviteEmail = ref('')
const inviteLoading = ref(false)
const inviteLink = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    await fetchWallets()
    pendingInvitations.value = await fetchPendingInvitations()
  } catch (e: any) {
    error.value = e?.message || 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

async function toggleWalletDetails(walletId: string) {
  if (expandedWalletId.value === walletId) {
    expandedWalletId.value = null
    return
  }
  expandedWalletId.value = walletId
  const [members, invitations] = await Promise.all([
    fetchWalletMembers(walletId),
    fetchWalletInvitations(walletId),
  ])
  walletMembers.value[walletId] = members
  walletInvitations.value[walletId] = invitations
}

async function handleCreateWallet() {
  if (!newWalletName.value.trim()) return
  createLoading.value = true
  try {
    const id = await createWallet(newWalletName.value)
    activeWalletId.value = id
    showCreateModal.value = false
    newWalletName.value = ''
  } catch (e: any) {
    alert(e?.message || 'Gagal membuat wallet')
  } finally {
    createLoading.value = false
  }
}

function openInviteModal(walletId: string) {
  inviteWalletId.value = walletId
  inviteEmail.value = ''
  inviteLink.value = null
  showInviteModal.value = true
}

async function handleInvite() {
  if (!inviteEmail.value.trim() || !inviteWalletId.value) return
  inviteLoading.value = true
  try {
    const token = await inviteMember(inviteWalletId.value, inviteEmail.value)
    const origin = window.location.origin
    inviteLink.value = `${origin}/invite?token=${token}`
    inviteEmail.value = ''
    if (expandedWalletId.value === inviteWalletId.value) {
      walletInvitations.value[inviteWalletId.value] = await fetchWalletInvitations(inviteWalletId.value)
    }
  } catch (e: any) {
    alert(e?.message || 'Gagal kirim undangan')
  } finally {
    inviteLoading.value = false
  }
}

async function handleCancelInvitation(walletId: string, invitationId: string) {
  if (!confirm('Batalkan undangan ini?')) return
  try {
    await cancelInvitation(invitationId)
    walletInvitations.value[walletId] = walletInvitations.value[walletId].filter(i => i.id !== invitationId)
  } catch (e: any) {
    alert(e?.message || 'Gagal membatalkan undangan')
  }
}

async function handleRemoveMember(walletId: string, userId: string) {
  if (!confirm('Hapus member ini dari wallet?')) return
  try {
    await removeMember(walletId, userId)
    walletMembers.value[walletId] = walletMembers.value[walletId].filter(m => m.user_id !== userId)
  } catch (e: any) {
    alert(e?.message || 'Gagal hapus member')
  }
}

async function handleLeaveWallet(walletId: string) {
  if (!confirm('Keluar dari wallet ini? Kamu tidak akan bisa akses transaksinya lagi.')) return
  try {
    await leaveWallet(walletId)
  } catch (e: any) {
    alert(e?.message || 'Gagal keluar dari wallet')
  }
}

async function handleAcceptInvitation(invitation: any) {
  const supabase = useSupabaseClient()
  try {
    const { error: err } = await supabase
      .from('wallet_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)
    if (err) throw err

    const { error: memberErr } = await supabase
      .from('wallet_members')
      .insert({ wallet_id: invitation.wallet_id, user_id: user.value!.id, role: 'member' })
    if (memberErr) throw memberErr

    pendingInvitations.value = pendingInvitations.value.filter(i => i.id !== invitation.id)
    await fetchWallets()
  } catch (e: any) {
    alert(e?.message || 'Gagal menerima undangan')
  }
}

async function handleRejectInvitation(invitation: any) {
  const supabase = useSupabaseClient()
  try {
    const { error: err } = await supabase
      .from('wallet_invitations')
      .update({ status: 'rejected' })
      .eq('id', invitation.id)
    if (err) throw err
    pendingInvitations.value = pendingInvitations.value.filter(i => i.id !== invitation.id)
  } catch (e: any) {
    alert(e?.message || 'Gagal menolak undangan')
  }
}

async function copyInviteLink() {
  if (!inviteLink.value) return
  await navigator.clipboard.writeText(inviteLink.value)
  alert('Link undangan disalin!')
}

function isOwner(wallet: any) {
  return wallet.user_id === user.value?.id
}

onMounted(() => load())
</script>

<template>
  <div class="max-w-3xl mx-auto p-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-foreground">Wallet</h1>
      <button
        @click="showCreateModal = true"
        class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
      >
        + Buat Wallet
      </button>
    </div>

    <div v-if="loading" class="text-center py-8 text-muted">Memuat...</div>
    <div v-else-if="error" class="text-red-400 py-4">{{ error }}</div>

    <div v-else class="space-y-4">
      <!-- Pending invitations for this user -->
      <div v-if="pendingInvitations.length > 0" class="bg-surface border border-yellow-400/30 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-foreground mb-3">Undangan Masuk</h2>
        <div class="space-y-3">
          <div
            v-for="inv in pendingInvitations"
            :key="inv.id"
            class="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
          >
            <div>
              <p class="text-sm font-medium text-foreground">{{ (inv.wallet as any)?.name }}</p>
              <p class="text-xs text-muted">Diundang {{ new Date(inv.created_at).toLocaleDateString('id-ID') }}</p>
            </div>
            <div class="flex gap-2">
              <button
                @click="handleAcceptInvitation(inv)"
                class="text-xs bg-green-400/10 text-green-400 hover:bg-green-400/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Terima
              </button>
              <button
                @click="handleRejectInvitation(inv)"
                class="text-xs bg-white/5 text-muted hover:text-foreground px-3 py-1.5 rounded-lg transition-colors"
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Wallet list -->
      <div
        v-for="wallet in wallets"
        :key="wallet.id"
        class="bg-surface border rounded-2xl overflow-hidden transition-colors"
        :class="wallet.id === activeWalletId ? 'border-primary/50' : 'border-white/10'"
      >
        <div class="flex items-center justify-between px-5 py-4">
          <div class="flex items-center gap-3">
            <div>
              <div class="flex items-center gap-2">
                <template v-if="editingWalletId === wallet.id">
                  <input
                    v-model="editingWalletName"
                    class="bg-background border border-primary rounded px-2 py-0.5 text-sm font-semibold text-foreground focus:outline-none w-36"
                    @keyup.enter="confirmRename(wallet.id)"
                    @keyup.esc="editingWalletId = null"
                    @blur="confirmRename(wallet.id)"
                    autofocus
                  />
                </template>
                <template v-else>
                  <span
                    class="text-sm font-semibold text-foreground"
                    :class="isOwner(wallet) ? 'cursor-pointer hover:text-foreground/70' : ''"
                    @click="isOwner(wallet) && startRename(wallet)"
                  >{{ wallet.name }}</span>
                </template>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="wallet.role === 'owner' ? 'bg-primary/10 text-primary' : 'bg-white/5 text-muted'"
                >
                  {{ wallet.role === 'owner' ? 'Owner' : 'Member' }}
                </span>
                <span v-if="wallet.id === activeWalletId" class="text-xs text-primary">• Aktif</span>
              </div>
              <p class="text-xs text-muted mt-0.5 capitalize">{{ wallet.type }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="toggleWalletDetails(wallet.id)"
              class="text-xs text-muted hover:text-foreground px-2 py-1 rounded hover:bg-white/5 transition-colors"
            >
              {{ expandedWalletId === wallet.id ? 'Tutup' : 'Detail' }}
            </button>
            <button
              v-if="!isOwner(wallet)"
              @click="handleLeaveWallet(wallet.id)"
              class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        <!-- Expanded details (members + invitations) -->
        <div v-if="expandedWalletId === wallet.id" class="border-t border-white/10 px-5 py-4 space-y-4">
          <!-- Members -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-muted uppercase tracking-wider">Anggota</span>
              <button
                v-if="isOwner(wallet)"
                @click="openInviteModal(wallet.id)"
                class="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                + Undang
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="member in walletMembers[wallet.id] ?? []"
                :key="member.user_id"
                class="flex items-center justify-between py-1"
              >
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-muted">
                    {{ member.user_id === user?.id ? 'K' : 'A' }}
                  </div>
                  <span class="text-sm text-foreground">
                    {{ member.user_id === user?.id ? 'Kamu' : member.user_id.slice(0, 8) + '...' }}
                  </span>
                  <span class="text-xs text-muted capitalize">{{ member.role }}</span>
                </div>
                <button
                  v-if="isOwner(wallet) && member.user_id !== user?.id"
                  @click="handleRemoveMember(wallet.id, member.user_id)"
                  class="text-xs text-red-400 hover:text-red-300 px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                >
                  Hapus
                </button>
              </div>
              <div v-if="!walletMembers[wallet.id]?.length" class="text-xs text-muted">Memuat anggota...</div>
            </div>
          </div>

          <!-- Pending invitations sent from this wallet -->
          <div v-if="isOwner(wallet) && walletInvitations[wallet.id]?.length">
            <span class="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Undangan Tertunda</span>
            <div class="space-y-2">
              <div
                v-for="inv in walletInvitations[wallet.id]"
                :key="inv.id"
                class="flex items-center justify-between py-1"
              >
                <div>
                  <span class="text-sm text-foreground">{{ inv.invited_email }}</span>
                  <span class="text-xs text-muted ml-2">Expires {{ new Date(inv.expires_at).toLocaleDateString('id-ID') }}</span>
                </div>
                <button
                  @click="handleCancelInvitation(wallet.id, inv.id)"
                  class="text-xs text-red-400 hover:text-red-300 px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                >
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create wallet modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-semibold text-foreground mb-4">Buat Wallet Baru</h2>
        <input
          v-model="newWalletName"
          type="text"
          placeholder="Nama wallet (mis. Keuangan Keluarga)"
          class="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary mb-4"
          @keyup.enter="handleCreateWallet"
        />
        <div class="flex gap-2">
          <button
            @click="showCreateModal = false"
            class="flex-1 border border-white/10 text-muted px-4 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            Batal
          </button>
          <button
            @click="handleCreateWallet"
            :disabled="createLoading"
            class="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
          >
            {{ createLoading ? 'Membuat...' : 'Buat' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Invite modal -->
    <div
      v-if="showInviteModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="showInviteModal = false; inviteLink = null"
    >
      <div class="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-semibold text-foreground mb-4">Undang Anggota</h2>

        <div class="flex gap-2 mb-4">
          <input
            v-model="inviteEmail"
            type="email"
            placeholder="Email yang diundang"
            class="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
            @keyup.enter="handleInvite"
          />
          <button
            @click="handleInvite"
            :disabled="inviteLoading || !inviteEmail.trim()"
            class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 whitespace-nowrap"
          >
            {{ inviteLoading ? '...' : 'Buat Link' }}
          </button>
        </div>

        <!-- Invite link result -->
        <div v-if="inviteLink" class="bg-background border border-white/10 rounded-xl p-3 mb-4">
          <p class="text-xs text-muted mb-2">Bagikan link ini ke orang yang diundang:</p>
          <p class="text-xs text-foreground break-all font-mono">{{ inviteLink }}</p>
          <button
            @click="copyInviteLink"
            class="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Salin Link
          </button>
        </div>

        <button
          @click="showInviteModal = false; inviteLink = null"
          class="w-full border border-white/10 text-muted px-4 py-2 rounded-lg text-sm hover:bg-white/5"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
