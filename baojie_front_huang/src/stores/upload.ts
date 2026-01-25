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
        console.warn(`文件 ${file.name} 超过大小限制 ${maxSize}MB`)
        return
      }
      
      // 检查文件数量
      if (files.value.length >= maxCount) {
        console.warn(`已达到最大文件数量限制 ${maxCount} 张`)
        return
      }

      // 检查是否为图片文件
      if (!file.type.startsWith('image/')) {
        console.warn(`文件 ${file.name} 不是图片格式`)
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

  // 模拟网络延迟和可能的失败
  const simulateNetworkRequest = async (file: UploadFile): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file.file)
    
    // 模拟上传进度
    for (let i = 0; i <= 100; i += Math.random() * 20) {
      if (file.status !== 'uploading') break // 如果状态改变，停止进度更新
      
      file.progress = Math.min(100, Math.floor(i))
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    }
    
    file.progress = 100
    
    // 模拟随机失败（20%概率）
    if (Math.random() < 0.2) {
      throw new Error('网络连接超时，请重试')
    }
    
    // 这里应该调用实际的上传API
    // const response = await fetch('/api/upload', {
    //   method: 'POST',
    //   body: formData,
    //   onUploadProgress: (progressEvent) => {
    //     file.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    //   }
    // })
    // 
    // if (!response.ok) {
    //   throw new Error(`上传失败: ${response.statusText}`)
    // }
    // 
    // return await response.json()
  }

  // 上传单个文件
  const uploadFile = async (file: UploadFile): Promise<void> => {
    file.status = 'uploading'
    file.progress = 0
    file.error = undefined

    try {
      await simulateNetworkRequest(file)
      file.status = 'success'
      console.log(`文件 ${file.file.name} 上传成功`)
    } catch (error) {
      file.status = 'error'
      file.error = error instanceof Error ? error.message : '上传失败'
      console.error(`文件 ${file.file.name} 上传失败:`, file.error)
    }
  }

  // 上传所有文件
  const uploadAll = async () => {
    if (isUploading.value) return
    
    isUploading.value = true
    const pendingFiles = files.value.filter(f => f.status === 'pending' || f.status === 'error')
    
    if (pendingFiles.length === 0) {
      isUploading.value = false
      return
    }
    
    console.log(`开始上传 ${pendingFiles.length} 个文件`)
    
    try {
      // 并发上传，但限制并发数量
      const concurrency = 3
      for (let i = 0; i < pendingFiles.length; i += concurrency) {
        const batch = pendingFiles.slice(i, i + concurrency)
        await Promise.all(batch.map(uploadFile))
      }
      
      const successCount = files.value.filter(f => f.status === 'success').length
      const errorCount = files.value.filter(f => f.status === 'error').length
      
      console.log(`上传完成: 成功 ${successCount} 个，失败 ${errorCount} 个`)
    } finally {
      isUploading.value = false
    }
  }

  // 重试上传
  const retryUpload = async (id: string) => {
    const file = files.value.find(f => f.id === id)
    if (file && file.status === 'error') {
      console.log(`重试上传文件: ${file.file.name}`)
      await uploadFile(file)
    }
  }

  // 重试所有失败的文件
  const retryAllFailed = async () => {
    const failedFiles = files.value.filter(f => f.status === 'error')
    if (failedFiles.length === 0) return
    
    isUploading.value = true
    console.log(`重试上传 ${failedFiles.length} 个失败的文件`)
    
    try {
      await Promise.all(failedFiles.map(uploadFile))
    } finally {
      isUploading.value = false
    }
  }

  // 清空所有文件
  const clearFiles = () => {
    files.value.forEach(file => URL.revokeObjectURL(file.url))
    files.value = []
    isUploading.value = false
  }

  // 获取统计信息
  const getStats = () => {
    const total = files.value.length
    const pending = files.value.filter(f => f.status === 'pending').length
    const uploading = files.value.filter(f => f.status === 'uploading').length
    const success = files.value.filter(f => f.status === 'success').length
    const error = files.value.filter(f => f.status === 'error').length
    
    return { total, pending, uploading, success, error }
  }

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    uploadAll,
    retryUpload,
    retryAllFailed,
    clearFiles,
    getStats
  }
})