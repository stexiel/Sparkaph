<template>
  <div class="layout">
    <Sidebar />

    <main class="content">
      <div class="page-header">
        <h1>📊 Складские запасы</h1>
        <div class="header-actions">
          <button class="btn-secondary" @click="activeModal = 'receive'">+ Приёмка</button>
          <button class="btn-secondary" @click="activeModal = 'move'">→ Перемещение</button>
          <button class="btn-danger" @click="activeModal = 'writeoff'">− Списание</button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button :class="['tab', tab === 'summary' && 'active']" @click="tab = 'summary'; loadSummary()">Остатки</button>
        <button :class="['tab', tab === 'movements' && 'active']" @click="tab = 'movements'; loadMovements()">История</button>
      </div>

      <!-- Summary Table -->
      <div v-if="tab === 'summary'" class="table-wrap">
        <div class="table-stats" v-if="summary.length">
          <div class="stat-card">
            <div class="stat-val">{{ summary.length }}</div>
            <div class="stat-label">Позиций</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">{{ totalQty }}</div>
            <div class="stat-label">Всего единиц</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">{{ formatMoney(totalValue) }}</div>
            <div class="stat-label">Общая стоимость</div>
          </div>
          <div class="stat-card warn" v-if="lowStock.length">
            <div class="stat-val">{{ lowStock.length }}</div>
            <div class="stat-label">⚠ Мало на складе</div>
          </div>
        </div>
        <table v-if="summary.length">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Наименование</th>
              <th>Кол-во</th>
              <th>Цена</th>
              <th>Стоимость</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in summary" :key="item.product_id">
              <td><span class="sku-badge">{{ item.sku }}</span></td>
              <td>{{ item.name }}</td>
              <td :class="item.total_quantity === 0 ? 'qty-zero' : item.total_quantity < 10 ? 'qty-low' : 'qty-ok'">
                <strong>{{ item.total_quantity }}</strong>
              </td>
              <td>{{ formatMoney(item.price) }}</td>
              <td>{{ formatMoney(item.total_value) }}</td>
              <td>
                <span :class="['badge', item.total_quantity === 0 ? 'badge-red' : item.total_quantity < 10 ? 'badge-yellow' : 'badge-green']">
                  {{ item.total_quantity === 0 ? 'Нет' : item.total_quantity < 10 ? 'Мало' : 'В наличии' }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-xs btn-blue" @click="prefillReceive(item)">Принять</button>
                <button class="btn-xs btn-gray" @click="prefillWriteoff(item)">Списать</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">Нет товаров. Сначала добавьте товары в раздел «Инвентарь».</div>
      </div>

      <!-- Movements Table -->
      <div v-if="tab === 'movements'" class="table-wrap">
        <table v-if="movements.length">
          <thead>
            <tr>
              <th>ID</th>
              <th>Товар</th>
              <th>Тип</th>
              <th>Кол-во</th>
              <th>Откуда</th>
              <th>Куда</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in movements" :key="m.id">
              <td>{{ m.id }}</td>
              <td>{{ m.product?.name || m.product_id }}</td>
              <td><span :class="['badge', movBadge(m.type)]">{{ movLabel(m.type) }}</span></td>
              <td>{{ m.quantity }}</td>
              <td>{{ m.from_cell || '—' }}</td>
              <td>{{ m.to_cell || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">Нет движений</div>
      </div>

      <!-- Receive Modal -->
      <div v-if="activeModal === 'receive'" class="modal-overlay" @click.self="activeModal = ''">
        <div class="modal">
          <h3>📥 Приёмка товара</h3>
          <div class="field">
            <label>Товар</label>
            <select v-model="receiveForm.product_id">
              <option value="" disabled>Выберите товар</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.sku }} — {{ p.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>Ячейка</label>
            <select v-model="receiveForm.cell_id">
              <option value="" disabled>Выберите ячейку</option>
              <option v-for="c in cells" :key="c.id" :value="c.id">{{ c.code }}</option>
            </select>
          </div>
          <div class="field">
            <label>Количество</label>
            <input v-model.number="receiveForm.quantity" type="number" min="1" placeholder="0" />
          </div>
          <div class="field">
            <label>Номер партии</label>
            <div class="input-with-btn">
              <input v-model="receiveForm.batch" placeholder="07..." />
              <button class="btn-gen-sm" @click="autoBatch">Авто</button>
            </div>
          </div>
          <div class="field">
            <label>Примечание</label>
            <input v-model="receiveForm.note" placeholder="Необязательно" />
          </div>
          <p v-if="modalError" class="error">{{ modalError }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="activeModal = ''">Отмена</button>
            <button class="btn-primary" @click="submitReceive">Принять</button>
          </div>
        </div>
      </div>

      <!-- Move Modal -->
      <div v-if="activeModal === 'move'" class="modal-overlay" @click.self="activeModal = ''">
        <div class="modal">
          <h3>→ Перемещение</h3>
          <div class="field">
            <label>Товар</label>
            <select v-model="moveForm.product_id">
              <option value="" disabled>Выберите товар</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.sku }} — {{ p.name }}</option>
            </select>
          </div>
          <div class="row-fields">
            <div class="field">
              <label>Из ячейки</label>
              <select v-model="moveForm.from_cell_id">
                <option value="" disabled>Откуда</option>
                <option v-for="c in cells" :key="c.id" :value="c.id">{{ c.code }}</option>
              </select>
            </div>
            <div class="field">
              <label>В ячейку</label>
              <select v-model="moveForm.to_cell_id">
                <option value="" disabled>Куда</option>
                <option v-for="c in cells" :key="c.id" :value="c.id">{{ c.code }}</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label>Количество</label>
            <input v-model.number="moveForm.quantity" type="number" min="1" />
          </div>
          <p v-if="modalError" class="error">{{ modalError }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="activeModal = ''">Отмена</button>
            <button class="btn-primary" @click="submitMove">Переместить</button>
          </div>
        </div>
      </div>

      <!-- Write-off Modal -->
      <div v-if="activeModal === 'writeoff'" class="modal-overlay" @click.self="activeModal = ''">
        <div class="modal">
          <h3>📤 Списание товара</h3>
          <div class="field">
            <label>Товар</label>
            <select v-model="writeoffForm.product_id">
              <option value="" disabled>Выберите товар</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.sku }} — {{ p.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>Ячейка</label>
            <select v-model="writeoffForm.cell_id">
              <option value="" disabled>Выберите ячейку</option>
              <option v-for="c in cells" :key="c.id" :value="c.id">{{ c.code }}</option>
            </select>
          </div>
          <div class="field">
            <label>Количество</label>
            <input v-model.number="writeoffForm.quantity" type="number" min="1" />
          </div>
          <div class="field">
            <label>Причина</label>
            <input v-model="writeoffForm.reason" placeholder="Брак, истёк срок и т.д." />
          </div>
          <p v-if="modalError" class="error">{{ modalError }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="activeModal = ''">Отмена</button>
            <button class="btn-danger" @click="submitWriteoff">Списать</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
const tab = ref('summary')
const summary = ref<any[]>([])
const movements = ref<any[]>([])
const products = ref<any[]>([])
const cells = ref<any[]>([])
const activeModal = ref('')
const modalError = ref('')

const receiveForm = ref({ product_id: '', cell_id: '', quantity: 1, batch: '', note: '' })
const moveForm = ref({ product_id: '', from_cell_id: '', to_cell_id: '', quantity: 1 })
const writeoffForm = ref({ product_id: '', cell_id: '', quantity: 1, reason: '' })

const token = () => localStorage.getItem('token')
const auth = () => ({ Authorization: `Bearer ${token()}` })

const loadSummary = async () => {
  const r = await fetch('/api/stock/summary', { headers: auth() })
  const d = await r.json()
  summary.value = d.data || []
}

const loadMovements = async () => {
  const r = await fetch('/api/stock/movements', { headers: auth() })
  const d = await r.json()
  movements.value = d.data || []
}

const loadProducts = async () => {
  const r = await fetch('/api/products', { headers: auth() })
  const d = await r.json()
  products.value = d.data || []
}

const loadCells = async () => {
  // get cells from all zones via warehouses
  const r2 = await fetch('/api/warehouses', { headers: auth() })
  const d2 = await r2.json()
  if (d2.data?.length) {
    const r3 = await fetch(`/api/warehouses/${d2.data[0].id}/grid`, { headers: auth() })
    const d3 = await r3.json()
    const allCells: any[] = []
    for (const z of d3.zones || []) allCells.push(...(z.cells || []))
    cells.value = allCells
  }
}

const totalQty = computed(() => summary.value.reduce((s: number, i: any) => s + i.total_quantity, 0))
const totalValue = computed(() => summary.value.reduce((s: number, i: any) => s + i.total_value, 0))
const lowStock = computed(() => summary.value.filter((i: any) => i.total_quantity > 0 && i.total_quantity < 10))

const formatMoney = (v: number) => v?.toLocaleString('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 })

const movLabel = (t: string) => ({ receive: 'Приёмка', move: 'Перемещение', writeoff: 'Списание' }[t] || t)
const movBadge = (t: string) => ({ receive: 'badge-green', move: 'badge-blue', writeoff: 'badge-red' }[t] || '')

const prefillReceive = (item: any) => {
  receiveForm.value.product_id = item.product_id
  activeModal.value = 'receive'
}
const prefillWriteoff = (item: any) => {
  writeoffForm.value.product_id = item.product_id
  activeModal.value = 'writeoff'
}

const autoBatch = async () => {
  const r = await fetch('/api/generate/batch', { method: 'POST', headers: auth() })
  const d = await r.json()
  receiveForm.value.batch = d.batch
}

const post = async (url: string, body: any) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify(body)
  })
  return r
}

const submitReceive = async () => {
  modalError.value = ''
  const r = await post('/api/stock/receive', receiveForm.value)
  const d = await r.json()
  if (!r.ok) { modalError.value = d.error || 'Ошибка'; return }
  activeModal.value = ''
  receiveForm.value = { product_id: '', cell_id: '', quantity: 1, batch: '', note: '' }
  loadSummary()
}

const submitMove = async () => {
  modalError.value = ''
  const r = await post('/api/stock/move', moveForm.value)
  const d = await r.json()
  if (!r.ok) { modalError.value = d.error || 'Ошибка'; return }
  activeModal.value = ''
  moveForm.value = { product_id: '', from_cell_id: '', to_cell_id: '', quantity: 1 }
  loadSummary()
}

const submitWriteoff = async () => {
  modalError.value = ''
  const r = await post('/api/stock/writeoff', writeoffForm.value)
  const d = await r.json()
  if (!r.ok) { modalError.value = d.error || 'Ошибка'; return }
  activeModal.value = ''
  writeoffForm.value = { product_id: '', cell_id: '', quantity: 1, reason: '' }
  loadSummary()
}

onMounted(async () => {
  await Promise.all([loadSummary(), loadProducts(), loadCells()])
})
</script>

<style scoped>
.layout { display: flex; height: 100vh; }
.content { flex: 1; padding: 32px; background: #f7f8fc; overflow-y: auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
h1 { margin: 0; font-size: 24px; color: #1a202c; }
.header-actions { display: flex; gap: 8px; }
.btn-primary { background: #4361ee; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #3451d1; }
.btn-secondary { background: white; color: #374151; border: 1px solid #d1d5db; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-secondary:hover { background: #f9fafb; }
.btn-danger { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-danger:hover { background: #fecaca; }
.tabs { display: flex; gap: 2px; margin-bottom: 16px; background: #e5e7eb; padding: 4px; border-radius: 10px; width: fit-content; }
.tab { padding: 8px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; background: transparent; color: #6b7280; transition: all 0.2s; }
.tab.active { background: white; color: #1a202c; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.table-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.stat-card { background: white; border-radius: 10px; padding: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
.stat-card.warn { background: #fef3c7; }
.stat-val { font-size: 24px; font-weight: 700; color: #1a202c; }
.stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
.table-wrap { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
table { width: 100%; border-collapse: collapse; }
th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
td { padding: 12px 16px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #f9fafb; }
.empty { padding: 48px; text-align: center; color: #9ca3af; font-size: 14px; }
.sku-badge { background: #eef2ff; color: #4361ee; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; font-family: monospace; }
.qty-zero { color: #9ca3af; }
.qty-low { color: #d97706; }
.qty-ok { color: #059669; }
.badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.actions { display: flex; gap: 6px; }
.btn-xs { padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; }
.btn-blue { background: #dbeafe; color: #1e40af; }
.btn-blue:hover { background: #bfdbfe; }
.btn-gray { background: #f3f4f6; color: #374151; }
.btn-gray:hover { background: #e5e7eb; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: white; border-radius: 16px; padding: 32px; width: 100%; max-width: 460px; display: flex; flex-direction: column; gap: 16px; max-height: 90vh; overflow-y: auto; }
.modal h3 { margin: 0; font-size: 20px; color: #1a202c; }
.field { display: flex; flex-direction: column; gap: 6px; }
.row-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label { font-size: 14px; font-weight: 600; color: #374151; }
input, select { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; outline: none; }
input:focus, select:focus { border-color: #4361ee; }
.input-with-btn { display: flex; gap: 8px; }
.input-with-btn input { flex: 1; }
.btn-gen-sm { background: #4361ee; color: white; border: none; padding: 8px 12px; border-radius: 8px; font-size: 13px; cursor: pointer; white-space: nowrap; }
.error { color: #e53e3e; font-size: 14px; margin: 0; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { background: #f3f4f6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #e5e7eb; }
</style>
