<template>
  <div class="layout">
    <Sidebar />
    <main class="content">
      <div class="page-header">
        <h1>Инвентарь</h1>
        <div class="header-actions">
          <button class="btn-secondary" @click="loadProducts">Товары</button>
          <button class="btn-primary" @click="showModal = true">+ Добавить товар</button>
        </div>
      </div>

      <div class="tabs">
        <button :class="['tab', tab === 'inventory' && 'active']" @click="tab = 'inventory'">Инвентарь</button>
        <button :class="['tab', tab === 'products' && 'active']" @click="tab = 'products'; loadProducts()">Товары</button>
      </div>

      <div class="table-wrap" v-if="tab === 'inventory'">
        <table v-if="inventory.length">
          <thead>
            <tr><th>ID</th><th>Товар</th><th>Ячейка</th><th>Количество</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in inventory" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.product?.name || item.product_id }}</td>
              <td>{{ item.cell?.code || item.cell_id }}</td>
              <td>{{ item.quantity }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">Нет данных об инвентаре</div>
      </div>

      <div class="table-wrap" v-if="tab === 'products'">
        <table v-if="products.length">
          <thead>
            <tr><th>ID</th><th>SKU</th><th>Название</th><th>Штрихкод</th><th>Цена</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in products" :key="p.id">
              <td>{{ p.id }}</td>
              <td>{{ p.sku }}</td>
              <td>{{ p.name }}</td>
              <td>{{ p.barcode || '—' }}</td>
              <td>{{ p.price }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">Нет товаров</div>
      </div>

      <!-- Modal: Add Product -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <h3>Новый товар</h3>
          <div class="field">
            <label>SKU</label>
            <input v-model="form.sku" placeholder="SKU-001" />
          </div>
          <div class="field">
            <label>Название</label>
            <input v-model="form.name" placeholder="Название товара" />
          </div>
          <div class="field">
            <label>Штрихкод</label>
            <input v-model="form.barcode" placeholder="1234567890" />
          </div>
          <div class="field">
            <label>Цена</label>
            <input v-model="form.price" type="number" placeholder="0.00" />
          </div>
          <p v-if="formError" class="error">{{ formError }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showModal = false">Отмена</button>
            <button class="btn-primary" @click="createProduct">Создать</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
const inventory = ref<any[]>([])
const products = ref<any[]>([])
const tab = ref('inventory')
const showModal = ref(false)
const formError = ref('')
const form = ref({ sku: '', name: '', barcode: '', price: 0 })

const token = () => localStorage.getItem('token')

const loadInventory = async () => {
  const response = await fetch('/api/inventory', {
    headers: { 'Authorization': `Bearer ${token()}` }
  })
  const data = await response.json()
  inventory.value = data.data || []
}

const loadProducts = async () => {
  const response = await fetch('/api/products', {
    headers: { 'Authorization': `Bearer ${token()}` }
  })
  const data = await response.json()
  products.value = data.data || []
}

const createProduct = async () => {
  formError.value = ''
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
    body: JSON.stringify(form.value)
  })
  if (!response.ok) {
    formError.value = 'Ошибка создания товара'
    return
  }
  showModal.value = false
  form.value = { sku: '', name: '', barcode: '', price: 0 }
  loadProducts()
  tab.value = 'products'
}

onMounted(() => loadInventory())
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
.header-actions { display: flex; gap: 10px; }
.btn-secondary { background: white; color: #374151; border: 1px solid #d1d5db; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-secondary:hover { background: #f9fafb; }
.tabs { display: flex; gap: 2px; margin-bottom: 16px; background: #e5e7eb; padding: 4px; border-radius: 10px; width: fit-content; }
.tab { padding: 8px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; background: transparent; color: #6b7280; transition: all 0.2s; }
.tab.active { background: white; color: #1a202c; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: white; border-radius: 16px; padding: 32px; width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: 16px; }
.modal h3 { margin: 0; font-size: 20px; color: #1a202c; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 14px; font-weight: 600; color: #374151; }
input { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; outline: none; }
input:focus { border-color: #4361ee; }
.error { color: #e53e3e; font-size: 14px; margin: 0; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { background: #f3f4f6; color: #374151; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #e5e7eb; }
</style>
