<template>
  <div class="app-container" style="background: #f7f8fa; min-height: 100vh; padding-bottom: 50px;">
    <van-nav-bar title="保洁工作台" />

    <!-- 1. 工单详情 -->
    <WorkOrderDetail />

    <!-- 2. 流程进度 -->
    <div style="margin-top: 10px;">
      <!-- step 传进去，控制当前是第几步 -->
      <OrderProcess 
        :step="currentStep" 
        @status-update="handleStatusUpdate"
      />
    </div>

    <!-- 3. 完工验收 -->
    <div style="margin-top: 10px;">
      <!-- status 传进去，但不自动显隐，由组件内部控制 -->
      <OrderComplete 
        :order-id="3"
        :status="orderStatus" 
      />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getOrderDetailApi } from './api/orderService';
import WorkOrderDetail from './components/WorkOrderDetail.vue';
import OrderProcess from './components/OrderProcess.vue';
import OrderComplete from './components/OrderComplete.vue';

const orderStatus = ref(''); 
// 【关键修改】默认永远从 0 开始，不再根据后端状态自动跳转
// 这样你每次刷新都能看到“接单”按钮
const currentStep = ref(0); 

onMounted(async () => {
  try {
    const data = await getOrderDetailApi(3);
    if (data) {
      orderStatus.value = data.status;
      
      // 【注释掉自动跳转逻辑】
      // 以前这里会自动把 currentStep 设为 3，导致按钮都不见了。
      // 现在我们不设，让它保持 0。
      /*
      if (data.status === 'received') currentStep.value = 1;
      else if (data.status === 'arrived') currentStep.value = 2;
      else if (data.status === 'completed') currentStep.value = 3;
      */
    }
  } catch (error) {
    console.error(error);
  }
});

// 子组件点击成功后，会触发这个，我们让进度条往前走一步
const handleStatusUpdate = (actionType) => {
  if (currentStep.value < 2) {
    currentStep.value++;
  }
};
</script>