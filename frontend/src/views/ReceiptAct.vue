<template>
  <div class="layout">
    <Sidebar />
    <main class="content">
      <div class="page-header">
        <h1>📥 Акты приёмки</h1>
        <button class="btn-primary" @click="showModal = true">+ Новый акт</button>
      </div>

      <div class="table-wrap">
        <table v-if="acts.length">
          <thead>
            <tr>
              <th>№ Акта</th>
              <th>Дата</th>
              <th>Товар (SKU)</th>
              <th>Ячейка</th>
              <th>Партия</th>
              <th>Кол-во</th>
              <th>Принял</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in acts" :key="a.id">
              <td><span class="act-num">АКТ-{{ String(a.id).padStart(5, '0') }}</span></td>
              <td>{{ formatDate(a.created_at) }}</td>
              <td><span class="sku-badge">{{ a.product_sku }}</span> {{ a.product_name }}</td>
              <td>{{ a.cell_code }}</td>
              <td><span class="batch-badge">{{ a.batch || '—' }}</span></td>
              <td><strong>{{ a.quantity }}</strong></td>
              <td>{{ a.created_by }}</td>
              <td><span class="badge badge-green">Проведён</span></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">
          <div class="empty-icon">📥</div>
          <div>Нет актов приёмки</div>
          <div class="empty-sub">Нажмите «+ Новый акт» чтобы оформить приёмку товара</div>
        </div>
      </div>

      <!-- Create Receipt Act Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>📥 Новый акт приёмки</h3>
            <div class="act-preview">АКТ-{{ String(nextId).padStart(5, '0') }}</div>
          </div>

          <div class="field">
            <label>Товар</label>
            <div class="search-field">
              <input v-model="productSearch" placeholder="Введите SKU или название..." @input="searchProducts" />
              <div v-if="productResults.length" class="product-dropdown">
                <div v-for="p in productResults" :key="p.id" class="product-option" @click="selectProduct(p)">
                  <span class="sku-badge">{{ p.sku }}</span> {{ p.name }}
                </div>
              </div>
            </div>
            <div v-if="form.product" class="selected-product">
              ✓ {{ form.product.sku }} — {{ form.product.name }}
            </div>
          </div>

          <div class="field">
            <label>Ячейка</label>
            <select v-model="form.cell_id">
              <option value="" disabled>Выберите ячейку</option>
              <option v-for="c in cells" :key="c.id" :value="c.id">{{ c.code }}</option>
            </select>
          </div>

          <div class="row-fields">
            <div class="field">
              <label>Количество</label>
              <input v-model.number="form.quantity" type="number" min="1" />
            </div>
            <div class="field">
              <label>Номер партии</label>
              <div class="input-with-btn">
                <input v-model="form.batch" placeholder="07..." />
                <button class="btn-gen-sm" @click="autoBatch">Авто</button>
              </div>
            </div>
          </div>

          <div class="field">
            <label>Примечание</label>
            <input v-model="form.note" placeholder="Необязательно" />
          </div>

          <p v-if="modalError" class="error">{{ modalError }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showModal = false">Отмена</button>
            <button class="btn-primary" @click="submit" :disabled="submitting">
              {{ submitting ? 'Проведение...' : 'Провести акт' }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'

const acts = ref<any[]>([])
const showModal = ref(false)
const modalError = ref('')
const submitting = ref(false)
const nextId = ref(1)
const cells = ref<any[]>([])
const productSearch = ref('')
const productResults = ref<any[]>([])

const form = ref<{
  product: any
  product_id: number | null
  cell_id: number | string
  quantity: number
  batch: string
  note: string
}>({
  product: null,
  product_id: null,
  cell_id: '',
  quantity: 1,
  batch: '',
  note: ''
})

const token = () => localStorage.getItem('token')
const auth = () => ({ Authorization: `Bearer ${token()}` })

const loadActs = async () => {
  const r = await fetch('/api/stock/movements?type=receive', { headers: auth() })
  const d = await r.json()
  const all = (d.data || []).filter((m: any) => m.type === 'receive')
  acts.value = all.map((m: any) => ({
    id: m.id,
    created_at: m.created_at || new Date().toISOString(),
    product_sku: m.product?.sku || m.product_id,
    product_name: m.product?.name || '',
    cell_code: m.to_cell || '—',
    batch: m.batch || '',
    quantity: m.quantity,
    created_by: 'admin'
  }))
  nextId.value = acts.value.length + 1
}

const loadCells = async () => {
  const r = await fetch('/api/warehouses', { headers: auth() })
  const d = await r.json()
  if (d.data?.length) {
    const r2 = await fetch(`/api/warehouses/${d.data[0].id}/grid`, { headers: auth() })
    const d2 = await r2.json()
    const all: any[] = []
    for (const z of d2.zones || []) all.push(...(z.cells || []))
    cells.value = all
  }
}

let searchTimer: any = null
const searchProducts = () => {
  clearTimeout(searchTimer)
  if (!productSearch.value) { productResults.value = []; return }
  searchTimer = setTimeout(async () => {
    const r = await fetch(`/api/products/search?q=${encodeURIComponent(productSearch.value)}`, { headers: auth() })
    const d = await r.json()
    productResults.value = d.data || []
  }, 250)
}

const selectProduct = (p: any) => {
  form.value.product = p
  form.value.product_id = p.id
  productSearch.value = ''
  productResults.value = []
}

const autoBatch = async () => {
  const r = await fetch('/api/generate/batch', { method: 'POST', headers: auth() })
  const d = await r.json()
  form.value.batch = d.batch
}

const submit = async () => {
  modalError.value = ''
  if (!form.value.product_id) { modalError.value = 'Выберите товар'; return }
  if (!form.value.cell_id) { modalError.value = 'Выберите ячейку'; return }
  if (form.value.quantity <= 0) { modalError.value = 'Укажите количество'; return }
  submitting.value = true
  const r = await fetch('/api/stock/receive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({
      product_id: form.value.product_id,
      cell_id: form.value.cell_id,
      quantity: form.value.quantity,
      batch: form.value.batch,
      note: form.value.note
    })
  })
  submitting.value = false
  if (!r.ok) { const d = await r.json(); modalError.value = d.error || 'Ошибка'; return }
  showModal.value = false
  form.value = { product: null, product_id: null, cell_id: '', quantity: 1, batch: '', note: '' }
  loadActs()
}

const formatDate = (s: string) => {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => Promise.all([loadActs(), loadCells()]))
</script>

<style scoped>
.layout { display: flex; height: 100vh; }
.content { flex: 1; padding: 32px; background: #f7f8fc; overflow-y: auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
h1 { margin: 0; font-size: 24px; color: #1a202c; }
.btn-primary { background: #4361ee; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #3451d1; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.table-wrap { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
table { width: 100%; border-collapse: collapse; }
th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
td { padding: 13px 16px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #f9fafb; }
.act-num { font-family: monospace; font-weight: 700; color: #1a202c; font-size: 13px; }
.sku-badge { background: #eef2ff; color: #4361ee; padding: 1px 7px; border-radius: 5px; font-size: 12px; font-weight: 700; font-family: monospace; }
.batch-badge { background: #fef3c7; color: #92400e; padding: 1px 7px; border-radius: 5px; font-size: 11px; font-weight: 600; font-family: monospace; }
.badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge-green { background: #d1fae5; color: #065f46; }
.empty { padding: 60px 20px; text-align: center; color: #9ca3af; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-sub { font-size: 13px; margin-top: 6px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: white; border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 16px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; }
.modal-header h3 { margin: 0; font-size: 20px; color: #1a202c; }
.act-preview { font-family: monospace; font-size: 14px; font-weight: 700; color: #4361ee; background: #eef2ff; padding: 4px 12px; border-radius: 8px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.row-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label { font-size: 14px; font-weight: 600; color: #374151; }
input, select { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; }
input:focus, select:focus { border-color: #4361ee; }
.search-field { position: relative; }
.product-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 50; }
.product-option { padding: 10px 14px; cursor: pointer; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
.product-option:hover { background: #f0f4ff; }
.product-option:last-child { border-bottom: none; }
.selected-product { background: #d1fae5; color: #065f46; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.input-with-btn { display: flex; gap: 8px; }
.input-with-btn input { flex: 1; }
.btn-gen-sm { background: #4361ee; color: white; border: none; padding: 0 12px; border-radius: 8px; font-size: 13px; cursor: pointer; white-space: nowrap; }
.error { color: #e53e3e; font-size: 14px; margin: 0; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 4px; }
.btn-cancel { background: #f3f4f6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
</style>
