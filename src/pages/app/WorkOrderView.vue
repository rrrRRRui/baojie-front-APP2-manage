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
        <div class="card-content">
          <p><strong>区域:</strong> {{ item.area }}</p>
          <p v-if="item.completed_at"><strong>完成时间:</strong> {{ item.completed_at }}</p>
          <p v-if="item.final_score"><strong>最终得分:</strong> <span class="score">{{ item.final_score }}</span></p>
          <p v-if="item.is_qualified !== undefined">
            <strong>是否合格:</strong> 
            <el-tag :type="item.is_qualified ? 'success' : 'danger'" size="small">
              {{ item.is_qualified ? '合格' : '不合格' }}
            </el-tag>
          </p>
        </div>
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
const activeStatus = ref('') // 绑定 tabs 的 name

const fetchOrders = async () => {
  loading.value = true
  const token = localStorage.getItem('token')
  
  try {
    // 路径必须带 /api 前缀以匹配 vite.config.js 的代理
    const res = await fetch('/api/v1/app/work-orders/history?page=1&limit=50', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    
    console.log('工单列表原始数据:', data)

    if (data.code === 0) {
      // 核心：对接后端返回的 work_orders 数组
      const rawList = data.data.work_orders || []
      
      // 执行前端状态过滤
      if (activeStatus.value) {
        orders.value = rawList.filter(o => o.status === activeStatus.value)
      } else {
        orders.value = rawList
      }
    } else {
      ElMessage.error(data.message || '获取工单失败')
    }
  } catch (err) {
    ElMessage.error('网络错误，请检查后端服务')
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)
</script>

<style scoped>
.work-order-page { padding: 16px; background: #f5f7fa; min-height: 100vh; }
.header { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 16px; }
.order-card { margin-bottom: 12px; border-radius: 8px; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
.card-content p { margin: 8px 0; font-size: 14px; color: #606266; }
.score { color: #f5222d; font-weight: bold; }
</style>