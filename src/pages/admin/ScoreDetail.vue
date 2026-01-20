<!-- src/pages/admin/ScoreDetail.vue -->
<template>
  <div class="score-detail-container" v-if="scoreDetail">
    <!-- 基本信息 -->
    <el-descriptions :column="2" border title="工单基本信息">
      <el-descriptions-item label="工单编号">{{ scoreDetail.order_no }}</el-descriptions-item>
      <el-descriptions-item label="保洁人员">{{ scoreDetail.cleaner_username }}</el-descriptions-item>
      <el-descriptions-item label="区域">{{ scoreDetail.area }}</el-descriptions-item>
      <el-descriptions-item label="评分时间">{{ formatDateTime(scoreDetail.score_time) }}</el-descriptions-item>
      <el-descriptions-item label="评分分数">
        <el-tag :type="getScoreType(scoreDetail.score)" size="large">
          {{ scoreDetail.score }}分
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="合格状态">
        <el-tag :type="scoreDetail.is_qualified ? 'success' : 'danger'" size="large">
          {{ scoreDetail.is_qualified ? '合格' : '不合格' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="复扫次数">{{ scoreDetail.rescan_count }}</el-descriptions-item>
      <el-descriptions-item label="清洁要求">{{ scoreDetail.clean_requirement || '无' }}</el-descriptions-item>
    </el-descriptions>

    <!-- 评分明细 -->
    <div class="score-items" v-if="scoreDetail.items && scoreDetail.items.length > 0">
      <h3>评分明细</h3>
      <el-table :data="scoreDetail.items" stripe>
        <el-table-column prop="item_name" label="检查项" width="200" />
        <el-table-column prop="score" label="得分" width="100">
          <template #default="{ row }">
            <span :class="getItemScoreClass(row.score)">{{ row.score }}分</span>
          </template>
        </el-table-column>
        <el-table-column prop="standard_score" label="标准分" width="100" />
        <el-table-column prop="comment" label="评语" />
        <el-table-column label="问题图片" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.problem_images && row.problem_images.length > 0"
              :src="row.problem_images[0]"
              :preview-src-list="row.problem_images"
              style="width: 40px; height: 40px"
              fit="cover"
            />
            <span v-else>无</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 图片展示 -->
    <div class="score-images" v-if="scoreDetail.images && scoreDetail.images.length > 0">
      <h3>清洁图片（{{ scoreDetail.images.length }}张）</h3>
      <div class="image-grid">
        <div class="image-item" v-for="(img, index) in scoreDetail.images" :key="index">
          <el-image
            :src="img.url"
            :preview-src-list="scoreDetail.images.map(i => i.url)"
            :initial-index="index"
            fit="cover"
          />
          <div class="image-info">
            <span>上传时间: {{ formatDateTime(img.upload_time) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 复扫记录 -->
    <div class="rescan-history" v-if="rescanHistory && rescanHistory.length > 0">
      <h3>复扫记录（{{ rescanHistory.length }}次）</h3>
      <el-timeline>
        <el-timeline-item
          v-for="(record, index) in rescanHistory"
          :key="index"
          :timestamp="formatDateTime(record.rescan_time)"
          placement="top"
        >
          <el-card>
            <h4>第{{ record.rescan_count }}次复扫</h4>
            <p><strong>复扫原因：</strong>{{ record.reason }}</p>
            <p><strong>复扫结果：</strong>
              <el-tag :type="record.is_qualified ? 'success' : 'danger'" size="small">
                {{ record.is_qualified ? '合格' : '不合格' }}
              </el-tag>
              <span style="margin-left: 10px">得分：{{ record.score }}分</span>
            </p>
            <p v-if="record.remarks"><strong>备注：</strong>{{ record.remarks }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
  <div v-else class="loading-container">
    <el-skeleton :rows="10" animated />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  scoreId: {
    type: [Number, String],
    required: true
  }
})

const scoreDetail = ref(null)
const rescanHistory = ref([])
const loading = ref(true)

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return ''
  return new Date(datetime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-')
}

// 获取分数类型
const getScoreType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

// 获取单项分数样式
const getItemScoreClass = (itemScore) => {
  if (itemScore >= 90) return 'item-score-excellent'
  if (itemScore >= 80) return 'item-score-good'
  if (itemScore >= 60) return 'item-score-fair'
  return 'item-score-poor'
}

// 加载评分详情
const loadScoreDetail = async () => {
  try {
    loading.value = true
    // 这里应该调用API获取评分详情
    // 暂时用模拟数据
    scoreDetail.value = {
      id: props.scoreId,
      order_no: `WO2025010100${props.scoreId}`,
      cleaner_username: '保洁人员' + props.scoreId,
      area: 'A区',
      score: 85,
      is_qualified: true,
      score_time: new Date(),
      rescan_count: 2,
      clean_requirement: '深度清洁，重点清理卫生间',
      items: [
        { item_name: '地面清洁', score: 90, standard_score: 100, comment: '清洁彻底，无污渍' },
        { item_name: '卫生间清洁', score: 85, standard_score: 100, comment: '基本清洁，有少量水渍' },
        { item_name: '玻璃清洁', score: 80, standard_score: 100, comment: '有少量水痕' }
      ],
      images: [
        { url: 'https://via.placeholder.com/400x300?text=清洁图片1', upload_time: new Date() },
        { url: 'https://via.placeholder.com/400x300?text=清洁图片2', upload_time: new Date() }
      ]
    }

    // 加载复扫记录
    rescanHistory.value = [
      {
        rescan_count: 1,
        rescan_time: new Date(Date.now() - 86400000),
        reason: '清洁不彻底',
        score: 65,
        is_qualified: false,
        remarks: '需要重新清洁卫生间'
      },
      {
        rescan_count: 2,
        rescan_time: new Date(),
        reason: '重新清洁',
        score: 85,
        is_qualified: true,
        remarks: '清洁完成，符合标准'
      }
    ]
  } catch (error) {
    ElMessage.error('加载评分详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadScoreDetail()
})
</script>

<style scoped>
.score-detail-container {
  padding: 20px;
}

.score-items {
  margin-top: 30px;
}

.score-items h3 {
  margin-bottom: 20px;
  color: #303133;
}

.item-score-excellent {
  color: #52c41a;
  font-weight: bold;
}

.item-score-good {
  color: #73d13d;
}

.item-score-fair {
  color: #ffa940;
}

.item-score-poor {
  color: #ff4d4f;
}

.score-images {
  margin-top: 30px;
}

.score-images h3 {
  margin-bottom: 20px;
  color: #303133;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 10px;
}

.image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.image-item:hover {
  transform: translateY(-4px);
}

.image-item .el-image {
  width: 100%;
  height: 150px;
  display: block;
}

.image-info {
  padding: 8px;
  background-color: #fff;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.rescan-history {
  margin-top: 30px;
}

.rescan-history h3 {
  margin-bottom: 20px;
  color: #303133;
}

.loading-container {
  padding: 40px;
}
</style>