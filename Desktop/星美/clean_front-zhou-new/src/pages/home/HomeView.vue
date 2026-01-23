<script setup>
import {ref} from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'

import SceneMange from "./SceneMange.vue";
import UserMange from "./UserMange.vue";
import AssetDownload from "./AssetDownload.vue";

const activeTab = ref('scene')
const switchTab = (tab) => {
  activeTab.value = tab
}

// 重新登录：清除会话 → 跳到登录页
const router = useRouter()
const handleRelogin = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重新登录吗？当前会话将退出。',
      '重新登录',
      { type: 'warning', confirmButtonText: '重新登录', cancelButtonText: '取消' }
    )
    localStorage.removeItem('token')
    localStorage.removeItem('user_info')
    ElMessage.success('已退出，请重新登录')
    // 二选一：
    await router.replace({ name: 'login' })  // 如果你的路由有 name:'login'
    // await router.replace('/login')        // 或者用路径
  } catch {
    // 用户取消
  }
}

</script>

<template>
  <div>
    <header class="navbar">
      <div class="logo">
        <img src="../../asset/img/app.png" alt="应用图标" class="app-icon">
        <span>保洁标准化—管理后台</span>
      </div>
      <nav>
        <ul id="tabs">
          <li :class="{ active: activeTab === 'scene' }" @click="switchTab('scene')">场景管理</li>
          <li :class="{ active: activeTab === 'user' }" @click="switchTab('user')">用户管理</li>
          <li :class="{ active: activeTab === 'material' }" @click="switchTab('material')">素材下载</li>
        </ul>
      </nav>
         <div class="avatar" @click="handleRelogin" title="重新登录">
         <img src="../../asset/img/user.png" alt="用户图标" class="user-icon">
         </div>
    </header>

    <main>
      <SceneMange v-if="activeTab === 'scene'"/>
      <UserMange v-if="activeTab === 'user'"/>
      <AssetDownload v-if="activeTab === 'material'"/>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Microsoft YaHei", sans-serif;
  background: #fff;
  color: #333;
}

.nav-link {
  display: block;
  padding: 0 20px;
  height: 80px;
  line-height: 80px;
  color: #333;
  text-decoration: none;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #1890ff;
}

#tabs li {
  margin: 0;
}

/* ===== 顶部导航 ===== */
.navbar {
  display: flex;
  align-items: center;
  height: 80px;
  padding: 0 40px;
  border-bottom: 1px solid #e8e8e8;
}

/* ===== 图标 ===== */
.logo {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-icon {
  width: 24px;
  height: 24px;
}

.navbar ul {
  list-style: none;
  display: flex;
  margin-left: 80px;
  gap: 50px;
}

.navbar li {
  cursor: pointer;
  padding: 4px 18px;
  position: relative;
}

.navbar li.active {
  color: #1890ff;
}

.navbar li.active::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -8px;
  width: 100%;
  height: 2px;
  background: #1890ff;
}

.avatar {
  margin-left: auto;
  font-size: 22px;
  cursor: pointer;
}

.user-icon {
  width: 24px;
  height: 24px;
  margin-top: 5px;
  transition: transform .15s ease, filter .15s ease;
}

.avatar:hover .user-icon {
  transform: scale(1.06);
  filter: drop-shadow(0 2px 6px rgba(0,0,0,.12));
}

/* ===== Tab 面板 ===== */
.tab-panel {
  display: none;
  padding: 32px;
}

.tab-panel.active {
  display: block;
}

/* ======================================================== page one ==================================================================== */

/* ----------------------
   基础布局
---------------------- */
html, body {
  margin: 0;
  padding: 0;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  background: #f5f7fa;
  color: #303133;
}

.group-header .el-icon {
  font-size: 14px;
  margin-right: auto;
  color: #909399;
}

button:hover {
  opacity: .85;
}

.user-table .head-row th {
  font-size: 16px;
  font-weight: 500;
  color: #898989;
  letter-spacing: 0.5px;
}

.user-table th,
.user-table td {
  padding: 18px 4px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
}

.user-table th {
  color: #666;
  font-weight: 500;
}

.user-table .manage-col {
  padding-left: 0px !important;
  padding-right: 12px !important;
}

.role-menu li.disabled {
  color: #bbb;
  cursor: default;
  pointer-events: none; /* 禁止点击 */
  background: none !important; /* 保持白底 */
}


.role-menu li {
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.role-menu li:hover {
  background: #f5f7fa;
}

.modal-field label {
  width: 70px;
  font-size: 16px;
  color: #333;
}

.modal-field input,
.modal-field select {
  flex: 1;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.modal-footer .btn-cancel {
  width: 120px;
  height: 38px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.modal-footer .btn-save {
  width: 160px;
  height: 38px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.modal-footer .btn-save:hover,
.modal-footer .btn-cancel:hover {
  opacity: .85;
}

.filter-row label {
  font-size: 16px;
  white-space: nowrap;
}

/* ---------- 勾选框  ---------- */
input[type="checkbox"].cb-lg {
  transform: scale(1.3); /* 放大 */
  transform-origin: left center; 
  accent-color: #1890ff; 
  margin-right: 6px; 
}

</style>


