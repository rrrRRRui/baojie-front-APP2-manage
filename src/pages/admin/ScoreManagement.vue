<!-- src/pages/admin/ScoreManagement.vue -->
<template>
  <div class="score-management-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>AI评分管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button type="success" @click="exportData" :loading="exporting">
          <el-icon><Download /></el-icon>导出数据
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" :inline="true">
        <el-form-item label="工单编号">
          <el-input
            v-model="filterForm.order_no"
            placeholder="请输入工单编号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="保洁人员">
          <el-input
            v-model="filterForm.cleaner_username"
            placeholder="请输入保洁人员"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="合格状态">
          <el-select v-model="filterForm.is_qualified" placeholder="请选择" clearable>
            <el-option label="全部" :value="null" />
            <el-option label="合格" :value="true" />
            <el-option label="不合格" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="评分日期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据统计卡片 -->
    <div class="stats-cards" v-if="statsData">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-label">总评分数量</div>
              <div class="stat-value">{{ statsData.total || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-label">合格数量</div>
              <div class="stat-value" style="color: #67C23A">{{ statsData.qualified_count || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-label">合格率</div>
              <div class="stat-value" style="color: #409EFF">
                {{ (statsData.qualified_rate || 0).toFixed(1) }}%
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-label">平均分数</div>
              <div class="stat-value" style="color: #E6A23C">
                {{ (statsData.average_score || 0).toFixed(1) }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 评分数据表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="scoreList"
        v-loading="loading"
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="order_no" label="工单编号" width="180" sortable />
        <el-table-column prop="cleaner_username" label="保洁人员" width="120" />
        <el-table-column prop="score" label="评分分数" width="100" sortable>
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.score)" size="small">
              {{ row.score }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_qualified" label="合格状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_qualified ? 'success' : 'danger'" size="small">
              {{ row.is_qualified ? '合格' : '不合格' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score_time" label="评分时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.score_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="rescan_count" label="复扫次数" width="100">
          <template #default="{ row }">
            <span :class="row.rescan_count > 0 ? 'rescan-highlight' : ''">
              {{ row.rescan_count }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="area" label="区域" width="150" />
        <el-table-column prop="image_count" label="图片数量" width="100">
          <template #default="{ row }">
            <el-button type="text" @click="viewImages(row)" v-if="row.image_count > 0">
              {{ row.image_count }}
            </el-button>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">
              查看详情
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              @click="viewRescanHistory(row)"
              v-if="row.rescan_count > 0"
            >
              复扫记录
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 评分详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      :title="`工单详情 - ${currentDetail?.order_no || ''}`"
      width="80%"
      top="5vh"
    >
      <ScoreDetail :score-id="currentDetail?.id" v-if="detailVisible" />
    </el-dialog>

    <!-- 图片查看对话框 -->
    <el-dialog
      v-model="imageVisible"
      title="清洁图片"
      width="70%"
      top="5vh"
    >
      <div class="image-gallery" v-if="currentImages.length > 0">
        <el-row :gutter="20">
          <el-col :span="8" v-for="(img, index) in currentImages" :key="index">
            <div class="image-item">
              <el-image
                :src="img.url"
                :preview-src-list="currentImages.map(i => i.url)"
                :initial-index="index"
                fit="cover"
                style="width: 100%; height: 200px; border-radius: 8px;"
              />
              <div class="image-meta">
                <span>上传时间: {{ formatDateTime(img.upload_time) }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      <div v-else class="empty-images">
        <el-empty description="暂无图片" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download, Search } from '@element-plus/icons-vue'
import { getAIScoreManagement } from '@/services/workOrderService'
import ScoreDetail from './ScoreDetail.vue'

// 数据定义
const loading = ref(false)
const exporting = ref(false)
const detailVisible = ref(false)
const imageVisible = ref(false)
const scoreList = ref([])
const statsData = ref(null)
const currentDetail = ref(null)
const currentImages = ref([])

// 筛选表单
const filterForm = ref({
  order_no: '',
  cleaner_username: '',
  is_qualified: null,
  dateRange: []
})

// 分页
const pagination = ref({
  current: 1,
  size: 20,
  total: 0,
  sortField: 'score_time',
  sortOrder: 'desc'
})

// 计算属性：构建查询参数
const queryParams = computed(() => {
  const params = {
    page: pagination.value.current,
    pageSize: pagination.value.size,
    sort_field: pagination.value.sortField,
    sort_order: pagination.value.sortOrder,
    ...filterForm.value
  }

//在 queryParams 计算属性中添加调试*********************

  console.log('原始filterForm:', filterForm.value)
  console.log('构建的params:', params)
//******************************************************



  // 处理日期范围
  if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
    params.start_date = filterForm.value.dateRange[0]
    params.end_date = filterForm.value.dateRange[1]
    delete params.dateRange
  }

  // 移除空值
  Object.keys(params).forEach(key => {
    if (params[key] === '' || params[key] === undefined || params[key] === null) {
      delete params[key]
    }
  })

  return params
})

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return ''
  return new Date(datetime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-')
}

// 获取分数类型
const getScoreType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

// 加载数据
const loadData = async () => {
  try {
    //在函数开头添加详细的调试：
    console.log(' loadData函数开始执行！')
    console.log('当前filterForm:', filterForm.value)
    console.log('scoreList初始值:', scoreList.value)





    loading.value = true


// ========== 暂时注释掉API调用，使用模拟数据测试 ==========    
//    const response = await getAIScoreManagement(queryParams.value)
    

// 使用模拟数据测试页面显示*****************************
    scoreList.value = [
      {
        id: 1,
        order_no: 'WO20250101001',
        cleaner_username: '张三',
        score: 85,
        is_qualified: true,
        score_time: new Date(),
        rescan_count: 0,
        area: 'A区',
        image_count: 3
      },
      {
        id: 2,
        order_no: 'WO20250101002',
        cleaner_username: '李四',
        score: 72,
        is_qualified: false,
        score_time: new Date(Date.now() - 86400000),
        rescan_count: 2,
        area: 'B区',
        image_count: 2
      },
      {
        id: 3,
        order_no: 'WO20250101003',
        cleaner_username: '王五',
        score: 95,
        is_qualified: true,
        score_time: new Date(Date.now() - 172800000),
        rescan_count: 0,
        area: 'C区',
        image_count: 4
      }
    ]
    
    pagination.value.total = 3
    
    statsData.value = {
      total: 3,
      qualified_count: 2,
      qualified_rate: 66.7,
      average_score: 84.0
    }








// ========== 原来的API调用代码（暂时注释） ==========
//    if (response.code === 0) {
//      scoreList.value = response.data.scores || []
//      pagination.value.total = response.data.total || 0
//      
      // 提取统计信息（假设API返回了统计信息）
//      statsData.value = {
//        total: response.data.total,
//        qualified_count: scoreList.value.filter(item => item.is_qualified).length,
//        qualified_rate: scoreList.value.length > 0 
//          ? (scoreList.value.filter(item => item.is_qualified).length / scoreList.value.length * 100)
//          : 0,
//        average_score: scoreList.value.length > 0
//          ? scoreList.value.reduce((sum, item) => sum + item.score, 0) / scoreList.value.length
//          : 0
//      }
//    }
// =================================================

  } catch (error) {
    console.error('加载评分数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.current = 1
  loadData()
}

// 重置筛选
const resetFilter = () => {
  filterForm.value = {
    order_no: '',
    cleaner_username: '',
    is_qualified: null,
    dateRange: []
  }
  pagination.value.current = 1
  loadData()
}

// 刷新数据
const refreshData = () => {
  loadData()
}

// 导出数据
const exportData = async () => {
  try {
    exporting.value = true
    // 这里实现导出逻辑
    ElMessage.success('导出功能开发中...')
    // 实际应该调用导出API
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// 查看详情
const viewDetail = (row) => {
  currentDetail.value = row
  detailVisible.value = true
}

// 查看图片
const viewImages = (row) => {
  // 这里应该调用API获取图片列表
  // 暂时用模拟数据
  currentImages.value = [
    { url: 'https://via.placeholder.com/400x300?text=清洁图片1', upload_time: new Date() },
    { url: 'https://via.placeholder.com/400x300?text=清洁图片2', upload_time: new Date() },
    { url: 'https://via.placeholder.com/400x300?text=清洁图片3', upload_time: new Date() }
  ]
  imageVisible.value = true
}

// 查看复扫记录
const viewRescanHistory = (row) => {
  ElMessage.info(`查看工单 ${row.order_no} 的复扫记录`)
  // 这里可以跳转到复扫记录页面
}

// 表格排序
const handleSortChange = ({ prop, order }) => {
  if (prop) {
    pagination.value.sortField = prop
    pagination.value.sortOrder = order === 'ascending' ? 'asc' : 'desc'
    loadData()
  }
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.value.size = size
  pagination.value.current = 1
  loadData()
}

// 页码变化
const handleCurrentChange = (page) => {
  pagination.value.current = page
  loadData()
}

// 生命周期
onMounted(() => {
  console.log('ScoreManagement组件已挂载')
  console.log(' 开始调用loadData...')
  loadData()
})





// 监听filterForm变化*******************************
import { watch } from 'vue'

watch(
  () => filterForm.value.is_qualified,
  (newVal, oldVal) => {
    console.log('is_qualified值变化:', oldVal, '->', newVal)
    console.log('值类型:', typeof newVal)
  }
)





</script>

<style scoped>
.score-management-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-card {
  margin-bottom: 20px;
  background-color: #fff;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
}

.stat-content {
  text-align: center;
  padding: 20px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
}

.table-card {
  margin-top: 20px;
  background-color: #fff;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.rescan-highlight {
  color: #E6A23C;
  font-weight: bold;
}

.image-gallery {
  max-height: 70vh;
  overflow-y: auto;
}

.image-item {
  margin-bottom: 20px;
  position: relative;
}

.image-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.empty-images {
  text-align: center;
  padding: 40px 0;
}
</style>