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
        <h1>Сборка</h1>
        <button class="btn-primary" @click="loadTasks">Обновить</button>
      </div>
      <div class="table-wrap">
        <table v-if="tasks.length">
          <thead>
            <tr>
              <th>ID</th>
              <th>ID Заказа</th>
              <th>Статус</th>
              <th>Назначен</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id">
              <td>{{ task.id }}</td>
              <td>{{ task.order_id }}</td>
              <td><span :class="'badge badge-' + task.status?.toLowerCase()">{{ task.status }}</span></td>
              <td>{{ task.assigned_to || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">Нет задач на сборку</div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const tasks = ref<any[]>([])

const loadTasks = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/picking/tasks', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const data = await response.json()
  tasks.value = data.data || []
}

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

onMounted(() => loadTasks())
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
.badge-in_progress { background: #dbeafe; color: #1e40af; }
</style>
