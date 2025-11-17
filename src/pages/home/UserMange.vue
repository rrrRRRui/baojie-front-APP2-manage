<template>
  <div class="user-page">
    <!-- 顶部工具栏：标题 + 统计 + 搜索 + 按钮组 -->
    <div class="topbar card">
      <div class="top-left">
        <div class="title-row">
          <h1 class="page-title">用户管理</h1>
          <el-tag size="small" effect="plain" round>{{ total }} 用户</el-tag>
        </div>
        <div class="sub-row">
          <span class="muted">支持新增 / 删除 / 修改角色</span>
        </div>
      </div>

      <div class="top-right">
        <el-input
          v-model="keyword"
          class="search"
          placeholder="按用户名关键字过滤"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-button class="btn" @click="refresh">
          <el-icon><RefreshRight /></el-icon> 重新拉取
        </el-button>

        <el-button type="primary" class="btn" @click="openCreate">
          <el-icon><Plus /></el-icon> 新增用户
        </el-button>
      </div>
    </div>

    <!-- 表格卡片 -->
    <el-card class="table-card card" shadow="never">
      <el-config-provider :locale="zhLocale">
        <el-table
          :data="displayedUsers"
          v-loading="loading"
          :row-key="row => row.id"
          border
          fit
          highlight-current-row
          class="user-table"
          empty-text="暂无数据"
        >
          <el-table-column prop="id" label="编号" width="80" align="center">
            <template #default="{ row }">
              <span class="mono">{{ row.id }}</span>
            </template>
          </el-table-column>

          <el-table-column label="用户名" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="24" class="ava">{{ avatarChar(row.username) }}</el-avatar>
                <span class="username" :title="row.username">{{ row.username }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="密码" width="110" align="center">
            <template #default>•••••••</template>
          </el-table-column>

          <el-table-column prop="role" label="权限" width="130" align="center">
            <template #default="{ row }">
              <el-tag :type="roleTagType(row.role)" round>{{ roleLabel(row.role) }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="last_login_time" label="上次登录时间" width="180">
            <template #default="{ row }">
              <span class="mono">{{ row.last_login_time ?? '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="last_login_ip" label="上次登录 IP" width="180">
            <template #default="{ row }">
              <span class="mono">{{ row.last_login_ip ?? '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="last_operation" label="最近操作" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="muted">{{ row.last_operation ?? '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="管理" width="240" align="center" fixed="right">
            <template #default="{ row }">
              <div class="row-ops">
                <!-- 角色下拉 -->
                <el-dropdown trigger="click" @command="(cmd) => onChangeRole(row, cmd)">
                  <el-button text>
                    <el-icon class="mr-4"><UserFilled /></el-icon> 设置权限
                    <el-icon class="ml-2"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :disabled="isRole(row.role, 'super')"   command="超级管理员">超级管理员</el-dropdown-item>
                      <el-dropdown-item :disabled="isRole(row.role, 'staff')"   command="保洁人员">保洁人员</el-dropdown-item>
                      <el-dropdown-item :disabled="isRole(row.role, 'normal')"  command="普通用户">普通用户</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>

                <el-divider direction="vertical" />

                <!-- 删除确认 -->
                <el-popconfirm
                  width="220"
                  confirm-button-text="删除"
                  cancel-button-text="取消"
                  confirm-button-type="danger"
                  :icon="WarningFilled"
                  icon-color="#ff4d4f"
                  :title="`确认删除用户「${row.username}」？`"
                  @confirm="deleteUser(row.id, row.username)"
                >
                  <template #reference>
                    <el-button text type="danger">
                      <el-icon class="mr-4"><Delete /></el-icon> 删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 底部：分页 -->
        <div class="table-footer">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :page-sizes="[10, 20, 50]"
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange"
          />
        </div>
      </el-config-provider>
    </el-card>

    <!-- 新增用户弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增用户" width="520px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="84px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" class="w100">
            <el-option label="超级管理员" value="super" />
            <el-option label="保洁人员" value="staff" />
            <el-option label="普通用户" value="normal" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="createUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import {
  Search, RefreshRight, Plus, Delete, UserFilled, ArrowDown, WarningFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const zhLocale = zhCn

/* 角色映射（展示用） */
const ROLE_MAP = { super: '超级管理员', staff: '保洁人员', normal: '普通用户' }

/* API */
const API_BASE = '/api/v1'
const TOKEN = localStorage.getItem('token')

async function api(url, opt = {}) {
  return fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
      ...(opt.headers || {})
    },
    ...opt
  }).then(r => r.json())
}

/* 状态 */
const loading     = ref(false)
const users       = ref([])
const keyword     = ref('')
const currentPage = ref(1)
const pageSize    = ref(10)
const total       = ref(0)

/* 拉取列表（后端分页） */
const loadUsers = async (page = currentPage.value, limit = pageSize.value) => {
  if (!TOKEN) {
    ElMessage.warning('登录信息失效，请重新登录')
    return
  }
  loading.value = true
  try {
    // 如后端支持搜索，可改为：`/users?page=${page}&limit=${limit}&q=${encodeURIComponent(keyword.value)}`
    const res = await api(`/users?page=${page}&limit=${limit}`)
    if (res.code === 0) {
      users.value       = res.data.users || []
      total.value       = Number(res.data?.total ?? users.value.length)
      currentPage.value = Number(res.data?.page ?? page)
      pageSize.value    = Number(res.data?.limit ?? limit)
    } else {
      ElMessage.error(res.message || '获取用户失败')
    }
  } catch (e) {
    ElMessage.error('获取用户失败')
  } finally {
    loading.value = false
  }
}
const refresh = () => loadUsers(currentPage.value, pageSize.value)
const handleCurrentChange = (p) => { currentPage.value = p; loadUsers(p, pageSize.value) }
const handleSizeChange    = (s) => { pageSize.value = s; loadUsers(1, s) }

/* 本地过滤（当前页内）——若后端支持 q 搜索，直接在 loadUsers 里带参即可 */
const displayedUsers = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return users.value
  return users.value.filter(u => String(u.username || '').toLowerCase().includes(kw))
})
const handleSearch = () => {
  // 1) 若切服务端搜索，请这样：
  // loadUsers(1, pageSize.value)
  // 2) 目前是前端过滤：无需额外动作
}

/* 头像字符 */
const avatarChar = (name) => (name || '?').trim().charAt(0).toUpperCase()

/* 角色渲染工具（兼容后端返回中英文） */
const roleLabel = (role) => ROLE_MAP[role] || role || '普通用户'
const isRole = (role, key) => {
  if (!role) return false
  if (role === key) return true
  return (roleLabel(role) === ROLE_MAP[key])
}
const roleTagType = (role) => {
  if (isRole(role, 'super'))  return 'danger'
  if (isRole(role, 'staff'))  return 'warning'
  return 'info'
}

/* 删除 */
const deleteUser = async (id, username) => {
  try {
    const d = await api(`/users/${id}`, { method: 'DELETE' })
    if (d.code === 0) {
      ElMessage.success(`已删除：${username}`)
      const isLastOne = users.value.length === 1 && currentPage.value > 1
      const nextPage  = isLastOne ? currentPage.value - 1 : currentPage.value
      loadUsers(nextPage, pageSize.value)
    } else {
      ElMessage.error(d.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

/* 修改角色（仍按你原来的“传中文角色名”规则） */
const onChangeRole = async (user, roleText) => {
  try {
    const d = await api(`/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        username: user.username,
        password: user.username, // 仍沿用“密码=用户名”的约定
        role: roleText
      })
    })
    if (d.code === 0) {
      user.role = d.data?.role ?? roleText
      ElMessage.success('角色已修改')
    } else {
      ElMessage.error(d.message || '修改失败')
    }
  } catch (e) {
    ElMessage.error('修改失败')
  }
}

/* 新增用户 */
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const form = reactive({ username: '', password: '', role: 'normal' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role:     [{ required: true, message: '请选择角色', trigger: 'change' }],
}
const openCreate = () => {
  form.username = ''
  form.password = ''
  form.role     = 'normal'
  dialogVisible.value = true
}
const createUser = () => {
  formRef.value.validate(async (ok) => {
    if (!ok) return
    try {
      saving.value = true
      const d = await api('/users', {
        method: 'POST',
        body: JSON.stringify({ ...form })
      })
      if (d.code === 0) {
        ElMessage.success('新增用户成功')
        dialogVisible.value = false
        loadUsers(1, pageSize.value)
      } else {
        ElMessage.error(d.message || '新增失败')
      }
    } catch (e) {
      ElMessage.error('新增失败')
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => loadUsers())
defineExpose({ loadUsers })
</script>

<style scoped>
.user-page {
  max-width: 1200px;
  margin: 16px auto 48px;
  padding: 0 16px;
}

/* ======= 卡片基类（统一质感） ======= */
.card {
  border: 1px solid #eef2f7;
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
  border-radius: 14px;
  box-shadow:
    0 8px 24px rgba(16, 30, 115, 0.06),
    inset 0 0 0 1px rgba(230, 236, 247, .6);
}

/* 顶部工具栏 */
.topbar {
  padding: 14px 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.top-left { flex: 1; min-width: 360px; }
.title-row { display: flex; align-items: center; gap: 10px; }
.page-title { font-size: 18px; font-weight: 700; margin: 0; letter-spacing: .3px; }
.sub-row { margin-top: 2px; color: #7a8599; font-size: 13px; }
.top-right { display: flex; align-items: center; gap: 10px; }
.search { width: 260px; }
.btn { height: 36px; }

/* 表格卡片 */
.table-card { padding: 10px 10px 4px; }

/* 行内操作：不换行、间距适中 */
.row-ops { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
/* 给右固定列一点内边距，避免视觉上“挤” */
.user-table :deep(.el-table__fixed-right .cell){ padding-right: 12px; }


/* 表格细节 */
.user-table :deep(.el-table__header th) {
  background: #f6f9ff !important;
  color: #556070;
  font-weight: 600;
}
.user-table :deep(.el-table__row:hover) {
  --el-table-tr-bg-color: #f7fbff !important;
}
.user-cell {
  display: flex; align-items: center; gap: 8px;
}
.ava {
  font-weight: 700;
  color: #1f2d3d;
  background: #e6f4ff;
  border: 1px solid #cfe7ff;
}
.username { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.muted { color: #8a93a3; }
.mono  { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

/* 行内操作 */
.row-ops { display: inline-flex; align-items: center; }

/* 底部分页 */
.table-footer {
  display: flex; justify-content: center;
  padding: 8px 2px 12px;
}

/* 弹窗宽度 & 表单 */
.w100 { width: 100%; }
.mr-4 { margin-right: 4px; }
.ml-2 { margin-left: 2px; }
</style>
