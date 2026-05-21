<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const { displayName, signOut, isLoggedIn } = useAuthClient()
const { wallets, activeWalletId, activeWallet, fetchWallets, switchWallet } = useWallets()
const route = useRoute()

const showWalletDropdown = ref(false)
const walletDropdownRef = ref<HTMLElement | null>(null)

onClickOutside(walletDropdownRef, () => { showWalletDropdown.value = false })

async function handleLogout() {
  await signOut()
  activeWalletId.value = null
  navigateTo('/login')
}

watch(isLoggedIn, async (loggedIn) => {
  if (loggedIn && wallets.value.length === 0) {
    await fetchWallets()
  }
}, { immediate: true })

function handleSwitchWallet(id: string) {
  switchWallet(id)
  showWalletDropdown.value = false
}

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transaksi' },
  { to: '/categories', label: 'Kategori' },
  { to: '/wallets', label: 'Wallet' },
]
</script>

<template>
  <div class="min-h-screen bg-background text-foreground pb-16 md:pb-0">

    <!-- Top navbar -->
    <nav class="bg-surface border-b border-white/10">
      <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">

        <!-- Left: wallet switcher + desktop nav links -->
        <div class="flex items-center gap-6 min-w-0">
          <ClientOnly>
            <div v-if="wallets.length > 0" class="relative shrink-0" ref="walletDropdownRef">
              <button
                @click="showWalletDropdown = !showWalletDropdown"
                class="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-foreground/80 transition-colors max-w-35 md:max-w-55"
              >
                <span class="truncate">{{ activeWallet?.name || 'Money Tracker' }}</span>
                <svg class="w-3 h-3 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <span class="truncate">{{ w.name }}</span>
                  <span v-if="w.id === activeWalletId" class="text-primary text-xs shrink-0">✓</span>
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
            <span v-else class="font-bold text-sm text-foreground shrink-0">Money Tracker</span>
          </ClientOnly>

          <!-- Desktop nav links (hidden on mobile) -->
          <div class="hidden md:flex gap-4">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="text-sm transition-colors"
              :class="route.path === link.to ? 'text-foreground font-medium' : 'text-muted hover:text-foreground'"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>

        <!-- Right: user + logout -->
        <ClientOnly>
          <div class="flex items-center gap-3 shrink-0">
            <NuxtLink
              to="/profile"
              class="text-sm transition-colors truncate max-w-20 md:max-w-none"
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

    <!-- Page content -->
    <main>
      <slot />
    </main>

    <!-- Bottom nav (mobile only) -->
    <ClientOnly>
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 z-40">
        <div class="flex">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs transition-colors"
            :class="route.path === link.to ? 'text-primary' : 'text-muted'"
          >
            <!-- Dashboard -->
            <svg v-if="link.to === '/dashboard'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <!-- Transaksi -->
            <svg v-else-if="link.to === '/transactions'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <!-- Kategori -->
            <svg v-else-if="link.to === '/categories'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <!-- Wallet -->
            <svg v-else-if="link.to === '/wallets'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>{{ link.label }}</span>
          </NuxtLink>
        </div>
      </nav>
    </ClientOnly>

  </div>
</template>
