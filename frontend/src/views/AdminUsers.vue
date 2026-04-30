<template>
  <div class="layout">
    <Sidebar />
    <main class="content">
      <div class="page-header">
        <h1>👥 Пользователи</h1>
        <button class="btn-primary" @click="showModal = true">+ Новый пользователь</button>
      </div>

      <div class="table-wrap">
        <table v-if="users.length">
          <thead>
            <tr>
              <th>ID</th>
              <th>Логин</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.id }}</td>
              <td><strong>{{ u.username }}</strong></td>
              <td>{{ u.email }}</td>
              <td>{{ u.first_name }} {{ u.last_name }}</td>
              <td>
                <select class="role-select" :value="u.role" @change="updateRole(u.id, ($event.target as HTMLSelectElement).value)">
                  <option value="user">user</option>
                  <option value="picker">picker</option>
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                <span :class="['badge', u.active ? 'badge-active' : 'badge-inactive']">
                  {{ u.active ? 'Активен' : 'Заблокирован' }}
                </span>
              </td>
              <td>
                <button class="btn-sm" @click="toggleActive(u)">
                  {{ u.active ? 'Блокировать' : 'Разблокировать' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">Нет пользователей</div>
      </div>

      <!-- Create User Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <h3>Новый пользователь</h3>
          <div class="row-fields">
            <div class="field">
              <label>Имя</label>
              <input v-model="form.first_name" placeholder="Иван" />
            </div>
            <div class="field">
              <label>Фамилия</label>
              <input v-model="form.last_name" placeholder="Иванов" />
            </div>
          </div>
          <div class="field">
            <label>Логин</label>
            <input v-model="form.username" placeholder="ivan123" />
          </div>
          <div class="field">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="ivan@example.com" />
          </div>
          <div class="field">
            <label>Пароль</label>
            <input v-model="form.password" type="password" placeholder="••••••••" />
          </div>
          <div class="field">
            <label>Роль</label>
            <select v-model="form.role">
              <option value="user">user — базовый доступ</option>
              <option value="picker">picker — сборщик</option>
              <option value="manager">manager — менеджер</option>
              <option value="admin">admin — администратор</option>
            </select>
          </div>
          <p v-if="formError" class="error">{{ formError }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showModal = false">Отмена</button>
            <button class="btn-primary" @click="createUser">Создать</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
const users = ref<any[]>([])
const showModal = ref(false)
const formError = ref('')
const form = ref({ username: '', email: '', password: '', role: 'user', first_name: '', last_name: '' })

const token = () => localStorage.getItem('token')

const loadUsers = async () => {
  const r = await fetch('/admin/users', { headers: { Authorization: `Bearer ${token()}` } })
  if (r.status === 403) { return }
  const d = await r.json()
  users.value = d.data || []
}

const createUser = async () => {
  formError.value = ''
  if (!form.value.username || !form.value.password) { formError.value = 'Заполните обязательные поля'; return }
  const r = await fetch('/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify(form.value)
  })
  const d = await r.json()
  if (!r.ok) { formError.value = d.error || 'Ошибка создания'; return }
  showModal.value = false
  form.value = { username: '', email: '', password: '', role: 'user', first_name: '', last_name: '' }
  loadUsers()
}

const updateRole = async (id: number, role: string) => {
  await fetch(`/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ role })
  })
  loadUsers()
}

const toggleActive = async (u: any) => {
  const active = !u.active
  await fetch(`/admin/users/${u.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ active })
  })
  loadUsers()
}

onMounted(() => loadUsers())
</script>

<style scoped>
.layout { display: flex; height: 100vh; }
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
.role-select { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; cursor: pointer; }
.badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge-active { background: #d1fae5; color: #065f46; }
.badge-inactive { background: #fee2e2; color: #991b1b; }
.btn-sm { padding: 4px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px; cursor: pointer; background: white; }
.btn-sm:hover { background: #f3f4f6; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: white; border-radius: 16px; padding: 32px; width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 16px; max-height: 90vh; overflow-y: auto; }
.modal h3 { margin: 0; font-size: 20px; color: #1a202c; }
.field { display: flex; flex-direction: column; gap: 6px; }
.row-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label { font-size: 14px; font-weight: 600; color: #374151; }
input, select { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; outline: none; }
input:focus, select:focus { border-color: #4361ee; }
.error { color: #e53e3e; font-size: 14px; margin: 0; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { background: #f3f4f6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #e5e7eb; }
</style>
