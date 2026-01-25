import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UploadFile, UploadOptions } from '@/types/upload'

export const useUploadStore = defineStore('upload', () => {
  const files = ref<UploadFile[]>([])
  const isUploading = ref(false)

  // 添加文件
  const addFiles = (newFiles: File[], options: UploadOptions = {}) => {
    const { maxSize = 10, maxCount = 9, quality = 0.8 } = options
    
    newFiles.forEach(file => {
      // 检查文件大小
      if (file.size > maxSize * 1024 * 1024) {
        console.warn(`文件 ${file.name} 超过大小限制`)
        return
      }
      
      // 检查文件数量
      if (files.value.length >= maxCount) {
        console.warn('已达到最大文件数量限制')
        return
      }

      const uploadFile: UploadFile = {
        id: Date.now() + Math.random().toString(36),
        file,
        url: URL.createObjectURL(file),
        status: 'pending',
        progress: 0
      }
      
      files.value.push(uploadFile)
    })
  }

  // 移除文件
  const removeFile = (id: string) => {
    const index = files.value.findIndex(f => f.id === id)
    if (index > -1) {
      URL.revokeObjectURL(files.value[index].url)
      files.value.splice(index, 1)
    }
  }

  // 上传单个文件
  const uploadFile = async (file: UploadFile): Promise<void> => {
    file.status = 'uploading'
    file.progress = 0

    try {
      // 模拟上传过程
      const formData = new FormData()
      formData.append('file', file.file)
      
      // 模拟上传进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        file.progress = i
      }
      
      // 这里应该调用实际的上传API
      // const response = await fetch('/api/upload', {
      //   method: 'POST',
      //   body: formData
      // })
      
      file.status = 'success'
    } catch (error) {
      file.status = 'error'
      file.error = error instanceof Error ? error.message : '上传失败'
    }
  }

  // 上传所有文件
  const uploadAll = async () => {
    isUploading.value = true
    const pendingFiles = files.value.filter(f => f.status === 'pending' || f.status === 'error')
    
    try {
      await Promise.all(pendingFiles.map(uploadFile))
    } finally {
      isUploading.value = false
    }
  }

  // 重试上传
  const retryUpload = async (id: string) => {
    const file = files.value.find(f => f.id === id)
    if (file && file.status === 'error') {
      await uploadFile(file)
    }
  }

  // 清空所有文件
  const clearFiles = () => {
    files.value.forEach(file => URL.revokeObjectURL(file.url))
    files.value = []
  }

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    uploadAll,
    retryUpload,
    clearFiles
  }
})