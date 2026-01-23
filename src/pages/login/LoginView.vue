<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'

// 定义响应式数据
const username = ref('')
const password = ref('')
const msgBox = ref('')
const isSubmitting = ref(false)

// 获取路由实例
const router = useRouter()


const getIsLogin = () => {
  setInterval(() => {
    let token = localStorage.getItem("token");
    if (token) {
      router.replace('/')
    }
  }, 100)
}



// 登录表单提交处理函数
const handleSubmit = async () => {
  // 清空旧提示
  msgBox.value = ''

  // 验证输入
  if (!username.value.trim() || !password.value.trim()) {
    msgBox.value = '请填写用户名和密码'
    return
  }

  // 设置提交状态
  isSubmitting.value = true

  try {
    // 发送登录请求
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        username: username.value.trim(),
        password: password.value.trim()
      })
    })

    const data = await res.json()

    if (res.ok && data.code === 0) {
      // 缓存 token 和用户信息
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user_info', JSON.stringify(data.data.user_info))

      // 显示成功消息并跳转
      msgBox.value = '登录成功，正在跳转…'
      const redirect = router.currentRoute.value.query.redirect
      await router.replace(typeof redirect === 'string' ? redirect : { name: 'home' })
    } else {
      // https://momenta.jobs.feishu.cn/s/eXB-sRTzTMc
      // QUWG3T9
      throw new Error(data.message || '登录失败')
    }
  } catch (err) {
    msgBox.value = err.message
  } finally {
    // 重置提交状态
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
          />
        </div>
        <div class="form-field">
          <input
              type="password"
              id="password"
              placeholder="密码"
              required
              v-model="password"
          />
        </div>

        <button
            type="submit"
            class="btn-login"
            :disabled="isSubmitting"
            :style="{ opacity: isSubmitting ? 0.6 : 1 }"
        >
          {{ isSubmitting ? '登录中...' : '登 录' }}
        </button>

        <p
            id="login-msg"
            class="login-msg"
            :style="{ color: msgBox.includes('成功') ? '#52c41a' : '#f5222d' }"
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
/* ===== 全局 ===== */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.login-wrapper {
  width: 100%;
  min-height: 100vh;         /* 占满视口高度 */
  display: flex;
  align-items: center;        /* 纵向居中 */
  justify-content: center;    /* 横向居中 */
  background: #f5f7fa;
  padding: 24px;              /* 防止超小屏幕贴边 */
}

/* ===== 登录卡片 ===== */
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

/* 头部 Logo + 标题 */
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

/* 表单字段 */
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

/* 登录按钮 */
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

.btn-login:hover {
  opacity: .9;
}

/* 错误 / 成功提示文字 */
.login-msg {
  margin-top: 12px;
  font-size: 14px;
  text-align: center;
  color: #f5222d; /* 默认红色；成功时 JS 会改成绿色 */
}

/* 底部版权 */
.login-footer {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  text-align: center;
}

</style>