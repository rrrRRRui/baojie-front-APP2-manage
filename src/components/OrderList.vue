<template>
  <el-card class="box-card" shadow="hover" style="height: 100%; display:flex; flex-direction:column">
    <template #header>
      <div class="card-header" style="display:flex; justify-content:space-between">
        <span>📡 实时监控大厅</span>
        <el-button size="small" @click="loadData">刷新</el-button>
      </div>
    </template>

    <div style="flex: 1; overflow: hidden;">
      <el-table :data="orders" stripe height="100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="工单详情" min-width="200">
          <template #default="{ row }">
            <div style="font-weight:bold">{{ row.address }}</div>
            <div style="font-size:12px; color:#666">
              {{ row.customerName }} | {{ row.time }}
            </div>
            <el-tag 
              v-for="tag in row.requirements.tags" :key="tag" 
              size="small" type="info" style="margin-right:4px; margin-top:4px">
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'PENDING' ? 'warning' : 'success'">
              {{ row.status === 'PENDING' ? '待派单' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="保洁员" width="90" prop="cleanerName">
          <template #default="{ row }">
            {{ row.cleanerName || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'PENDING'"
              type="primary" link 
              @click="$emit('dispatch', row)">
              派单
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// 【重点修改这里】
import OrderService from '../OrderService';

const orders = ref([]);
const loading = ref(false);

const loadData = async () => {
  loading.value = true;
  orders.value = await OrderService.getOrders();
  loading.value = false;
};

onMounted(() => {
  loadData();
  OrderService.onDataChange(() => {
    loadData();
  });
});
</script>