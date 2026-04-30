<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">📦</div>
        <h2>Sparkaph WMS</h2>
        <p>Создать аккаунт</p>
      </div>
      <form @submit.prevent="handleRegister" class="login-form">
        <div class="field">
          <label>Логин</label>
          <input v-model="username" placeholder="Введите логин" />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="Введите email" />
        </div>
        <div class="field">
          <label>Пароль</label>
          <input v-model="password" type="password" placeholder="Введите пароль" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>
        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
      </form>
      <p class="register-link">
        Уже есть аккаунт? <span @click="router.push('/login')">Войти</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const handleRegister = async () => {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, email: email.value, password: password.value })
    })
    const data = await response.json()
    if (!response.ok) {
      error.value = data.error || 'Ошибка регистрации'
      return
    }
    localStorage.setItem('token', data.token)
    router.push('/dashboard')
  } catch {
    error.value = 'Ошибка соединения с сервером'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
.login-box {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.logo { font-size: 48px; margin-bottom: 8px; }
h2 { margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #1a202c; }
.login-header p { margin: 0; color: #718096; font-size: 14px; }
.login-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 14px; font-weight: 600; color: #374151; }
input {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}
input:focus { border-color: #4361ee; }
.error { color: #e53e3e; font-size: 14px; margin: 0; }
.success { color: #38a169; font-size: 14px; margin: 0; }
.btn-submit {
  background: #4361ee;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 4px;
}
.btn-submit:hover:not(:disabled) { background: #3451d1; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.register-link { text-align: center; margin: 20px 0 0; font-size: 14px; color: #718096; }
.register-link span { color: #4361ee; cursor: pointer; font-weight: 600; }
</style>
