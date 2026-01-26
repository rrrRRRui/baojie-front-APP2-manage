<template>
  <div class="work-order-page">
    <div class="header">我的工单</div>
    <el-tabs v-model="activeStatus" class="tabs" @tab-change="fetchOrders">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="待处理" name="pending" />
      <el-tab-pane label="已完成" name="completed" />
    </el-tabs>

    <div v-loading="loading" class="list">
      <el-card v-for="item in orders" :key="item.id" class="order-card">
        <template #header>
          <div class="card-header">
            <span>单号: {{ item.order_no }}</span>
            <el-tag :type="item.status === 'completed' ? 'success' : 'warning'">
              {{ item.status === 'completed' ? '已完成' : '待处理' }}
            </el-tag>
          </div>
        </template>
        <p><strong>区域:</strong> {{ item.area }}</p>
        <p v-if="item.completed_at"><strong>完成时间:</strong> {{ item.completed_at }}</p>
        <p v-if="item.final_score"><strong>最终得分:</strong> <span class="score">{{ item.final_score }}</span></p>
      </el-card>
      <el-empty v-if="!loading && orders.length === 0" description="暂无工单数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const orders = ref([])
const loading = ref(false)
const activeStatus = ref('') // 对应 Tabs 的 name

const fetchOrders = async () => {
  loading.value = true
  const token = localStorage.getItem('token')
  
  if (!token) {
    ElMessage.error('登录失效，请重新登录')
    return
  }

  try {
    // 路径必须以 /api 开头以触发代理转发
    const res = await fetch('/api/v1/app/work-orders/history?page=1&limit=10', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await res.json()
    console.log('工单接口返回:', result)

    if (result.code === 0) {
      // 核心：对接文档中的 work_orders 字段
      const rawOrders = result.data.work_orders || []
      
      // 执行前端筛选
      if (activeStatus.value) {
        orders.value = rawOrders.filter(o => o.status === activeStatus.value)
      } else {
        orders.value = rawOrders
      }
    } else {
      ElMessage.error(result.message || '获取工单失败')
    }
  } catch (err) {
    console.error('网络异常:', err)
    ElMessage.error('网络异常，请检查后端服务是否启动')
  } finally {
    loading.value = false
  }
}

// 监听 Tab 切换
const handleTabChange = () => {
  fetchOrders()
}

onMounted(fetchOrders)
</script>

<style scoped>
.work-order-page { padding: 16px; background: #f5f7fa; min-height: 100vh; }
.header { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 16px; }
.order-card { margin-bottom: 12px; border-radius: 8px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.score { color: #f5222d; font-weight: bold; }
</style>