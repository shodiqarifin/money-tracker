<script setup lang="ts">
definePageMeta({ middleware: "auth" })

const { fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories()

const categories = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showModal = ref(false)
const editingCategory = ref<any>(null)

const form = reactive({
  name: "",
  type: "expense",
})

async function loadCategories() {
  loading.value = true
  error.value = null
  try {
    categories.value = await fetchCategories()
  } catch (e: any) {
    error.value = e?.message || "Gagal memuat kategori"
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingCategory.value = null
  Object.assign(form, { name: "", type: "expense" })
  showModal.value = true
}

function openEditModal(category: any) {
  editingCategory.value = category
  Object.assign(form, { name: category.name, type: category.type })
  showModal.value = true
}

async function handleSubmit() {
  if (!form.name.trim()) {
    alert("Nama kategori wajib diisi")
    return
  }

  try {
    if (editingCategory.value) {
      await updateCategory(editingCategory.value.id, form.name)
    } else {
      await createCategory(form.name, form.type as 'income' | 'expense')
    }
    showModal.value = false
    await loadCategories()
  } catch (e: any) {
    alert(e?.message || "Terjadi kesalahan")
  }
}

async function handleDelete(category: any) {
  if (!confirm(`Hapus kategori "${category.name}"? Transaksi yang ada akan dipindah ke Uncategorized.`)) return
  try {
    await deleteCategory(category.id, category.type)
    await loadCategories()
  } catch (e: any) {
    alert(e?.message || "Gagal hapus kategori")
  }
}

const incomeCategories = computed(() => categories.value.filter((c) => c.type === "income"))
const expenseCategories = computed(() => categories.value.filter((c) => c.type === "expense"))

onMounted(() => loadCategories())
</script>

<template>
  <div class="max-w-3xl mx-auto p-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Kategori</h1>
      <button
        @click="openAddModal"
        class="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        + Tambah
      </button>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">Memuat...</div>
    <div v-else-if="error" class="text-red-500 py-4">{{ error }}</div>

    <div v-else class="space-y-6">
      <!-- Pemasukan -->
      <div>
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pemasukan</h2>
        <div v-if="incomeCategories.length === 0" class="text-sm text-gray-400 py-2">Belum ada kategori pemasukan.</div>
        <div class="space-y-1">
          <div
            v-for="cat in incomeCategories"
            :key="cat.id"
            class="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-green-500" />
              <span class="text-sm font-medium">{{ cat.name }}</span>
              <span v-if="cat.isPreset" class="text-xs text-gray-400">preset</span>
            </div>
            <div class="flex gap-1">
              <button
                @click="openEditModal(cat)"
                class="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                @click="handleDelete(cat)"
                class="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pengeluaran -->
      <div>
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pengeluaran</h2>
        <div v-if="expenseCategories.length === 0" class="text-sm text-gray-400 py-2">Belum ada kategori pengeluaran.</div>
        <div class="space-y-1">
          <div
            v-for="cat in expenseCategories"
            :key="cat.id"
            class="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-red-400" />
              <span class="text-sm font-medium">{{ cat.name }}</span>
              <span v-if="cat.isPreset" class="text-xs text-gray-400">preset</span>
            </div>
            <div class="flex gap-1">
              <button
                @click="openEditModal(cat)"
                class="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                @click="handleDelete(cat)"
                class="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showModal = false"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-semibold mb-4">
          {{ editingCategory ? "Edit Kategori" : "Tambah Kategori" }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Nama kategori"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          <div v-if="!editingCategory">
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <select
              v-model="form.type"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            >
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            @click="showModal = false"
            class="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            @click="handleSubmit"
            class="flex-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            {{ editingCategory ? "Simpan" : "Tambah" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
