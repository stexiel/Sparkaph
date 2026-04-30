<template>
  <div class="layout">
    <Sidebar />
    <main class="content">
      <h1>Добро пожаловать, {{ username }}</h1>
      <div v-if="warehouse" class="wh-banner">
        🏭 Текущий склад: <strong>{{ warehouse.name }}</strong>
        <span class="wh-meta">{{ warehouse.floors }} эт. · {{ warehouse.rows }} рядов · {{ warehouse.columns }} яч. в ряду</span>
      </div>
      <div class="cards">
        <div class="card" @click="goTo('/warehouses')">
          <div class="card-icon">🏭</div>
          <div class="card-title">Склады</div>
          <div class="card-desc">Управление складами и визуализация</div>
        </div>
        <div class="card" @click="goTo('/inventory')">
          <div class="card-icon">📋</div>
          <div class="card-title">Инвентарь</div>
          <div class="card-desc">Товары, ячейки, остатки</div>
        </div>
        <div class="card" @click="goTo('/stock')">
          <div class="card-icon">�</div>
          <div class="card-title">Запасы</div>
          <div class="card-desc">Приёмка, перемещение, списание</div>
        </div>
        <div class="card" @click="goTo('/receipts')">
          <div class="card-icon">�</div>
          <div class="card-title">Акты приёмки</div>
          <div class="card-desc">Оформление актов приёмки товаров</div>
        </div>
        <div class="card" @click="goTo('/shipments')">
          <div class="card-icon">�</div>
          <div class="card-title">Отгрузка</div>
          <div class="card-desc">Заказы на отгрузку</div>
        </div>
        <div v-if="isAdmin" class="card" @click="goTo('/admin/users')">
          <div class="card-icon">👥</div>
          <div class="card-title">Пользователи</div>
          <div class="card-desc">Управление доступами и ролями</div>
        </div>
      </div>

      <!-- SKU / Batch Generator (admin only) -->
      <div v-if="isAdmin" class="generator-section">
        <h2>Генератор кодов</h2>
        <div class="generator-cards">
          <div class="gen-card">
            <div class="gen-label">SKU (начинается с 08)</div>
            <div class="gen-code">{{ generatedSKU || '—' }}</div>
            <button class="btn-gen" @click="generateSKU">Сгенерировать SKU</button>
          </div>
          <div class="gen-card">
            <div class="gen-label">Партия (начинается с 07)</div>
            <div class="gen-code">{{ generatedBatch || '—' }}</div>
            <button class="btn-gen" @click="generateBatch">Сгенерировать партию</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'

const router = useRouter()
const generatedSKU = ref('')
const generatedBatch = ref('')

const token = () => localStorage.getItem('token')
const parseToken = () => { try { return JSON.parse(atob(token()!.split('.')[1])) } catch { return {} } }
const username = computed(() => parseToken().username || 'Пользователь')
const isAdmin = computed(() => parseToken().role === 'admin')
const warehouse = computed(() => { try { const w = localStorage.getItem('warehouse'); return w ? JSON.parse(w) : null } catch { return null } })

const generateSKU = async () => {
  const r = await fetch('/api/generate/sku', { method: 'POST', headers: { Authorization: `Bearer ${token()}` } })
  const d = await r.json()
  generatedSKU.value = d.sku
}
const generateBatch = async () => {
  const r = await fetch('/api/generate/batch', { method: 'POST', headers: { Authorization: `Bearer ${token()}` } })
  const d = await r.json()
  generatedBatch.value = d.batch
}
const goTo = (path: string) => router.push(path)
</script>

<style scoped>
.layout { display: flex; height: 100vh; }
.content { flex: 1; padding: 32px; background: #f7f8fc; overflow-y: auto; }
h1 { margin: 0 0 16px; font-size: 24px; color: #1a202c; }
.wh-banner { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 10px 16px; font-size: 14px; color: #3730a3; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
.wh-meta { color: #6366f1; font-size: 12px; margin-left: auto; }
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
.card { background: white; border-radius: 12px; padding: 24px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.2s, box-shadow 0.2s; }
.card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.card-icon { font-size: 32px; margin-bottom: 12px; }
.card-title { font-size: 16px; font-weight: 700; color: #1a202c; margin-bottom: 6px; }
.card-desc { font-size: 13px; color: #718096; }
.generator-section { margin-top: 8px; }
h2 { font-size: 18px; color: #1a202c; margin: 0 0 16px; }
.generator-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.gen-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 10px; }
.gen-label { font-size: 13px; color: #6b7280; font-weight: 600; }
.gen-code { font-size: 20px; font-weight: 700; color: #1a202c; font-family: monospace; letter-spacing: 1px; min-height: 28px; }
.btn-gen { background: #4361ee; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; align-self: flex-start; }
.btn-gen:hover { background: #3451d1; }
</style>
