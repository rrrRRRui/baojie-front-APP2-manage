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
import { getOrderDetailApi } from '../api/orderService';

const loading = ref(true);
const detail = ref({});

onMounted(async () => {
  try {
    // 【重要】我们先死写 ID 为 3，因为你的 Token 和数据都是针对 ID 3 的
    const data = await getOrderDetailApi(3);
    
    // 字段映射：左边是前端用的，右边是后端返回的
    if (data) {
      detail.value = {
        id: data.order_no,             // 工单号 (WO2026...)
        area: data.area,               // 区域
        task: data.clean_requirement,  // 任务内容
        level: '普通',                 // 后端没返回优先级，先写死
        status: data.status            // completed
      };
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
});
</script>