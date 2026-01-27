<template>
  <div class="profile-page">
    <div class="user-info-card">
      <el-avatar :size="64">{{ userInfo.username?.charAt(0) }}</el-avatar>
      <div class="user-detail">
        <h2>{{ userInfo.username }}</h2>
        <el-tag type="info" size="small">{{ userInfo.role }}</el-tag>
      </div>
    </div>

    <div class="stats-container">
      <div class="stat-box">
        <div class="val">{{ stats.total_completed || 0 }}</div>
        <div class="lab">本月完成</div>
      </div>
      <div class="stat-box">
        <div class="val">{{ stats.qualification_rate || '0%' }}</div>
        <div class="lab">合格率</div>
      </div>
      <div class="stat-box">
        <div class="val">{{ stats.avg_score || '0.0' }}</div>
        <div class="lab">平均得分</div>
      </div>
    </div>

    <div class="action-list">
      <div class="action-item" @click="$router.push('/app/orders')">
        <div class="item-left">
          <el-icon><Timer /></el-icon>
          <span>历史工单查询</span>
        </div>
        <el-icon><ArrowRight /></el-icon>
      </div>
      
      <div class="action-item logout" @click="handleLogout">
        <span>退出登录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// 修正：从 @element-plus/icons-vue 导入正确的图标名 Timer
import { ArrowRight, Timer } from '@element-plus/icons-vue'

const router = useRouter()
// 确保从 localStorage 读取的是 user_info
const userInfo = ref(JSON.parse(localStorage.getItem('user_info') || '{}'))
const stats = ref({
  total_completed: 0,
  qualification_rate: '0%',
  avg_score: '0.0'
})

const loadStats = async () => {
  const token = localStorage.getItem('token')
  try {
    // 路径使用 /api 以触发 vite.config.js 代理转发
    const res = await fetch('/api/v1/app/personal/stats', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.code === 0) {
      // 匹配后端文档返回的 data 统计对象
      stats.value = data.data || {}
    }
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

const handleLogout = () => {
  localStorage.clear()
  router.replace('/login')
}

onMounted(() => {
  if (!localStorage.getItem('token')) {
    router.replace('/login')
  } else {
    loadStats()
  }
})
</script>

<style scoped>
.profile-page { padding: 20px; background: #f9f9f9; min-height: 100vh; }
.user-info-card { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.user-detail h2 { margin: 0 0 5px 0; font-size: 20px; }
.stats-container { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.stat-box { background: #fff; padding: 15px 5px; border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.stat-box .val { font-size: 20px; font-weight: bold; color: #1890ff; }
.stat-box .lab { font-size: 12px; color: #999; margin-top: 5px; }
.action-list { background: #fff; border-radius: 10px; overflow: hidden; }
.action-item { padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.item-left { display: flex; align-items: center; gap: 10px; }
.logout { color: #f5222d; justify-content: center; font-weight: bold; border-bottom: none; }
</style>