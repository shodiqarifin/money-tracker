<script setup>
definePageMeta({ middleware: "auth" })

const { data: summary, pending, refresh } = useFetch("/api/dashboard/summary", {
  server: false,
})

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

// Hitung persentase tiap kategori terhadap total pengeluaran bulan ini
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
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <span class="text-sm text-gray-400">{{ currentMonth }}</span>
    </div>

    <div v-if="pending" class="text-center py-12 text-gray-400">Memuat...</div>

    <template v-else-if="summary">

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Balance all-time -->
        <div class="bg-black text-white rounded-2xl p-5">
          <p class="text-xs text-gray-400 mb-1">Saldo Keseluruhan</p>
          <p class="text-2xl font-bold leading-tight">
            {{ formatRupiah(summary.allTime.balance) }}
          </p>
          <div class="mt-3 flex gap-3 text-xs text-gray-400">
            <span>↑ {{ formatRupiah(summary.allTime.income) }}</span>
            <span>↓ {{ formatRupiah(summary.allTime.expense) }}</span>
          </div>
        </div>

        <!-- Income this month -->
        <div class="bg-white border border-gray-100 rounded-2xl p-5">
          <p class="text-xs text-gray-400 mb-1">Pemasukan Bulan Ini</p>
          <p class="text-2xl font-bold text-green-600 leading-tight">
            {{ formatRupiah(summary.thisMonth.income) }}
          </p>
          <p class="mt-3 text-xs text-gray-400">
            {{ summary.thisMonth.income > 0 ? "Ada pemasukan 🎉" : "Belum ada pemasukan" }}
          </p>
        </div>

        <!-- Expense this month -->
        <div class="bg-white border border-gray-100 rounded-2xl p-5">
          <p class="text-xs text-gray-400 mb-1">Pengeluaran Bulan Ini</p>
          <p class="text-2xl font-bold text-gray-900 leading-tight">
            {{ formatRupiah(summary.thisMonth.expense) }}
          </p>
          <p
            class="mt-3 text-xs font-medium"
            :class="summary.thisMonth.net >= 0 ? 'text-green-500' : 'text-red-400'"
          >
            {{ summary.thisMonth.net >= 0 ? "+" : "" }}{{ formatRupiah(summary.thisMonth.net) }} net
          </p>
        </div>
      </div>

      <!-- Top Spending Categories -->
      <div class="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 class="text-sm font-semibold mb-4">Top Pengeluaran Bulan Ini</h2>

        <div v-if="topCategoriesWithPercent.length === 0" class="text-sm text-gray-400 py-4 text-center">
          Belum ada pengeluaran bulan ini.
        </div>

        <div v-else class="space-y-3">
          <div v-for="cat in topCategoriesWithPercent" :key="cat.name">
            <div class="flex items-center justify-between text-sm mb-1">
              <span class="font-medium text-gray-700">{{ cat.name }}</span>
              <div class="flex items-center gap-3">
                <span class="text-gray-500 text-xs">{{ cat.percent }}%</span>
                <span class="font-semibold">{{ formatRupiah(cat.total) }}</span>
              </div>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gray-800 rounded-full transition-all duration-500"
                :style="{ width: cat.percent + '%' }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white border border-gray-100 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold">Transaksi Terakhir</h2>
          <NuxtLink to="/transactions" class="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            Lihat semua →
          </NuxtLink>
        </div>

        <div v-if="summary.recentTransactions.length === 0" class="text-sm text-gray-400 py-4 text-center">
          Belum ada transaksi.
        </div>

        <div v-else class="space-y-1">
          <div
            v-for="tx in summary.recentTransactions"
            :key="tx.id"
            class="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-2 h-2 rounded-full flex-shrink-0"
                :class="tx.category?.type === 'income' ? 'bg-green-500' : 'bg-red-400'"
              />
              <div>
                <p class="text-sm font-medium">{{ tx.category?.name || "Tanpa Kategori" }}</p>
                <p v-if="tx.description" class="text-xs text-gray-400">{{ tx.description }}</p>
              </div>
            </div>
            <div class="text-right">
              <p
                class="text-sm font-semibold"
                :class="tx.category?.type === 'income' ? 'text-green-600' : 'text-gray-900'"
              >
                {{ tx.category?.type === "income" ? "+" : "-" }}{{ formatRupiah(tx.amount) }}
              </p>
              <p class="text-xs text-gray-400">{{ formatDate(tx.date) }}</p>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
  <template #fallback>
    <div class="max-w-3xl mx-auto p-4">
      <div class="text-center py-12 text-gray-400">Memuat...</div>
    </div>
  </template>
  </ClientOnly>
</template>
