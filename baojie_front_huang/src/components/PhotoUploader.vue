<template>
  <div class="photo-uploader">
    <!-- 上传区域 -->
    <div class="upload-area">
      <div class="upload-actions">
        <button @click="openCamera" class="btn btn-primary">
          📷 拍照
        </button>
        <button @click="openGallery" class="btn btn-secondary">
          🖼️ 相册
        </button>
      </div>
      
      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        @change="handleFileSelect"
        style="display: none"
      />
      
      <input
        ref="galleryInput"
        type="file"
        accept="image/*"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- 文件预览列表 -->
    <div v-if="uploadStore.files.length > 0" class="file-list">
      <h3>已选择的图片 ({{ uploadStore.files.length }})</h3>
      
      <div class="file-grid">
        <div
          v-for="file in uploadStore.files"
          :key="file.id"
          class="file-item"
          :class="{ 
            'uploading': file.status === 'uploading',
            'success': file.status === 'success',
            'error': file.status === 'error'
          }"
        >
          <div class="file-preview">
            <img :src="file.url" :alt="file.file.name" />
            
            <!-- 上传状态覆盖层 -->
            <div v-if="file.status === 'uploading'" class="upload-overlay">
              <div class="progress-circle">
                <svg viewBox="0 0 36 36" class="circular-chart">
                  <path
                    class="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    class="circle"
                    :stroke-dasharray="`${file.progress}, 100`"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div class="progress-text">{{ file.progress }}%</div>
              </div>
            </div>
            
            <!-- 成功状态 -->
            <div v-if="file.status === 'success'" class="status-overlay success">
              ✅
            </div>
            
            <!-- 错误状态 -->
            <div v-if="file.status === 'error'" class="status-overlay error">
              ❌
              <button @click="uploadStore.retryUpload(file.id)" class="retry-btn">
                重试
              </button>
            </div>
          </div>
          
          <div class="file-info">
            <div class="file-name">{{ file.file.name }}</div>
            <div class="file-size">{{ formatFileSize(file.file.size) }}</div>
          </div>
          
          <button @click="uploadStore.removeFile(file.id)" class="remove-btn">
            ×
          </button>
        </div>
      </div>
      
      <!-- 上传控制按钮 -->
      <div class="upload-controls">
        <button
          @click="uploadStore.uploadAll"
          :disabled="uploadStore.isUploading || !hasPendingFiles"
          class="btn btn-primary upload-all-btn"
        >
          {{ uploadStore.isUploading ? '上传中...' : '上传所有图片' }}
        </button>
        
        <button
          @click="uploadStore.clearFiles"
          :disabled="uploadStore.isUploading"
          class="btn btn-secondary"
        >
          清空
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUploadStore } from '@/stores/upload'

const uploadStore = useUploadStore()
const fileInput = ref<HTMLInputElement>()
const galleryInput = ref<HTMLInputElement>()

const hasPendingFiles = computed(() => {
  return uploadStore.files.some(f => f.status === 'pending' || f.status === 'error')
})

// 打开相机
const openCamera = () => {
  fileInput.value?.click()
}

// 打开相册
const openGallery = () => {
  galleryInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
  if (files.length > 0) {
    uploadStore.addFiles(files, {
      maxSize: 10, // 10MB
      maxCount: 9,
      quality: 0.8
    })
  }
  
  // 清空input值，允许重复选择同一文件
  target.value = ''
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.photo-uploader {
  padding: 20px;
}

.upload-area {
  margin-bottom: 30px;
}

.upload-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.upload-actions .btn {
  flex: 1;
  max-width: 150px;
  font-size: 16px;
  padding: 15px;
}

.file-list h3 {
  margin-bottom: 15px;
  color: #333;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.file-item {
  position: relative;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.file-item.uploading {
  border-color: #007AFF;
}

.file-item.success {
  border-color: #34C759;
}

.file-item.error {
  border-color: #FF3B30;
}

.file-preview {
  position: relative;
  width: 100%;
  height: 120px;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-circle {
  position: relative;
  width: 50px;
  height: 50px;
}

.circular-chart {
  width: 100%;
  height: 100%;
}

.circle-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 2;
}

.circle {
  fill: none;
  stroke: #007AFF;
  stroke-width: 2;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.status-overlay.success {
  background: rgba(52, 199, 89, 0.8);
}

.status-overlay.error {
  background: rgba(255, 59, 48, 0.8);
  flex-direction: column;
  gap: 8px;
}

.retry-btn {
  background: white;
  color: #FF3B30;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.file-info {
  padding: 8px;
  font-size: 12px;
}

.file-name {
  font-weight: 500;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #666;
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
}

.upload-controls {
  display: flex;
  gap: 15px;
}

.upload-all-btn {
  flex: 1;
}

.upload-all-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>