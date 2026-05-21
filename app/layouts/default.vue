<script setup>
import { onClickOutside } from '@vueuse/core'

const { displayName, signOut, isLoggedIn } = useAuthClient()
const { wallets, activeWalletId, activeWallet, fetchWallets, switchWallet } = useWallets()
const route = useRoute()

const showWalletDropdown = ref(false)
const walletDropdownRef = ref(null)

onClickOutside(walletDropdownRef, () => { showWalletDropdown.value = false })

async function handleLogout() {
  await signOut()
  activeWalletId.value = null
  navigateTo("/login")
}

watch(isLoggedIn, async (loggedIn) => {
  if (loggedIn && wallets.value.length === 0) {
    await fetchWallets()
  }
}, { immediate: true })

async function handleSwitchWallet(id) {
  switchWallet(id)
  showWalletDropdown.value = false
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <nav class="bg-surface border-b border-white/10">
      <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <!-- Wallet switcher -->
          <ClientOnly>
            <div v-if="wallets.length > 0" class="relative" ref="walletDropdownRef">
              <button
                @click="showWalletDropdown = !showWalletDropdown"
                class="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-foreground/80 transition-colors"
              >
                {{ activeWallet?.name || 'Money Tracker' }}
                <svg class="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                v-if="showWalletDropdown"
                class="absolute top-full left-0 mt-1 bg-surface border border-white/10 rounded-xl py-1 z-50 min-w-44 shadow-lg"
              >
                <button
                  v-for="w in wallets"
                  :key="w.id"
                  @click="handleSwitchWallet(w.id)"
                  class="w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors flex items-center justify-between gap-3"
                  :class="w.id === activeWalletId ? 'text-foreground' : 'text-muted'"
                >
                  <span>{{ w.name }}</span>
                  <span v-if="w.id === activeWalletId" class="text-primary text-xs">✓</span>
                </button>
                <div class="border-t border-white/10 mt-1 pt-1">
                  <NuxtLink
                    to="/wallets"
                    @click="showWalletDropdown = false"
                    class="block px-4 py-2 text-xs text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                  >
                    Kelola Wallet →
                  </NuxtLink>
                </div>
              </div>
            </div>
            <span v-else class="font-bold text-sm text-foreground">Money Tracker</span>
          </ClientOnly>

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
            <NuxtLink
              to="/wallets"
              class="text-sm transition-colors"
              :class="route.path === '/wallets' ? 'text-foreground font-medium' : 'text-muted hover:text-foreground'"
            >
              Wallet
            </NuxtLink>
          </div>
        </div>

        <ClientOnly>
          <div class="flex items-center gap-3">
            <NuxtLink
              to="/profile"
              class="text-sm transition-colors"
              :class="route.path === '/profile' ? 'text-foreground font-medium' : 'text-muted hover:text-foreground'"
            >
              {{ displayName }}
            </NuxtLink>
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
