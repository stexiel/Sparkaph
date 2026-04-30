import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/select-warehouse',
    name: 'WarehouseSelect',
    component: () => import('@/views/WarehouseSelect.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true, requiresWarehouse: true }
  },
  {
    path: '/warehouses',
    name: 'Warehouses',
    component: () => import('@/views/Warehouses.vue'),
    meta: { requiresAuth: true, requiresWarehouse: true }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('@/views/Inventory.vue'),
    meta: { requiresAuth: true, requiresWarehouse: true }
  },
  {
    path: '/stock',
    name: 'Stock',
    component: () => import('@/views/Stock.vue'),
    meta: { requiresAuth: true, requiresWarehouse: true }
  },
  {
    path: '/receipts',
    name: 'ReceiptAct',
    component: () => import('@/views/ReceiptAct.vue'),
    meta: { requiresAuth: true, requiresWarehouse: true }
  },
  {
    path: '/shipments',
    name: 'ShipmentOrder',
    component: () => import('@/views/ShipmentOrder.vue'),
    meta: { requiresAuth: true, requiresWarehouse: true }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/AdminUsers.vue'),
    meta: { requiresAuth: true, requiresWarehouse: true }
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const warehouse = localStorage.getItem('warehouse')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.requiresWarehouse && !warehouse) {
    next('/select-warehouse')
  } else {
    next()
  }
})

export default router
