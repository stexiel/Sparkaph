<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="sidebar-logo">📦</span>
      <span class="sidebar-title">Sparkaph WMS</span>
    </div>

    <!-- Sidebar search -->
    <div class="sidebar-search">
      <input
        v-model="searchQ"
        placeholder="🔍 Поиск..."
        class="search-input"
        @input="onSearch"
      />
      <div v-if="results.length" class="search-results">
        <div
          v-for="p in results"
          :key="p.id"
          class="search-item"
          @click="goProduct(p)"
        >
          <span class="s-sku">{{ p.sku }}</span>
          <span class="s-name">{{ p.name }}</span>
        </div>
      </div>
    </div>

    <!-- Warehouse selector -->
    <div class="warehouse-pill" v-if="currentWarehouse" @click="$emit('change-warehouse')">
      <span>🏭</span>
      <span class="wh-name">{{ currentWarehouse.name }}</span>
      <span class="wh-change">↕</span>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/dashboard" class="nav-item" @click="clearSearch">🏠 Главная</router-link>
      <router-link to="/warehouses" class="nav-item" @click="clearSearch">🏭 Склады</router-link>
      <router-link to="/inventory" class="nav-item" @click="clearSearch">📋 Инвентарь</router-link>
      <router-link to="/stock" class="nav-item" @click="clearSearch">📊 Запасы</router-link>
      <router-link to="/receipts" class="nav-item" @click="clearSearch">📥 Акты приёмки</router-link>
      <router-link to="/shipments" class="nav-item" @click="clearSearch">📤 Отгрузка</router-link>
      <router-link v-if="isAdmin" to="/admin/users" class="nav-item" @click="clearSearch">👥 Пользователи</router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">{{ username.charAt(0).toUpperCase() }}</div>
        <div>
          <div class="user-name">{{ username }}</div>
          <div class="user-role">{{ role }}</div>
        </div>
      </div>
      <button class="logout-btn" @click="logout">Выйти</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQ = ref('')
const results = ref<any[]>([])

const token = () => localStorage.getItem('token')

const parseToken = () => {
  try { return JSON.parse(atob(token()!.split('.')[1])) } catch { return {} }
}

const username = computed(() => parseToken().username || 'Пользователь')
const role = computed(() => parseToken().role || 'user')
const isAdmin = computed(() => role.value === 'admin')

const currentWarehouse = computed(() => {
  try {
    const wh = localStorage.getItem('warehouse')
    return wh ? JSON.parse(wh) : null
  } catch { return null }
})

let timer: any = null
const onSearch = () => {
  clearTimeout(timer)
  if (!searchQ.value.trim()) { results.value = []; return }
  timer = setTimeout(async () => {
    const r = await fetch(`/api/products/search?q=${encodeURIComponent(searchQ.value)}`, {
      headers: { Authorization: `Bearer ${token()}` }
    })
    const d = await r.json()
    results.value = d.data || []
  }, 250)
}

const goProduct = (_p: any) => {
  clearSearch()
  router.push('/inventory')
}

const clearSearch = () => {
  searchQ.value = ''
  results.value = []
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('warehouse')
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: #1a1a2e;
  color: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
}
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.sidebar-logo { font-size: 22px; }
.sidebar-title { font-size: 15px; font-weight: 700; }

.sidebar-search {
  padding: 10px 12px;
  position: relative;
}
.search-input {
  width: 100%;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  color: white;
  font-size: 13px;
  outline: none;
}
.search-input::placeholder { color: #718096; }
.search-input:focus { border-color: #4361ee; background: rgba(255,255,255,0.12); }
.search-results {
  position: absolute;
  top: calc(100% - 4px);
  left: 12px;
  right: 12px;
  background: #2d3748;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  z-index: 200;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.search-item:hover { background: rgba(255,255,255,0.08); }
.s-sku {
  font-size: 10px;
  font-weight: 700;
  background: rgba(67,97,238,0.4);
  color: #a5b4fc;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}
.s-name { font-size: 12px; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.warehouse-pill {
  margin: 0 12px 6px;
  background: rgba(67,97,238,0.2);
  border: 1px solid rgba(67,97,238,0.4);
  border-radius: 8px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}
.warehouse-pill:hover { background: rgba(67,97,238,0.3); }
.wh-name { flex: 1; font-weight: 600; color: #a5b4fc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wh-change { color: #718096; font-size: 10px; }

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 6px 10px;
  gap: 2px;
  flex: 1;
  overflow-y: auto;
}
.nav-item {
  display: block;
  padding: 9px 12px;
  border-radius: 8px;
  color: #a0aec0;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}
.nav-item:hover { background: rgba(255,255,255,0.07); color: white; }
.nav-item.router-link-active { background: rgba(67,97,238,0.35); color: white; }

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.user-info { display: flex; align-items: center; gap: 10px; }
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4361ee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.user-name { font-size: 13px; font-weight: 600; color: white; }
.user-role { font-size: 11px; color: #718096; text-transform: capitalize; }
.logout-btn {
  width: 100%;
  padding: 8px;
  background: rgba(255,255,255,0.05);
  color: #a0aec0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  text-align: center;
}
.logout-btn:hover { background: rgba(239,68,68,0.2); color: #fc8181; }
</style>
