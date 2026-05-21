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
      <h1 class="text-2xl font-bold text-foreground">Kategori</h1>
      <button
        @click="openAddModal"
        class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
      >
        + Tambah
      </button>
    </div>

    <div v-if="loading" class="text-center py-8 text-muted">Memuat...</div>
    <div v-else-if="error" class="text-red-400 py-4">{{ error }}</div>

    <div v-else class="space-y-6">
      <!-- Pemasukan -->
      <div>
        <h2 class="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Pemasukan</h2>
        <div v-if="incomeCategories.length === 0" class="text-sm text-muted py-2">Belum ada kategori pemasukan.</div>
        <div class="space-y-1">
          <div
            v-for="cat in incomeCategories"
            :key="cat.id"
            class="flex items-center justify-between px-4 py-3 bg-surface border border-white/10 rounded-xl hover:border-white/20 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-green-400" />
              <span class="text-sm font-medium text-foreground">{{ cat.name }}</span>
              <span v-if="cat.isPreset" class="text-xs text-muted">preset</span>
            </div>
            <div class="flex gap-1">
              <button
                @click="openEditModal(cat)"
                class="text-xs text-muted hover:text-foreground px-2 py-1 rounded hover:bg-white/5"
              >
                Edit
              </button>
              <button
                @click="handleDelete(cat)"
                class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pengeluaran -->
      <div>
        <h2 class="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Pengeluaran</h2>
        <div v-if="expenseCategories.length === 0" class="text-sm text-muted py-2">Belum ada kategori pengeluaran.</div>
        <div class="space-y-1">
          <div
            v-for="cat in expenseCategories"
            :key="cat.id"
            class="flex items-center justify-between px-4 py-3 bg-surface border border-white/10 rounded-xl hover:border-white/20 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-red-400" />
              <span class="text-sm font-medium text-foreground">{{ cat.name }}</span>
              <span v-if="cat.isPreset" class="text-xs text-muted">preset</span>
            </div>
            <div class="flex gap-1">
              <button
                @click="openEditModal(cat)"
                class="text-xs text-muted hover:text-foreground px-2 py-1 rounded hover:bg-white/5"
              >
                Edit
              </button>
              <button
                @click="handleDelete(cat)"
                class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10"
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
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="showModal = false"
    >
      <div class="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-semibold text-foreground mb-4">
          {{ editingCategory ? "Edit Kategori" : "Tambah Kategori" }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-muted mb-1">Nama</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Nama kategori"
              class="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
            />
          </div>

          <div v-if="!editingCategory">
            <label class="block text-sm font-medium text-muted mb-1">Tipe</label>
            <select
              v-model="form.type"
              class="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            @click="showModal = false"
            class="flex-1 border border-white/10 text-muted px-4 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            Batal
          </button>
          <button
            @click="handleSubmit"
            class="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover"
          >
            {{ editingCategory ? "Simpan" : "Tambah" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
