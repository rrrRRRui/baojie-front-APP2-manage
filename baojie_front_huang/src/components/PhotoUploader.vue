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
        ref="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        @change="handleCameraCapture"
        style="display: none"
      />
      
      <input
        ref="galleryInput"
        type="file"
        accept="image/*"
        multiple
        @change="handleGallerySelect"
        style="display: none"
      />
    </div>

    <!-- 相机预览模态框 -->
    <div v-if="showCameraModal" class="camera-modal">
      <div class="camera-container">
        <div class="camera-header">
          <h3>拍照</h3>
          <button @click="closeCameraModal" class="close-btn">×</button>
        </div>
        
        <div class="camera-preview">
          <video
            ref="videoElement"
            autoplay
            playsinline
            :class="{ 'mirrored': facingMode === 'user' }"
          ></video>
          
          <canvas
            ref="canvasElement"
            style="display: none"
          ></canvas>
        </div>
        
        <div class="camera-controls">
          <button @click="switchCamera" class="switch-btn" v-if="hasMultipleCameras">
            🔄 切换摄像头
          </button>
          
          <button @click="capturePhoto" class="capture-btn">
            📷 拍照
          </button>
          
          <button @click="closeCameraModal" class="cancel-btn">
            取消
          </button>
        </div>
      </div>
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
              <div class="error-message">{{ file.error }}</div>
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
          v-if="hasFailedFiles"
          @click="uploadStore.retryAllFailed"
          :disabled="uploadStore.isUploading"
          class="btn btn-warning retry-all-btn"
        >
          重试失败
        </button>
        
        <button
          @click="uploadStore.clearFiles"
          :disabled="uploadStore.isUploading"
          class="btn btn-secondary"
        >
          清空
        </button>
      </div>
      
      <!-- 上传统计 -->
      <div v-if="uploadStore.files.length > 0" class="upload-stats">
        <div class="stats-item">
          <span class="stats-label">总计:</span>
          <span class="stats-value">{{ stats.total }}</span>
        </div>
        <div class="stats-item success" v-if="stats.success > 0">
          <span class="stats-label">成功:</span>
          <span class="stats-value">{{ stats.success }}</span>
        </div>
        <div class="stats-item error" v-if="stats.error > 0">
          <span class="stats-label">失败:</span>
          <span class="stats-value">{{ stats.error }}</span>
        </div>
        <div class="stats-item uploading" v-if="stats.uploading > 0">
          <span class="stats-label">上传中:</span>
          <span class="stats-value">{{ stats.uploading }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUploadStore } from '@/stores/upload'
import { compressImage, isImageFile, formatFileSize as formatSize } from '@/utils/imageUtils'

const uploadStore = useUploadStore()
const cameraInput = ref<HTMLInputElement>()
const galleryInput = ref<HTMLInputElement>()
const videoElement = ref<HTMLVideoElement>()
const canvasElement = ref<HTMLCanvasElement>()

// 相机相关状态
const showCameraModal = ref(false)
const mediaStream = ref<MediaStream | null>(null)
const facingMode = ref<'user' | 'environment'>('environment')
const hasMultipleCameras = ref(false)

const hasPendingFiles = computed(() => {
  return uploadStore.files.some(f => f.status === 'pending' || f.status === 'error')
})

const hasFailedFiles = computed(() => {
  return uploadStore.files.some(f => f.status === 'error')
})

const stats = computed(() => uploadStore.getStats())

// 检测可用摄像头
onMounted(async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter(device => device.kind === 'videoinput')
    hasMultipleCameras.value = videoDevices.length > 1
  } catch (error) {
    console.warn('无法检测摄像头设备:', error)
  }
})

// 清理资源
onUnmounted(() => {
  stopCamera()
})

// 打开相机
const openCamera = async () => {
  try {
    // 检查是否支持摄像头
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // 降级到文件选择
      cameraInput.value?.click()
      return
    }
    
    showCameraModal.value = true
    await startCamera()
  } catch (error) {
    console.error('打开相机失败:', error)
    showCameraModal.value = false
    // 降级到文件选择
    cameraInput.value?.click()
  }
}

// 启动相机
const startCamera = async () => {
  try {
    const constraints = {
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    }
    
    mediaStream.value = await navigator.mediaDevices.getUserMedia(constraints)
    
    if (videoElement.value) {
      videoElement.value.srcObject = mediaStream.value
    }
  } catch (error) {
    console.error('启动相机失败:', error)
    throw error
  }
}

// 停止相机
const stopCamera = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
}

// 切换摄像头
const switchCamera = async () => {
  stopCamera()
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'
  await startCamera()
}

// 拍照
const capturePhoto = () => {
  if (!videoElement.value || !canvasElement.value) return
  
  const video = videoElement.value
  const canvas = canvasElement.value
  const ctx = canvas.getContext('2d')!
  
  // 设置画布尺寸
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  // 绘制视频帧到画布
  ctx.drawImage(video, 0, 0)
  
  // 转换为Blob
  canvas.toBlob(async (blob) => {
    if (blob) {
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      })
      
      // 压缩图片
      const compressedFile = await compressImage(file, 0.8)
      
      // 添加到上传列表
      uploadStore.addFiles([compressedFile], {
        maxSize: 10,
        maxCount: 9,
        quality: 0.8
      })
      
      closeCameraModal()
    }
  }, 'image/jpeg', 0.9)
}

// 关闭相机模态框
const closeCameraModal = () => {
  stopCamera()
  showCameraModal.value = false
}

// 打开相册
const openGallery = () => {
  galleryInput.value?.click()
}

// 处理相机拍照（降级方案）
const handleCameraCapture = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
  if (files.length > 0) {
    // 压缩图片
    const compressedFiles = await Promise.all(
      files.map(file => compressImage(file, 0.8))
    )
    
    uploadStore.addFiles(compressedFiles, {
      maxSize: 10,
      maxCount: 9,
      quality: 0.8
    })
  }
  
  target.value = ''
}

// 处理相册选择
const handleGallerySelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
  if (files.length > 0) {
    // 过滤图片文件
    const imageFiles = files.filter(isImageFile)
    
    if (imageFiles.length !== files.length) {
      console.warn('只能选择图片文件')
    }
    
    // 压缩图片
    const compressedFiles = await Promise.all(
      imageFiles.map(file => compressImage(file, 0.8))
    )
    
    uploadStore.addFiles(compressedFiles, {
      maxSize: 10,
      maxCount: 9,
      quality: 0.8
    })
  }
  
  target.value = ''
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  return formatSize(bytes)
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
  padding: 8px;
}

.error-message {
  color: white;
  font-size: 10px;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  word-break: break-word;
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

.retry-btn:hover {
  background: #f0f0f0;
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

.remove-btn:hover {
  background: rgba(0, 0, 0, 0.9);
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

.retry-all-btn {
  background: #FF9500;
  color: white;
}

.retry-all-btn:hover {
  background: #E6850E;
}

.retry-all-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 上传统计样式 */
.upload-stats {
  display: flex;
  gap: 15px;
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stats-label {
  color: #666;
}

.stats-value {
  font-weight: 600;
  color: #333;
}

.stats-item.success .stats-value {
  color: #34C759;
}

.stats-item.error .stats-value {
  color: #FF3B30;
}

.stats-item.uploading .stats-value {
  color: #007AFF;
}

/* 相机模态框样式 */
.camera-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.camera-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.camera-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.camera-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-preview {
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.camera-preview video {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
}

.camera-preview video.mirrored {
  transform: scaleX(-1);
}

.camera-controls {
  display: flex;
  gap: 10px;
  padding: 20px;
  background: #f5f5f5;
  justify-content: center;
  align-items: center;
}

.switch-btn, .capture-btn, .cancel-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.switch-btn {
  background: #f0f0f0;
  color: #333;
}

.switch-btn:hover {
  background: #e0e0e0;
}

.capture-btn {
  background: #007AFF;
  color: white;
  font-size: 16px;
  padding: 15px 30px;
}

.capture-btn:hover {
  background: #0056CC;
}

.cancel-btn {
  background: #666;
  color: white;
}

.cancel-btn:hover {
  background: #555;
}

@media (max-width: 768px) {
  .camera-container {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .camera-controls {
    flex-direction: column;
    gap: 15px;
  }
  
  .camera-controls button {
    width: 100%;
  }
}
</style>