<template>
  <div class="profile-page">
    <div class="user-info card">
      <el-avatar :size="60">{{ userInfo.username?.charAt(0) }}</el-avatar>
      <div class="meta">
        <h3>{{ userInfo.username }}</h3>
        <el-tag size="small">{{ userInfo.role }}</el-tag>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card card">
        <div class="num">{{ stats.total_completed || 0 }}</div>
        <div class="label">本月完成</div>
      </div>
      <div class="stat-card card">
        <div class="num">{{ stats.qualification_rate || '0%' }}</div>
        <div class="label">合格率</div>
      </div>
      <div class="stat-card card">
        <div class="num">{{ stats.avg_score || '0.0' }}</div>
        <div class="label">平均得分</div>
      </div>
    </div>

    <div class="menu card">
      <div class="menu-item" @click="$router.push('/app/orders')">
        <span>历史工单查询</span>
        <el-icon><ArrowRight /></el-icon>
      </div>
      <div class="menu-item logout" @click="doLogout">
        <span>退出登录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const userInfo = ref(JSON.parse(localStorage.getItem('user_info') || '{}'))
const stats = ref({})

const loadStats = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch('/api/v1/app/personal/stats', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const result = await res.json()
    if (result.code === 0) {
      // 直接将 data 对象赋值给 stats
      stats.value = result.data || {
        total_completed: 0,
        qualification_rate: '0%',
        avg_score: '0.0'
      }
    }
  } catch (e) {
    console.error('获取个人统计失败')
  }
}

const doLogout = () => {
  localStorage.clear()
  router.replace('/login')
}

onMounted(loadStats)
</script>

<style scoped>
.profile-page { padding: 20px; background: #f8f9fa; min-height: 100vh; }
.card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.user-info { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.stat-card { text-align: center; padding: 15px 5px; }
.stat-card .num { font-size: 18px; font-weight: bold; color: #1890ff; }
.stat-card .label { font-size: 12px; color: #909399; margin-top: 4px; }
.menu-item { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #f0f0f0; }
.logout { color: #f5222d; margin-top: 10px; }
</style>