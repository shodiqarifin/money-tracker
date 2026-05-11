<script setup>
const { user, signOut } = useAuthClient()
const route = useRoute()

async function handleLogout() {
  await signOut()
  window.location.href = "/login"
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-100">
      <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <span class="font-bold text-sm">Money Tracker</span>
          <div class="flex gap-4">
            <NuxtLink
              to="/dashboard"
              class="text-sm transition-colors"
              :class="route.path === '/dashboard' ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-700'"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              to="/transactions"
              class="text-sm transition-colors"
              :class="route.path === '/transactions' ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-700'"
            >
              Transaksi
            </NuxtLink>
            <NuxtLink
              to="/categories"
              class="text-sm transition-colors"
              :class="route.path === '/categories' ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-700'"
            >
              Kategori
            </NuxtLink>
          </div>
        </div>

        <ClientOnly>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">{{ user?.name || user?.email }}</span>
            <button
              @click="handleLogout"
              class="text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </ClientOnly>
      </div>
    </nav>

    <main>
      <slot />
    </main>
  </div>
</template>
