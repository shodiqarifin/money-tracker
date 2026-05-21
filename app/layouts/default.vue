<script setup>
const { displayName, signOut } = useAuthClient()
const route = useRoute()

async function handleLogout() {
  await signOut()
  navigateTo("/login")
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <nav class="bg-surface border-b border-white/10">
      <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <span class="font-bold text-sm text-foreground">Money Tracker</span>
          <div class="flex gap-4">
            <NuxtLink
              to="/dashboard"
              class="text-sm transition-colors"
              :class="route.path === '/dashboard' ? 'text-foreground font-medium' : 'text-muted hover:text-foreground'"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              to="/transactions"
              class="text-sm transition-colors"
              :class="route.path === '/transactions' ? 'text-foreground font-medium' : 'text-muted hover:text-foreground'"
            >
              Transaksi
            </NuxtLink>
            <NuxtLink
              to="/categories"
              class="text-sm transition-colors"
              :class="route.path === '/categories' ? 'text-foreground font-medium' : 'text-muted hover:text-foreground'"
            >
              Kategori
            </NuxtLink>
          </div>
        </div>

        <ClientOnly>
          <div class="flex items-center gap-3">
            <span class="text-sm text-muted">{{ displayName }}</span>
            <button
              @click="handleLogout"
              class="text-sm text-red-400 hover:text-red-300 transition-colors"
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
