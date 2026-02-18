<!-- src/components/AnnotationList.vue -->
<template>
  <div class="annotation-list-container">
    <!-- 头部 -->
    <div class="list-header">
      <div class="header-title">
        <span class="title-text">标注列表</span>
        <span class="count-badge">{{ annotations.length }}</span>
      </div>

      <!-- 操作按钮 -->
      <div class="header-actions">
        <button
          v-if="annotations.length > 0"
          @click="exportMarkdown"
          class="action-btn"
          title="导出为Markdown"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
        <button
          @click="refresh"
          class="action-btn"
          title="刷新"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 标注列表 -->
    <div class="list-body">
      <div v-if="loading" class="loading-tip">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else-if="annotations.length === 0" class="empty-tip">
        <div class="empty-icon">📝</div>
        <div class="empty-title">暂无标注</div>
        <div class="empty-hint">在 PDF 中选择文本或图片<br>标注会自动显示在这里</div>
      </div>

      <div v-else class="annotation-items">
        <template v-for="(ann, index) in sortedAnnotations" :key="ann.id">
          <!-- 标题级别 -->
          <div
            v-if="ann.level && ann.level !== 'text' && !ann.isImage"
            class="annotation-item heading-item"
            :class="[`heading-${ann.level}`, `color-accent-${ann.color}`]"
            @click="handleClick(ann)"
            @dblclick="handleDoubleClick(ann)"
          >
            <div class="heading-marker">{{ getHeadingMarker(ann.level) }}</div>
            <div class="heading-content">
              <div class="heading-text">{{ ann.text }}</div>
            </div>
            <div class="item-actions">
              <button class="icon-btn" @click.stop="editAnnotation(ann)" title="编辑">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button class="icon-btn delete" @click.stop="deleteAnnotation(ann)" title="删除">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 图片标注 -->
          <div
            v-else-if="ann.isImage"
            class="annotation-item image-item"
            :class="`color-accent-${ann.color}`"
            @click="handleClick(ann)"
            @dblclick="handleDoubleClick(ann)"
          >
            <div class="image-wrapper">
              <img 
                v-if="ann.imagePath && imageStatus[ann.id] !== 'error'" 
                :src="getImageUrl(ann.imagePath)" 
                class="excerpt-image"
                @load="handleImageLoad(ann.id)"
                @error="handleImageError($event, ann)"
              />
              <div v-else class="image-placeholder">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <span>图片加载失败</span>
              </div>
            </div>
            <div class="item-footer">
              <div class="item-actions">
                <button class="icon-btn" @click.stop="editAnnotation(ann)" title="编辑">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button class="icon-btn delete" @click.stop="deleteAnnotation(ann)" title="删除">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 正文标注 -->
          <div
            v-else-if="ann.text"
            class="annotation-item text-item"
            :class="`color-accent-${ann.color}`"
            @click="handleClick(ann)"
            @dblclick="handleDoubleClick(ann)"
          >
            <div class="text-marker"></div>
            <div class="text-content">
              <div class="text-body">{{ ann.text }}</div>
              <div v-if="ann.note" class="text-note">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
                </svg>
                {{ ann.note }}
              </div>
            </div>
            <div class="item-actions">
              <button class="icon-btn" @click.stop="editAnnotation(ann)" title="编辑">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button class="icon-btn delete" @click.stop="deleteAnnotation(ann)" title="删除">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import type { PDFAnnotation, AnnotationColor, AnnotationLevel } from '../types/annotaion';
import { ANNOTATION_LEVELS } from '../types/annotaion';
import { deleteAnnotation as deleteAnnotationApi } from '../api/annotationApi';
import { generateMarkdown } from '../utils/markdownGenerator';
import { getKernelBase } from '../api/siyuanApi';

const props = defineProps<{
  annotations: PDFAnnotation[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'annotation-click', annotation: PDFAnnotation): void;
  (e: 'annotation-edit', annotation: PDFAnnotation): void;
  (e: 'refresh'): void;
}>();

// 图片加载状态
const imageStatus = reactive<Record<string, 'loading' | 'loaded' | 'error'>>({});

// 获取图片URL - 使用内核端口 6806
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

// 图片加载错误处理
const handleImageError = (e: Event, ann: PDFAnnotation) => {
  imageStatus[ann.id] = 'error';
};

// 图片加载成功
const handleImageLoad = (annId: string) => {
  imageStatus[annId] = 'loaded';
};

// 获取标题标记
const getHeadingMarker = (level: AnnotationLevel): string => {
  const markers: Record<string, string> = {
    'title': '¶',
    'h1': 'H1',
    'h2': 'H2',
    'h3': 'H3',
    'h4': 'H4',
    'h5': 'H5'
  };
  return markers[level] || '>';
};

// 排序后的标注
const sortedAnnotations = computed<PDFAnnotation[]>(() => {
  return [...props.annotations].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return a.created - b.created;
  });
});

// 单击标注
const handleClick = (ann: PDFAnnotation) => {
  // 单击不做跳转，只高亮
};

// 双击跳转
const handleDoubleClick = (ann: PDFAnnotation) => {
  emit('annotation-click', ann);
};

// 编辑标注
const editAnnotation = (ann: PDFAnnotation) => {
  emit('annotation-edit', ann);
};

// 删除标注
const deleteAnnotation = async (ann: PDFAnnotation) => {
  if (!confirm('确定要删除这条标注吗？')) {
    return;
  }

  try {
    await deleteAnnotationApi(ann.blockId);
    emit('refresh');
  } catch (e) {
    console.error('删除失败:', e);
    alert('删除失败');
  }
};

// 导出Markdown
const exportMarkdown = () => {
  const markdown = generateMarkdown(props.annotations, {
    groupBy: 'hierarchy',
    includeNotes: true,
    includeLocation: true
  });

  navigator.clipboard.writeText(markdown).then(() => {
    alert('Markdown 已复制到剪贴板！');
  }).catch(err => {
    console.error('复制失败:', err);
    alert('复制失败');
  });
};

// 刷新
const refresh = () => {
  emit('refresh');
};
</script>

<style scoped>
.annotation-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  font-size: 14px;
}

.list-header {
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
  gap: 8px;
}

.title-text {
  font-weight: 600;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
}

.count-badge {
  padding: 2px 8px;
  background: var(--b3-theme-primary);
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--b3-theme-surface-light);
}

.list-body {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.loading-tip,
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: var(--b3-theme-on-surface-light);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--b3-theme-surface-light);
  border-top-color: var(--b3-theme-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 40px;
  opacity: 0.5;
}

.empty-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.empty-hint {
  font-size: 12px;
  text-align: center;
  opacity: 0.6;
  line-height: 1.6;
}

/* 标注项通用样式 */
.annotation-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.annotation-item {
  position: relative;
  padding: 10px 12px;
  background: var(--b3-theme-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  border-left: 3px solid transparent;
}

.annotation-item:hover {
  background: var(--b3-theme-surface-light);
}

.annotation-item:hover .item-actions {
  opacity: 1;
}

/* 颜色主题 */
.color-accent-red { border-left-color: #ef4444; }
.color-accent-yellow { border-left-color: #f59e0b; }
.color-accent-green { border-left-color: #10b981; }
.color-accent-blue { border-left-color: #3b82f6; }
.color-accent-purple { border-left-color: #8b5cf6; }

/* 标题项样式 */
.heading-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.heading-marker {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--b3-theme-primary);
  background: var(--b3-theme-primary-light);
  border-radius: 4px;
}

.heading-content {
  flex: 1;
  min-width: 0;
}

.heading-text {
  font-weight: 600;
  line-height: 1.5;
  color: var(--b3-theme-on-background);
}

.heading-title .heading-text { font-size: 17px; }
.heading-h1 .heading-text { font-size: 16px; }
.heading-h2 .heading-text { font-size: 15px; }
.heading-h3 .heading-text { font-size: 14px; }
.heading-h4 .heading-text { font-size: 13px; }
.heading-h5 .heading-text { font-size: 13px; }

/* 文本项样式 */
.text-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.text-marker {
  flex-shrink: 0;
  width: 3px;
  height: 100%;
  min-height: 24px;
  background: var(--b3-theme-primary-light);
  border-radius: 2px;
  margin-top: 2px;
}

.text-content {
  flex: 1;
  min-width: 0;
}

.text-body {
  line-height: 1.7;
  color: var(--b3-theme-on-background);
  word-break: break-word;
}

.text-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--b3-theme-surface-light);
  border-radius: 6px;
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
  line-height: 1.5;
}

.text-note svg {
  flex-shrink: 0;
  margin-top: 2px;
  opacity: 0.5;
}

/* 图片项样式 */
.image-item {
  padding: 8px;
}

.image-wrapper {
  margin-bottom: 8px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--b3-theme-surface-light);
}

.excerpt-image {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  display: block;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  gap: 8px;
  color: var(--b3-theme-on-surface-light);
  opacity: 0.5;
}

.image-placeholder span {
  font-size: 12px;
}

.item-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 4px;
}

/* 操作按钮 */
.item-actions {
  position: absolute;
  right: 8px;
  top: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: all 0.15s;
}

.icon-btn:hover {
  background: var(--b3-theme-surface-light);
  color: var(--b3-theme-primary);
}

.icon-btn.delete:hover {
  color: #ef4444;
}
</style>
