<template>
  <div class="photo-upload-page">
    <header class="page-header">
      <button @click="$router.back()" class="back-btn">
        ← 返回
      </button>
      <h1>现场拍照</h1>
      <div class="spacer"></div>
    </header>
    
    <div class="page-content">
      <div class="tips">
        <h3>📸 拍照说明</h3>
        <ul>
          <li>请拍摄清洁前后对比照片</li>
          <li>确保照片清晰，光线充足</li>
          <li>最多可上传9张图片</li>
          <li>单张图片不超过10MB</li>
        </ul>
      </div>
      
      <PhotoUploader />
      
      <!-- 上传成功提示 -->
      <div v-if="showSuccessMessage" class="success-message">
        <div class="success-content">
          <div class="success-icon">✅</div>
          <h3>上传成功！</h3>
          <p>所有图片已成功上传到服务器</p>
          <button @click="handleComplete" class="btn btn-primary">
            完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import PhotoUploader from '@/components/PhotoUploader.vue'
import { useUploadStore } from '@/stores/upload'

const router = useRouter()
const uploadStore = useUploadStore()

// 检查是否所有文件都上传成功
const showSuccessMessage = computed(() => {
  return uploadStore.files.length > 0 && 
         uploadStore.files.every(f => f.status === 'success')
})

// 监听上传完成状态
watch(showSuccessMessage, (newVal) => {
  if (newVal) {
    // 可以在这里添加上传完成的逻辑，比如发送通知等
    console.log('所有文件上传完成')
  }
})

const handleComplete = () => {
  uploadStore.clearFiles()
  router.push('/')
}
</script>

<style scoped>
.photo-upload-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #007AFF;
  cursor: pointer;
  padding: 8px;
  margin-right: 15px;
}

.page-header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.spacer {
  flex: 1;
}

.page-content {
  padding: 20px;
}

.tips {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.tips h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 16px;
}

.tips ul {
  list-style: none;
  padding: 0;
}

.tips li {
  padding: 8px 0;
  color: #666;
  font-size: 14px;
  position: relative;
  padding-left: 20px;
}

.tips li::before {
  content: '•';
  color: #007AFF;
  position: absolute;
  left: 0;
  font-weight: bold;
}

.success-message {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.success-content {
  background: white;
  border-radius: 16px;
  padding: 40px 30px;
  text-align: center;
  max-width: 300px;
  margin: 20px;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.success-content h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 20px;
}

.success-content p {
  color: #666;
  margin-bottom: 30px;
  line-height: 1.5;
}

.success-content .btn {
  width: 100%;
}
</style>