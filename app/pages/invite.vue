<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const token = computed(() => route.query.token as string | undefined)

const invitation = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const processing = ref(false)
const done = ref<'accepted' | 'rejected' | null>(null)

onMounted(async () => {
  if (!token.value) {
    error.value = 'Token undangan tidak valid'
    loading.value = false
    return
  }

  if (!user.value) {
    navigateTo(`/login?redirect=/invite?token=${token.value}`)
    return
  }

  try {
    const { data, error: err } = await supabase
      .from('wallet_invitations')
      .select('id, wallet_id, invited_email, status, expires_at, wallet:wallets(id, name)')
      .eq('token', token.value)
      .single()

    if (err || !data) {
      error.value = 'Undangan tidak ditemukan atau sudah tidak valid'
      return
    }

    if (data.status !== 'pending') {
      error.value = `Undangan ini sudah ${data.status === 'accepted' ? 'diterima' : 'ditolak'}`
      return
    }

    if (new Date(data.expires_at) < new Date()) {
      error.value = 'Undangan ini sudah kadaluarsa'
      return
    }

    if (data.invited_email !== user.value.email) {
      error.value = 'Undangan ini bukan untuk akun kamu'
      return
    }

    invitation.value = data
  } catch (e: any) {
    error.value = e?.message || 'Terjadi kesalahan'
  } finally {
    loading.value = false
  }
})

async function accept() {
  if (!invitation.value || !user.value) return
  processing.value = true
  try {
    const { error: updateErr } = await supabase
      .from('wallet_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.value.id)
    if (updateErr && updateErr.code !== '23505') throw updateErr

    const { error: memberErr } = await supabase
      .from('wallet_members')
      .insert({ wallet_id: invitation.value.wallet_id, user_id: user.value.id, role: 'member' })
    if (memberErr && memberErr.code !== '23505') throw memberErr

    done.value = 'accepted'
  } catch (e: any) {
    error.value = e?.message || 'Gagal menerima undangan'
  } finally {
    processing.value = false
  }
}

async function reject() {
  if (!invitation.value) return
  processing.value = true
  try {
    const { error: updateErr } = await supabase
      .from('wallet_invitations')
      .update({ status: 'rejected' })
      .eq('id', invitation.value.id)
    if (updateErr) throw updateErr
    done.value = 'rejected'
  } catch (e: any) {
    error.value = e?.message || 'Gagal menolak undangan'
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="bg-surface border border-white/10 rounded-2xl p-8 text-center">

        <div v-if="loading" class="text-muted text-sm">Memuat undangan...</div>

        <div v-else-if="error" class="space-y-4">
          <div class="text-4xl">⚠️</div>
          <p class="text-sm text-muted">{{ error }}</p>
          <NuxtLink
            to="/dashboard"
            class="inline-block text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Kembali ke Dashboard
          </NuxtLink>
        </div>

        <div v-else-if="done === 'accepted'" class="space-y-4">
          <div class="text-4xl">🎉</div>
          <h2 class="text-lg font-semibold text-foreground">Undangan Diterima!</h2>
          <p class="text-sm text-muted">
            Kamu sekarang punya akses ke wallet <strong class="text-foreground">{{ (invitation?.wallet as any)?.name }}</strong>.
          </p>
          <NuxtLink
            to="/dashboard"
            class="block w-full bg-primary text-white text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Buka Dashboard
          </NuxtLink>
        </div>

        <div v-else-if="done === 'rejected'" class="space-y-4">
          <div class="text-4xl">👋</div>
          <p class="text-sm text-muted">Undangan ditolak.</p>
          <NuxtLink
            to="/dashboard"
            class="inline-block text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Kembali ke Dashboard
          </NuxtLink>
        </div>

        <div v-else-if="invitation" class="space-y-5">
          <div class="text-4xl">💌</div>
          <div>
            <h2 class="text-lg font-semibold text-foreground mb-1">Kamu diundang!</h2>
            <p class="text-sm text-muted">
              Seseorang mengundangmu untuk bergabung ke wallet
            </p>
            <p class="text-base font-bold text-foreground mt-2">
              {{ (invitation.wallet as any)?.name }}
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <button
              @click="accept"
              :disabled="processing"
              class="w-full bg-primary text-white text-sm font-medium py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {{ processing ? 'Memproses...' : 'Terima Undangan' }}
            </button>
            <button
              @click="reject"
              :disabled="processing"
              class="w-full border border-white/10 text-muted text-sm py-2.5 rounded-xl hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              Tolak
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
