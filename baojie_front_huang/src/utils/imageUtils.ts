/**
 * 图片压缩工具函数
 */
export const compressImage = (
  file: File,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }
      
      canvas.width = width
      canvas.height = height
      
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
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        },
        file.type,
        quality
      )
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
 * 获取图片的EXIF方向信息并旋转
 */
export const getImageOrientation = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
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
    }
    
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024))
  })
}