<template>
  <van-cell-group inset title="执行进度">
    <van-steps :active="step" direction="vertical">
      
      <!-- 第一步：接单 -->
      <van-step>
        <h3>{{ logs.receive ? '已接单' : '待接单' }}</h3>
        <!-- 如果有时间，显示时间 -->
        <p v-if="logs.receive">接单时间: {{ logs.receive }}</p>
      </van-step>
      
      <!-- 第二步：到场 -->
      <van-step>
        <h3>{{ logs.arrive ? '已到场' : '前往中' }}</h3>
        <p v-if="logs.arrive">到场时间: {{ logs.arrive }}</p>
      </van-step>
      
      <van-step>作业中</van-step>
    </van-steps>

    <div style="padding: 16px">
      <!-- 只有当 step 为 0 且 还没显示时间时，显示接单按钮 -->
      <van-button 
        v-if="step === 0 && !logs.receive" 
        type="primary" block 
        :loading="loading"
        @click="handleAction('RECEIVE')">
        确认接单
      </van-button>
      
      <!-- 只有当 step 为 1 且 还没显示时间时，显示到场按钮 -->
      <van-button 
        v-if="step === 1 && !logs.arrive" 
        type="success" block 
        :loading="loading"
        @click="handleAction('ARRIVE')">
        确认到场
      </van-button>
      
      <div v-if="step >= 2" style="text-align: center; color: #999; font-size: 14px;">
        当前处于作业状态，请完工后拍照
      </div>
    </div>
  </van-cell-group>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import { confirmReceiveApi, confirmArriveApi } from '../api/orderService';
import { showToast } from 'vant';

const props = defineProps({
  step: { type: Number, default: 0 }
});

const emit = defineEmits(['status-update']);
const loading = ref(false);
// 用来存储显示的时间
const logs = ref({ receive: '', arrive: '' });

const handleAction = async (type) => {
  loading.value = true;
  
  // 生成一个当前时间字符串
  const nowTime = new Date().toLocaleTimeString();

  try {
    if (type === 'RECEIVE') {
      await confirmReceiveApi(3);
      showToast('接单成功');
      
      // 成功后：1.设置时间 2.通知父组件跳下一步
      logs.value.receive = nowTime;
      emit('status-update', 'working');
      
    } else if (type === 'ARRIVE') {
      await confirmArriveApi(3);
      showToast('已确认到场');
      
      logs.value.arrive = nowTime;
      emit('status-update', 'arrived');
    }
  } catch (error) {
    // 【关键】：如果后端报错 4002 (说明以前点过了)
    if (error.code === 4002) {
      showToast('状态同步成功');
      
      // 我们也要假装刚才点击成功了，补上时间，并跳下一步
      if (type === 'RECEIVE') {
        logs.value.receive = nowTime + ' (已同步)';
        emit('status-update', 'working');
      } else if (type === 'ARRIVE') {
        logs.value.arrive = nowTime + ' (已同步)';
        emit('status-update', 'arrived');
      }
    } else {
      console.error(error);
    }
  } finally {
    loading.value = false;
  }
};
</script>