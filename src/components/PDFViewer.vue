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
      <!-- 标注高亮层 -->
      <canvas ref="annotationCanvasRef" class="annotation-canvas"></canvas>
      <!-- 文本选择层 -->
      <div ref="textLayerRef" class="pdf-text-layer"></div>
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
}>();

const canvasRef = ref<HTMLCanvasElement>();
const annotationCanvasRef = ref<HTMLCanvasElement>();
const containerRef = ref<HTMLElement>();
const textLayerRef = ref<HTMLElement>();
const pageContainerRef = ref<HTMLElement>();
const imageSelectLayerRef = ref<HTMLElement>();
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

// 标注颜色映射
const LEVEL_COLORS: Record<string, { fill: string; stroke: string }> = {
  title: { fill: 'rgba(255, 87, 87, 0.3)', stroke: '#ff5757' },      // 红色
  h1: { fill: 'rgba(255, 159, 67, 0.3)', stroke: '#ff9f43' },        // 橙色
  h2: { fill: 'rgba(254, 202, 87, 0.3)', stroke: '#feca57' },        // 黄色
  h3: { fill: 'rgba(29, 209, 161, 0.3)', stroke: '#1dd1a1' },        // 绿色
  h4: { fill: 'rgba(72, 219, 251, 0.3)', stroke: '#48dbfb' },        // 青色
  h5: { fill: 'rgba(84, 160, 255, 0.3)', stroke: '#54a0ff' },        // 蓝色
  text: { fill: 'rgba(255, 217, 61, 0.3)', stroke: '#ffd93d' },      // 黄色
};

const ANNOTATION_COLORS: Record<AnnotationColor, { fill: string; stroke: string }> = {
  red: { fill: 'rgba(255, 107, 107, 0.3)', stroke: '#ff6b6b' },
  yellow: { fill: 'rgba(255, 217, 61, 0.3)', stroke: '#ffd93d' },
  green: { fill: 'rgba(107, 203, 119, 0.3)', stroke: '#6bcb77' },
  blue: { fill: 'rgba(77, 150, 255, 0.3)', stroke: '#4d96ff' },
  purple: { fill: 'rgba(155, 89, 182, 0.3)', stroke: '#9b59b6' },
};

// 当前页的标注
const currentPageAnnotations = computed(() => {
  if (!props.annotations) return [];
  return props.annotations.filter(ann => ann.page === props.currentPage);
});

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
  if (!pdfDoc || !canvasRef.value || !containerRef.value || !textLayerRef.value || !annotationCanvasRef.value) return;

  try {
    currentPageObj = await pdfDoc.getPage(props.currentPage);

    const containerWidth = containerRef.value.clientWidth - 40;

    // 渲染 Canvas
    const viewport = await renderPage(currentPageObj, canvasRef.value, containerWidth * scale.value);

    // 设置标注层 Canvas 尺寸
    annotationCanvasRef.value.width = canvasRef.value.width;
    annotationCanvasRef.value.height = canvasRef.value.height;
    annotationCanvasRef.value.style.width = canvasRef.value.style.width;
    annotationCanvasRef.value.style.height = canvasRef.value.style.height;

    // 渲染文本层
    await renderTextLayer(currentPageObj, textLayerRef.value, viewport);

    // 设置页面容器尺寸
    if (pageContainerRef.value) {
      pageContainerRef.value.style.width = canvasRef.value.style.width;
      pageContainerRef.value.style.height = canvasRef.value.style.height;
    }

    // 绘制标注高亮
    drawAnnotations(viewport);

  } catch (e: any) {
    console.error('渲染页面失败:', e);
    error.value = '渲染失败';
  }
};

// 绘制标注高亮
const drawAnnotations = (viewport: any) => {
  const canvas = annotationCanvasRef.value;
  
  console.log('[drawAnnotations] 开始绘制, 当前页标注数:', currentPageAnnotations.value.length);
  console.log('[drawAnnotations] viewport:', viewport);
  
  if (!canvas) {
    console.log('[drawAnnotations] 没有 canvas');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 清除之前的内容
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!currentPageAnnotations.value.length) {
    console.log('[drawAnnotations] 当前页没有标注，跳过绘制');
    return;
  }

  // 获取缩放比例
  const pdfToCanvasScale = canvas.width / viewport.viewBox[2];
  console.log('[drawAnnotations] 缩放比例:', pdfToCanvasScale);

  for (const ann of currentPageAnnotations.value) {
    const [x1, y1, x2, y2] = ann.rect;
    
    console.log('[drawAnnotations] 标注:', ann.text, 'rect:', ann.rect);
    
    // PDF坐标转换到Canvas坐标
    // PDF坐标系：左下角为原点，Y轴向上
    // Canvas坐标系：左上角为原点，Y轴向下
    const canvasX = x1 * pdfToCanvasScale;
    const canvasY = (viewport.viewBox[3] - y2) * pdfToCanvasScale; // y2 是底部，需要翻转
    const canvasWidth = (x2 - x1) * pdfToCanvasScale;
    const canvasHeight = (y2 - y1) * pdfToCanvasScale;

    console.log('[drawAnnotations] Canvas坐标:', { canvasX, canvasY, canvasWidth, canvasHeight });

    // 获取颜色
    const colors = LEVEL_COLORS[ann.level] || ANNOTATION_COLORS[ann.color] || ANNOTATION_COLORS.yellow;

    // 绘制高亮矩形
    ctx.fillStyle = colors.fill;
    ctx.fillRect(canvasX, canvasY, canvasWidth, canvasHeight);

    // 绘制边框
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);

    // 如果是标题级别，绘制角标
    if (ann.level && ann.level !== 'text') {
      const levelLabels: Record<string, string> = {
        title: 'T',
        h1: 'H1',
        h2: 'H2',
        h3: 'H3',
        h4: 'H4',
        h5: 'H5',
      };
      const label = levelLabels[ann.level];
      if (label) {
        ctx.fillStyle = colors.stroke;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(label, canvasX + 2, canvasY + 12);
      }
    }
  }
  
  console.log('[drawAnnotations] 绘制完成');
};

// 处理文本选择
const handleTextSelection = () => {
  // 图片模式下不处理文本选择
  if (props.extractMode === 'image') return;
  
  if (!textLayerRef.value) return;

  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    const text = selection.toString().trim();
    const rect = getSelectionRect(textLayerRef.value);

    emit('text-selected', {
      text,
      page: props.currentPage,
      rect
    });
  }
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
  // 添加内联样式确保显示
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
  
  isSelecting = false;
  
  const rect = imageSelectLayerRef.value.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  
  const left = Math.min(selectionStart.x, currentX);
  const top = Math.min(selectionStart.y, currentY);
  const width = Math.abs(currentX - selectionStart.x);
  const height = Math.abs(currentY - selectionStart.y);
  
  // 移除选择框
  selectionDiv.remove();
  selectionDiv = null;
  
  // 如果选择区域太小，忽略
  if (width < 10 || height < 10) return;
  
  // 计算PDF坐标（用于存储和绘制高亮）
  // 需要将CSS像素坐标转换为PDF坐标
  const canvas = canvasRef.value;
  const canvasCssWidth = canvas.offsetWidth;
  const canvasCssHeight = canvas.offsetHeight;
  
  if (currentPageObj) {
    const viewport = currentPageObj.getViewport({ scale: 1 });
    
    // CSS像素到PDF坐标的转换
    // PDF坐标系：左下角为原点，Y轴向上
    // Canvas坐标系：左上角为原点，Y轴向下
    const pdfScale = viewport.width / canvasCssWidth;
    
    // 转换坐标
    const pdfX1 = left * pdfScale;
    const pdfY1 = viewport.height - (top + height) * pdfScale;  // Y轴翻转
    const pdfX2 = (left + width) * pdfScale;
    const pdfY2 = viewport.height - top * pdfScale;  // Y轴翻转
    
    console.log('[endImageSelect] 坐标转换:', {
      css: { left, top, width, height },
      pdf: { pdfX1, pdfY1, pdfX2, pdfY2 },
      viewport: { width: viewport.width, height: viewport.height },
      canvasCss: { width: canvasCssWidth, height: canvasCssHeight }
    });
    
    // 发出图片选择事件
    emit('image-selected', {
      canvasRect: { x: left, y: top, width, height },
      pdfRect: [pdfX1, pdfY1, pdfX2, pdfY2],
      page: props.currentPage
    });
  } else {
    // 如果没有currentPageObj，只发送CSS坐标
    emit('image-selected', {
      canvasRect: { x: left, y: top, width, height },
      pdfRect: [left, top, left + width, top + height],
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

// 监听标注变化，重绘高亮
watch(() => props.annotations, (newAnnotations) => {
  console.log('[PDFViewer] 标注变化:', newAnnotations?.length);
  if (newAnnotations && newAnnotations.length >= 0) {
    // 如果 PDF 已加载，立即重绘
    if (pdfDoc && annotationCanvasRef.value && currentPageObj) {
      const containerWidth = containerRef.value?.clientWidth || 800;
      const viewport = currentPageObj.getViewport({ 
        scale: containerWidth * scale.value / currentPageObj.getViewport({ scale: 1 }).width 
      });
      drawAnnotations(viewport);
    }
  }
}, { deep: true, immediate: true });

onMounted(() => {
  loadPdf();
  document.addEventListener('mouseup', handleTextSelection);
});

onBeforeUnmount(() => {
  if (pdfDoc) {
    pdfDoc.destroy();
  }
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
  }
  document.removeEventListener('mouseup', handleTextSelection);
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

.annotation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 2;
}

.pdf-text-layer {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  line-height: 1;
  z-index: 3;
  pointer-events: auto;
}

.pdf-text-layer span {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
}

.pdf-text-layer ::selection {
  background: rgba(0, 120, 255, 0.4);
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
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  z-index: 5;
}

.zoom-level {
  font-size: 12px;
  min-width: 40px;
  text-align: center;
}
</style>
