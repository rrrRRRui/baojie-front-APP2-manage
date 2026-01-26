<template>
  <div class="user-page">
    <div class="topbar card">
      <div class="top-left">
        <div class="title-row">
          <h1 class="page-title">保洁人员管理</h1>
          <el-tag size="small" effect="plain" round>{{ total }} 名人员</el-tag>
        </div>
        <div class="sub-row">
          <span class="muted">管理保洁人员账号、权限及基础信息</span>
        </div>
      </div>

      <div class="top-right">
        <el-input
          v-model="keyword"
          class="search"
          placeholder="搜索用户名"
          clearable
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-button class="btn" @click="loadCleaners">
          <el-icon><RefreshRight /></el-icon> 刷新列表
        </el-button>
      </div>
    </div>

    <el-card class="table-card card" shadow="never">
      <el-table
        :data="filteredCleaners"
        v-loading="loading"
        border
        fit
        highlight-current-row
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        
        <el-table-column label="保洁员姓名" min-width="150">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" class="ava">{{ row.username?.charAt(0) }}</el-avatar>
              <span class="username">{{ row.username }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="role" label="当前角色" width="150" align="center">
          <template #default="{ row }">
            <el-tag type="warning" round>{{ row.role || '保洁人员' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="管理操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <div class="row-ops">
              <el-dropdown trigger="click" @command="(role) => handleUpdateRole(row, role)">
                <el-button text type="primary">
                  <el-icon><UserFilled /></el-icon> 修改角色
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="超级管理员">超级管理员</el-dropdown-item>
                    <el-dropdown-item command="保洁人员">保洁人员</el-dropdown-item>
                    <el-dropdown-item command="普通用户">普通用户</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <el-popconfirm
                title="确定删除该人员吗？"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button text type="danger">
                    <el-icon><Delete /></el-icon> 删除
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Search, RefreshRight, Delete, UserFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const cleaners = ref([])
const keyword = ref('')
const total = ref(0)

// 获取 Token
const TOKEN = localStorage.getItem('token')

// 通用请求封装
async function adminApi(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  }
  if (body) options.body = JSON.stringify(body)
  
  const res = await fetch(`/api${url}`, options)
  return res.json()
}

// 核心任务：加载保洁人员列表 [cite: 1041, 1050]
const loadCleaners = async () => {
  loading.value = true
  try {
    const res = await adminApi('/v1/admin/cleaners')
    if (res.code === 0) {
      cleaners.value = res.data.cleaners || []
      total.value = cleaners.value.length
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (e) {
    ElMessage.error('网络请求失败')
  } finally {
    loading.value = false
  }
}

// 搜索过滤
const filteredCleaners = computed(() => {
  return cleaners.value.filter(c => 
    c.username?.toLowerCase().includes(keyword.value.toLowerCase())
  )
})

// 修改角色 [cite: 142, 153]
const handleUpdateRole = async (user, newRole) => {
  try {
    const res = await adminApi(`/v1/users/${user.id}`, 'PUT', {
      username: user.username,
      role: newRole
    })
    if (res.code === 0) {
      ElMessage.success('角色更新成功')
      user.role = newRole
    }
  } catch (e) {
    ElMessage.error('更新失败')
  }
}

// 删除人员
const handleDelete = async (user) => {
  try {
    const res = await adminApi(`/v1/users/${user.id}`, 'DELETE')
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadCleaners()
    }
  } catch (e) {
    ElMessage.error('删除操作失败')
  }
}

onMounted(loadCleaners)
</script>

<style scoped>
.user-page { max-width: 1200px; margin: 20px auto; padding: 0 20px; }
.card { border-radius: 12px; border: 1px solid #ebeef5; }
.topbar { padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #fff; }
.page-title { font-size: 20px; margin-bottom: 5px; }
.muted { color: #909399; font-size: 14px; }
.search { width: 250px; margin-right: 15px; }
.user-cell { display: flex; align-items: center; gap: 10px; }
.ava { background: #e6f7ff; color: #1890ff; }
.row-ops { display: flex; justify-content: center; gap: 10px; }
</style>