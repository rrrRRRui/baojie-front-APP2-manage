export interface UploadFile {
  id: string
  file: File
  url: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

export interface UploadOptions {
  maxSize?: number // 最大文件大小 (MB)
  maxCount?: number // 最大文件数量
  accept?: string // 接受的文件类型
  quality?: number // 图片压缩质量 0-1
}