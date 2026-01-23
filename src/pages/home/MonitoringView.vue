<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const monitoringData = ref({
  totalOrders: 0,
  inProgressOrders: 0,
  completedOrders: 0,
  pendingOrders: 0,
  todayOrders: 0
})

const orderList = ref([])
const refreshInterval = ref(null)

const loadMonitoringData = async () => {
    loading.value = true
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/v1/admin/work-orders/monitor', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (data.code === 0) {
        monitoringData.value = data.data.summary || monitoringData.value
        orderList.value = data.data.orders || []
      } else {
        ElMessage.error(data.message || '获取监控数据失败')
      }
    } catch (error) {
      console.error('获取监控数据失败:', error)
      ElMessage.error('获取监控数据失败')
    } finally {
      loading.value = false
    }
  }

const getStatusType = (status) => {
  const statusMap = {
    'pending': 'warning',
    'in_progress': 'primary',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待接单',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  loadMonitoringData()
  refreshInterval.value = setInterval(loadMonitoringData, 30000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<template>
  <div class="monitoring-container">
    <div class="page-header">
      <h1>执行过程监控</h1>
      <el-button type="primary" @click="loadMonitoringData" :loading="loading">
        <el-icon><Refresh /></el-icon> 刷新数据
      </el-button>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ monitoringData.totalOrders }}</div>
          <div class="stat-label">总订单数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon progress">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ monitoringData.inProgressOrders }}</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon completed">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ monitoringData.completedOrders }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pending">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ monitoringData.pendingOrders }}</div>
          <div class="stat-label">待接单</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon today">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ monitoringData.todayOrders }}</div>
          <div class="stat-label">今日订单</div>
        </div>
      </div>
    </div>

    <div class="order-list-section">
      <div class="section-header">
        <h2>实时订单列表</h2>
        <el-tag type="info">每30秒自动刷新</el-tag>
      </div>

      <el-table :data="orderList" v-loading="loading" stripe>
        <el-table-column prop="id" label="订单ID" width="100" />
        <el-table-column prop="scene" label="场景" width="200" />
        <el-table-column prop="cleaner" label="保洁员" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="completeTime" label="完成时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.completeTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时(分钟)" width="120" />
        <el-table-column prop="score" label="评分" width="100" />
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.monitoring-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: calc(100vh - 80px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.stat-icon.progress {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.stat-icon.completed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #fff;
}

.stat-icon.today {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #1f2d3d;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2d3d;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.order-list-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0;
}
</style>
