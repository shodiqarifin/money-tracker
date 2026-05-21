<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user, updateName, updatePassword } = useProfile()

const nameInput = ref('')
const nameLoading = ref(false)
const nameSuccess = ref(false)
const nameError = ref<string | null>(null)

const passwordInput = ref('')
const passwordConfirm = ref('')
const passwordLoading = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref<string | null>(null)

onMounted(() => {
  nameInput.value = user.value?.user_metadata?.name || ''
})

async function handleUpdateName() {
  if (!nameInput.value.trim()) return
  nameLoading.value = true
  nameSuccess.value = false
  nameError.value = null
  try {
    await updateName(nameInput.value.trim())
    nameSuccess.value = true
  } catch (e: any) {
    nameError.value = e?.message || 'Gagal menyimpan nama'
  } finally {
    nameLoading.value = false
  }
}

async function handleUpdatePassword() {
  passwordError.value = null
  passwordSuccess.value = false
  if (passwordInput.value.length < 8) {
    passwordError.value = 'Password minimal 8 karakter'
    return
  }
  if (passwordInput.value !== passwordConfirm.value) {
    passwordError.value = 'Konfirmasi password tidak cocok'
    return
  }
  passwordLoading.value = true
  try {
    await updatePassword(passwordInput.value)
    passwordSuccess.value = true
    passwordInput.value = ''
    passwordConfirm.value = ''
  } catch (e: any) {
    passwordError.value = e?.message || 'Gagal mengganti password'
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-xl font-semibold mb-6">Profil</h1>

    <div class="space-y-6">
      <!-- Info akun -->
      <div class="bg-surface rounded-2xl border border-white/10 p-6">
        <h2 class="text-sm font-medium text-muted mb-4">Informasi Akun</h2>
        <div class="text-sm text-muted">Email</div>
        <div class="mt-1 text-foreground">{{ user?.email }}</div>
      </div>

      <!-- Edit nama -->
      <div class="bg-surface rounded-2xl border border-white/10 p-6">
        <h2 class="text-sm font-medium text-muted mb-4">Nama Tampilan</h2>
        <form @submit.prevent="handleUpdateName" class="space-y-3">
          <input
            v-model="nameInput"
            type="text"
            placeholder="Nama kamu"
            class="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-white/30"
          />
          <div v-if="nameError" class="text-sm text-red-400">{{ nameError }}</div>
          <div v-if="nameSuccess" class="text-sm text-green-400">Nama berhasil diperbarui</div>
          <button
            type="submit"
            :disabled="nameLoading"
            class="bg-primary text-background text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {{ nameLoading ? 'Menyimpan...' : 'Simpan Nama' }}
          </button>
        </form>
      </div>

      <!-- Ganti password -->
      <div class="bg-surface rounded-2xl border border-white/10 p-6">
        <h2 class="text-sm font-medium text-muted mb-4">Ganti Password</h2>
        <form @submit.prevent="handleUpdatePassword" class="space-y-3">
          <input
            v-model="passwordInput"
            type="password"
            placeholder="Password baru (min. 8 karakter)"
            class="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-white/30"
          />
          <input
            v-model="passwordConfirm"
            type="password"
            placeholder="Konfirmasi password baru"
            class="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-white/30"
          />
          <div v-if="passwordError" class="text-sm text-red-400">{{ passwordError }}</div>
          <div v-if="passwordSuccess" class="text-sm text-green-400">Password berhasil diperbarui</div>
          <button
            type="submit"
            :disabled="passwordLoading"
            class="bg-primary text-background text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {{ passwordLoading ? 'Menyimpan...' : 'Ganti Password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
