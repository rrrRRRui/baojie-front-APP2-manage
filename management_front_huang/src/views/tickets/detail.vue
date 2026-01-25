<template>
  <div class="ticket-detail">
    <el-card class="detail-card">
      <template #header>
        <div class="card-header">
          <span>工单详情 - {{ ticketData.id }}</span>
          <div>
            <el-button @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              返回列表
            </el-button>
            <el-button type="primary" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              编辑工单
            </el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="16">
          <!-- 基本信息 -->
          <el-descriptions title="基本信息" :column="2" border>
            <el-descriptions-item label="工单编号">{{ ticketData.id }}</el-descriptions-item>
            <el-descriptions-item label="工单标题">{{ ticketData.title }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(ticketData.status)">
                {{ getStatusText(ticketData.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag :type="getPriorityType(ticketData.priority)">
                {{ getPriorityText(ticketData.priority) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建人">{{ ticketData.creator }}</el-descriptions-item>
            <el-descriptions-item label="处理人">{{ ticketData.assignee || '未分配' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ ticketData.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ ticketData.updatedAt }}</el-descriptions-item>
          </el-descriptions>

          <!-- 问题描述 -->
          <el-card class="section-card" header="问题描述">
            <div class="description-content">
              {{ ticketData.description }}
            </div>
          </el-card>

          <!-- 处理记录 -->
          <el-card class="section-card" header="处理记录">
            <el-timeline>
              <el-timeline-item
                v-for="record in ticketData.records"
                :key="record.id"
                :timestamp="record.timestamp"
                placement="top"
              >
                <el-card>
                  <div class="record-header">
                    <strong>{{ record.operator }}</strong>
                    <span class="record-action">{{ record.action }}</span>
                  </div>
                  <div class="record-content">{{ record.content }}</div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>

        <el-col :span="8">
          <!-- 证据图片 -->
          <el-card class="section-card" header="证据图片">
            <div class="image-gallery">
              <div
                v-for="(image, index) in ticketData.images"
                :key="index"
                class="image-item"
                @click="previewImage(index)"
              >
                <el-image
                  :src="image.url"
                  :alt="image.name"
                  fit="cover"
                  class="evidence-image"
                  :preview-src-list="imageUrls"
                  :initial-index="index"
                />
                <div class="image-name">{{ image.name }}</div>
              </div>
              <div v-if="ticketData.images.length === 0" class="no-images">
                暂无证据图片
              </div>
            </div>
          </el-card>

          <!-- 相关信息 -->
          <el-card class="section-card" header="相关信息">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="所属模块">{{ ticketData.module }}</el-descriptions-item>
              <el-descriptions-item label="影响范围">{{ ticketData.impact }}</el-descriptions-item>
              <el-descriptions-item label="预计工时">{{ ticketData.estimatedHours }}小时</el-descriptions-item>
              <el-descriptions-item label="实际工时">{{ ticketData.actualHours }}小时</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 添加处理记录对话框 -->
    <el-dialog v-model="recordDialogVisible" title="添加处理记录" width="600px">
      <el-form :model="recordForm" label-width="80px">
        <el-form-item label="处理内容">
          <el-input
            v-model="recordForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入处理内容"
          />
        </el-form-item>
        <el-form-item label="状态变更">
          <el-select v-model="recordForm.newStatus" placeholder="请选择新状态">
            <el-option label="待分配" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddRecord">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const recordDialogVisible = ref(false)
const recordForm = reactive({
  content: '',
  newStatus: ''
})

const ticketData = ref({
  id: '',
  title: '',
  status: '',
  priority: '',
  creator: '',
  assignee: '',
  createdAt: '',
  updatedAt: '',
  description: '',
  module: '',
  impact: '',
  estimatedHours: 0,
  actualHours: 0,
  images: [],
  records: []
})

// 模拟数据
const mockTicketData = {
  id: 'T202401001',
  title: '系统登录异常问题',
  status: 'processing',
  priority: 'high',
  creator: '王五',
  assignee: '张三',
  createdAt: '2024-01-15 09:30:00',
  updatedAt: '2024-01-15 14:20:00',
  description: '用户反馈在登录系统时出现异常，无法正常进入系统主页面。错误提示为"网络连接超时"，但网络连接正常。问题出现频率较高，影响用户正常使用。',
  module: '用户认证模块',
  impact: '影响所有用户登录',
  estimatedHours: 8,
  actualHours: 6,
  images: [
    {
      name: '错误截图1.png',
      url: 'https://via.placeholder.com/300x200/409EFF/ffffff?text=Error+Screenshot+1'
    },
    {
      name: '错误截图2.png',
      url: 'https://via.placeholder.com/300x200/67C23A/ffffff?text=Error+Screenshot+2'
    },
    {
      name: '系统日志.png',
      url: 'https://via.placeholder.com/300x200/E6A23C/ffffff?text=System+Log'
    }
  ],
  records: [
    {
      id: 1,
      operator: '张三',
      action: '开始处理',
      content: '已接收工单，开始排查登录异常问题',
      timestamp: '2024-01-15 10:00:00'
    },
    {
      id: 2,
      operator: '张三',
      action: '问题分析',
      content: '经过初步排查，发现是认证服务器负载过高导致的超时问题',
      timestamp: '2024-01-15 12:30:00'
    },
    {
      id: 3,
      operator: '张三',
      action: '解决方案',
      content: '已优化认证服务器配置，增加了连接池大小，问题已解决',
      timestamp: '2024-01-15 14:20:00'
    }
  ]
}

const imageUrls = computed(() => {
  return ticketData.value.images.map(img => img.url)
})

const getStatusType = (status) => {
  const types = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    closed: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待分配',
    processing: '处理中',
    completed: '已完成',
    closed: '已关闭'
  }
  return texts[status] || '未知'
}

const getPriorityType = (priority) => {
  const types = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
    urgent: 'danger'
  }
  return types[priority] || 'info'
}

const getPriorityText = (priority) => {
  const texts = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return texts[priority] || '未知'
}

const loadTicketData = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    ticketData.value = mockTicketData
  } catch (error) {
    ElMessage.error('加载工单详情失败')
  }
}

const goBack = () => {
  router.push('/tickets/list')
}

const handleEdit = () => {
  ElMessage.info('编辑功能待实现')
}

const previewImage = (index) => {
  // 图片预览功能由 el-image 组件自动处理
}

const handleAddRecord = () => {
  if (!recordForm.content.trim()) {
    ElMessage.warning('请输入处理内容')
    return
  }
  
  // 模拟添加记录
  const newRecord = {
    id: Date.now(),
    operator: '当前用户',
    action: '添加记录',
    content: recordForm.content,
    timestamp: new Date().toLocaleString()
  }
  
  ticketData.value.records.unshift(newRecord)
  
  if (recordForm.newStatus) {
    ticketData.value.status = recordForm.newStatus
  }
  
  recordDialogVisible.value = false
  recordForm.content = ''
  recordForm.newStatus = ''
  
  ElMessage.success('处理记录添加成功')
}

onMounted(() => {
  loadTicketData()
})
</script>

<style scoped>
.ticket-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-card {
  margin-top: 20px;
}

.description-content {
  line-height: 1.6;
  color: #606266;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.record-action {
  color: #409EFF;
  font-size: 12px;
}

.record-content {
  color: #606266;
  line-height: 1.5;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.image-item {
  cursor: pointer;
  text-align: center;
}

.evidence-image {
  width: 100%;
  height: 80px;
  border-radius: 4px;
}

.image-name {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  word-break: break-all;
}

.no-images {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}
</style>