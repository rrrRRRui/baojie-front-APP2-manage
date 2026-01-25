<template>
  <div class="app-layout">
    <!-- 顶部 -->
    <header class="header">
      <div class="logo">🧹 洁净帮管理后台 (Mock Mode)</div>
    </header>

    <!-- 内容区 -->
    <main class="content">
      <div class="left-panel">
        <!-- 左侧表单组件 -->
        <OrderForm />
      </div>
      <div class="right-panel">
        <!-- 右侧列表组件：监听 dispatch 事件 -->
        <OrderList @dispatch="handleOpenModal" />
      </div>
    </main>

    <!-- 弹窗组件 -->
    <DispatchModal 
      v-model:visible="modalVisible"
      :order="currentOrder"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
// 引入组件
import OrderForm from './components/OrderForm.vue';
import OrderList from './components/OrderList.vue';
import DispatchModal from './components/DispatchModal.vue';

// 状态管理
const modalVisible = ref(false);
const currentOrder = ref(null);

// 接收 OrderList 传来的派单请求，打开弹窗
const handleOpenModal = (order) => {
  currentOrder.value = order;
  modalVisible.value = true;
};
</script>

<style>
/* 全局布局样式 */
body { margin: 0; background-color: #f0f2f5; font-family: sans-serif; }
.app-layout { height: 100vh; display: flex; flex-direction: column; }

.header { height: 50px; background: #001529; color: #fff; display: flex; align-items: center; padding: 0 20px; font-weight: bold; }

.content { flex: 1; display: flex; padding: 20px; gap: 20px; overflow: hidden; }
.left-panel { flex: 0 0 380px; } /* 左侧固定宽 */
.right-panel { flex: 1; } /* 右侧自适应 */
</style>