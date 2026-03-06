/**
 * 图片上传服务
 * 提供图片上传到思源资源库、Base64 转换等功能
 */

import { postApi } from '@/api/siyuanApi'

/**
 * 上传文件到思源资源库
 * @param file - 要上传的文件
 * @returns 文件路径
 */
export async function uploadImage(file: File): Promise<string> {
  // 文件大小限制（5MB）
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error('图片大小不能超过 5MB')
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await postApi('/api/file/uploadAsset', formData)
    return response.path as string
  } catch (error) {
    console.error('图片上传失败:', error)
    throw new Error('图片上传失败，请重试')
  }
}

/**
 * 从思源资源库选择图片
 * @returns 选中的图片路径
 */
export async function selectImageFromSiyuan(): Promise<string> {
  try {
    // 思源 API：列出资源库中的图片
    const response = await postApi('/api/file/getAssets', {})
    const assets = response.data as any[]

    // TODO: 实现图片选择器 UI
    // 目前返回第一个图片作为示例
    if (assets.length > 0) {
      return assets[0].path as string
    }

    throw new Error('资源库中没有图片')
  } catch (error) {
    console.error('从思源选择图片失败:', error)
    throw new Error('从思源选择图片失败')
  }
}

/**
 * 文件转 Base64
 * @param file - 要转换的文件
 * @returns Base64 字符串
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Base64 转 File
 * @param base64 - Base64 字符串
 * @param fileName - 文件名
 * @returns File 对象
 */
export function base64ToFile(base64: string, fileName: string): File {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new File([u8arr], fileName, { type: mime })
}

/**
 * 压缩图片
 * @param file - 原始图片文件
 * @param maxSize - 最大尺寸（像素）
 * @param quality - 压缩质量（0-1）
 * @returns 压缩后的图片文件
 */
export async function compressImage(
  file: File,
  maxSize: number = 1920,
  quality: number = 0.8,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 计算缩放比例
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          } else {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取 canvas 上下文'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'))
              return
            }
            resolve(new File([blob], file.name, { type: file.type }))
          },
          file.type,
          quality,
        )
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 验证图片文件
 * @param file - 要验证的文件
 * @returns 验证结果
 */
export function validateImageFile(file: File): { valid: boolean, error?: string } {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '只支持 JPG、PNG、GIF、WebP 格式的图片',
    }
  }

  // 检查文件大小
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '图片大小不能超过 5MB',
    }
  }

  return { valid: true }
}
