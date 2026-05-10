import type { Transaction, CreateTransactionInput } from "~/types/transaction"

export function useTransactions() {
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTransactions() {
    loading.value = true
    error.value = null
    try {
      transactions.value = await $fetch("/api/transactions")
    } catch (e: any) {
      error.value = e?.data?.message || "Gagal memuat transaksi"
    } finally {
      loading.value = false
    }
  }

  async function createTransaction(data: CreateTransactionInput) {
    await $fetch("/api/transactions", {
      method: "POST",
      body: data,
    })
    await fetchTransactions()
  }

  async function updateTransaction(id: string, data: Partial<CreateTransactionInput>) {
    await $fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      body: data,
    })
    await fetchTransactions()
  }

  async function deleteTransaction(id: string) {
    await $fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    })
    await fetchTransactions()
  }

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  }
}