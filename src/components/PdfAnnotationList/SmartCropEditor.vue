<!-- src/components/PdfAnnotationList/SmartCropEditor.vue -->
<template>
  <div class="smart-crop-editor">
    <!-- 头部 -->
    <div class="crop-header">
      <h3 class="crop-title">
        智能裁剪
      </h3>
      <div class="header-actions">
        <button
          :disabled="!imageLoaded || isProcessing"
          class="btn-auto"
          title="自动检测内容边缘"
          @click="autoCrop"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
          >
            <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-8.8 3.8L19 14.2 16.8 22H2.8l1.4-5.6L9 14 3 9.8 5.2 2h8z" />
          </svg>
          <span>智能检测</span>
        </button>
      </div>
    </div>

    <!-- 裁剪容器 -->
    <div
      ref="cropContainerRef"
      class="crop-container"
    >
      <!-- 原图 -->
      <canvas
        ref="cropCanvasRef"
        class="crop-canvas"
      ></canvas>

      <!-- 裁剪框 -->
      <div
        v-if="isCropping && cropBox"
        class="crop-box"
        :style="cropBoxStyle"
        @mousedown="startDrag"
      >
        <!-- 8 个控制点 -->
        <div
          v-for="handle in handles"
          :key="handle"
          class="crop-handle"
          :class="`handle-${handle}`"
          @mousedown.stop="startResize(handle, $event)"
        >
        </div>

        <!-- 中心区域提示 -->
        <div class="crop-box-center">
          <span class="crop-dimensions">{{ cropBox.width }} × {{ cropBox.height }}</span>
        </div>
      </div>

      <!-- 加载状态 -->
      <div
        v-if="!imageLoaded && !isProcessing"
        class="crop-empty"
      >
        <svg
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="currentColor"
          class="empty-icon"
        >
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
        <p>暂无图片</p>
      </div>

      <!-- 处理中状态 -->
      <div
        v-if="isProcessing"
        class="crop-processing"
      >
        <div class="spinner"></div>
        <p>处理中...</p>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="crop-actions">
      <div
        v-if="lastCropResult"
        class="confidence-indicator"
      >
        <span class="confidence-label">置信度：</span>
        <span
          class="confidence-value"
          :class="confidenceClass"
        >
          {{ (lastCropResult.confidence * 100).toFixed(0) }}%
        </span>
      </div>
      <div class="action-buttons">
        <button
          class="btn-cancel"
          @click="cancelCrop"
        >
          取消
        </button>
        <button
          class="btn-reset"
          @click="resetCrop"
        >
          重置
        </button>
        <button
          :disabled="!cropBox || isProcessing"
          class="btn-apply"
          @click="applyCrop"
        >
          应用裁剪
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CropRegion } from '../../services/smartCropService'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import {

  detectContentRegion,
} from '../../services/smartCropService'

const props = defineProps<{
  imageSrc?: string
}>()

const emit = defineEmits<{
  (e: 'crop-apply', croppedImage: string, region: CropRegion): void
  (e: 'crop-cancel'): void
}>()

// Canvas 引用
const cropContainerRef = ref<HTMLElement | null>(null)
const cropCanvasRef = ref<HTMLCanvasElement | null>(null)

// 状态
const imageLoaded = ref(false)
const isCropping = ref(false)
const isProcessing = ref(false)
let originalImage: HTMLImageElement | null = null

// 裁剪框
interface CropBox {
  x: number
  y: number
  width: number
  height: number
}

const cropBox = ref<CropBox | null>(null)
const lastCropResult = ref<CropRegion | null>(null)

// 控制点
const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const
type Handle = typeof handles[number]

// 拖拽状态
let isDragging = false
let isResizing = false
let currentHandle: Handle | null = null
let dragStartX = 0
let dragStartY = 0
let cropBoxStart: CropBox | null = null

// 缩放比例
let scale = 1

// 裁剪框样式
const cropBoxStyle = computed(() => {
  if (!cropBox.value) return {}
  return {
    left: `${cropBox.value.x}px`,
    top: `${cropBox.value.y}px`,
    width: `${cropBox.value.width}px`,
    height: `${cropBox.value.height}px`,
  }
})

// 置信度样式
const confidenceClass = computed(() => {
  if (!lastCropResult.value) return ''
  const confidence = lastCropResult.value.confidence
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
})

// 加载图片
watch(() => props.imageSrc, async (newSrc) => {
  if (newSrc) {
    await loadImage(newSrc)
  } else {
    resetEditor()
  }
}, { immediate: true })

async function loadImage(src: string) {
  isProcessing.value = true
  imageLoaded.value = false

  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = src
    })

    originalImage = img
    renderImage()
    autoCrop() // 加载后自动检测
  } catch (error) {
    console.error('加载图片失败:', error)
  } finally {
    isProcessing.value = false
    imageLoaded.value = true
  }
}

// 渲染图片到 Canvas
function renderImage() {
  if (!originalImage || !cropCanvasRef.value) return

  const canvas = cropCanvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 计算缩放比例（适配容器）
  const container = cropContainerRef.value
  if (!container) return

  const maxWidth = container.clientWidth
  const maxHeight = container.clientHeight - 100 // 留出头部和底部空间

  const imgRatio = originalImage.width / originalImage.height
  const containerRatio = maxWidth / maxHeight

  if (imgRatio > containerRatio) {
    // 图片更宽，按宽度缩放
    scale = maxWidth / originalImage.width
  } else {
    // 图片更高，按高度缩放
    scale = maxHeight / originalImage.height
  }

  const scaledWidth = originalImage.width * scale
  const scaledHeight = originalImage.height * scale

  canvas.width = scaledWidth
  canvas.height = scaledHeight

  // 绘制图片
  ctx.drawImage(originalImage, 0, 0, scaledWidth, scaledHeight)

  // 初始化裁剪框为全图
  if (!cropBox.value) {
    cropBox.value = {
      x: 0,
      y: 0,
      width: scaledWidth,
      height: scaledHeight,
    }
    isCropping.value = true
  }
}

// 智能裁剪
async function autoCrop() {
  if (!originalImage || !cropCanvasRef.value) return

  isProcessing.value = true

  try {
    const canvas = cropCanvasRef.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 获取图片数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // 检测内容区域
    const region = detectContentRegion(imageData, {
      threshold: 240,
      padding: 5,
    })

    // 应用检测结果
    cropBox.value = {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
    }

    lastCropResult.value = region
    isCropping.value = true
  } catch (error) {
    console.error('智能裁剪失败:', error)
  } finally {
    isProcessing.value = false
  }
}

// 开始拖拽裁剪框
function startDrag(e: MouseEvent) {
  isDragging = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  cropBoxStart = cropBox.value ? { ...cropBox.value } : null

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

function handleDrag(e: MouseEvent) {
  if (!isDragging || !cropBoxStart || !cropBox.value) return

  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY

  const canvas = cropCanvasRef.value
  if (!canvas) return

  // 计算新位置（限制在 Canvas 内）
  let newX = cropBoxStart.x + dx
  let newY = cropBoxStart.y + dy

  newX = Math.max(0, Math.min(newX, canvas.width - cropBox.value.width))
  newY = Math.max(0, Math.min(newY, canvas.height - cropBox.value.height))

  cropBox.value.x = newX
  cropBox.value.y = newY
}

function stopDrag() {
  isDragging = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 开始调整大小
function startResize(handle: Handle, e: MouseEvent) {
  isResizing = true
  currentHandle = handle
  dragStartX = e.clientX
  dragStartY = e.clientY
  cropBoxStart = cropBox.value ? { ...cropBox.value } : null

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
}

function handleResize(e: MouseEvent) {
  if (!isResizing || !cropBoxStart || !currentHandle || !cropBox.value) return

  const canvas = cropCanvasRef.value
  if (!canvas) return

  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  const handle = currentHandle

  // 最小尺寸
  const minSize = 20

  // 根据控制点调整
  if (handle.includes('e')) {
    // 右侧
    cropBox.value.width = Math.max(minSize, cropBoxStart.width + dx)
    cropBox.value.width = Math.min(cropBox.value.width, canvas.width - cropBoxStart.x)
  }
  if (handle.includes('w')) {
    // 左侧
    const newWidth = cropBoxStart.width - dx
    if (newWidth >= minSize && cropBoxStart.x + dx >= 0) {
      cropBox.value.x = cropBoxStart.x + dx
      cropBox.value.width = newWidth
    }
  }
  if (handle.includes('s')) {
    // 下侧
    cropBox.value.height = Math.max(minSize, cropBoxStart.height + dy)
    cropBox.value.height = Math.min(cropBox.value.height, canvas.height - cropBoxStart.y)
  }
  if (handle.includes('n')) {
    // 上侧
    const newHeight = cropBoxStart.height - dy
    if (newHeight >= minSize && cropBoxStart.y + dy >= 0) {
      cropBox.value.y = cropBoxStart.y + dy
      cropBox.value.height = newHeight
    }
  }
}

function stopResize() {
  isResizing = false
  currentHandle = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// 应用裁剪
async function applyCrop() {
  if (!cropBox.value || !originalImage) return

  isProcessing.value = true

  try {
    // 创建裁剪 Canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法获取 canvas 上下文')

    canvas.width = cropBox.value.width
    canvas.height = cropBox.value.height

    // 从原图裁剪（使用原始尺寸，不是缩放后的）
    ctx.drawImage(
      originalImage,
      cropBox.value.x / scale,
      cropBox.value.y / scale,
      cropBox.value.width / scale,
      cropBox.value.height / scale,
      0,
      0,
      cropBox.value.width / scale,
      cropBox.value.height / scale,
    )

    const croppedImage = canvas.toDataURL('image/png')

    // 计算原始尺寸的裁剪区域
    const region: CropRegion = {
      x: Math.round(cropBox.value.x / scale),
      y: Math.round(cropBox.value.y / scale),
      width: Math.round(cropBox.value.width / scale),
      height: Math.round(cropBox.value.height / scale),
      confidence: lastCropResult.value?.confidence || 1,
    }

    emit('crop-apply', croppedImage, region)
  } catch (error) {
    console.error('应用裁剪失败:', error)
  } finally {
    isProcessing.value = false
  }
}

// 取消裁剪
function cancelCrop() {
  emit('crop-cancel')
}

// 重置裁剪
function resetCrop() {
  if (originalImage && cropCanvasRef.value) {
    const canvas = cropCanvasRef.value
    cropBox.value = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    }
    lastCropResult.value = null
  }
}

// 重置编辑器
function resetEditor() {
  imageLoaded.value = false
  isCropping.value = false
  cropBox.value = null
  lastCropResult.value = null
  originalImage = null

  const canvas = cropCanvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
}

// 键盘快捷键
function handleKeyDown(e: KeyboardEvent) {
  if (!isCropping.value) return

  if (e.key === 'Enter') {
    applyCrop()
  } else if (e.key === 'Escape') {
    cancelCrop()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped lang="scss">
.smart-crop-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  border-radius: 8px;
  overflow: hidden;
}

.crop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.crop-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--b3-theme-on-surface);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-auto {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.crop-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--b3-theme-surface-light);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.crop-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.crop-box {
  position: absolute;
  border: 2px solid var(--b3-theme-primary);
  background: transparent;
  cursor: move;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
  }
}

.crop-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid var(--b3-theme-primary);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--b3-theme-primary);
    transform: scale(1.2);
  }
}

.handle-nw { top: -6px; left: -6px; cursor: nw-resize; }
.handle-n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.handle-ne { top: -6px; right: -6px; cursor: ne-resize; }
.handle-e { top: 50%; right: -6px; transform: translateY(-50%); cursor: e-resize; }
.handle-se { bottom: -6px; right: -6px; cursor: se-resize; }
.handle-s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.handle-sw { bottom: -6px; left: -6px; cursor: sw-resize; }
.handle-w { top: 50%; left: -6px; transform: translateY(-50%); cursor: w-resize; }

.crop-box-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

.crop-box:hover .crop-box-center {
  opacity: 1;
}

.crop-empty,
.crop-processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--b3-theme-on-surface-light);

  .empty-icon {
    opacity: 0.3;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}

.crop-processing {
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--b3-theme-surface-light);
    border-top-color: var(--b3-theme-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.crop-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.confidence-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;

  .confidence-label {
    color: var(--b3-theme-on-surface-light);
  }

  .confidence-value {
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;

    &.high {
      color: #22c55e;
      background: rgba(34, 197, 94, 0.1);
    }

    &.medium {
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
    }

    &.low {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-cancel,
.btn-reset {
  padding: 6px 12px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--b3-theme-surface-light);
  }
}

.btn-apply {
  padding: 6px 16px;
  background: var(--b3-theme-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
