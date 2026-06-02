<script setup lang="ts">
const authReady = ref(false)

if (import.meta.client) {
  const client = useSupabaseClient()
  client.auth.getSession().then(() => {
    authReady.value = true
  })
} else {
  authReady.value = true
}
</script>

<template>
  <div>
    <Transition name="splash-fade" appear>
      <div
        v-if="!authReady"
        class="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background gap-6"
      >
        <div class="flex flex-col items-center gap-4">
          <div class="relative w-12 h-12">
            <div class="absolute inset-0 rounded-full border-2 border-white/10" />
            <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
          <p class="text-sm text-muted tracking-wide">Money Tracker</p>
        </div>
      </div>
    </Transition>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
.splash-fade-leave-active {
  transition: opacity 0.25s ease;
}
.splash-fade-leave-to {
  opacity: 0;
}
</style>