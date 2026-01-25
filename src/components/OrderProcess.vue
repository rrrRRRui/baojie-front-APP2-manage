<template>
  <van-cell-group inset title="执行进度" style="margin-top: 12px">
    <van-steps :active="activeStep" direction="vertical">
      <van-step>
        <h3>待接单</h3>
        <p v-if="logs.receive">接单时间: {{ logs.receive }}</p>
      </van-step>
      <van-step>
        <h3>前往中</h3>
        <p v-if="logs.arrive">到场时间: {{ logs.arrive }}</p>
      </van-step>
      <van-step>作业中</van-step>
    </van-steps>

    <div style="padding: 16px">
      <!-- 按钮根据状态切换 -->
      <van-button 
        v-if="activeStep === 0" 
        type="primary" block 
        :loading="loading"
        @click="handleAction('RECEIVE')">
        确认接单
      </van-button>
      
      <van-button 
        v-if="activeStep === 1" 
        type="success" block 
        :loading="loading"
        @click="handleAction('ARRIVE')">
        确认到场
      </van-button>
    </div>
  </van-cell-group>
</template>

<script setup>
import { ref, defineEmits } from 'vue';
import { updateOrderActionApi } from '../api/orderService';

const emit = defineEmits(['status-update']); // 通知父组件
const activeStep = ref(0);
const loading = ref(false);
const logs = ref({ receive: '', arrive: '' });

const handleAction = async (type) => {
  loading.value = true;
  await updateOrderActionApi('GD-1001', type); // 调用接口
  
  const nowTime = new Date().toLocaleTimeString();
  
  if (type === 'RECEIVE') {
    activeStep.value = 1;
    logs.value.receive = nowTime;
    emit('status-update', 'working'); // 告诉父组件：我在路上了
  } else {
    activeStep.value = 2;
    logs.value.arrive = nowTime;
    emit('status-update', 'arrived'); // 告诉父组件：我到了
  }
  
  loading.value = false;
};
</script>