<template>
  <div class="home">
    <div class="hero">
      <div class="logo">📦</div>
      <h1>Sparkaph WMS</h1>
      <p>Warehouse Management System</p>
      <button class="btn-primary" @click="goToLogin">Войти в систему</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.home {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
.hero {
  text-align: center;
  color: white;
}
.logo {
  font-size: 64px;
  margin-bottom: 16px;
}
h1 {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -1px;
}
p {
  font-size: 18px;
  color: #a0aec0;
  margin: 0 0 32px;
}
.btn-primary {
  background: #4361ee;
  color: white;
  border: none;
  padding: 14px 40px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #3451d1;
}
</style>
