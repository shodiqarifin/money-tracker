<script setup lang="ts">
defineProps<{
  title: string
  message: string
  confirmLabel?: string
  confirmClass?: string
  loading?: boolean
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4 pb-6 sm:pb-0" @click.self="$emit('cancel')">
    <div class="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-xl">
      <h3 class="text-base font-semibold text-foreground mb-2">{{ title }}</h3>
      <p class="text-sm text-muted leading-relaxed mb-6">{{ message }}</p>
      <div class="flex gap-2">
        <button
          @click="$emit('cancel')"
          class="flex-1 border border-white/10 text-muted px-4 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors"
        >
          Batal
        </button>
        <button
          @click="$emit('confirm')"
          :disabled="loading"
          :class="confirmClass || 'bg-red-500 hover:bg-red-600 text-white'"
          class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Memproses...' : (confirmLabel || 'Hapus') }}
        </button>
      </div>
    </div>
  </div>
</template>
