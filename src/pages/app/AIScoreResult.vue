<!-- src/pages/app/AIScoreResult.vue -->
<template>
  <div class="ai-score-result-container">
    <!-- 顶部标题 -->
    <div class="page-header">
      <h2>AI评分结果</h2>
      <div class="work-order-info">
        <span>工单号: {{ workOrderNo }}</span>
        <span class="area-tag">{{ area }}</span>
      </div>
    </div>


      <!-- 添加AI评分按钮 -->
  <div class="action-buttons" style="margin-bottom: 20px;">
    <button @click="triggerAIScoring" :disabled="isScoring" class="ai-score-btn">
      {{ isScoring ? 'AI评分中...' : '获取AI评分' }}
    </button>
  </div>   


    <!-- 分数展示卡片 -->
    <div class="score-display-card">
      <div class="score-main">
        <div class="score-value">{{ score }}<span class="score-unit">分</span></div>
        <div :class="['status-badge', isQualified ? 'qualified' : 'unqualified']">
          {{ isQualified ? '合格' : '不合格' }}
        </div>
      </div>
      <div class="score-meta">
        <div class="meta-item">
          <span class="meta-label">评分时间:</span>
          <span class="meta-value">{{ formatDateTime(scoreTime) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">保洁人员:</span>
          <span class="meta-value">{{ cleanerName }}</span>
        </div>
      </div>
    </div>

    <!-- 评分明细 -->
    <div class="score-details-section" v-if="scoreItems && scoreItems.length > 0">
      <h3>评分明细</h3>
      <div class="score-items-list">
        <div v-for="(item, index) in scoreItems" :key="index" class="score-item">
          <div class="item-header">
            <span class="item-name">{{ item.item_name }}</span>
            <span :class="['item-score', getItemScoreClass(item.score)]">
              {{ item.score }}分
            </span>
          </div>
          <div class="item-standard">标准分: {{ item.standard_score }}分</div>
          <div v-if="item.comment" class="item-comment">评语: {{ item.comment }}</div>
          <div v-if="item.problem_images && item.problem_images.length > 0" class="item-images">
            <div class="image-preview" v-for="(img, imgIndex) in item.problem_images" :key="imgIndex">
              <img :src="img" alt="问题图片" @click="previewImage(img, item.problem_images)">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 清洁图片 -->
    <div class="clean-images-section" v-if="cleanImages && cleanImages.length > 0">
      <h3>清洁图片 ({{ cleanImages.length }}张)</h3>
      <div class="images-grid">
        <div v-for="(img, index) in cleanImages" :key="index" class="image-item">
          <img :src="img.url" alt="清洁图片" @click="previewImage(img.url, cleanImages.map(i => i.url))">
          <div class="image-time">{{ formatTime(img.upload_time) }}</div>
        </div>
      </div>
    </div>

    <!-- 复扫按钮（不合格时显示） -->
    <div class="action-section" v-if="!isQualified">
      <button class="rescan-btn" @click="startRescan">
        <span class="btn-icon">🔄</span>
        发起复扫
      </button>
      <p class="rescan-tip">本次评分不合格，请进行复扫处理</p>
    </div>

    <!-- 图片预览对话框 -->
    <div v-if="showImagePreview" class="image-preview-modal" @click="closePreview">
      <div class="preview-content">
        <img :src="previewImageUrl" alt="预览">
        <button class="close-btn" @click="closePreview">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAIScoreResult } from '@/services/workOrderService'

const route = useRoute()
const workOrderId = ref(route.params.id || 1) // 从路由获取或默认值

// 数据定义
const workOrderNo = ref('')
const score = ref(0)
const isQualified = ref(false)
const scoreTime = ref('')
const cleanerName = ref('')
const area = ref('')
const scoreItems = ref([])
const cleanImages = ref([])
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const previewImageList = ref([])

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

// 格式化时间（仅时间部分）
const formatTime = (datetime) => {
  if (!datetime) return ''
  return new Date(datetime).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取单项分数样式
const getItemScoreClass = (itemScore) => {
  if (itemScore >= 90) return 'score-excellent'
  if (itemScore >= 80) return 'score-good'
  if (itemScore >= 60) return 'score-fair'
  return 'score-poor'
}

// 加载评分结果
const loadScoreResult = async () => {
  try {
    const response = await getAIScoreResult(workOrderId.value)
    
    if (response.code === 0) {
      const data = response.data
      workOrderNo.value = data.order_no || `WO${workOrderId.value}`
      score.value = data.score || 0
      isQualified.value = data.is_qualified || false
      scoreTime.value = data.score_time || new Date()
      cleanerName.value = data.cleaner_username || '保洁人员'
      area.value = data.area || '未知区域'
      scoreItems.value = data.items || []
      cleanImages.value = data.images || []
      
      // 如果没有数据，使用模拟数据
      if (scoreItems.value.length === 0) {
        scoreItems.value = [
          { item_name: '地面清洁', score: 85, standard_score: 100, comment: '清洁彻底' },
          { item_name: '卫生间清洁', score: 90, standard_score: 100, comment: '无水渍' },
          { item_name: '玻璃清洁', score: 78, standard_score: 100, comment: '有少量水痕' }
        ]
      }
      
      if (cleanImages.value.length === 0) {
        cleanImages.value = [
          { url: 'https://via.placeholder.com/300x200?text=清洁后1', upload_time: new Date() },
          { url: 'https://via.placeholder.com/300x200?text=清洁后2', upload_time: new Date() }
        ]
      }
    }
  } catch (error) {
    console.error('加载评分结果失败:', error)
    ElMessage.error('加载评分结果失败')
    
    // 使用模拟数据
    score.value = 76
    isQualified.value = false
    workOrderNo.value = `WO${workOrderId.value}`
    scoreTime.value = new Date()
    cleanerName.value = '测试人员'
    area.value = '测试区'
    scoreItems.value = [
      { item_name: '地面清洁', score: 70, standard_score: 100, comment: '有污渍未清理' },
      { item_name: '卫生间清洁', score: 80, standard_score: 100, comment: '基本清洁' },
      { item_name: '玻璃清洁', score: 78, standard_score: 100, comment: '有少量水痕' }
    ]
    cleanImages.value = [
      { url: 'https://via.placeholder.com/300x200?text=清洁图片1', upload_time: new Date() },
      { url: 'https://via.placeholder.com/300x200?text=清洁图片2', upload_time: new Date() }
    ]
  }
}

// 预览图片
const previewImage = (url, list) => {
  previewImageUrl.value = url
  previewImageList.value = list
  showImagePreview.value = true
}

// 关闭预览
const closePreview = () => {
  showImagePreview.value = false
}

// 发起复扫
const startRescan = () => {
  // 跳转到复扫处理页面
  window.location.href = `/app/rescan/${workOrderId.value}`
  // 或者使用路由跳转
  // router.push(`/app/rescan/${workOrderId.value}`)
}


// AI评分状态
const isScoring = ref(false)

// 触发AI评分
const triggerAIScoring = async () => {
  isScoring.value = true
  try {
    // 调用AI评分接口
    const response = await fetch(`/v1/app/work-orders/${workOrderId.value}/ai-scoring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({})
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('AI评分结果:', result)
      
      if (result.score !== undefined) {
        // 更新页面显示的分数
        score.value = result.score
        isQualified.value = result.score >= 80 // 80分合格
        
        ElMessage.success(`AI评分完成！得分：${result.score}`)
      } else {
        ElMessage.warning('AI评分返回数据格式异常')
      }
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.error('AI评分失败:', error)
    
    // 如果AI服务不可用，使用模拟数据
    ElMessage.info('AI服务暂不可用，使用模拟数据演示')
    score.value = Math.floor(Math.random() * 30) + 70 // 70-99随机分
    isQualified.value = score.value >= 80
  } finally {
    isScoring.value = false
  }
}


// 组件挂载
onMounted(() => {
  loadScoreResult()
})
</script>

<style scoped>
.ai-score-result-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.work-order-info {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 14px;
}

.area-tag {
  background: #e8f4ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.score-display-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.score-main {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.score-value {
  font-size: 48px;
  font-weight: bold;
  color: #1890ff;
  margin-right: 16px;
}

.score-unit {
  font-size: 24px;
  margin-left: 4px;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: bold;
}

.status-badge.qualified {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-badge.unqualified {
  background: #fff2e8;
  color: #fa541c;
  border: 1px solid #ffbb96;
}

.score-meta {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.meta-item {
  text-align: center;
}

.meta-label {
  display: block;
  color: #999;
  font-size: 12px;
  margin-bottom: 4px;
}

.meta-value {
  font-size: 14px;
  color: #333;
}

.score-details-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.score-details-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.score-items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.score-item {
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-name {
  font-weight: 500;
  color: #333;
}

.item-score {
  font-weight: bold;
}

.score-excellent { color: #52c41a; }
.score-good { color: #1890ff; }
.score-fair { color: #faad14; }
.score-poor { color: #ff4d4f; }

.item-standard {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.item-comment {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.item-images {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.image-preview img {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
}

.clean-images-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.clean-images-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.image-item {
  position: relative;
}

.image-item img {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
}

.image-time {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.action-section {
  text-align: center;
  padding: 32px 20px;
}

.rescan-btn {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.rescan-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.rescan-tip {
  margin-top: 12px;
  color: #ff4d4f;
  font-size: 14px;
}

.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.preview-content img {
  max-width: 100%;
  max-height: 90vh;
  border-radius: 8px;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}



.action-buttons {
  text-align: center;
  margin: 20px 0;
}

.ai-score-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.ai-score-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.ai-score-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: linear-gradient(135deg, #ccc 0%, #999 100%);
}


</style>