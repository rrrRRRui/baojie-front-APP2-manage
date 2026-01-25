<template>
  <div class="worker-li-app">
    <van-nav-bar title="保洁工作台" />

    <!-- 1. 详情模块 -->
    <WorkOrderDetail />

    <!-- 2. 进度模块 (如果没完工，就显示这个) -->
    <OrderProcess 
      v-if="!isFinished" 
      @status-update="handleStatus" 
    />

    <!-- 3. 完结模块 (只有状态变成了 'arrived' 也就是到场后，才显示) -->
    <OrderComplete 
      v-if="currentStatus === 'arrived'" 
    />
    
  </div>
</template>

<script setup>
import { ref } from 'vue';
import WorkOrderDetail from './components/WorkOrderDetail.vue';
import OrderProcess from './components/OrderProcess.vue';
import OrderComplete from './components/OrderComplete.vue';

const currentStatus = ref('pending'); // pending -> working -> arrived
const isFinished = ref(false);

const handleStatus = (val) => {
  currentStatus.value = val;
};
</script>

<style>
body {
  background-color: #f7f8fa;
}
.worker-li-app {
  min-height: 100vh;
  padding-bottom: 50px;
}
</style>