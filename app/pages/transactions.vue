<script setup lang="ts">
definePageMeta({ middleware: "auth" })

const {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
} = useTransactions()

const { fetchCategories } = useCategories()
const categories = ref<any[]>([])
onMounted(async () => {
  await fetchTransactions()
  categories.value = await fetchCategories()
})

const showModal = ref(false)
const editingTransaction = ref(null)
const deleteConfirmId = ref(null)

// Form state
const form = reactive({
    amount: "",
    categoryId: "",
    description: "",
    date: new Date().toISOString().split("T")[0], // default: today
})

function openAddModal() {
    editingTransaction.value = null
    Object.assign(form, {
        amount: "",
        categoryId: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
    })
    showModal.value = true
}

function openEditModal(transaction) {
    editingTransaction.value = transaction
    Object.assign(form, {
        amount: transaction.amount,
        categoryId: transaction.category?.id || "",
        description: transaction.description || "",
        date: new Date(transaction.date).toISOString().split("T")[0],
    })
    showModal.value = true
}

async function handleSubmit() {
    const data = {
        amount: parseFloat(form.amount),
        categoryId: form.categoryId,
        description: form.description,
        date: form.date,
    }

    try {
        if (editingTransaction.value) {
            await updateTransaction(editingTransaction.value.id, data)
        } else {
            await createTransaction(data)
        }
        showModal.value = false
    } catch (e) {
        alert(e?.data?.message || "Terjadi kesalahan")
    }
}

async function handleDelete(id) {
    if (!confirm("Yakin mau hapus transaksi ini?")) return
    try {
        await deleteTransaction(id)
    } catch (e) {
        alert(e?.data?.message || "Gagal hapus transaksi")
    }
}

// Format currency
function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount)
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
}

</script>

<template>
    <div class="max-w-3xl mx-auto p-4">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold">Transaksi</h1>
            <button @click="openAddModal"
                class="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                + Tambah
            </button>
        </div>

        <div v-if="loading" class="text-center py-8 text-gray-500">Memuat...</div>

        <div v-else-if="error" class="text-red-500 py-4">{{ error }}</div>

        <div v-else-if="transactions.length === 0" class="text-center py-12 text-gray-400">
            Belum ada transaksi. Tambah yang pertama!
        </div>

        <div v-else class="space-y-2">
            <div v-for="tx in transactions" :key="tx.id"
                class="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                <div class="flex items-start gap-3">
                    <div class="w-2 h-2 mt-2 rounded-full flex-shrink-0"
                        :class="tx.category?.type === 'income' ? 'bg-green-500' : 'bg-red-400'" />
                    <div>
                        <div class="font-medium text-sm">
                            {{ tx.category?.name || "Tanpa Kategori" }}
                        </div>
                        <div v-if="tx.description" class="text-xs text-gray-400 mt-0.5">
                            {{ tx.description }}
                        </div>
                        <div class="text-xs text-gray-400 mt-0.5">{{ formatDate(tx.date) }}</div>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <span class="font-semibold text-sm"
                        :class="tx.category?.type === 'income' ? 'text-green-600' : 'text-gray-900'">
                        {{ tx.category?.type === "income" ? "+" : "-" }}{{ formatRupiah(tx.amount) }}
                    </span>
                    <div class="flex gap-1">
                        <button @click="openEditModal(tx)"
                            class="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50">
                            Edit
                        </button>
                        <button @click="handleDelete(tx.id)"
                            class="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            @click.self="showModal = false">
            <div class="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                <h2 class="text-lg font-semibold mb-4">
                    {{ editingTransaction ? "Edit Transaksi" : "Tambah Transaksi" }}
                </h2>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                        <input v-model="form.amount" type="number" min="0" step="any" placeholder="50000"
                            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select v-model="form.categoryId"
                            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400">
                            <option value="" disabled>Pilih kategori</option>
                            <optgroup label="Pemasukan">
                                <option v-for="cat in categories?.filter((c) => c.type === 'income')" :key="cat.id"
                                    :value="cat.id">
                                    {{ cat.name }}
                                </option>
                            </optgroup>
                            <optgroup label="Pengeluaran">
                                <option v-for="cat in categories?.filter((c) => c.type === 'expense')" :key="cat.id"
                                    :value="cat.id">
                                    {{ cat.name }}
                                </option>
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input v-model="form.date" type="date" :max="new Date().toISOString().split('T')[0]"
                            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Keterangan <span class="text-gray-400 font-normal">(opsional)</span>
                        </label>
                        <input v-model="form.description" type="text" placeholder="Makan siang, bensin, dll"
                            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                    </div>
                </div>

                <div class="flex gap-2 mt-6">
                    <button @click="showModal = false"
                        class="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                        Batal
                    </button>
                    <button @click="handleSubmit"
                        class="flex-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
                        {{ editingTransaction ? "Simpan" : "Tambah" }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>