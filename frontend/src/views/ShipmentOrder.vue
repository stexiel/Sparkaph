<template>
  <div class="layout">
    <Sidebar />
    <main class="content">
      <div class="page-header">
        <h1>📤 Заказы на отгрузку</h1>
        <button class="btn-primary" @click="showModal = true">+ Новый заказ</button>
      </div>

      <div class="table-wrap">
        <table v-if="shipments.length">
          <thead>
            <tr>
              <th>№ Заказа</th>
              <th>Дата</th>
              <th>Клиент</th>
              <th>Товар</th>
              <th>Кол-во</th>
              <th>Ячейка</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in shipments" :key="s.id">
              <td><span class="ship-num">ОТГ-{{ String(s.id).padStart(5, '0') }}</span></td>
              <td>{{ formatDate(s.created_at) }}</td>
              <td>{{ s.customer }}</td>
              <td><span class="sku-badge">{{ s.product_sku }}</span> {{ s.product_name }}</td>
              <td><strong>{{ s.quantity }}</strong></td>
              <td>{{ s.cell_code }}</td>
              <td>
                <span :class="['badge', statusBadge(s.status)]">{{ statusLabel(s.status) }}</span>
              </td>
              <td>
                <button
                  v-if="s.status === 'pending'"
                  class="btn-xs btn-green"
                  @click="completeShipment(s)"
                >Провести</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">
          <div class="empty-icon">📤</div>
          <div>Нет заказов на отгрузку</div>
          <div class="empty-sub">Нажмите «+ Новый заказ» чтобы создать отгрузку</div>
        </div>
      </div>

      <!-- Create Shipment Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>📤 Заказ на отгрузку</h3>
            <div class="ship-preview">ОТГ-{{ String(nextId).padStart(5, '0') }}</div>
          </div>

          <div class="field">
            <label>Клиент / Получатель</label>
            <input v-model="form.customer" placeholder="Название клиента или ФИО" />
          </div>

          <div class="field">
            <label>Товар</label>
            <div class="search-field">
              <input v-model="productSearch" placeholder="Введите SKU или название..." @input="searchProducts" />
              <div v-if="productResults.length" class="product-dropdown">
                <div v-for="p in productResults" :key="p.id" class="product-option" @click="selectProduct(p)">
                  <span class="sku-badge">{{ p.sku }}</span> {{ p.name }}
                  <span class="stock-hint">на складе: {{ getStock(p.id) }}</span>
                </div>
              </div>
            </div>
            <div v-if="form.product" class="selected-product">
              ✓ {{ form.product.sku }} — {{ form.product.name }}
            </div>
          </div>

          <div class="row-fields">
            <div class="field">
              <label>Ячейка (откуда)</label>
              <select v-model="form.cell_id">
                <option value="" disabled>Выберите ячейку</option>
                <option v-for="c in cells" :key="c.id" :value="c.id">{{ c.code }}</option>
              </select>
            </div>
            <div class="field">
              <label>Количество</label>
              <input v-model.number="form.quantity" type="number" min="1" />
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
              {{ submitting ? 'Создание...' : 'Создать заказ' }}
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

const shipments = ref<any[]>([])
const showModal = ref(false)
const modalError = ref('')
const submitting = ref(false)
const nextId = ref(1)
const cells = ref<any[]>([])
const productSearch = ref('')
const productResults = ref<any[]>([])
const stockMap = ref<Record<number, number>>({})

const form = ref<{
  customer: string
  product: any
  product_id: number | null
  cell_id: number | string
  quantity: number
  note: string
}>({
  customer: '',
  product: null,
  product_id: null,
  cell_id: '',
  quantity: 1,
  note: ''
})

const token = () => localStorage.getItem('token')
const auth = () => ({ Authorization: `Bearer ${token()}` })

const loadShipments = async () => {
  const stored = localStorage.getItem('shipments')
  shipments.value = stored ? JSON.parse(stored) : []
  nextId.value = shipments.value.length + 1
}

const saveShipments = () => {
  localStorage.setItem('shipments', JSON.stringify(shipments.value))
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

const loadStock = async () => {
  const r = await fetch('/api/stock/summary', { headers: auth() })
  const d = await r.json()
  const map: Record<number, number> = {}
  for (const item of (d.data || [])) map[item.product_id] = item.total_quantity
  stockMap.value = map
}

const getStock = (productId: number) => stockMap.value[productId] ?? 0

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

const submit = async () => {
  modalError.value = ''
  if (!form.value.customer) { modalError.value = 'Укажите клиента'; return }
  if (!form.value.product_id) { modalError.value = 'Выберите товар'; return }
  if (!form.value.cell_id) { modalError.value = 'Выберите ячейку'; return }
  if (form.value.quantity <= 0) { modalError.value = 'Укажите количество'; return }
  const cellCode = cells.value.find((c: any) => c.id === form.value.cell_id)?.code || '—'
  submitting.value = true
  const newShipment = {
    id: nextId.value,
    created_at: new Date().toISOString(),
    customer: form.value.customer,
    product_sku: form.value.product?.sku,
    product_name: form.value.product?.name,
    product_id: form.value.product_id,
    cell_id: form.value.cell_id,
    cell_code: cellCode,
    quantity: form.value.quantity,
    note: form.value.note,
    status: 'pending'
  }
  submitting.value = false
  shipments.value.unshift(newShipment)
  saveShipments()
  nextId.value++
  showModal.value = false
  form.value = { customer: '', product: null, product_id: null, cell_id: '', quantity: 1, note: '' }
}

const completeShipment = async (s: any) => {
  const r = await fetch('/api/stock/writeoff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({ product_id: s.product_id, cell_id: s.cell_id, quantity: s.quantity, reason: `Отгрузка ОТГ-${String(s.id).padStart(5,'0')}` })
  })
  if (r.ok) {
    s.status = 'completed'
    saveShipments()
  }
}

const statusLabel = (s: string) => ({ pending: 'Ожидает', completed: 'Отгружен', cancelled: 'Отменён' }[s] || s)
const statusBadge = (s: string) => ({ pending: 'badge-yellow', completed: 'badge-green', cancelled: 'badge-red' }[s] || '')

const formatDate = (s: string) => {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => Promise.all([loadShipments(), loadCells(), loadStock()]))
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
.ship-num { font-family: monospace; font-weight: 700; color: #1a202c; font-size: 13px; }
.sku-badge { background: #eef2ff; color: #4361ee; padding: 1px 7px; border-radius: 5px; font-size: 12px; font-weight: 700; font-family: monospace; }
.badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-red { background: #fee2e2; color: #991b1b; }
.btn-xs { padding: 4px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
.btn-green { background: #d1fae5; color: #065f46; }
.btn-green:hover { background: #a7f3d0; }
.empty { padding: 60px 20px; text-align: center; color: #9ca3af; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-sub { font-size: 13px; margin-top: 6px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: white; border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 16px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; }
.modal-header h3 { margin: 0; font-size: 20px; color: #1a202c; }
.ship-preview { font-family: monospace; font-size: 14px; font-weight: 700; color: #059669; background: #d1fae5; padding: 4px 12px; border-radius: 8px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.row-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label { font-size: 14px; font-weight: 600; color: #374151; }
input, select { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; }
input:focus, select:focus { border-color: #4361ee; }
.search-field { position: relative; }
.product-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 50; }
.product-option { padding: 10px 14px; cursor: pointer; font-size: 13px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 8px; }
.product-option:hover { background: #f0f4ff; }
.product-option:last-child { border-bottom: none; }
.stock-hint { margin-left: auto; font-size: 11px; color: #6b7280; }
.selected-product { background: #d1fae5; color: #065f46; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.error { color: #e53e3e; font-size: 14px; margin: 0; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 4px; }
.btn-cancel { background: #f3f4f6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
</style>
