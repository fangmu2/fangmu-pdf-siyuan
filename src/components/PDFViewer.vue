<!-- src/components/PDFViewer.vue -->
<template>
  <div class="pdf-viewer-container" ref="containerRef">
    <!-- 加载提示 -->
    <div v-if="loading" class="loading-overlay">
      <div class="b3-spin"></div>
      <span>正在加载 PDF...</span>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-overlay">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
    </div>

    <!-- PDF渲染层容器 -->
    <div class="pdf-page-container" ref="pageContainerRef">
      <canvas ref="canvasRef" class="pdf-canvas"></canvas>
      <!-- 文本选择层（使用官方API） -->
      <div ref="textLayerRef" class="pdf-text-layer"></div>
      <!-- DOM高亮层（替代Canvas，更流畅） -->
      <div ref="highlightLayerRef" class="highlight-layer"></div>
      <!-- 图片框选层 -->
      <div 
        v-if="extractMode === 'image'"
        ref="imageSelectLayerRef" 
        class="image-select-layer"
        @mousedown="startImageSelect"
        @mousemove="updateImageSelect"
        @mouseup="endImageSelect"
      ></div>
    </div>

    <!-- 框选提示 -->
    <div v-if="extractMode === 'image'" class="image-mode-hint">
      📷 图片摘录模式 - 在PDF上框选区域截图
    </div>

    <!-- 页码指示器 -->
    <div class="page-indicator" v-if="totalPages > 0">
      {{ currentPage }} / {{ totalPages }}
    </div>

    <!-- 缩放控制 -->
    <div class="zoom-controls">
      <button @click="zoomOut" class="b3-button b3-button--outline" title="缩小">
        <svg><use xlink:href="#iconZoomOut"></use></svg>
      </button>
      <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
      <button @click="zoomIn" class="b3-button b3-button--outline" title="放大">
        <svg><use xlink:href="#iconZoomIn"></use></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue';
import { getOrLoadPdf, renderPage, renderTextLayer, getSelectionRect } from '../utils/pdf';
import { getFileAsBlob } from '../api/siyuanApi';
import type { PDFAnnotation, AnnotationColor, ExtractMode } from '../types/annotaion';

const props = defineProps<{
  pdfPath: string;
  currentPage: number;
  annotations?: PDFAnnotation[];
  highlightAnnotation?: PDFAnnotation | null;
  extractMode?: ExtractMode;
}>();

const emit = defineEmits<{
  (e: 'loaded', numPages: number): void;
  (e: 'page-change', page: number): void;
  (e: 'text-selected', data: { text: string; page: number; rect: [number, number, number, number] | null }): void;
  (e: 'image-selected', data: { 
    canvasRect: { x: number; y: number; width: number; height: number }; 
    pdfRect: [number, number, number, number];
    page: number 
  }): void;
  (e: 'annotation-delete', annotation: PDFAnnotation): void;
  (e: 'annotation-click', annotation: PDFAnnotation): void;
}>();

const canvasRef = ref<HTMLCanvasElement>();
const containerRef = ref<HTMLElement>();
const textLayerRef = ref<HTMLElement>();
const pageContainerRef = ref<HTMLElement>();
const imageSelectLayerRef = ref<HTMLElement>();
const highlightLayerRef = ref<HTMLElement>();
const loading = ref(false);
const error = ref('');
const totalPages = ref(0);
const scale = ref(1.0);

let pdfDoc: any = null;
let currentPageObj: any = null;
let currentBlobUrl: string | null = null;

// 图片框选状态
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionDiv: HTMLDivElement | null = null;

// 使用 window 对象存储全局锁，确保跨 HMR 和组件实例唯一
const getGlobalLock = () => {
  if (typeof window === 'undefined') return { locked: false, text: '', time: 0, lastEmittedText: '' };
  (window as any).__PDF_SELECTION_LOCK__ ||= { locked: false, text: '', time: 0, lastEmittedText: '' };
  return (window as any).__PDF_SELECTION_LOCK__;
};
const SELECTION_LOCK_DURATION = 2000; // 2秒锁定时间，防止快速摘录重复

// 图片选择防抖
let lastImageSelectTime = 0;

// 当前 viewport 缓存
let currentViewport: any = null;

// 标注颜色映射
const LEVEL_COLORS: Record<string, { bg: string; border: string }> = {
  title: { bg: 'rgba(255, 87, 87, 0.35)', border: '#ff5757' },
  h1: { bg: 'rgba(255, 159, 67, 0.35)', border: '#ff9f43' },
  h2: { bg: 'rgba(254, 202, 87, 0.35)', border: '#feca57' },
  h3: { bg: 'rgba(29, 209, 161, 0.35)', border: '#1dd1a1' },
  h4: { bg: 'rgba(72, 219, 251, 0.35)', border: '#48dbfb' },
  h5: { bg: 'rgba(84, 160, 255, 0.35)', border: '#54a0ff' },
  text: { bg: 'rgba(255, 217, 61, 0.35)', border: '#ffd93d' },
};

const ANNOTATION_COLORS: Record<AnnotationColor, { bg: string; border: string }> = {
  red: { bg: 'rgba(255, 107, 107, 0.35)', border: '#ff6b6b' },
  yellow: { bg: 'rgba(255, 217, 61, 0.35)', border: '#ffd93d' },
  green: { bg: 'rgba(107, 203, 119, 0.35)', border: '#6bcb77' },
  blue: { bg: 'rgba(77, 150, 255, 0.35)', border: '#4d96ff' },
  purple: { bg: 'rgba(155, 89, 182, 0.35)', border: '#9b59b6' },
};

// 当前页的标注
const currentPageAnnotations = computed(() => {
  if (!props.annotations) return [];
  const pageAnnotations = props.annotations.filter(ann => ann.page === props.currentPage);
  
  // 去重：同一 ID 只保留一个
  const seenIds = new Set<string>();
  const uniqueAnnotations: typeof pageAnnotations = [];
  for (const ann of pageAnnotations) {
    if (!seenIds.has(ann.id)) {
      seenIds.add(ann.id);
      uniqueAnnotations.push(ann);
    } else {
      console.warn('[currentPageAnnotations] 发现重复标注ID:', ann.id);
    }
  }
  return uniqueAnnotations;
});

// 选中的标注
const selectedAnnotation = ref<PDFAnnotation | null>(null);

// 加载PDF
const loadPdf = async () => {
  if (!props.pdfPath || !canvasRef.value || !containerRef.value) return;

  loading.value = true;
  error.value = '';

  try {
    const blob = await getFileAsBlob(props.pdfPath);
    
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
    }
    currentBlobUrl = URL.createObjectURL(blob);

    if (!pdfDoc || pdfDoc._path !== props.pdfPath) {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
      pdfDoc = await getOrLoadPdf(currentBlobUrl);
      pdfDoc._path = props.pdfPath;
      totalPages.value = pdfDoc.numPages;
      emit('loaded', pdfDoc.numPages);
    }

    await renderCurrentPage();

  } catch (e: any) {
    console.error('PDF加载失败:', e);
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
};

// 渲染当前页
const renderCurrentPage = async () => {
  if (!pdfDoc || !canvasRef.value || !containerRef.value || !textLayerRef.value || !highlightLayerRef.value) return;

  try {
    currentPageObj = await pdfDoc.getPage(props.currentPage);

    const containerWidth = containerRef.value.clientWidth - 40;

    // 渲染 Canvas
    const viewport = await renderPage(currentPageObj, canvasRef.value, containerWidth * scale.value);

    // 缓存viewport
    currentViewport = viewport;

    // 渲染文本层（使用官方API）
    await renderTextLayer(currentPageObj, textLayerRef.value, viewport);

    // 设置页面容器尺寸
    if (pageContainerRef.value) {
      pageContainerRef.value.style.width = canvasRef.value.style.width;
      pageContainerRef.value.style.height = canvasRef.value.style.height;
    }

    // 绘制标注高亮（DOM方式）
    renderHighlights();

  } catch (e: any) {
    console.error('渲染页面失败:', e);
    error.value = '渲染失败';
  }
};

// 使用DOM渲染高亮（比Canvas更流畅，支持交互）
const renderHighlights = () => {
  const layer = highlightLayerRef.value;
  
  if (!layer) {
    return;
  }

  if (!currentViewport) {
    return;
  }

  // 清空高亮层
  layer.innerHTML = '';
  layer.style.width = currentViewport.width + 'px';
  layer.style.height = currentViewport.height + 'px';

  // viewport.scale 是 PDF单位到CSS像素的转换比例
  // PDF坐标 * scale = CSS坐标
  const scale = currentViewport.scale || 1;
  
  // PDF页面原始高度（从viewBox获取）
  const pdfPageHeight = currentViewport.viewBox[3];

  for (const ann of currentPageAnnotations.value) {
    const [pdfX1, pdfY1, pdfX2, pdfY2] = ann.rect;

    // PDF坐标转换为CSS坐标
    // CSS X = PDF X * scale
    // CSS Y = (pdfPageHeight - PDF Y) * scale  （Y轴翻转）
    const cssX = pdfX1 * scale;
    const cssY = (pdfPageHeight - pdfY2) * scale;  // y2是底部，翻转后是CSS的top
    const cssWidth = (pdfX2 - pdfX1) * scale;
    const cssHeight = Math.max((pdfY2 - pdfY1) * scale, 14);

    // 获取颜色
    const colors = LEVEL_COLORS[ann.level] || ANNOTATION_COLORS[ann.color] || ANNOTATION_COLORS.yellow;
    const isSelected = selectedAnnotation.value?.id === ann.id;

    // 创建高亮元素
    const highlight = document.createElement('div');
    highlight.className = 'highlight-element';
    highlight.dataset.annotationId = ann.id;
    highlight.style.cssText = `
      position: absolute;
      left: ${cssX}px;
      top: ${cssY}px;
      width: ${cssWidth}px;
      height: ${cssHeight}px;
      background-color: ${isSelected ? colors.bg.replace('0.35', '0.55') : colors.bg};
      border: 2px solid ${isSelected ? '#fff' : colors.border};
      border-radius: 3px;
      cursor: pointer;
      pointer-events: auto;
      transition: background-color 0.15s ease, transform 0.1s ease;
      box-shadow: ${isSelected ? '0 0 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'};
      z-index: ${isSelected ? 2 : 1};
    `;

    // 如果是标题级别，添加角标
    if (ann.isImage) {
      // 图片摘录角标
      const badge = document.createElement('span');
      badge.style.cssText = `
        position: absolute;
        top: -8px;
        left: 0;
        background: #8b5cf6;
        color: white;
        font-size: 10px;
        font-weight: bold;
        padding: 1px 4px;
        border-radius: 2px;
        line-height: 1;
      `;
      badge.textContent = '📷';
      highlight.appendChild(badge);
    } else if (ann.level && ann.level !== 'text') {
      const levelLabels: Record<string, string> = {
        title: 'T', h1: 'H1', h2: 'H2', h3: 'H3', h4: 'H4', h5: 'H5',
      };
      const label = levelLabels[ann.level];
      if (label) {
        const badge = document.createElement('span');
        badge.style.cssText = `
          position: absolute;
          top: -8px;
          left: 0;
          background: ${colors.border};
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 1px 4px;
          border-radius: 2px;
          line-height: 1;
        `;
        badge.textContent = label;
        highlight.appendChild(badge);
      }
    }

    // 点击事件
    highlight.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectedAnnotation.value?.id === ann.id) {
        selectedAnnotation.value = null;
      } else {
        selectedAnnotation.value = ann;
        emit('annotation-click', ann);
      }
      renderHighlights();
    });

    // 悬停效果 - 显示删除按钮
    highlight.addEventListener('mouseenter', () => {
      if (selectedAnnotation.value?.id !== ann.id) {
        highlight.style.transform = 'scale(1.01)';
      }
    });
    highlight.addEventListener('mouseleave', () => {
      highlight.style.transform = 'scale(1)';
    });

    // 创建删除按钮（始终显示，悬停时高亮）
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'highlight-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = '删除标注';
    deleteBtn.style.cssText = `
      position: absolute;
      top: -10px;
      right: -10px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #ef4444;
      color: white;
      border: 2px solid white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      z-index: 100;
      line-height: 1;
      opacity: 0;
      transition: opacity 0.15s ease, transform 0.15s ease;
    `;
    
    // 鼠标进入高亮区域时显示删除按钮
    highlight.addEventListener('mouseenter', () => {
      deleteBtn.style.opacity = '1';
    });
    highlight.addEventListener('mouseleave', () => {
      if (selectedAnnotation.value?.id !== ann.id) {
        deleteBtn.style.opacity = '0';
      }
    });
    
    // 删除按钮悬停效果
    deleteBtn.addEventListener('mouseenter', () => {
      deleteBtn.style.background = '#dc2626';
      deleteBtn.style.transform = 'scale(1.1)';
    });
    deleteBtn.addEventListener('mouseleave', () => {
      deleteBtn.style.background = '#ef4444';
      deleteBtn.style.transform = 'scale(1)';
    });
    
    // 删除按钮点击事件
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      emit('annotation-delete', ann);
      selectedAnnotation.value = null;
    });
    
    // 选中状态下也显示删除按钮
    if (isSelected) {
      deleteBtn.style.opacity = '1';
    }

    highlight.appendChild(deleteBtn);
    layer.appendChild(highlight);
  }
};

// 处理键盘删除
const handleKeyDown = (e: KeyboardEvent) => {
  // 只在 Delete 或 Backspace 键时处理
  if (e.key !== 'Delete' && e.key !== 'Backspace') return;
  
  // 如果焦点在输入框中，不处理删除
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable)) {
    return;
  }
  
  if (selectedAnnotation.value) {
    e.preventDefault();
    emit('annotation-delete', selectedAnnotation.value);
    selectedAnnotation.value = null;
    renderHighlights();
  }
};

// 处理文本选择 - 使用 window 全局锁确保跨 HMR 只触发一次
const handleTextSelection = () => {
  // 图片模式下不处理文本选择
  if (props.extractMode === 'image') return;

  const lock = getGlobalLock();
  const now = Date.now();

  // 全局锁检查：如果正在处理中，直接返回
  if (lock.locked) {
    return;
  }

  // 【关键修复】立即设置全局锁，防止竞态条件
  lock.locked = true;

  // 释放锁的辅助函数
  const releaseLock = () => {
    lock.locked = false;
  };

  if (!textLayerRef.value) {
    releaseLock();
    return;
  }

  const selection = window.getSelection();
  if (!selection || !selection.toString().trim()) {
    releaseLock();
    return;
  }

  const text = selection.toString().trim();

  // 检查是否是最近发出过的相同文本（防止重复）
  if (text === lock.lastEmittedText && (now - lock.time) < SELECTION_LOCK_DURATION) {
    releaseLock();
    return;
  }

  // 更新锁的文本和时间
  lock.text = text;
  lock.time = now;
  lock.lastEmittedText = text; // 记录最后发出的文本

  const rect = getSelectionRect(textLayerRef.value);

  emit('text-selected', {
    text,
    page: props.currentPage,
    rect
  });

  // 延迟释放锁（但保留 lastEmittedText 用于去重）
  setTimeout(() => {
    lock.locked = false;
    // 2秒后清除 lastEmittedText，允许再次选择相同文本
    setTimeout(() => {
      if (lock.lastEmittedText === text) {
        lock.lastEmittedText = '';
      }
    }, SELECTION_LOCK_DURATION);
  }, 500); // 500ms 后释放锁，但保留文本去重
};

// 图片框选 - 开始
const startImageSelect = (e: MouseEvent) => {
  if (props.extractMode !== 'image' || !imageSelectLayerRef.value) return;
  
  isSelecting = true;
  const rect = imageSelectLayerRef.value.getBoundingClientRect();
  selectionStart = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
  
  // 创建选择框元素
  selectionDiv = document.createElement('div');
  selectionDiv.className = 'image-selection-box';
  selectionDiv.style.cssText = `
    position: absolute;
    border: 2px solid #1890ff;
    background: rgba(24, 144, 255, 0.2);
    pointer-events: none;
    z-index: 100;
    box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.5);
    left: ${selectionStart.x}px;
    top: ${selectionStart.y}px;
    width: 0;
    height: 0;
  `;
  imageSelectLayerRef.value.appendChild(selectionDiv);
};

// 图片框选 - 更新
const updateImageSelect = (e: MouseEvent) => {
  if (!isSelecting || !selectionDiv || !imageSelectLayerRef.value) return;
  
  const rect = imageSelectLayerRef.value.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  
  const left = Math.min(selectionStart.x, currentX);
  const top = Math.min(selectionStart.y, currentY);
  const width = Math.abs(currentX - selectionStart.x);
  const height = Math.abs(currentY - selectionStart.y);
  
  selectionDiv.style.left = left + 'px';
  selectionDiv.style.top = top + 'px';
  selectionDiv.style.width = width + 'px';
  selectionDiv.style.height = height + 'px';
};

// 图片框选 - 结束
const endImageSelect = (e: MouseEvent) => {
  if (!isSelecting || !selectionDiv || !imageSelectLayerRef.value || !canvasRef.value) return;

  // 防抖
  const now = Date.now();
  if (now - lastImageSelectTime < 500) {
    isSelecting = false;
    selectionDiv.remove();
    selectionDiv = null;
    return;
  }
  lastImageSelectTime = now;

  isSelecting = false;
  
  const rect = imageSelectLayerRef.value.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  
  const left = Math.min(selectionStart.x, currentX);
  const top = Math.min(selectionStart.y, currentY);
  const width = Math.abs(currentX - selectionStart.x);
  const height = Math.abs(currentY - selectionStart.y);
  
  selectionDiv.remove();
  selectionDiv = null;
  
  if (width < 10 || height < 10) return;
  
  // 计算PDF坐标
  const canvas = canvasRef.value;
  const canvasCssWidth = canvas.offsetWidth;
  
  if (currentPageObj && currentViewport) {
    const viewport = currentPageObj.getViewport({ scale: 1 });
    const pdfScale = viewport.width / canvasCssWidth;
    
    const pdfX1 = left * pdfScale;
    const pdfY1 = viewport.height - (top + height) * pdfScale;
    const pdfX2 = (left + width) * pdfScale;
    const pdfY2 = viewport.height - top * pdfScale;
    
    emit('image-selected', {
      canvasRect: { x: left, y: top, width, height },
      pdfRect: [pdfX1, pdfY1, pdfX2, pdfY2],
      page: props.currentPage
    });
  }
};

// 缩放控制
const zoomIn = () => {
  if (scale.value < 3.0) {
    scale.value += 0.1;
    renderCurrentPage();
  }
};

const zoomOut = () => {
  if (scale.value > 0.3) {
    scale.value -= 0.1;
    renderCurrentPage();
  }
};

// 监听变化
watch([() => props.pdfPath, () => props.currentPage], () => {
  nextTick(() => loadPdf());
});

watch(() => props.highlightAnnotation, () => {
  if (props.highlightAnnotation) {
    if (props.highlightAnnotation.page !== props.currentPage) {
      emit('page-change', props.highlightAnnotation.page);
    } else {
      renderCurrentPage();
    }
  }
});

// 监听标注变化 - 确保删除后能正确重新渲染
watch(() => props.annotations, () => {
  // 无论 pdfDoc 和 currentViewport 是否存在，都尝试重新渲染
  if (highlightLayerRef.value) {
    renderHighlights();
  }
}, { deep: true, immediate: true });

onMounted(() => {
  loadPdf();
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleTextSelection);
  document.removeEventListener('keydown', handleKeyDown);
  
  if (pdfDoc) {
    pdfDoc.destroy();
  }
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
  }
});
</script>

<style scoped>
.pdf-viewer-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: var(--b3-theme-background);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--b3-theme-on-surface);
  z-index: 10;
}

.error-overlay {
  color: var(--b3-card-error-color);
}

.error-icon {
  font-size: 32px;
}

.pdf-page-container {
  position: relative;
  display: inline-block;
}

.pdf-canvas {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  background: white;
  display: block;
  position: relative;
  z-index: 1;
}

/* 文本层样式 - 支持流畅选择 */
.pdf-text-layer {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  line-height: 1;
  z-index: 5; /* 确保文本层在高亮层之上 */
  pointer-events: auto;
}

.pdf-text-layer :deep(.textLayer) {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1;
}

.pdf-text-layer :deep(.textLayer > span) {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}

.pdf-text-layer :deep(::selection) {
  background: rgba(0, 120, 255, 0.4);
}

/* 文本选择提示动画 */
.pdf-text-layer :deep(.textLayer > span::selection) {
  background: rgba(0, 120, 255, 0.5);
}

/* DOM高亮层 - 比Canvas更流畅 */
.highlight-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 6; /* 高于文本层(z-index:5)，使点击事件能到达高亮元素 */
}

.highlight-element {
  pointer-events: auto !important;
  cursor: pointer;
}

.image-select-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  cursor: crosshair;
  background: transparent;
}

.image-select-layer :deep(.image-selection-box),
.image-selection-box {
  position: absolute;
  border: 2px solid #1890ff !important;
  background: rgba(24, 144, 255, 0.2) !important;
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.5) !important;
  z-index: 100 !important;
}

.image-mode-hint {
  position: absolute;
  top: 60px;
  right: 20px;
  padding: 6px 12px;
  background: rgba(24, 144, 255, 0.9);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  z-index: 20;
}

.page-indicator {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 6px 12px;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  font-size: 12px;
  color: var(--b3-theme-on-surface);
  z-index: 5;
}

.zoom-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--b3-theme-surface, #fff);
  border: 1px solid var(--b3-border-color, #ddd);
  border-radius: 4px;
  z-index: 200;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
}

.zoom-level {
  font-size: 12px;
  min-width: 40px;
  text-align: center;
}
</style>
