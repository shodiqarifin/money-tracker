<script setup>
definePageMeta({ layout: false })

const { signIn, user } = useAuthClient()

if (import.meta.client) {
  watch(user, (u) => {
    if (u) window.location.href = "/dashboard"
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

  window.location.href = "/dashboard"
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h1 class="text-xl font-bold mb-6">Login</h1>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="email@kamu.com"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="Password kamu"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            @keyup.enter="handleLogin"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <button
          @click="handleLogin"
          :disabled="loading"
          class="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {{ loading ? "Memproses..." : "Login" }}
        </button>
      </div>

      <p class="text-center text-sm text-gray-500 mt-6">
        Belum punya akun?
        <NuxtLink to="/signup" class="text-black font-medium hover:underline">Daftar</NuxtLink>
      </p>
    </div>
  </div>
</template>
