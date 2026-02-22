<!-- src/components/ChildBlock.vue -->
<template>
  <div
    class="merged-child-block"
    :class="{
      'drag-over': dragOverId === annotation.id,
      'dragging': draggingId === annotation.id,
      'is-image': annotation.isImage
    }"
    draggable="true"
    @dragstart="onDragStart($event, annotation)"
    @dragend="onDragEnd"
    @dragover="onDragOver($event, annotation)"
    @dragleave="onDragLeave"
    @drop="onDrop($event, annotation)"
    @click="onClick(annotation)"
  >
    <div class="child-marker"></div>
    <div class="child-content">
      <!-- 图片类型 -->
      <template v-if="annotation.isImage">
        <img
          v-if="isValidImagePath(annotation.imagePath) && imageStatus[annotation.id] !== 'error'"
          :src="getImageUrl(annotation.imagePath!)"
          class="excerpt-image"
          @load="onImageLoad(annotation.id)"
          @error="onImageError($event, annotation)"
        />
        <div v-else class="image-placeholder">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          <span>图片加载失败</span>
        </div>
      </template>
      <!-- 文本类型 -->
      <template v-else>
        <p class="paragraph-text">{{ annotation.text }}</p>
        <div v-if="annotation.note" class="paragraph-note">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
          </svg>
          <span>{{ annotation.note }}</span>
        </div>
      </template>
    </div>
    <div class="child-actions">
      <button class="action-icon" @click.stop="onEdit(annotation)" title="编辑">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
      </button>
      <button class="action-icon" @click.stop="onUnmerge(annotation)" v-if="annotation.parentId" title="取消合并">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
      </button>
      <button class="action-icon delete" @click.stop="onDelete(annotation)" title="删除">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PDFAnnotation } from '../types/annotaion';
import { getKernelBase } from '../api/siyuanApi';

const props = defineProps<{
  annotation: PDFAnnotation;
  allAnnotations: PDFAnnotation[];
  draggingId: string | null;
  dragOverId: string | null;
  imageStatus: Record<string, 'loading' | 'loaded' | 'error'>;
}>();

const emit = defineEmits<{
  (e: 'click', annotation: PDFAnnotation): void;
  (e: 'dragstart', event: DragEvent, annotation: PDFAnnotation): void;
  (e: 'dragend'): void;
  (e: 'dragover', event: DragEvent, annotation: PDFAnnotation): void;
  (e: 'dragleave'): void;
  (e: 'drop', event: DragEvent, annotation: PDFAnnotation): void;
  (e: 'edit', annotation: PDFAnnotation): void;
  (e: 'unmerge', annotation: PDFAnnotation): void;
  (e: 'delete', annotation: PDFAnnotation): void;
  (e: 'image-load', annotationId: string): void;
  (e: 'image-error', event: Event, annotation: PDFAnnotation): void;
}>();

// 检查图片路径是否有效（排除 blob URL、临时文件等无效路径）
const isValidImagePath = (path: string | undefined): boolean => {
  if (!path) return false;
  // 排除 blob URL
  if (path.startsWith('blob:')) return false;
  // 排除 file:// 协议
  if (path.startsWith('file://')) return false;
  // 排除 Windows 临时文件路径（以 @ 开头）
  if (path.startsWith('@')) return false;
  // 排除 localhost 临时地址
  if (path.includes('localhost') || path.includes('127.0.0.1')) return false;
  return true;
};

// 获取图片URL
const getImageUrl = (imagePath: string): string => {
  const kernelBase = getKernelBase();
  
  let path = imagePath;
  if (path.startsWith('/data/')) {
    path = path.slice(6);
  }
  
  if (path.startsWith('assets/')) {
    return `${kernelBase}/${path}`;
  }
  
  return `${kernelBase}/api/file/getFile?path=${encodeURIComponent('/data/' + path)}`;
};

// 事件代理
const onClick = (annotation: PDFAnnotation) => emit('click', annotation);
const onDragStart = (e: DragEvent, annotation: PDFAnnotation) => emit('dragstart', e, annotation);
const onDragEnd = () => emit('dragend');
const onDragOver = (e: DragEvent, annotation: PDFAnnotation) => emit('dragover', e, annotation);
const onDragLeave = () => emit('dragleave');
const onDrop = (e: DragEvent, annotation: PDFAnnotation) => emit('drop', e, annotation);
const onEdit = (annotation: PDFAnnotation) => emit('edit', annotation);
const onUnmerge = (annotation: PDFAnnotation) => emit('unmerge', annotation);
const onDelete = (annotation: PDFAnnotation) => emit('delete', annotation);
const onImageLoad = (annotationId: string) => emit('image-load', annotationId);
const onImageError = (e: Event, annotation: PDFAnnotation) => emit('image-error', e, annotation);
</script>

<style scoped>
.merged-child-block {
  display: flex;
  align-items: flex-start;
  padding: 6px 10px;
  margin: 2px 0;
  background: var(--b3-theme-surface);
  border-radius: 4px;
  cursor: grab;
  transition: all 0.15s;
  user-select: none;
}

.merged-child-block:active {
  cursor: grabbing;
}

.merged-child-block:hover {
  background: var(--b3-theme-primary-light);
}

.merged-child-block.drag-over {
  background: var(--b3-theme-primary-light) !important;
  box-shadow: 0 0 0 2px var(--b3-theme-primary);
  border-radius: 4px;
}

.merged-child-block.dragging {
  opacity: 0.5;
  background: var(--b3-theme-surface-light) !important;
}

.child-marker {
  flex-shrink: 0;
  width: 4px;
  height: 4px;
  background: var(--b3-theme-primary);
  border-radius: 50%;
  margin-right: 10px;
  margin-top: 8px;
}

.child-content {
  flex: 1;
  min-width: 0;
}

.paragraph-text {
  font-size: 13px;
  opacity: 0.85;
  margin: 0;
  line-height: 1.6;
}

.paragraph-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 6px;
  padding: 6px 10px;
  background: var(--b3-theme-background);
  border-radius: 4px;
  font-size: 11px;
  color: var(--b3-theme-on-surface-light);
  line-height: 1.4;
}

.paragraph-note svg {
  flex-shrink: 0;
  margin-top: 1px;
  opacity: 0.6;
  color: var(--b3-theme-primary);
}

.excerpt-image {
  max-height: 150px;
  width: auto;
  border-radius: 4px;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px;
  gap: 6px;
  color: var(--b3-theme-on-surface-light);
  opacity: 0.5;
}

.image-placeholder span {
  font-size: 11px;
}

.child-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  margin-left: 8px;
}

.merged-child-block:hover .child-actions {
  opacity: 1;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 3px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  transition: all 0.15s;
}

.action-icon:hover {
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
}

.action-icon.delete:hover {
  background: #fef2f2;
  color: #ef4444;
}
</style>
