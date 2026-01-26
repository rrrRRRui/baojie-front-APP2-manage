<script setup></script>

<template>
  <router-view />
  
  <div v-if="$route.path.startsWith('/app')" class="bottom-nav">
    <div class="nav-item" @click="$router.push('/app/orders')">工单</div>
    <div class="nav-item" @click="$router.push('/app/profile')">我的</div>
  </div>
</template>

<style>
.bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 50px;
  background: white;
  display: flex;
  border-top: 1px solid #eee;
}
.nav-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
</style>