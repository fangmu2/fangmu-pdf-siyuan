<!-- src/components/AnnotationList/AnnotationItem.vue -->
<template>
  <div
    :class="[containerClass, `color-accent-${annotation.color}`]"
    :style="{ paddingLeft: `${indent}px` }"
    :data-annotation-id="annotation.id"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- 复选框（批量选择） -->
    <label
      v-if="showCheckbox"
      class="annotation-checkbox"
      title="选择此标注"
      @click.stop
    >
      <input
        type="checkbox"
        :checked="isSelected"
        @change="handleCheckboxChange"
      />
    </label>

    <!-- 标题类型 -->
    <template v-if="isHeading">
      <!-- 折叠指示器 -->
      <div
        v-if="canFold"
        class="fold-indicator"
        :title="isCollapsed ? '点击展开' : '点击折叠'"
        @click.stop="handleFoldToggle"
      >
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="currentColor"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>
      <div class="heading-prefix">
        {{ headingPrefix }}
      </div>
      <div class="heading-content">
        <span class="heading-text">{{ annotation.text }}</span>
        <span
          v-if="hasChildren"
          class="merged-count"
        >
          +{{ childrenCount }}
        </span>
      </div>
    </template>

    <!-- 段落类型 -->
    <template v-else-if="isParagraph">
      <div class="paragraph-marker"></div>
      <div class="paragraph-content">
        <p class="paragraph-text">
          {{ annotation.text }}
        </p>
        <div
          v-if="annotation.note"
          class="paragraph-note"
        >
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="currentColor"
          >
            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
          </svg>
          <span>{{ annotation.note }}</span>
        </div>
      </div>
    </template>

    <!-- 图片类型 -->
    <template v-else-if="isImage">
      <div class="image-container">
        <img
          v-if="isValidImagePath(annotation.imagePath) && imageStatus !== 'error'"
          :src="imageUrl"
          class="excerpt-image"
          @load="handleImageLoad"
          @error="handleImageError"
        />
        <div
          v-else
          class="image-placeholder"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
          <span>图片加载失败</span>
        </div>
      </div>
    </template>

    <!-- 悬浮操作按钮 -->
    <div class="hover-actions">
      <button
        class="action-icon"
        title="编辑"
        @click.stop="handleEdit"
      >
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="currentColor"
        >
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
        </svg>
      </button>
      <button
        v-if="isImage"
        class="action-icon"
        title="智能裁剪"
        @click.stop="handleCrop"
      >
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="currentColor"
        >
          <path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z" />
        </svg>
      </button>
      <button
        v-if="annotation.parentId"
        class="action-icon"
        title="取消合并"
        @click.stop="handleUnmerge"
      >
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="currentColor"
        >
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
        </svg>
      </button>
      <button
        class="action-icon delete"
        title="删除"
        @click.stop="handleDelete"
      >
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="currentColor"
        >
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AnnotationLevel, AnnotationColor, PDFAnnotation } from '@/types/annotation'
import { getKernelBase } from '../api/siyuanApi'

const props = defineProps<{
  annotation: PDFAnnotation
  indent?: number
  isSelected?: boolean
  isCollapsed?: boolean
  canFold?: boolean
  hasChildren?: boolean
  childrenCount?: number
  showCheckbox?: boolean
  isDragOver?: boolean
  isDragging?: boolean
  imageStatus?: 'loading' | 'loaded' | 'error'
}>()

const emit = defineEmits<{
  (e: 'click', annotation: PDFAnnotation, event: MouseEvent): void
  (e: 'contextmenu', annotation: PDFAnnotation, event: MouseEvent): void
  (e: 'checkbox-change', annotation: PDFAnnotation, checked: boolean): void
  (e: 'fold-toggle', annotationId: string): void
  (e: 'edit', annotation: PDFAnnotation): void
  (e: 'crop', annotation: PDFAnnotation): void
  (e: 'unmerge', annotation: PDFAnnotation): void
  (e: 'delete', annotation: PDFAnnotation): void
  (e: 'drag-start', event: DragEvent, annotation: PDFAnnotation): void
  (e: 'drag-end'): void
  (e: 'drag-over', event: DragEvent, annotation: PDFAnnotation): void
  (e: 'drag-leave'): void
  (e: 'drop', event: DragEvent, annotation: PDFAnnotation): void
  (e: 'image-load', annotationId: string): void
  (e: 'image-error', annotation: PDFAnnotation): void
}>()

const indent = computed(() => props.indent ?? 0)
const imageStatus = ref<'loading' | 'loaded' | 'error'>(props.imageStatus ?? 'loading')

// 判断节点类型
const isHeading = computed(() => {
  return !!props.annotation.level && props.annotation.level !== 'text' && !props.annotation.isImage
})

const isParagraph = computed(() => {
  return !props.annotation.isImage && (!props.annotation.level || props.annotation.level === 'text')
})

const isImage = computed(() => {
  return !!props.annotation.isImage
})

// 容器类名
const containerClass = computed(() => {
  const baseClass = isHeading.value ? 'doc-heading' : isImage.value ? 'doc-image' : 'doc-paragraph'
  return [
    baseClass,
    `color-accent-${props.annotation.color}`,
    {
      'drag-over': props.isDragOver,
      'dragging': props.isDragging,
      'selected': props.isSelected,
      'is-collapsed': props.isCollapsed,
    },
  ]
})

// 标题前缀
const headingPrefix = computed(() => {
  const prefixes: Record<AnnotationLevel, string> = {
    title: '¶',
    h1: '#',
    h2: '##',
    h3: '###',
    h4: '####',
    h5: '#####',
    text: '',
  }
  return prefixes[props.annotation.level as AnnotationLevel] || ''
})

// 检查图片路径是否有效
const isValidImagePath = (path: string | undefined): boolean => {
  if (!path) return false
  if (path.startsWith('blob:')) return false
  if (path.startsWith('file://')) return false
  if (path.startsWith('@')) return false
  if (path.includes('localhost') || path.includes('127.0.0.1')) return false
  return true
}

// 获取图片 URL
const imageUrl = computed(() => {
  const imagePath = props.annotation.imagePath
  if (!imagePath) return ''
  
  const kernelBase = getKernelBase()
  let path = imagePath
  
  if (path.startsWith('/data/')) {
    path = path.slice(6)
  }

  if (path.startsWith('assets/')) {
    return `${kernelBase}/${path}`
  }

  return `${kernelBase}/api/file/getFile?path=${encodeURIComponent(`/data/${path}`)}`
})

// 事件处理
const handleClick = (e: MouseEvent) => {
  emit('click', props.annotation, e)
}

const handleContextMenu = (e: MouseEvent) => {
  emit('contextmenu', props.annotation, e)
}

const handleCheckboxChange = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  emit('checkbox-change', props.annotation, checked)
}

const handleFoldToggle = () => {
  emit('fold-toggle', props.annotation.id)
}

const handleEdit = () => {
  emit('edit', props.annotation)
}

const handleCrop = () => {
  emit('crop', props.annotation)
}

const handleUnmerge = () => {
  emit('unmerge', props.annotation)
}

const handleDelete = () => {
  emit('delete', props.annotation)
}

const handleDragStart = (e: DragEvent) => {
  emit('drag-start', e, props.annotation)
}

const handleDragEnd = () => {
  emit('drag-end')
}

const handleDragOver = (e: DragEvent) => {
  emit('drag-over', e, props.annotation)
}

const handleDragLeave = () => {
  emit('drag-leave')
}

const handleDrop = (e: DragEvent) => {
  emit('drop', e, props.annotation)
}

const handleImageLoad = () => {
  imageStatus.value = 'loaded'
  emit('image-load', props.annotation.id)
}

const handleImageError = () => {
  imageStatus.value = 'error'
  emit('image-error', props.annotation)
}
</script>

<style scoped lang="scss">
.doc-heading,
.doc-paragraph,
.doc-image {
  position: relative;
  display: flex;
  align-items: flex-start;
  cursor: grab;
  transition: all 0.15s;
  user-select: none;
  margin: 4px 0;
}

.doc-heading:active,
.doc-paragraph:active,
.doc-image:active {
  cursor: grabbing;
}

.doc-heading:hover,
.doc-paragraph:hover {
  background: var(--b3-theme-surface-light);
  margin-left: -8px;
  margin-right: -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 4px;
}

.doc-heading:hover .hover-actions,
.doc-paragraph:hover .hover-actions {
  opacity: 1;
}

.doc-image:hover {
  background: var(--b3-theme-surface-light);
  margin-left: -8px;
  margin-right: -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 8px;
}

.doc-image:hover .image-actions {
  opacity: 1;
}

// 选中状态
.selected {
  background: var(--b3-theme-primary-lightest, rgba(66, 133, 244, 0.15)) !important;
  border-left-color: var(--b3-theme-primary);
  margin-left: -8px;
  margin-right: -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 4px;
  box-shadow: 0 0 0 2px var(--b3-theme-primary-lightest);
  position: relative;
}

.selected::before {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--b3-theme-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  animation: checkmark-appear 0.2s ease-out;
}

@keyframes checkmark-appear {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

// 拖拽状态
.dragging {
  opacity: 0.5;
  background: var(--b3-theme-surface-light) !important;
}

.drag-over {
  background: var(--b3-theme-primary-light) !important;
  border-left-color: var(--b3-theme-primary) !important;
  box-shadow: 0 0 0 2px var(--b3-theme-primary);
}

// 折叠指示器
.fold-indicator {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--b3-theme-on-surface-light);
  border-radius: 3px;
  margin-right: 2px;
  transition: all 0.2s ease;
}

.fold-indicator:hover {
  background: var(--b3-theme-surface-light);
  color: var(--b3-theme-primary);
}

.fold-indicator svg {
  transition: transform 0.2s ease;
}

.is-collapsed .fold-indicator svg {
  transform: rotate(-90deg);
}

// 复选框
.annotation-checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-right: 8px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.15s;
}

.annotation-checkbox:hover {
  background: var(--b3-theme-surface-light);
}

.annotation-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--b3-theme-primary);
}

// 标题样式
.heading-prefix {
  flex-shrink: 0;
  width: 24px;
  margin-right: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--b3-theme-primary);
  opacity: 0.7;
  font-family: monospace;
}

.heading-content {
  flex: 1;
  min-width: 0;
}

.heading-text {
  font-weight: 600;
  line-height: 1.4;
  color: var(--b3-theme-on-background);
}

.heading-title .heading-text {
  font-size: 20px;
  color: var(--b3-theme-primary);
}

.heading-h1 .heading-text {
  font-size: 18px;
  border-bottom: 1px solid var(--b3-border-color);
  padding-bottom: 6px;
  margin-bottom: 4px;
}

.heading-h2 .heading-text {
  font-size: 16px;
  color: var(--b3-theme-on-background);
}

.heading-h3 .heading-text { font-size: 15px; }
.heading-h4 .heading-text { font-size: 14px; font-weight: 500; }
.heading-h5 .heading-text { font-size: 13px; font-weight: 500; }

.merged-count {
  font-size: 11px;
  color: var(--b3-theme-primary);
  background: var(--b3-theme-primary-light);
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 8px;
}

// 段落样式
.paragraph-marker {
  flex-shrink: 0;
  width: 3px;
  height: auto;
  min-height: 20px;
  background: linear-gradient(135deg, var(--b3-theme-primary-light) 0%, var(--b3-theme-primary) 100%);
  border-radius: 2px;
  margin-right: 12px;
  margin-top: 2px;
  opacity: 0.5;
}

.doc-paragraph:hover .paragraph-marker {
  opacity: 1;
}

.paragraph-content {
  flex: 1;
  min-width: 0;
}

.paragraph-text {
  margin: 0;
  line-height: 1.75;
  color: var(--b3-theme-on-background);
  word-break: break-word;
  text-align: justify;
}

.paragraph-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--b3-theme-surface);
  border-radius: 6px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  line-height: 1.5;
  border-left: 2px solid var(--b3-theme-primary-light);
}

.paragraph-note svg {
  flex-shrink: 0;
  margin-top: 2px;
  opacity: 0.6;
  color: var(--b3-theme-primary);
}

// 图片样式
.image-container {
  border-radius: 8px;
  overflow: hidden;
  background: var(--b3-theme-surface);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.excerpt-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  gap: 8px;
  color: var(--b3-theme-on-surface-light);
  opacity: 0.5;
}

.image-placeholder span {
  font-size: 12px;
}

// 悬浮操作按钮
.hover-actions {
  position: absolute;
  top: 4px;
  right: 0;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-icon:hover {
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
}

.action-icon.delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

// 颜色主题
.color-accent-red { border-left: 3px solid #ef4444; }
.color-accent-yellow { border-left: 3px solid #f59e0b; }
.color-accent-green { border-left: 3px solid #10b981; }
.color-accent-blue { border-left: 3px solid #3b82f6; }
.color-accent-purple { border-left: 3px solid #8b5cf6; }
</style>
