<script setup>
definePageMeta({ middleware: "auth" })

const { summary, pending, fetchSummary } = useDashboard()

onMounted(() => fetchSummary())

const currentMonth = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date())

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount ?? 0)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  })
}

const topCategoriesWithPercent = computed(() => {
  if (!summary.value?.topCategories?.length) return []
  const totalExpense = summary.value.thisMonth.expense || 0
  return summary.value.topCategories.map((cat) => ({
    ...cat,
    percent: totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0,
  }))
})
</script>

<template>
  <ClientOnly>
  <div class="max-w-3xl mx-auto p-4 space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-foreground">Dashboard</h1>
      <span class="text-sm text-muted">{{ currentMonth }}</span>
    </div>

    <div v-if="pending" class="text-center py-12 text-muted">Memuat...</div>

    <template v-else-if="summary">

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Balance all-time -->
        <div class="bg-primary text-white rounded-2xl p-5">
          <p class="text-xs text-white/70 mb-1">Saldo Keseluruhan</p>
          <p class="text-2xl font-bold leading-tight">
            {{ formatRupiah(summary.allTime.balance) }}
          </p>
          <div class="mt-3 flex gap-3 text-xs text-white/70">
            <span>↑ {{ formatRupiah(summary.allTime.income) }}</span>
            <span>↓ {{ formatRupiah(summary.allTime.expense) }}</span>
          </div>
        </div>

        <!-- Income this month -->
        <div class="bg-surface border border-white/10 rounded-2xl p-5">
          <p class="text-xs text-muted mb-1">Pemasukan Bulan Ini</p>
          <p class="text-2xl font-bold text-green-400 leading-tight">
            {{ formatRupiah(summary.thisMonth.income) }}
          </p>
          <p class="mt-3 text-xs text-muted">
            {{ summary.thisMonth.income > 0 ? "Ada pemasukan 🎉" : "Belum ada pemasukan" }}
          </p>
        </div>

        <!-- Expense this month -->
        <div class="bg-surface border border-white/10 rounded-2xl p-5">
          <p class="text-xs text-muted mb-1">Pengeluaran Bulan Ini</p>
          <p class="text-2xl font-bold text-foreground leading-tight">
            {{ formatRupiah(summary.thisMonth.expense) }}
          </p>
          <p
            class="mt-3 text-xs font-medium"
            :class="summary.thisMonth.net >= 0 ? 'text-green-400' : 'text-red-400'"
          >
            {{ summary.thisMonth.net >= 0 ? "+" : "" }}{{ formatRupiah(summary.thisMonth.net) }} net
          </p>
        </div>
      </div>

      <!-- Top Spending Categories -->
      <div class="bg-surface border border-white/10 rounded-2xl p-5">
        <h2 class="text-sm font-semibold text-foreground mb-4">Top Pengeluaran Bulan Ini</h2>

        <div v-if="topCategoriesWithPercent.length === 0" class="text-sm text-muted py-4 text-center">
          Belum ada pengeluaran bulan ini.
        </div>

        <div v-else class="space-y-3">
          <div v-for="cat in topCategoriesWithPercent" :key="cat.name">
            <div class="flex items-center justify-between text-sm mb-1">
              <span class="font-medium text-foreground">{{ cat.name }}</span>
              <div class="flex items-center gap-3">
                <span class="text-muted text-xs">{{ cat.percent }}%</span>
                <span class="font-semibold text-foreground">{{ formatRupiah(cat.total) }}</span>
              </div>
            </div>
            <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all duration-500"
                :style="{ width: cat.percent + '%' }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-surface border border-white/10 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-foreground">Transaksi Terakhir</h2>
          <NuxtLink to="/transactions" class="text-xs text-muted hover:text-foreground transition-colors">
            Lihat semua →
          </NuxtLink>
        </div>

        <div v-if="summary.recentTransactions.length === 0" class="text-sm text-muted py-4 text-center">
          Belum ada transaksi.
        </div>

        <div v-else class="space-y-1">
          <div
            v-for="tx in summary.recentTransactions"
            :key="tx.id"
            class="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-2 h-2 rounded-full flex-shrink-0"
                :class="tx.category?.type === 'income' ? 'bg-green-400' : 'bg-red-400'"
              />
              <div>
                <p class="text-sm font-medium text-foreground">{{ tx.category?.name || "Tanpa Kategori" }}</p>
                <p v-if="tx.description" class="text-xs text-muted">{{ tx.description }}</p>
              </div>
            </div>
            <div class="text-right">
              <p
                class="text-sm font-semibold"
                :class="tx.category?.type === 'income' ? 'text-green-400' : 'text-foreground'"
              >
                {{ tx.category?.type === "income" ? "+" : "-" }}{{ formatRupiah(tx.amount) }}
              </p>
              <p class="text-xs text-muted">{{ formatDate(tx.date) }}</p>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
  <template #fallback>
    <div class="max-w-3xl mx-auto p-4">
      <div class="text-center py-12 text-muted">Memuat...</div>
    </div>
  </template>
  </ClientOnly>
</template>
