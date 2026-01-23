<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const dashboardData = ref({
  totalOrders: 0,
  completedOrders: 0,
  pendingOrders: 0,
  cancelledOrders: 0,
  todayOrders: 0,
  avgScore: 0,
  avgDuration: 0
})

const charts = {
  orderTrend: null,
  orderStatus: null,
  cleanerPerformance: null,
  sceneDistribution: null
}

const refreshInterval = ref(null)

const loadDashboardData = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/v1/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await res.json()
    if (data.code === 0) {
      dashboardData.value = data.data.summary || dashboardData.value
      updateCharts(data.data.charts || {})
    } else {
      ElMessage.error(data.message || '获取看板数据失败')
    }
  } catch (error) {
    console.error('获取看板数据失败:', error)
    ElMessage.error('获取看板数据失败')
  } finally {
    loading.value = false
  }
}

const initOrderTrendChart = (data) => {
  const chartDom = document.getElementById('orderTrendChart')
  if (!chartDom) return
  
  if (charts.orderTrend) {
    charts.orderTrend.dispose()
  }
  
  charts.orderTrend = echarts.init(chartDom)
  
  const option = {
    title: {
      text: '订单趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['派单量', '完成量'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: data.dates || ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '派单量',
        type: 'line',
        data: data.dispatch || [120, 132, 101, 134, 90, 230, 210],
        smooth: true,
        itemStyle: {
          color: '#5470c6'
        }
      },
      {
        name: '完成量',
        type: 'line',
        data: data.completed || [110, 122, 91, 124, 80, 210, 200],
        smooth: true,
        itemStyle: {
          color: '#91cc75'
        }
      }
    ]
  }
  
  charts.orderTrend.setOption(option)
}

const initOrderStatusChart = (data) => {
  const chartDom = document.getElementById('orderStatusChart')
  if (!chartDom) return
  
  if (charts.orderStatus) {
    charts.orderStatus.dispose()
  }
  
  charts.orderStatus = echarts.init(chartDom)
  
  const option = {
    title: {
      text: '订单状态分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: '50%',
        data: data.status || [
          { value: 1048, name: '已完成' },
          { value: 735, name: '进行中' },
          { value: 580, name: '待接单' },
          { value: 484, name: '已取消' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  charts.orderStatus.setOption(option)
}

const initCleanerPerformanceChart = (data) => {
  const chartDom = document.getElementById('cleanerPerformanceChart')
  if (!chartDom) return
  
  if (charts.cleanerPerformance) {
    charts.cleanerPerformance.dispose()
  }
  
  charts.cleanerPerformance = echarts.init(chartDom)
  
  const option = {
    title: {
      text: '保洁员绩效排行',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: data.names || ['张三', '李四', '王五', '赵六', '孙七']
    },
    series: [
      {
        name: '完成订单数',
        type: 'bar',
        data: data.orders || [182, 234, 290, 104, 167],
        itemStyle: {
          color: '#5470c6'
        }
      }
    ]
  }
  
  charts.cleanerPerformance.setOption(option)
}

const initSceneDistributionChart = (data) => {
  const chartDom = document.getElementById('sceneDistributionChart')
  if (!chartDom) return
  
  if (charts.sceneDistribution) {
    charts.sceneDistribution.dispose()
  }
  
  charts.sceneDistribution = echarts.init(chartDom)
  
  const option = {
    title: {
      text: '场景分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        name: '场景分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.scenes || [
          { value: 1048, name: '卫生间' },
          { value: 735, name: '厨房' },
          { value: 580, name: '客厅' },
          { value: 484, name: '卧室' },
          { value: 300, name: '阳台' }
        ]
      }
    ]
  }
  
  charts.sceneDistribution.setOption(option)
}

const updateCharts = (chartData) => {
  initOrderTrendChart(chartData.trend || {})
  initOrderStatusChart(chartData.status || {})
  initCleanerPerformanceChart(chartData.performance || {})
  initSceneDistributionChart(chartData.scenes || {})
}

const handleResize = () => {
  Object.values(charts).forEach(chart => {
    if (chart) {
      chart.resize()
    }
  })
}

onMounted(() => {
  loadDashboardData()
  refreshInterval.value = setInterval(loadDashboardData, 60000)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(chart => {
    if (chart) {
      chart.dispose()
    }
  })
})
</script>

<template>
  <div class="dashboard-container">
    <div class="page-header">
      <h1>数据看板</h1>
      <el-button type="primary" @click="loadDashboardData" :loading="loading">
        <el-icon><Refresh /></el-icon> 刷新数据
      </el-button>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dashboardData.totalOrders }}</div>
          <div class="stat-label">总订单数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon completed">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dashboardData.completedOrders }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pending">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dashboardData.pendingOrders }}</div>
          <div class="stat-label">待接单</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon cancelled">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dashboardData.cancelledOrders }}</div>
          <div class="stat-label">已取消</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon today">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dashboardData.todayOrders }}</div>
          <div class="stat-label">今日订单</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon score">
          <el-icon><Star /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dashboardData.avgScore }}</div>
          <div class="stat-label">平均评分</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon duration">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dashboardData.avgDuration }}</div>
          <div class="stat-label">平均耗时(分钟)</div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <div id="orderTrendChart" class="chart"></div>
      </div>

      <div class="chart-card">
        <div id="orderStatusChart" class="chart"></div>
      </div>

      <div class="chart-card">
        <div id="cleanerPerformanceChart" class="chart"></div>
      </div>

      <div class="chart-card">
        <div id="sceneDistributionChart" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
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

.stat-icon.completed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #fff;
}

.stat-icon.cancelled {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: #fff;
}

.stat-icon.today {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #1f2d3d;
}

.stat-icon.score {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.stat-icon.duration {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: #1f2d3d;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2d3d;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-height: 400px;
}

.chart {
  width: 100%;
  height: 350px;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
