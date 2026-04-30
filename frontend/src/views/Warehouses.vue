<template>
  <div class="layout">
    <Sidebar />
    <main class="content">
      <div class="page-header">
        <h1>🏭 Склады</h1>
        <button class="btn-primary" @click="showModal = true">+ Новый склад</button>
      </div>

      <div class="warehouse-grid">
        <div v-for="wh in warehouses" :key="wh.id" class="wh-card" @click="openGrid(wh)">
          <div class="wh-icon">🏭</div>
          <div class="wh-name">{{ wh.name }}</div>
          <div class="wh-address">{{ wh.address || 'Адрес не указан' }}</div>
          <div class="wh-stats">
            <span>{{ wh.floors }} эт.</span>
            <span>{{ wh.rows }} рядов</span>
            <span>{{ wh.columns }} яч. в ряду</span>
          </div>
        </div>
        <div v-if="!warehouses.length" class="empty">Нет складов</div>
      </div>

      <!-- Warehouse Grid Visualization -->
      <div v-if="selectedWH" class="grid-section">
        <div class="grid-header">
          <h2>{{ selectedWH.name }} — Визуализация</h2>
          <div class="legend">
            <span class="leg-item"><span class="leg-box empty-box"></span> Пусто</span>
            <span class="leg-item"><span class="leg-box partial-box"></span> Частично</span>
            <span class="leg-item"><span class="leg-box full-box"></span> Заполнено</span>
          </div>
        </div>
        <div v-if="gridLoading" class="loading">Загрузка...</div>
        <div v-else>
          <div v-for="zone in gridZones" :key="zone.id" class="floor-section">
            <h3>{{ zone.name }}</h3>
            <div class="cell-grid" :style="{ gridTemplateColumns: `repeat(${selectedWH.columns}, 1fr)` }">
              <div
                v-for="cell in zone.cells"
                :key="cell.id"
                :class="['cell', getCellClass(cell)]"
                :title="`${cell.code} — ${cell.quantity} ед.`"
              >
                <span class="cell-code">{{ cell.code }}</span>
                <span class="cell-qty">{{ cell.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Warehouse Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <h3>Новый склад</h3>
          <div class="field">
            <label>Название</label>
            <input v-model="form.name" placeholder="Склад №1" />
          </div>
          <div class="field">
            <label>Адрес</label>
            <input v-model="form.address" placeholder="г. Алматы, ул. Складская 1" />
          </div>
          <div class="row-fields">
            <div class="field">
              <label>Этажей</label>
              <input v-model.number="form.floors" type="number" min="1" max="10" />
            </div>
            <div class="field">
              <label>Рядов</label>
              <input v-model.number="form.rows" type="number" min="1" max="50" />
            </div>
            <div class="field">
              <label>Ячеек в ряду</label>
              <input v-model.number="form.columns" type="number" min="1" max="50" />
            </div>
          </div>
          <div class="cell-preview">
            Будет создано: <strong>{{ form.floors * form.rows * form.columns }}</strong> ячеек
          </div>
          <p v-if="formError" class="error">{{ formError }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showModal = false">Отмена</button>
            <button class="btn-primary" @click="createWarehouse">Создать</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
const warehouses = ref<any[]>([])
const showModal = ref(false)
const formError = ref('')
const gridLoading = ref(false)
const selectedWH = ref<any>(null)
const gridZones = ref<any[]>([])
const form = ref({ name: '', address: '', floors: 1, rows: 5, columns: 5 })

const token = () => localStorage.getItem('token')

const loadWarehouses = async () => {
  const r = await fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token()}` } })
  const d = await r.json()
  warehouses.value = d.data || []
}

const createWarehouse = async () => {
  formError.value = ''
  if (!form.value.name) { formError.value = 'Введите название'; return }
  if (form.value.floors < 1) form.value.floors = 1
  if (form.value.rows < 1) form.value.rows = 1
  if (form.value.columns < 1) form.value.columns = 1
  try {
    const r = await fetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form.value)
    })
    const d = await r.json()
    if (!r.ok) { formError.value = d.error || 'Ошибка создания'; return }
    showModal.value = false
    form.value = { name: '', address: '', floors: 1, rows: 5, columns: 5 }
    loadWarehouses()
  } catch {
    formError.value = 'Ошибка соединения с сервером'
  }
}

const openGrid = async (wh: any) => {
  selectedWH.value = wh
  gridLoading.value = true
  gridZones.value = []
  const r = await fetch(`/api/warehouses/${wh.id}/grid`, { headers: { Authorization: `Bearer ${token()}` } })
  const d = await r.json()
  gridZones.value = d.zones || []
  gridLoading.value = false
}

const getCellClass = (cell: any) => {
  if (!cell.quantity || cell.quantity === 0) return 'cell-empty'
  if (cell.quantity >= cell.capacity) return 'cell-full'
  return 'cell-partial'
}

onMounted(() => loadWarehouses())
</script>

<style scoped>
.layout { display: flex; height: 100vh; }
.content { flex: 1; padding: 32px; background: #f7f8fc; overflow-y: auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
h1 { margin: 0; font-size: 24px; color: #1a202c; }
.btn-primary { background: #4361ee; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #3451d1; }
.warehouse-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px; }
.wh-card { background: white; border-radius: 12px; padding: 20px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: all 0.2s; border: 2px solid transparent; }
.wh-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); border-color: #4361ee; }
.wh-icon { font-size: 32px; margin-bottom: 8px; }
.wh-name { font-size: 16px; font-weight: 700; color: #1a202c; margin-bottom: 4px; }
.wh-address { font-size: 13px; color: #718096; margin-bottom: 12px; }
.wh-stats { display: flex; gap: 8px; }
.wh-stats span { background: #f0f4ff; color: #4361ee; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.empty { padding: 40px; text-align: center; color: #9ca3af; background: white; border-radius: 12px; }
.grid-section { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.grid-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.grid-header h2 { margin: 0; font-size: 18px; color: #1a202c; }
.legend { display: flex; gap: 16px; }
.leg-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; }
.leg-box { width: 16px; height: 16px; border-radius: 4px; }
.empty-box { background: #f3f4f6; border: 1px solid #d1d5db; }
.partial-box { background: #fef3c7; border: 1px solid #f59e0b; }
.full-box { background: #d1fae5; border: 1px solid #10b981; }
.floor-section { margin-bottom: 24px; }
.floor-section h3 { font-size: 15px; color: #374151; margin-bottom: 10px; }
.cell-grid { display: grid; gap: 4px; }
.cell { border-radius: 6px; padding: 6px 4px; text-align: center; cursor: default; transition: transform 0.1s; display: flex; flex-direction: column; align-items: center; min-height: 48px; justify-content: center; }
.cell:hover { transform: scale(1.05); }
.cell-code { font-size: 9px; color: #6b7280; font-weight: 600; }
.cell-qty { font-size: 12px; font-weight: 700; margin-top: 2px; }
.cell-empty { background: #f3f4f6; border: 1px solid #d1d5db; }
.cell-empty .cell-qty { color: #9ca3af; }
.cell-partial { background: #fef3c7; border: 1px solid #f59e0b; }
.cell-partial .cell-qty { color: #92400e; }
.cell-full { background: #d1fae5; border: 1px solid #10b981; }
.cell-full .cell-qty { color: #065f46; }
.loading { padding: 40px; text-align: center; color: #6b7280; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: white; border-radius: 16px; padding: 32px; width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 16px; }
.modal h3 { margin: 0; font-size: 20px; color: #1a202c; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 14px; font-weight: 600; color: #374151; }
input { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; outline: none; }
input:focus { border-color: #4361ee; }
.row-fields { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.cell-preview { background: #f0f4ff; border-radius: 8px; padding: 10px 14px; font-size: 14px; color: #4361ee; }
.error { color: #e53e3e; font-size: 14px; margin: 0; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { background: #f3f4f6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #e5e7eb; }
</style>
