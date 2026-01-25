<template>
  <div class="home">
    <header class="header">
      <h1>保洁APP</h1>
      <p>专业的保洁服务管理平台</p>
    </header>
    
    <nav class="nav-menu">
      <router-link to="/upload" class="nav-item">
        <div class="nav-icon">📷</div>
        <div class="nav-text">
          <h3>现场拍照</h3>
          <p>记录保洁现场情况</p>
        </div>
      </router-link>
      
      <div class="nav-item disabled">
        <div class="nav-icon">📋</div>
        <div class="nav-text">
          <h3>工作清单</h3>
          <p>查看今日保洁任务</p>
        </div>
      </div>
      
      <div class="nav-item disabled">
        <div class="nav-icon">📊</div>
        <div class="nav-text">
          <h3>工作报告</h3>
          <p>生成保洁工作报告</p>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
// 主页组件
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  text-align: center;
  padding: 60px 20px 40px;
  color: white;
}

.header h1 {
  font-size: 32px;
  margin-bottom: 10px;
  font-weight: 600;
}

.header p {
  font-size: 16px;
  opacity: 0.9;
}

.nav-menu {
  padding: 0 20px;
}

.nav-item {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.nav-item:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.nav-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nav-icon {
  font-size: 32px;
  margin-right: 20px;
  width: 50px;
  text-align: center;
}

.nav-text h3 {
  font-size: 18px;
  margin-bottom: 5px;
  color: #333;
}

.nav-text p {
  font-size: 14px;
  color: #666;
  margin: 0;
}
</style>