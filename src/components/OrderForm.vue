<template>
  <el-card class="box-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>📝 新建工单</span>
      </div>
    </template>
    
    <el-form :model="form" label-position="top" ref="formRef">
      <el-form-item label="客户信息">
        <el-row :gutter="10">
          <el-col :span="12">
            <el-input v-model="form.customerName" placeholder="姓名" />
          </el-col>
          <el-col :span="12">
            <el-input v-model="form.phone" placeholder="电话" />
          </el-col>
        </el-row>
      </el-form-item>
      
      <el-form-item label="服务地址">
        <el-input v-model="form.address" placeholder="请输入详细地址" />
      </el-form-item>

      <el-form-item label="预约时间">
        <el-date-picker
          v-model="form.time"
          type="datetime"
          placeholder="选择时间"
          style="width: 100%"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm"
        />
      </el-form-item>

      <el-divider content-position="left">打扫要求</el-divider>

      <el-form-item>
        <el-checkbox-group v-model="form.requirements.tags">
          <el-checkbox-button label="深度清洁" />
          <el-checkbox-button label="擦窗" />
          <el-checkbox-button label="除螨" />
        </el-checkbox-group>
      </el-form-item>

      <el-form-item>
        <el-input 
          v-model="form.requirements.note" 
          type="textarea" 
          placeholder="特殊备注（如：有宠物）" 
        />
      </el-form-item>

      <el-button type="primary" :loading="loading" style="width: 100%" @click="submitOrder">
        发布工单
      </el-button>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
// 【重点修改这里】：从 components 目录往上一级找 OrderService
import OrderService from '../OrderService'; 

const loading = ref(false);
const form = reactive({
  customerName: '',
  phone: '',
  address: '',
  time: '',
  requirements: { tags: [], note: '' }
});

const submitOrder = async () => {
  if (!form.customerName || !form.address) return ElMessage.warning('请补全信息');

  loading.value = true;
  try {
    await OrderService.createOrder({ ...form });
    ElMessage.success('工单创建成功');
    // 重置
    form.customerName = '';
    form.address = '';
    form.phone = '';
    form.time = '';
    form.requirements.tags = [];
    form.requirements.note = '';
  } catch (e) {
    ElMessage.error('创建失败');
  } finally {
    loading.value = false;
  }
};
</script>