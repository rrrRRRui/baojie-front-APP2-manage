/**
 * 图片压缩工具函数
 */
export const compressImage = (
  file: File,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // 如果不是图片文件，直接返回
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      try {
        // 计算压缩后的尺寸
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }
        
        canvas.width = width
        canvas.height = height
        
        // 设置高质量绘制
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              
              // 如果压缩后文件更大，使用原文件
              if (compressedFile.size > file.size) {
                resolve(file)
              } else {
                resolve(compressedFile)
              }
            } else {
              resolve(file)
            }
          },
          file.type,
          quality
        )
      } catch (error) {
        console.error('图片压缩失败:', error)
        resolve(file) // 压缩失败时返回原文件
      }
    }
    
    img.onerror = () => {
      console.error('图片加载失败')
      resolve(file) // 加载失败时返回原文件
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 检查文件是否为图片
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

/**
 * 检查图片文件是否为支持的格式
 */
export const isSupportedImageFormat = (file: File): boolean => {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ]
  return supportedTypes.includes(file.type.toLowerCase())
}

/**
 * 获取图片的EXIF方向信息并旋转
 */
export const getImageOrientation = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const dataView = new DataView(arrayBuffer)
        
        // 检查是否为JPEG
        if (dataView.getUint16(0) !== 0xFFD8) {
          resolve(1) // 默认方向
          return
        }
        
        let offset = 2
        let marker = dataView.getUint16(offset)
        
        while (marker !== 0xFFE1 && offset < dataView.byteLength) {
          offset += 2 + dataView.getUint16(offset + 2)
          if (offset >= dataView.byteLength) break
          marker = dataView.getUint16(offset)
        }
        
        if (marker !== 0xFFE1) {
          resolve(1)
          return
        }
        
        // 查找EXIF数据
        offset += 4
        if (dataView.getUint32(offset) !== 0x45786966) {
          resolve(1)
          return
        }
        
        // 读取方向信息
        const little = dataView.getUint16(offset + 6) === 0x4949
        offset += 6
        
        if (dataView.getUint16(offset + 2, little) !== 0x002A) {
          resolve(1)
          return
        }
        
        const firstIFD = dataView.getUint32(offset + 4, little)
        offset += firstIFD
        
        const entries = dataView.getUint16(offset, little)
        offset += 2
        
        for (let i = 0; i < entries; i++) {
          if (dataView.getUint16(offset + i * 12, little) === 0x0112) {
            const orientation = dataView.getUint16(offset + i * 12 + 8, little)
            resolve(orientation)
            return
          }
        }
        
        resolve(1)
      } catch (error) {
        console.error('读取EXIF信息失败:', error)
        resolve(1)
      }
    }
    
    reader.onerror = () => {
      resolve(1)
    }
    
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024))
  })
}

/**
 * 根据EXIF方向信息旋转图片
 */
export const rotateImageByOrientation = (
  file: File,
  orientation: number = 1
): Promise<File> => {
  return new Promise((resolve) => {
    if (orientation === 1) {
      resolve(file) // 不需要旋转
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      const { width, height } = img
      
      // 根据方向设置画布尺寸和变换
      switch (orientation) {
        case 2:
          canvas.width = width
          canvas.height = height
          ctx.transform(-1, 0, 0, 1, width, 0)
          break
        case 3:
          canvas.width = width
          canvas.height = height
          ctx.transform(-1, 0, 0, -1, width, height)
          break
        case 4:
          canvas.width = width
          canvas.height = height
          ctx.transform(1, 0, 0, -1, 0, height)
          break
        case 5:
          canvas.width = height
          canvas.height = width
          ctx.transform(0, 1, 1, 0, 0, 0)
          break
        case 6:
          canvas.width = height
          canvas.height = width
          ctx.transform(0, 1, -1, 0, height, 0)
          break
        case 7:
          canvas.width = height
          canvas.height = width
          ctx.transform(0, -1, -1, 0, height, width)
          break
        case 8:
          canvas.width = height
          canvas.height = width
          ctx.transform(0, -1, 1, 0, 0, width)
          break
        default:
          canvas.width = width
          canvas.height = height
      }
      
      ctx.drawImage(img, 0, 0)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const rotatedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(rotatedFile)
          } else {
            resolve(file)
          }
        },
        file.type,
        0.9
      )
    }
    
    img.onerror = () => {
      resolve(file)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}