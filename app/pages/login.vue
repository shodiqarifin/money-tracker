<script setup>
definePageMeta({ layout: false })

const { signIn, user } = useAuthClient()

if (import.meta.client) {
  watch(user, (u) => {
    if (u) navigateTo("/dashboard")
  }, { immediate: true })
}

const form = reactive({
  email: "",
  password: "",
})
const error = ref("")
const loading = ref(false)

async function handleLogin() {
  error.value = ""

  if (!form.email || !form.password) {
    error.value = "Email dan password wajib diisi"
    return
  }

  loading.value = true
  const { error: authError } = await signIn(form.email, form.password)

  if (authError) {
    error.value = "Email atau password salah"
    loading.value = false
    return
  }

  navigateTo("/dashboard")
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="w-full max-w-sm bg-surface rounded-2xl p-8 border border-white/10">
      <h1 class="text-xl font-bold text-foreground mb-6">Login</h1>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-muted mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="email@kamu.com"
            class="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-muted mb-1">Password</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="Password kamu"
            class="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
            @keyup.enter="handleLogin"
          />
        </div>

        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

        <button
          @click="handleLogin"
          :disabled="loading"
          class="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {{ loading ? "Memproses..." : "Login" }}
        </button>
      </div>

      <p class="text-center text-sm text-muted mt-6">
        Belum punya akun?
        <NuxtLink to="/signup" class="text-primary font-medium hover:underline">Daftar</NuxtLink>
      </p>
    </div>
  </div>
</template>
