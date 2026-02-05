<template>
  <div class="ai-scoring-page">
    <h2>AI智能评分</h2>
    
    <!-- 选择场景 -->
    <div class="scenario-section">
      <h3>选择清洁场景：</h3>
      <div class="scenario-buttons">
        <el-button 
          v-for="item in scenarios" 
          :key="item.value"
          :type="selectedScenario === item.value ? 'primary' : ''"
          @click="selectedScenario = item.value"
        >
          {{ item.label }}
        </el-button>
      </div>
    </div>
    
    <!-- 上传图片 -->
    <div class="upload-section">
      <h3>上传清洁图片：</h3>
      <el-upload
        class="upload-box"
        drag
        :show-file-list="false"
        :on-change="handleImageUpload"
        accept="image/*"
      >
        <div v-if="!selectedImage">
          <el-icon><upload /></el-icon>
          <div>点击或拖拽图片到这里</div>
        </div>
        <div v-else>
          <img :src="imagePreview" alt="预览" class="preview-image" />
          <div>点击更换图片</div>
        </div>
      </el-upload>
    </div>
    
    <!-- 开始评分按钮 -->
    <div class="action-section">
      <el-button 
        type="primary" 
        size="large" 
        :disabled="!selectedImage || !selectedScenario"
        :loading="isLoading"
        @click="startScoring"
      >
        {{ isLoading ? '评分中...' : '开始AI评分' }}
      </el-button>
    </div>
    
    <!-- 结果显示 -->
    <div v-if="scoreResult" class="result-section">
      <h3>评分结果：</h3>
      <div class="score-card">
        <div class="score-number">{{ scoreResult.score }}分</div>
        <div class="score-status">
          <el-tag :type="scoreResult.score >= 60 ? 'success' : 'danger'">
            {{ scoreResult.score >= 60 ? '合格' : '不合格' }}
          </el-tag>
        </div>
        <div class="score-time">处理时间：{{ scoreResult.processing_time }}秒</div>
      </div>
      
      <div class="save-section">
        <el-button type="success" @click="saveScore">保存评分结果</el-button>
        <el-button @click="resetAll">重新评分</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { getAIScore, saveAIScore } from '@/services/workOrderService'

// 6个场景
const scenarios = ref([
  { value: 'dimian', label: '地面' },
  { value: 'dingmian', label: '顶面' },
  { value: 'dunbian', label: '蹲便' },
  { value: 'matong', label: '马桶' },
  { value: 'taimian', label: '台面' },
  { value: 'xiaobianqi', label: '小便器' }
])

// 数据
const selectedScenario = ref('')
const selectedImage = ref(null)
const imagePreview = ref('')
const isLoading = ref(false)
const scoreResult = ref(null)

// 处理图片上传
const handleImageUpload = (file) => {
  selectedImage.value = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

// 开始评分
const startScoring = async () => {
  try {
    isLoading.value = true
    const response = await getAIScore(selectedImage.value, selectedScenario.value)
    
    if (response.code === 0) {
      scoreResult.value = response.data
      ElMessage.success('评分成功！')
    }
  } catch (error) {
    ElMessage.error('评分失败：' + error.message)
  } finally {
    isLoading.value = false
  }
}

// 保存评分
const saveScore = async () => {
  try {
    // 这里需要获取工单ID，暂时用弹窗让用户输入
    const { value: workOrderId } = await ElMessageBox.prompt('请输入工单ID', '保存评分', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputPattern: /^\d+$/,
      inputErrorMessage: '请输入数字'
    })
    
    if (workOrderId) {
      const response = await saveAIScore(workOrderId, scoreResult.value.score)
      if (response.code === 0) {
        ElMessage.success('保存成功！')
      }
    }
  } catch (error) {
    // 用户取消输入
  }
}

// 重置
const resetAll = () => {
  selectedScenario.value = ''
  selectedImage.value = null
  imagePreview.value = ''
  scoreResult.value = null
}
</script>

<style scoped>
.ai-scoring-page {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.scenario-section,
.upload-section,
.action-section,
.result-section {
  margin-bottom: 30px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
}

h3 {
  margin-bottom: 15px;
}

.scenario-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.upload-box {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-box:hover {
  border-color: #409eff;
}

.preview-image {
  max-width: 300px;
  max-height: 200px;
  margin-bottom: 10px;
}

.action-section {
  text-align: center;
}

.score-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  margin: 20px 0;
}

.score-number {
  font-size: 48px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 10px;
}

.score-status {
  margin-bottom: 10px;
}

.save-section {
  text-align: center;
  margin-top: 20px;
}
</style>