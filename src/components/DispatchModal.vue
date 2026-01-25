<template>
  <el-dialog 
    :model-value="visible" 
    title="👨‍🚀 指派保洁员" 
    width="500px"
    @close="$emit('update:visible', false)"
  >
    <div v-if="order" style="margin-bottom: 15px; color: #666;">
      当前指派工单：<span style="color:#000; font-weight:bold">{{ order.address }}</span>
    </div>
    
    <el-table :data="cleaners" highlight-current-row v-loading="loading">
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'IDLE' ? 'success' : 'info'">
            {{ row.status === 'IDLE' ? '空闲' : '忙碌' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="skills" label="技能">
        <template #default="{ row }">
          {{ row.skills.join('、') }}
        </template>
      </el-table-column>
      <el-table-column width="80" align="right">
        <template #default="{ row }">
           <el-button 
             :disabled="row.status !== 'IDLE'"
             type="primary" link 
             @click="confirmDispatch(row.id)">
             选择
           </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
// 【重点修改这里】
import OrderService from '../OrderService';

const props = defineProps({
  visible: Boolean,
  order: Object
});
const emit = defineEmits(['update:visible', 'success']);

const cleaners = ref([]);
const loading = ref(false);

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    loading.value = true;
    cleaners.value = await OrderService.getCleaners();
    loading.value = false;
  }
});

const confirmDispatch = async (cleanerId) => {
  try {
    await OrderService.dispatchOrder(props.order.id, cleanerId);
    ElMessage.success('派单成功');
    emit('update:visible', false);
    emit('success');
  } catch (e) {
    ElMessage.error(e);
  }
};
</script>