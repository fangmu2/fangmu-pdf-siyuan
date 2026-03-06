// src/services/smartCropService.ts
/**
 * 智能裁剪服务
 * 自动检测图片内容边缘，去除白边和空白区域
 */

/**
 * 裁剪区域
 */
export interface CropRegion {
  /** 左上角 X 坐标 */
  x: number
  /** 左上角 Y 坐标 */
  y: number
  /** 裁剪宽度 */
  width: number
  /** 裁剪高度 */
  height: number
  /** 置信度（0-1） */
  confidence: number
}

/**
 * 裁剪配置选项
 */
export interface CropOptions {
  /** 白边阈值（0-255），默认 240 */
  threshold?: number
  /** 最小内容宽度（像素），默认 10 */
  minWidth?: number
  /** 最小内容高度（像素），默认 10 */
  minHeight?: number
  /** 边距（像素），默认 5 */
  padding?: number
  /** 是否启用置信度计算 */
  enableConfidence?: boolean
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<CropOptions> = {
  threshold: 240,
  minWidth: 10,
  minHeight: 10,
  padding: 5,
  enableConfidence: true,
}

/**
 * 检测上边界
 */
function detectTopBoundary(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
): number {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // 检测非白色像素（RGB 都小于阈值）
      if (r < threshold || g < threshold || b < threshold) {
        return y
      }
    }
  }
  return 0
}

/**
 * 检测下边界
 */
function detectBottomBoundary(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
  startY: number = 0,
): number {
  for (let y = height - 1; y >= startY; y--) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      if (r < threshold || g < threshold || b < threshold) {
        return y
      }
    }
  }
  return height - 1
}

/**
 * 检测左边界
 */
function detectLeftBoundary(
  data: Uint8ClampedArray,
  width: number,
  _height: number,
  threshold: number,
  topY: number,
  bottomY: number,
): number {
  for (let x = 0; x < width; x++) {
    for (let y = topY; y <= bottomY; y++) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      if (r < threshold || g < threshold || b < threshold) {
        return x
      }
    }
  }
  return 0
}

/**
 * 检测右边界
 */
function detectRightBoundary(
  data: Uint8ClampedArray,
  width: number,
  _height: number,
  threshold: number,
  leftX: number,
  topY: number,
  bottomY: number,
): number {
  for (let x = width - 1; x >= leftX; x--) {
    for (let y = topY; y <= bottomY; y++) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      if (r < threshold || g < threshold || b < threshold) {
        return x
      }
    }
  }
  return width - 1
}

/**
 * 检测内容区域
 * @param imageData - 图片像素数据
 * @param options - 裁剪选项
 * @returns 裁剪区域
 */
export function detectContentRegion(
  imageData: ImageData,
  options: CropOptions = {},
): CropRegion {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
  }
  const {
    width,
    height,
    data,
  } = imageData
  const {
    threshold,
    minWidth,
    minHeight,
    padding,
    enableConfidence,
  } = opts

  // 1. 检测上下左右边界
  const top = detectTopBoundary(data, width, height, threshold)
  const bottom = detectBottomBoundary(data, width, height, threshold, top)
  const left = detectLeftBoundary(data, width, height, threshold, top, bottom)
  const right = detectRightBoundary(data, width, height, threshold, left, top, bottom)

  // 2. 应用边距
  const paddedTop = Math.max(0, top - padding)
  const paddedBottom = Math.min(height - 1, bottom + padding)
  const paddedLeft = Math.max(0, left - padding)
  const paddedRight = Math.min(width - 1, right + padding)

  // 3. 计算裁剪区域
  let cropWidth = paddedRight - paddedLeft + 1
  let cropHeight = paddedBottom - paddedTop + 1

  // 4. 确保最小尺寸
  if (cropWidth < minWidth) {
    cropWidth = minWidth
  }
  if (cropHeight < minHeight) {
    cropHeight = minHeight
  }

  // 5. 计算置信度（基于内容占比）
  let confidence = 1.0
  if (enableConfidence) {
    const contentRatio = (cropWidth * cropHeight) / (width * height)
    // 内容占比越小，置信度越高（说明白边越多）
    // 内容占比越大，置信度越低（说明几乎没有白边）
    confidence = Math.min(1, (1 - contentRatio) * 2)

    // 如果没有检测到有效内容，降低置信度
    if (cropWidth >= width - 2 && cropHeight >= height - 2) {
      confidence = 0.3
    }
  }

  return {
    x: paddedLeft,
    y: paddedTop,
    width: cropWidth,
    height: cropHeight,
    confidence,
  }
}

/**
 * 加载图片为 ImageData
 */
export function loadImageData(
  imageSrc: string,
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('无法获取 canvas 上下文'))
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        resolve(imageData)
      } catch (error) {
        reject(new Error(`获取图片数据失败：${(error as Error).message}`))
      }
    }

    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }

    img.src = imageSrc
  })
}

/**
 * 裁剪图片
 * @param imageSrc - 原图路径
 * @param region - 裁剪区域
 * @returns 裁剪后的图片 DataURL
 */
export async function cropImage(
  imageSrc: string,
  region: CropRegion,
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('无法获取 canvas 上下文')
  }

  canvas.width = region.width
  canvas.height = region.height

  // 从原图中裁剪
  ctx.drawImage(
    img,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    region.width,
    region.height,
  )

  return canvas.toDataURL('image/png')
}

/**
 * 智能裁剪图片（自动检测 + 裁剪）
 * @param imageSrc - 原图路径
 * @param options - 裁剪选项
 * @returns 裁剪后的图片 DataURL 和裁剪区域
 */
export async function smartCropImage(
  imageSrc: string,
  options: CropOptions = {},
): Promise<{ croppedImage: string, region: CropRegion }> {
  const imageData = await loadImageData(imageSrc)
  const region = detectContentRegion(imageData, options)

  const croppedImage = await cropImage(imageSrc, region)

  return {
    croppedImage,
    region,
  }
}

/**
 * 批量处理图片裁剪
 * @param imageSources - 图片路径列表
 * @param options - 裁剪选项
 * @param onProgress - 进度回调（当前索引，总数）
 * @returns 裁剪结果列表
 */
export async function batchSmartCrop(
  imageSources: string[],
  options: CropOptions = {},
  onProgress?: (current: number, total: number) => void,
): Promise<Array<{ src: string, croppedImage: string, region: CropRegion }>> {
  const results: Array<{ src: string, croppedImage: string, region: CropRegion }> = []

  for (let i = 0; i < imageSources.length; i++) {
    try {
      const result = await smartCropImage(imageSources[i], options)
      results.push({
        src: imageSources[i],
        croppedImage: result.croppedImage,
        region: result.region,
      })
    } catch (error) {
      console.error(`裁剪图片失败 [${i + 1}/${imageSources.length}]:`, error)
      // 失败时保留原图
      results.push({
        src: imageSources[i],
        croppedImage: imageSources[i],
        region: {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          confidence: 0,
        },
      })
    }

    if (onProgress) {
      onProgress(i + 1, imageSources.length)
    }

    // 避免阻塞 UI
    if (i < imageSources.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  return results
}

export default {
  detectContentRegion,
  loadImageData,
  cropImage,
  smartCropImage,
  batchSmartCrop,
}
