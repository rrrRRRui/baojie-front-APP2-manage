<template>
  <van-cell-group inset title="完工验收" style="margin-top: 12px">
    <van-field name="switch" label="合格确认">
      <template #input>
        <van-switch v-model="isOk" size="20" />
        <span style="margin-left: 10px; font-size: 14px">{{ isOk ? '已确认合格' : '未确认' }}</span>
      </template>
    </van-field>

    <van-field label="现场拍照">
      <template #input>
        <van-uploader v-model="photos" max-count="2" />
      </template>
    </van-field>

    <div style="padding: 16px">
      <van-button type="primary" block :loading="loading" @click="submit">
        提交并生成记录
      </van-button>
    </div>

    <!-- 结果展示 -->
    <div v-if="resultCode" style="padding: 20px; text-align: center; color: #07c160">
      <van-icon name="checked" size="40" />
      <p style="font-weight: bold">工单已归档</p>
      <p style="font-size: 12px; color: #999">追溯码: {{ resultCode }}</p>
    </div>
  </van-cell-group>
</template>

<script setup>
import { ref } from 'vue';
import { completeOrderApi } from '../api/orderService';
import { showToast } from 'vant';

const isOk = ref(false);
const photos = ref([]);
const loading = ref(false);
const resultCode = ref('');

const submit = async () => {
  if (!isOk.value) return showToast('请先确认清洁合格');
  
  loading.value = true;
  // 调用接口
  const res = await completeOrderApi({
    id: 'GD-1001',
    qualified: true,
    photoCount: photos.value.length
  });
  
  if (res.code === 200) {
    resultCode.value = res.traceCode;
    showToast('提交成功');
  }
  loading.value = false;
};
</script>