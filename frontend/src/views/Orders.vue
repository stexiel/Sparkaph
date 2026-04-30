<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="sidebar-logo">📦</span>
        <span class="sidebar-title">Sparkaph WMS</span>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item">🏠 Главная</router-link>
        <router-link to="/inventory" class="nav-item">📋 Инвентарь</router-link>
        <router-link to="/orders" class="nav-item">📦 Заказы</router-link>
        <router-link to="/picking" class="nav-item">✅ Сборка</router-link>
      </nav>
      <button class="logout-btn" @click="logout">Выйти</button>
    </aside>
    <main class="content">
      <div class="page-header">
        <h1>Заказы</h1>
        <button class="btn-primary" @click="showModal = true">+ Новый заказ</button>
      </div>

      <div class="table-wrap">
        <table v-if="orders.length">
          <thead>
            <tr>
              <th>ID</th>
              <th>Номер заказа</th>
              <th>Клиент</th>
              <th>Статус</th>
              <th>Приоритет</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>{{ order.id }}</td>
              <td>{{ order.order_number }}</td>
              <td>{{ order.customer_name }}</td>
              <td><span :class="'badge badge-' + order.status?.toLowerCase()">{{ order.status }}</span></td>
              <td>{{ order.priority }}</td>
              <td>
                <select class="status-select" :value="order.status" @change="updateStatus(order.id, ($event.target as HTMLSelectElement).value)">
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">Нет заказов</div>
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <h3>Новый заказ</h3>
          <div class="field">
            <label>Номер заказа</label>
            <input v-model="form.order_number" placeholder="ORD-001" />
          </div>
          <div class="field">
            <label>Клиент</label>
            <input v-model="form.customer_name" placeholder="Имя клиента" />
          </div>
          <div class="field">
            <label>Приоритет</label>
            <select v-model="form.priority">
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <p v-if="formError" class="error">{{ formError }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showModal = false">Отмена</button>
            <button class="btn-primary" @click="createOrder">Создать</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const orders = ref<any[]>([])
const showModal = ref(false)
const formError = ref('')
const form = ref({ order_number: '', customer_name: '', priority: 'NORMAL' })

const token = () => localStorage.getItem('token')

const loadOrders = async () => {
  const response = await fetch('/api/orders', {
    headers: { 'Authorization': `Bearer ${token()}` }
  })
  const data = await response.json()
  orders.value = data.data || []
}

const createOrder = async () => {
  formError.value = ''
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
    body: JSON.stringify(form.value)
  })
  if (!response.ok) {
    formError.value = 'Ошибка создания заказа'
    return
  }
  showModal.value = false
  form.value = { order_number: '', customer_name: '', priority: 'NORMAL' }
  loadOrders()
}

const updateStatus = async (id: number, status: string) => {
  await fetch(`/api/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
    body: JSON.stringify({ status })
  })
  loadOrders()
}

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

onMounted(() => loadOrders())
</script>

<style scoped>
.layout { display: flex; height: 100vh; }
.sidebar { width: 240px; background: #1a1a2e; color: white; display: flex; flex-direction: column; flex-shrink: 0; }
.sidebar-header { display: flex; align-items: center; gap: 10px; padding: 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.sidebar-logo { font-size: 24px; }
.sidebar-title { font-size: 16px; font-weight: 700; }
.sidebar-nav { display: flex; flex-direction: column; padding: 16px 12px; gap: 4px; flex: 1; }
.nav-item { display: block; padding: 10px 12px; border-radius: 8px; color: #a0aec0; text-decoration: none; font-size: 14px; font-weight: 500; transition: all 0.2s; }
.nav-item:hover, .nav-item.router-link-active { background: rgba(67,97,238,0.3); color: white; }
.logout-btn { margin: 16px 12px; padding: 10px; background: rgba(255,255,255,0.05); color: #a0aec0; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
.logout-btn:hover { background: rgba(255,255,255,0.1); color: white; }
.content { flex: 1; padding: 32px; background: #f7f8fc; overflow-y: auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
h1 { margin: 0; font-size: 24px; color: #1a202c; }
.btn-primary { background: #4361ee; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #3451d1; }
.table-wrap { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
table { width: 100%; border-collapse: collapse; }
th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
td { padding: 14px 16px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #f9fafb; }
.empty { padding: 48px; text-align: center; color: #9ca3af; font-size: 14px; }
.badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge-pending { background: #fef3c7; color: #92400e; }
.badge-completed { background: #d1fae5; color: #065f46; }
.badge-cancelled { background: #fee2e2; color: #991b1b; }
.badge-processing { background: #dbeafe; color: #1e40af; }
.status-select { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; cursor: pointer; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: white; border-radius: 16px; padding: 32px; width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: 16px; }
.modal h3 { margin: 0; font-size: 20px; color: #1a202c; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 14px; font-weight: 600; color: #374151; }
input, select { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; outline: none; }
input:focus, select:focus { border-color: #4361ee; }
.error { color: #e53e3e; font-size: 14px; margin: 0; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { background: #f3f4f6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #e5e7eb; }
</style>
