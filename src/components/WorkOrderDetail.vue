<template>
  <van-skeleton title :row="3" :loading="loading">
    <van-cell-group inset title="工单信息">
      <van-cell title="工单号" :value="detail.id" />
      <van-cell title="作业区域" :value="detail.area" label="请携带专业清洁工具" />
      <van-cell title="任务内容" :value="detail.task" />
      <van-cell title="优先级">
        <template #value>
          <van-tag type="danger">{{ detail.level }}</van-tag>
        </template>
      </van-cell>
    </van-cell-group>
  </van-skeleton>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getOrderDetailApi } from '../api/orderService'; // 引入API

const loading = ref(true);
const detail = ref({});

onMounted(async () => {
  // 模拟进入页面自动获取 ID 为 1001 的工单
  const res = await getOrderDetailApi('GD-1001');
  if (res.code === 200) {
    detail.value = res.data;
  }
  loading.value = false;
});
</script>