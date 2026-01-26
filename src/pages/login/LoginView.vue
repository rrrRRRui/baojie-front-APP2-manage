<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

// 1. 定义响应式数据
const username = ref('')
const password = ref('')
const msgBox = ref('')
const isSubmitting = ref(false)

// 2. 获取路由实例
const router = useRouter()

// 3. 登录表单提交处理函数
const handleSubmit = async () => {
  // 清空旧提示
  msgBox.value = ''

  // 验证输入
  if (!username.value.trim() || !password.value.trim()) {
    msgBox.value = '请填写用户名和密码'
    ElMessage.warning('请填写用户名和密码')
    return
  }

  // 设置提交状态
  isSubmitting.value = true

  try {
    // 根据接口文档 ，登录接口为 /v1/auth/login，请求方式 POST
    // 注意：在 Vite 开发环境下，通常会通过 proxy 转发 /api，请确认你的 vite.config.js 配置
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        username: username.value.trim(),
        password: password.value.trim()
      })
    })

    const data = await res.json()

    // 根据接口规范 ，成功时 code 应为 0
    if (res.ok && data.code === 0) {
      // 存储 token [cite: 2, 4]
      localStorage.setItem('token', data.data.token)
      // 存储用户信息，供个人中心使用 
      localStorage.setItem('user_info', JSON.stringify(data.data.user_info))

      msgBox.value = '登录成功，正在跳转…'
      ElMessage.success('登录成功')

      // 处理登录后的重定向逻辑 
      const redirectPath = router.currentRoute.value.query.redirect
      await router.replace(typeof redirectPath === 'string' ? redirectPath : '/home')
    } else {
      // 处理后端返回的错误信息 
      throw new Error(data.message || '登录失败，请检查用户名或密码')
    }
  } catch (err) {
    msgBox.value = err.message
    ElMessage.error(err.message)
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
        <h2>保洁标准化后台</h2>
      </div>

      <form @submit.prevent="handleSubmit" id="login-form">
        <div class="form-field">
          <input
            type="text"
            id="username"
            placeholder="用户名 / 邮箱"
            required
            v-model="username"
            :disabled="isSubmitting"
          />
        </div>
        <div class="form-field">
          <input
            type="password"
            id="password"
            placeholder="密码"
            required
            v-model="password"
            :disabled="isSubmitting"
          />
        </div>

        <button
          type="submit"
          class="btn-login"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting">登录中...</span>
          <span v-else>登 录</span>
        </button>

        <p
          id="login-msg"
          class="login-msg"
          :style="{ color: msgBox.includes('成功') ? '#52c41a' : '#f5222d' }"
          v-if="msgBox"
        >
          {{ msgBox }}
        </p>
      </form>

      <div class="login-footer">
        © 2025 保洁标准化
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保持原有 UI 样式不变  */
.login-wrapper {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 24px;
}

.login-card {
  width: 380px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, .08);
  padding: 40px 42px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 48px;
  height: 48px;
}

.login-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

.form-field {
  margin-bottom: 18px;
}

.form-field input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 15px;
}

.form-field input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, .15);
}

.btn-login {
  width: 100%;
  height: 46px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-msg {
  margin-top: 12px;
  font-size: 14px;
  text-align: center;
}

.login-footer {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>