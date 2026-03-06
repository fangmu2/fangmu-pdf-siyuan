<!-- src/components/PdfAnnotationList/BatchCropPanel.vue -->
<template>
  <div class="batch-crop-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-title">
        <h3>批量智能裁剪</h3>
        <span class="progress-text">{{ processedCount }} / {{ totalCount }}</span>
      </div>
      <button
        class="btn-close"
        title="关闭"
        @click="$emit('close')"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
        >
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar-container">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
      <span class="progress-percent">{{ progressPercentage.toFixed(0) }}%</span>
    </div>

    <!-- 裁剪预览列表 -->
    <div
      ref="previewListRef"
      class="crop-preview-list"
    >
      <div
        v-for="item in cropItems"
        :key="item.id"
        class="crop-item"
        :class="{
          'is-processing': item.status === 'processing',
          'is-cropped': item.status === 'cropped',
          'is-pending': item.status === 'pending',
          'is-error': item.status === 'error',
        }"
      >
        <!-- 缩略图 -->
        <div class="crop-thumbnail">
          <img
            v-if="item.status === 'cropped' && item.croppedImage"
            :src="item.croppedImage"
            alt="裁剪结果"
            @click="previewCrop(item)"
          />
          <img
            v-else-if="item.thumbnail"
            :src="item.thumbnail"
            alt="原图"
            @click="previewCrop(item)"
          />
          <div
            v-else
            class="thumbnail-placeholder"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
            >
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>

          <!-- 处理中遮罩 -->
          <div
            v-if="item.status === 'processing'"
            class="processing-overlay"
          >
            <div class="spinner"></div>
          </div>
        </div>

        <!-- 信息 -->
        <div class="crop-info">
          <div
            class="crop-name"
            :title="item.name"
          >
            {{ item.name }}
          </div>
          <div class="crop-status">
            <span
              v-if="item.status === 'cropped'"
              class="status-badge success"
            >
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="currentColor"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              已裁剪
            </span>
            <span
              v-else-if="item.status === 'processing'"
              class="status-badge processing"
            >
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="currentColor"
                class="spinner-icon"
              >
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8z" />
              </svg>
              处理中
            </span>
            <span
              v-else-if="item.status === 'error'"
              class="status-badge error"
            >
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              失败
            </span>
            <span
              v-else
              class="status-badge pending"
            >
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
              待处理
            </span>
          </div>
          <div
            v-if="item.region"
            class="crop-dimensions"
          >
            {{ item.region.width }} × {{ item.region.height }}
            <span
              v-if="item.region.confidence"
              class="confidence"
              :class="confidenceClass(item.region.confidence)"
            >
              ({{ (item.region.confidence * 100).toFixed(0) }}%)
            </span>
          </div>
        </div>

        <!-- 操作 -->
        <div class="crop-actions">
          <button
            v-if="item.status === 'cropped'"
            class="btn-preview"
            title="预览"
            @click="previewCrop(item)"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
          </button>
          <button
            v-if="item.status === 'cropped'"
            class="btn-revert"
            title="还原"
            @click="revertCrop(item)"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </button>
          <button
            v-if="item.status === 'pending' || item.status === 'error'"
            class="btn-process"
            title="处理"
            @click="processItem(item)"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-8.8 3.8L19 14.2 16.8 22H2.8l1.4-5.6L9 14 3 9.8 5.2 2h8z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="panel-actions">
      <div class="stats">
        <span class="stat-item success">✅ {{ successCount }}</span>
        <span class="stat-item pending">⏸️ {{ pendingCount }}</span>
        <span
          v-if="errorCount > 0"
          class="stat-item error"
        >❌ {{ errorCount }}</span>
      </div>
      <div class="action-buttons">
        <button
          :disabled="pendingCount === 0"
          class="btn-skip"
          @click="skipAll"
        >
          全部跳过
        </button>
        <button
          :disabled="pendingCount === 0 || isProcessingAll"
          class="btn-apply-all"
          :class="{ 'is-processing': isProcessingAll }"
          @click="processAll"
        >
          {{ isProcessingAll ? '处理中...' : '全部应用' }}
        </button>
      </div>
    </div>

    <!-- 预览对话框 -->
    <div
      v-if="previewItem"
      class="preview-dialog-overlay"
      @click="closePreview"
    >
      <div
        class="preview-dialog"
        @click.stop
      >
        <div class="preview-header">
          <h4>裁剪预览</h4>
          <button
            class="btn-close"
            @click="closePreview"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div class="preview-content">
          <div class="preview-comparison">
            <div class="preview-panel">
              <div class="panel-label">
                原图
              </div>
              <img
                :src="previewItem.originalImage || previewItem.thumbnail"
                alt="原图"
              />
            </div>
            <div class="preview-panel">
              <div class="panel-label">
                裁剪后
              </div>
              <img
                v-if="previewItem.croppedImage"
                :src="previewItem.croppedImage"
                alt="裁剪后"
              />
              <div
                v-else
                class="no-preview"
              >
                暂无裁剪结果
              </div>
            </div>
          </div>
        </div>
        <div class="preview-footer">
          <button
            class="btn-cancel"
            @click="closePreview"
          >
            关闭
          </button>
          <button
            class="btn-apply"
            @click="applyPreviewCrop"
          >
            应用此裁剪
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CropRegion } from '../../services/smartCropService'
import {
  computed,
  onMounted,
  ref,
} from 'vue'
import {

  smartCropImage,
} from '../../services/smartCropService'

interface CropItem {
  id: string
  name: string
  thumbnail?: string
  originalImage?: string
  croppedImage?: string
  region?: CropRegion
  status: 'pending' | 'processing' | 'cropped' | 'error'
}

const props = defineProps<{
  items: Array<{
    id: string
    name: string
    imageSrc: string
  }>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'crop-result', id: string, croppedImage: string, region: CropRegion): void
  (e: 'crop-revert', id: string): void
}>()

const cropItems = ref<CropItem[]>([])
const isProcessingAll = ref(false)
const previewItem = ref<CropItem | null>(null)
const previewListRef = ref<HTMLElement | null>(null)

// 初始化
onMounted(() => {
  cropItems.value = props.items.map((item) => ({
    id: item.id,
    name: item.name,
    thumbnail: item.imageSrc,
    originalImage: item.imageSrc,
    status: 'pending',
  }))
})

// 计算属性
const totalCount = computed(() => props.items.length)

const processedCount = computed(() => {
  return cropItems.value.filter((item) => item.status === 'cropped').length
})

const pendingCount = computed(() => {
  return cropItems.value.filter((item) =>
    item.status === 'pending' || item.status === 'error',
  ).length
})

const successCount = computed(() => {
  return cropItems.value.filter((item) => item.status === 'cropped').length
})

const errorCount = computed(() => {
  return cropItems.value.filter((item) => item.status === 'error').length
})

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return (processedCount.value / totalCount.value) * 100
})

// 置信度样式
function confidenceClass(confidence: number): string {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}

// 处理单个项目
async function processItem(item: CropItem) {
  if (!item.originalImage) return

  item.status = 'processing'

  try {
    const result = await smartCropImage(item.originalImage, {
      threshold: 240,
      padding: 5,
    })

    item.croppedImage = result.croppedImage
    item.region = result.region
    item.status = 'cropped'

    emit('crop-result', item.id, result.croppedImage, result.region)
  } catch (error) {
    console.error(`裁剪图片失败 [${item.name}]:`, error)
    item.status = 'error'
  }
}

// 全部处理
async function processAll() {
  isProcessingAll.value = true

  const pendingItems = cropItems.value.filter((item) =>
    item.status === 'pending' || item.status === 'error',
  )

  for (let i = 0; i < pendingItems.length; i++) {
    await processItem(pendingItems[i])
    // 避免阻塞 UI
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  isProcessingAll.value = false
}

// 全部跳过
function skipAll() {
  cropItems.value.forEach((item) => {
    if (item.status === 'pending' || item.status === 'error') {
      emit('crop-revert', item.id)
    }
  })
  emit('close')
}

// 还原裁剪
function revertCrop(item: CropItem) {
  item.croppedImage = undefined
  item.region = undefined
  item.status = 'pending'
  emit('crop-revert', item.id)
}

// 预览裁剪
function previewCrop(item: CropItem) {
  previewItem.value = item
}

// 关闭预览
function closePreview() {
  previewItem.value = null
}

// 应用预览中的裁剪
function applyPreviewCrop() {
  if (previewItem.value && previewItem.value.croppedImage && previewItem.value.region) {
    emit('crop-result', previewItem.value.id, previewItem.value.croppedImage, previewItem.value.region)
  }
  closePreview()
}
</script>

<style scoped lang="scss">
.batch-crop-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
    margin: 0;
  }

  .progress-text {
    font-size: 13px;
    color: var(--b3-theme-on-surface-light);
    background: var(--b3-theme-surface-light);
    padding: 2px 8px;
    border-radius: 4px;
  }
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--b3-theme-on-surface-light);
  border-radius: 4px;
  transition: all 0.15s;

  &:hover {
    background: var(--b3-theme-surface-light);
    color: var(--b3-theme-on-surface);
  }
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--b3-theme-surface-light);
  border-radius: 4px;
  overflow: hidden;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--b3-theme-primary), var(--b3-theme-primary-light));
    transition: width 0.3s ease;
    border-radius: 4px;
  }
}

.progress-percent {
  font-size: 13px;
  font-weight: 600;
  color: var(--b3-theme-primary);
  min-width: 40px;
  text-align: right;
}

.crop-preview-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.crop-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  margin-bottom: 8px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  border: 1px solid var(--b3-border-color);
  transition: all 0.2s;

  &:hover {
    background: var(--b3-theme-surface-light);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.is-cropped {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.05);
  }

  &.is-processing {
    border-color: var(--b3-theme-primary);
    background: rgba(66, 133, 244, 0.05);
  }

  &.is-error {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }
}

.crop-thumbnail {
  position: relative;
  width: 80px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: var(--b3-theme-background);
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumbnail-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--b3-theme-on-surface-light);
    opacity: 0.3;
  }

  .processing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.crop-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.crop-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crop-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;

  &.success {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.1);
  }

  &.processing {
    color: var(--b3-theme-primary);
    background: rgba(66, 133, 244, 0.1);

    .spinner-icon {
      animation: spin 1s linear infinite;
    }
  }

  &.error {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  &.pending {
    color: var(--b3-theme-on-surface-light);
    background: var(--b3-theme-surface-light);
  }
}

.crop-dimensions {
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);

  .confidence {
    margin-left: 4px;
    font-weight: 500;

    &.high { color: #22c55e; }
    &.medium { color: #f59e0b; }
    &.low { color: #ef4444; }
  }
}

.crop-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.btn-preview,
.btn-revert,
.btn-process {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--b3-theme-background);
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
    transform: translateY(-1px);
  }
}

.btn-revert:hover {
  background: #f59e0b;
  border-color: #f59e0b;
}

.btn-process:hover {
  background: #22c55e;
  border-color: #22c55e;
}

.panel-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 13px;

  .stat-item {
    font-weight: 500;
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-skip,
.btn-apply-all {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-skip {
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  border: 1px solid var(--b3-border-color);

  &:hover:not(:disabled) {
    background: var(--b3-theme-surface-light);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-apply-all {
  background: var(--b3-theme-primary);
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.is-processing {
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 预览对话框 */
.preview-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.preview-dialog {
  width: 90%;
  max-width: 800px;
  background: var(--b3-theme-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: dialog-appear 0.2s ease-out;
}

@keyframes dialog-appear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);

  h4 {
    font-size: 15px;
    font-weight: 600;
    color: var(--b3-theme-on-surface);
    margin: 0;
  }

  .btn-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--b3-theme-on-surface-light);
    border-radius: 4px;
    transition: all 0.15s;

    &:hover {
      background: var(--b3-theme-surface-light);
      color: var(--b3-theme-on-surface);
    }
  }
}

.preview-content {
  padding: 20px;
  max-height: 60vh;
  overflow: auto;
}

.preview-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .panel-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-on-surface-light);
    text-align: center;
  }

  img {
    width: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .no-preview {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--b3-theme-surface-light);
    border-radius: 8px;
    color: var(--b3-theme-on-surface-light);
    font-size: 13px;
  }
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
}

.btn-cancel,
.btn-apply {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  border: 1px solid var(--b3-border-color);

  &:hover {
    background: var(--b3-theme-surface-light);
  }
}

.btn-apply {
  background: var(--b3-theme-primary);
  color: white;
  border: none;

  &:hover {
    background: var(--b3-theme-primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}
</style>
