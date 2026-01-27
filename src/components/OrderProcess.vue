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
import { confirmReceiveApi, confirmArriveApi } from '../api/orderService';

const emit = defineEmits(['status-update']);
const activeStep = ref(0);
const loading = ref(false);
const logs = ref({ receive: '', arrive: '' });

// 这是一个通用的处理函数
const handleAction = async (type) => {
  loading.value = true;
  try {
    // 依然使用 ID 3
    if (type === 'RECEIVE') {
      await confirmReceiveApi(3);
      // 如果成功：
      const now = new Date().toLocaleTimeString();
      logs.value.receive = now;
      activeStep.value = 1;
      emit('status-update', 'working');
      
    } else if (type === 'ARRIVE') {
      await confirmArriveApi(3);
      // 如果成功：
      const now = new Date().toLocaleTimeString();
      logs.value.arrive = now;
      activeStep.value = 2;
      emit('status-update', 'arrived');
    }
  } catch (error) {
    // 这里会捕获到 4002 错误
    // 比如提示 "工单已完成，无需确认到场"
    // 这证明接口通了！只是逻辑被后端拦截了
  } finally {
    loading.value = false;
  }
};
</script>