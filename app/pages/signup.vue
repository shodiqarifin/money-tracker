<script setup>
definePageMeta({ layout: false })

const { signUp, user } = useAuthClient()

if (import.meta.client) {
  watch(user, (u) => {
    if (u) window.location.href = "/dashboard"
  }, { immediate: true })
}

const form = reactive({
  name: "",
  email: "",
  password: "",
})
const error = ref("")
const loading = ref(false)

async function handleSignup() {
  error.value = ""

  if (!form.name || !form.email || !form.password) {
    error.value = "Semua field wajib diisi"
    return
  }
  if (form.password.length < 8) {
    error.value = "Password minimal 8 karakter"
    return
  }

  loading.value = true
  const { error: authError } = await signUp(form.email, form.password, form.name)

  if (authError) {
    error.value = authError.message?.includes("already")
      ? "Email sudah terdaftar, coba login"
      : "Signup gagal, coba lagi"
    loading.value = false
    return
  }

  window.location.href = "/dashboard"
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h1 class="text-xl font-bold mb-6">Buat Akun</h1>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Nama kamu"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

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
            placeholder="Minimal 8 karakter"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <button
          @click="handleSignup"
          :disabled="loading"
          class="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {{ loading ? "Memproses..." : "Daftar" }}
        </button>
      </div>

      <p class="text-center text-sm text-gray-500 mt-6">
        Sudah punya akun?
        <NuxtLink to="/login" class="text-black font-medium hover:underline">Login</NuxtLink>
      </p>
    </div>
  </div>
</template>
