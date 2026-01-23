<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'

import MonitoringView from './MonitoringView.vue'
import DashboardView from './DashboardView.vue'

const activeTab = ref('monitoring')
const switchTab = (tab) => {
  activeTab.value = tab
}

const router = useRouter()
const handleRelogin = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重新登录吗？当前会话将退出。',
      '重新登录',
      { type: 'warning', confirmButtonText: '重新登录', cancelButtonText: '取消' }
    )
    localStorage.removeItem('token')
    localStorage.removeItem('user_info')
    ElMessage.success('已退出，请重新登录')
    await router.replace({ name: 'login' })
  } catch {
  }
}
</script>

<template>
  <div>
    <header class="navbar">
      <div class="logo">
        <img src="../../asset/img/app.png" alt="应用图标" class="app-icon">
        <span>保洁标准化—管理后台</span>
      </div>
      <nav>
        <ul id="tabs">
          <li :class="{ active: activeTab === 'monitoring' }" @click="switchTab('monitoring')">执行过程监控</li>
          <li :class="{ active: activeTab === 'dashboard' }" @click="switchTab('dashboard')">数据看板</li>
        </ul>
      </nav>
      <div class="avatar" @click="handleRelogin" title="重新登录">
        <img src="../../asset/img/user.png" alt="用户图标" class="user-icon">
      </div>
    </header>

    <main>
      <MonitoringView v-if="activeTab === 'monitoring'" />
      <DashboardView v-if="activeTab === 'dashboard'" />
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.navbar {
  display: flex;
  align-items: center;
  height: 80px;
  padding: 0 40px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
}

.logo {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-icon {
  width: 24px;
  height: 24px;
}

.navbar ul {
  list-style: none;
  display: flex;
  margin-left: 80px;
  gap: 50px;
}

.navbar li {
  cursor: pointer;
  padding: 4px 18px;
  position: relative;
  transition: color 0.3s;
}

.navbar li:hover {
  color: #1890ff;
}

.navbar li.active {
  color: #1890ff;
}

.navbar li.active::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -8px;
  width: 100%;
  height: 2px;
  background: #1890ff;
}

.avatar {
  margin-left: auto;
  font-size: 22px;
  cursor: pointer;
}

.user-icon {
  width: 24px;
  height: 24px;
  margin-top: 5px;
  transition: transform .15s ease, filter .15s ease;
}

.avatar:hover .user-icon {
  transform: scale(1.06);
  filter: drop-shadow(0 2px 6px rgba(0,0,0,.12));
}

main {
  min-height: calc(100vh - 80px);
}
</style>
