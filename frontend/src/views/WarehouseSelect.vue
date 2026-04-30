<template>
  <div class="select-page">
    <div class="select-box">
      <div class="select-header">
        <div class="logo">📦</div>
        <h2>Sparkaph WMS</h2>
        <p>Выберите склад для работы</p>
      </div>

      <div v-if="warehouses.length" class="wh-list">
        <div
          v-for="wh in warehouses"
          :key="wh.id"
          :class="['wh-item', selected?.id === wh.id && 'selected']"
          @click="selected = wh"
        >
          <span class="wh-icon">🏭</span>
          <div class="wh-info">
            <div class="wh-name">{{ wh.name }}</div>
            <div class="wh-addr">{{ wh.address || 'Адрес не указан' }}</div>
            <div class="wh-meta">{{ wh.floors }} эт. · {{ wh.rows }} рядов · {{ wh.columns }} яч.</div>
          </div>
          <span v-if="selected?.id === wh.id" class="check">✓</span>
        </div>
      </div>

      <div v-else class="no-wh">
        <p>Нет складов. Создайте первый склад.</p>
      </div>

      <div class="divider"><span>или</span></div>

      <button class="btn-create" @click="showCreate = !showCreate">
        {{ showCreate ? '✕ Отмена' : '+ Создать новый склад' }}
      </button>

      <div v-if="showCreate" class="create-form">
        <div class="field">
          <label>Название склада</label>
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
        <p v-if="createError" class="error">{{ createError }}</p>
        <button class="btn-primary" @click="createWarehouse" :disabled="creating">
          {{ creating ? 'Создание...' : 'Создать склад' }}
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <button
        class="btn-enter"
        :disabled="!selected"
        @click="enter"
      >
        Войти на склад →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const warehouses = ref<any[]>([])
const selected = ref<any>(null)
const showCreate = ref(false)
const creating = ref(false)
const error = ref('')
const createError = ref('')
const form = ref({ name: '', address: '', floors: 1, rows: 5, columns: 5 })

const token = () => localStorage.getItem('token')

const load = async () => {
  const r = await fetch('/api/warehouses', {
    headers: { Authorization: `Bearer ${token()}` }
  })
  const d = await r.json()
  warehouses.value = d.data || []
  if (warehouses.value.length === 1) selected.value = warehouses.value[0]
}

const createWarehouse = async () => {
  createError.value = ''
  if (!form.value.name) { createError.value = 'Введите название'; return }
  if (form.value.floors < 1) form.value.floors = 1
  if (form.value.rows < 1) form.value.rows = 1
  if (form.value.columns < 1) form.value.columns = 1
  const totalCells = form.value.floors * form.value.rows * form.value.columns
  if (totalCells > 500) { createError.value = `Слишком много ячеек (${totalCells}). Максимум 500.`; return }
  creating.value = true
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const r = await fetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form.value),
      signal: controller.signal
    })
    clearTimeout(timeout)
    const d = await r.json()
    if (!r.ok) { createError.value = d.error || 'Ошибка создания склада'; return }
    showCreate.value = false
    form.value = { name: '', address: '', floors: 1, rows: 5, columns: 5 }
    await load()
    selected.value = d.data
  } catch (e) {
    createError.value = 'Ошибка соединения с сервером'
  } finally {
    creating.value = false
  }
}

const enter = () => {
  if (!selected.value) { error.value = 'Выберите склад'; return }
  localStorage.setItem('warehouse', JSON.stringify(selected.value))
  router.push('/dashboard')
}

onMounted(load)
</script>

<style scoped>
.select-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
}
.select-box {
  background: white;
  border-radius: 20px;
  padding: 36px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.35);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.select-header { text-align: center; }
.logo { font-size: 48px; margin-bottom: 8px; }
h2 { margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #1a202c; }
.select-header p { margin: 0; color: #718096; font-size: 14px; }
.wh-list { display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; }
.wh-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.wh-item:hover { border-color: #4361ee; background: #f0f4ff; }
.wh-item.selected { border-color: #4361ee; background: #eef2ff; }
.wh-icon { font-size: 24px; flex-shrink: 0; }
.wh-info { flex: 1; min-width: 0; }
.wh-name { font-size: 15px; font-weight: 700; color: #1a202c; }
.wh-addr { font-size: 12px; color: #718096; margin-top: 1px; }
.wh-meta { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.check { font-size: 18px; color: #4361ee; font-weight: 700; flex-shrink: 0; }
.no-wh { text-align: center; padding: 20px; color: #9ca3af; font-size: 14px; }
.divider { display: flex; align-items: center; gap: 12px; color: #d1d5db; font-size: 13px; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
.btn-create {
  width: 100%;
  padding: 10px;
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-create:hover { border-color: #4361ee; color: #4361ee; background: #f0f4ff; }
.create-form { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #f9fafb; border-radius: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; }
label { font-size: 13px; font-weight: 600; color: #374151; }
input { padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; }
input:focus { border-color: #4361ee; }
.row-fields { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.cell-preview { background: #eef2ff; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #4361ee; }
.error { color: #e53e3e; font-size: 13px; margin: 0; }
.btn-primary {
  background: #4361ee;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) { background: #3451d1; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-enter {
  width: 100%;
  padding: 14px;
  background: #1a1a2e;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
}
.btn-enter:hover:not(:disabled) { background: #4361ee; }
.btn-enter:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
