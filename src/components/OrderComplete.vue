<template>
  <van-cell-group inset title="完工验收" style="margin-top: 12px">
    
    <!-- 【修改点】去掉 status !== 'completed' 的判断 -->
    <!-- 现在只有当用户点击提交并获得结果(resultCode)后，表单才会消失 -->
    <div v-if="!resultCode">
      <van-field name="switch" label="合格确认">
        <template #input>
          <van-switch v-model="isOk" size="20" />
          <span style="margin-left: 10px; font-size: 14px; color: #666">
            {{ isOk ? '已确认合格' : '请确认' }}
          </span>
        </template>
      </van-field>

      <van-field label="现场拍照">
        <template #input>
          <van-uploader v-model="photos" max-count="2" />
        </template>
      </van-field>

      <div style="padding: 16px">
        <van-button 
          type="primary" 
          block 
          :loading="loading" 
          :disabled="!isOk"
          @click="submit">
          提交并生成记录
        </van-button>
      </div>
    </div>

    <!-- 成功结果页 -->
    <div v-else style="padding: 30px 20px; text-align: center; color: #07c160">
      <van-icon name="checked" size="60" />
      <h3 style="margin: 10px 0; color: #333">工单已归档</h3>
      <p style="font-size: 14px; color: #999">
        状态: <span style="font-weight: bold; color: #333">已完成</span>
      </p>
      <p v-if="resultCode !== 'HISTORY-RECORD'" style="font-size: 12px; color: #999">
        Code: {{ resultCode }}
      </p>
    </div>

  </van-cell-group>
</template>

<script setup>
import { ref, defineProps } from 'vue';
import { completeOrderApi } from '../api/orderService';
import { showToast } from 'vant';

const props = defineProps({
  orderId: {
    type: [Number, String],
    default: 3
  },
  // 虽然 App.vue 还在传 status，但我们在 template 里不再用它控制显隐了
  status: String 
});

const isOk = ref(false);
const photos = ref([]);
const loading = ref(false);
const resultCode = ref(''); 

const submit = async () => {
  if (!isOk.value) return showToast('请先确认清洁合格');
  
  loading.value = true;
  try {
    const res = await completeOrderApi(props.orderId, {
      qualified: true,
      photoCount: photos.value.length
    });
    
    // 1. 如果真的提交成功 (首次提交)
    showToast({ type: 'success', message: '提交成功' });
    resultCode.value = res?.traceCode || 'WO-' + Date.now();

  } catch (error) {
    // 2. 【关键逻辑】如果后端返回 4002 (说明之前已经完成过了)
    // 我们在这里捕获错误，并手动让界面变成“成功态”
    if (error.code === 4002) {
       showToast('后台状态同步：工单已完成');
       // 给 resultCode 赋值，触发 v-else，界面就会变成绿色对勾
       resultCode.value = 'HISTORY-RECORD'; 
    } else {
       console.error(error);
    }
  } finally {
    loading.value = false;
  }
};
</script>