<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const username = ref('')
const password = ref('')
const role = ref('保洁人员') 
const isRegister = ref(false) 
const msgBox = ref('')
const isSubmitting = ref(false)
const router = useRouter()

const handleSubmit = async () => {
  msgBox.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    msgBox.value = '请填写用户名和密码'
    return
  }

  isSubmitting.value = true
  // 登录使用 /v1/auth/login，注册使用 /v1/app/auth/register
  const apiUrl = isRegister.value ? '/api/v1/app/auth/register' : '/api/v1/auth/login'
  
  const bodyData = {
    username: username.value.trim(),
    password: password.value.trim()
  }
  if (isRegister.value) bodyData.role = role.value

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    })
    const data = await res.json()

    if (res.ok && data.code === 0) {
      if (isRegister.value) {
        ElMessage.success('注册成功，请登录')
        isRegister.value = false
      } else {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user_info', JSON.stringify(data.data.user_info))
        
        const userRole = data.data.user_info.role
        ElMessage.success(`欢迎回来，${data.data.user_info.username}`)

        // 核心跳转逻辑：根据身份进入不同界面
        if (userRole === '超级管理员' || userRole === '管理员') {
          await router.replace({ name: 'home' })
        } else {
          // 保洁人员或其他 APP 用户进入工单界面
          await router.replace({ name: 'appOrders' })
        }
      }
    } else {
      throw new Error(data.message || '操作失败')
    }
  } catch (err) {
    msgBox.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-header">
        <img src="../../asset/img/logo.svg" alt="Logo" class="logo-icon">
        <h2>{{ isRegister ? '账号注册' : '保洁标准化后台' }}</h2>
      </div>
      <form @submit.prevent="handleSubmit" id="login-form">
        <div class="form-field">
          <input type="text" placeholder="用户名" required v-model="username" />
        </div>
        <div class="form-field">
          <input type="password" placeholder="密码" required v-model="password" />
        </div>
        <div v-if="isRegister" class="form-field">
          <select v-model="role" style="width: 100%; height: 44px; border: 1px solid #d9d9d9; border-radius: 4px; padding: 0 14px; font-size: 15px; background: #fff;">
            <option value="保洁人员">保洁人员</option>
            <option value="普通用户">普通用户</option>
          </select>
        </div>
        <button type="submit" class="btn-login" :disabled="isSubmitting">
          {{ isSubmitting ? '处理中...' : (isRegister ? '立即注册' : '登 录') }}
        </button>
        <div style="text-align: right; margin-top: 10px;">
          <span @click="isRegister = !isRegister" style="color: #1890ff; cursor: pointer; font-size: 13px;">
            {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
          </span>
        </div>
        <p class="login-msg" :style="{ color: msgBox.includes('成功') ? '#52c41a' : '#f5222d' }">{{ msgBox }}</p>
      </form>
      <div class="login-footer">© 2025 保洁标准化</div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper { width: 100%; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f7fa; padding: 24px; }
.login-card { width: 380px; background: #fff; border-radius: 8px; box-shadow: 0 6px 20px rgba(0, 0, 0, .08); padding: 40px 42px 32px; display: flex; flex-direction: column; gap: 24px; }
.login-header { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.logo-icon { width: 48px; height: 48px; }
.login-header h2 { font-size: 22px; font-weight: 600; color: #333; }
.form-field { margin-bottom: 18px; }
.form-field input { width: 100%; height: 44px; padding: 0 14px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 15px; }
.btn-login { width: 100%; height: 46px; background: #1890ff; color: #fff; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
.login-msg { margin-top: 12px; font-size: 14px; text-align: center; }
.login-footer { margin-top: 8px; font-size: 12px; color: #999; text-align: center; }
</style>