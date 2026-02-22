<!-- src/components/PDFViewer.vue -->
<template>
  <div 
    class="pdf-viewer-container" 
    ref="containerRef"
    tabindex="0"
    @keydown="handlePageKeyDown"
  >
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

    <!-- PDF内容区域 -->
    <div class="pdf-content-wrapper">
      <!-- 右侧翻页区域 -->
      <div 
        class="page-nav-area page-nav-right"
        title="下一页 (→)"
      >
        <div class="page-nav-btn" @click="handlePageNavClick('next')" :class="{ visible: showRightNav }">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </div>
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
    </div>

    <!-- 框选提示 -->
    <div v-if="extractMode === 'image'" class="image-mode-hint">
      📷 图片摘录模式 - 在PDF上框选区域截图
    </div>

    <!-- 底部工具栏 -->
    <div class="bottom-toolbar" v-if="totalPages > 0">
      <!-- 左侧：缩放控制 -->
      <div class="toolbar-section toolbar-left">
        <button @click="zoomOut" class="toolbar-btn" title="缩小 (-)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13H5v-2h14v2z"/>
          </svg>
        </button>
        <span class="zoom-display" @click="showZoomMenu = !showZoomMenu">{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn" class="toolbar-btn" title="放大 (+)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
        <!-- 缩放菜单 -->
        <div v-if="showZoomMenu" class="zoom-menu">
          <button @click="setZoom(0.5)" class="zoom-menu-item">50%</button>
          <button @click="setZoom(0.75)" class="zoom-menu-item">75%</button>
          <button @click="setZoom(1)" class="zoom-menu-item">100%</button>
          <button @click="setZoom(1.25)" class="zoom-menu-item">125%</button>
          <button @click="setZoom(1.5)" class="zoom-menu-item">150%</button>
          <button @click="setZoom(2)" class="zoom-menu-item">200%</button>
          <div class="zoom-menu-divider"></div>
          <button @click="fitToWidth" class="zoom-menu-item">适应宽度</button>
          <button @click="fitToPage" class="zoom-menu-item">适应页面</button>
        </div>
      </div>

      <!-- 中间：翻页控制 -->
      <div class="toolbar-section toolbar-center">
        <button @click="goToPage(1)" class="toolbar-btn" title="首页" :disabled="currentPage === 1">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"/>
          </svg>
        </button>
        <button @click="prevPage" class="toolbar-btn" title="上一页 (←)" :disabled="currentPage === 1">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <div class="page-input-wrapper">
          <input 
            type="number" 
            :value="currentPage" 
            @change="handlePageInput"
            @keyup.enter="handlePageInput"
            min="1" 
            :max="totalPages"
            class="page-input"
          />
          <span class="page-total-text">/ {{ totalPages }}</span>
        </div>
        <button @click="nextPage" class="toolbar-btn" title="下一页 (→)" :disabled="currentPage === totalPages">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
        <button @click="goToPage(totalPages)" class="toolbar-btn" title="末页" :disabled="currentPage === totalPages">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"/>
          </svg>
        </button>
      </div>

      <!-- 右侧：目录按钮 -->
      <div class="toolbar-section toolbar-right">
        <button @click="toggleOutline" class="toolbar-btn" title="目录">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 目录侧边栏 -->
    <div v-if="showOutline" class="outline-sidebar">
      <div class="outline-header">
        <span>目录</span>
        <button @click="showOutline = false" class="outline-close">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div class="outline-content">
        <div v-if="outlineLoading" class="outline-loading">
          <div class="b3-spin"></div>
        </div>
        <div v-else-if="outline.length === 0" class="outline-empty">
          此文档没有目录
        </div>
        <div v-else class="outline-tree">
          <OutlineItem 
            v-for="(item, index) in outline" 
            :key="index"
            :item="item"
            :level="0"
            @navigate="handleOutlineNavigate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed, defineComponent, h } from 'vue';
import { getOrLoadPdf, renderPage, renderTextLayer, getSelectionRect } from '../utils/pdf';
import { getFileAsBlob } from '../api/siyuanApi';
import type { PDFAnnotation, AnnotationColor, ExtractMode } from '../types/annotaion';

// 目录项组件
const OutlineItem = defineComponent({
  name: 'OutlineItem',
  props: {
    item: { type: Object, required: true },
    level: { type: Number, default: 0 }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    const handleClick = () => {
      emit('navigate', props.item);
    };
    return () => {
      const children = props.item.items?.map((child: any, index: number) =>
        h(OutlineItem, {
          key: index,
          item: child,
          level: props.level + 1,
          onNavigate: (item: any) => emit('navigate', item)
        })
      );
      return h('div', { class: 'outline-item-wrapper' }, [
        h('div', {
          class: 'outline-item',
          style: { paddingLeft: `${props.level * 16 + 8}px` },
          onClick: handleClick
        }, [
          h('span', { class: 'outline-item-title' }, props.item.title)
        ]),
        children?.length ? h('div', { class: 'outline-children' }, children) : null
      ]);
    };
  }
});

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

// 翻页按钮显示状态
const showRightNav = ref(false);

// 底部工具栏状态
const showZoomMenu = ref(false);
const showOutline = ref(false);
const outline = ref<any[]>([]);
const outlineLoading = ref(false);

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

// 翻页按钮悬停检测
let navHoverTimer: ReturnType<typeof setTimeout> | null = null;
const NAV_EDGE_WIDTH = 40; // 边缘检测宽度
const NAV_HOVER_DELAY = 400; // 悬停显示延迟(ms)

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
  const scale = currentViewport.scale || 1;
  
  // 使用 viewport.height 作为CSS坐标系参考（与文本层保持一致）
  // 避免使用 viewBox[3] * scale 导致的浮点误差
  const cssPageHeight = currentViewport.height;

  for (const ann of currentPageAnnotations.value) {
    const [pdfX1, pdfY1, pdfX2, pdfY2] = ann.rect;

    // PDF坐标转换为CSS坐标
    // CSS X = PDF X * scale
    // CSS Y = viewport.height - PDF Y * scale （Y轴翻转）
    // 注意：使用 viewport.height 而不是 viewBox[3] * scale
    const cssX = pdfX1 * scale;
    const cssY = cssPageHeight - pdfY2 * scale;
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

// 设置精确缩放
const setZoom = (newScale: number) => {
  scale.value = newScale;
  showZoomMenu.value = false;
  renderCurrentPage();
};

// 适应宽度
const fitToWidth = async () => {
  if (!pdfDoc || !containerRef.value) return;
  const page = await pdfDoc.getPage(props.currentPage);
  const viewport = page.getViewport({ scale: 1 });
  const containerWidth = containerRef.value.clientWidth - 40;
  scale.value = containerWidth / viewport.width;
  showZoomMenu.value = false;
  renderCurrentPage();
};

// 适应页面
const fitToPage = async () => {
  if (!pdfDoc || !containerRef.value) return;
  const page = await pdfDoc.getPage(props.currentPage);
  const viewport = page.getViewport({ scale: 1 });
  const containerWidth = containerRef.value.clientWidth - 40;
  const containerHeight = containerRef.value.clientHeight - 100; // 减去底部工具栏高度
  const scaleX = containerWidth / viewport.width;
  const scaleY = containerHeight / viewport.height;
  scale.value = Math.min(scaleX, scaleY);
  showZoomMenu.value = false;
  renderCurrentPage();
};

// 目录功能
const toggleOutline = async () => {
  showOutline.value = !showOutline.value;
  if (showOutline.value && outline.value.length === 0 && pdfDoc) {
    outlineLoading.value = true;
    try {
      const pdfOutline = await pdfDoc.getOutline();
      if (pdfOutline) {
        outline.value = pdfOutline;
      }
    } catch (e) {
      console.error('获取目录失败:', e);
    } finally {
      outlineLoading.value = false;
    }
  }
};

// 目录导航
const handleOutlineNavigate = async (item: any) => {
  if (item.dest) {
    try {
      let dest = item.dest;
      if (typeof dest === 'string') {
        dest = await pdfDoc.getDestination(dest);
      }
      if (dest) {
        const ref = dest[0];
        const pageIndex = await pdfDoc.getPageIndex(ref);
        emit('page-change', pageIndex + 1);
        showOutline.value = false;
      }
    } catch (e) {
      console.error('导航失败:', e);
    }
  }
};

// 页码输入处理
const handlePageInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const page = parseInt(input.value, 10);
  if (page >= 1 && page <= totalPages.value) {
    goToPage(page);
  } else {
    input.value = String(props.currentPage);
  }
};

// 翻页控制
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === props.currentPage) return;
  emit('page-change', page);
};

const prevPage = () => {
  goToPage(props.currentPage - 1);
};

const nextPage = () => {
  goToPage(props.currentPage + 1);
};

// 键盘翻页
const handlePageKeyDown = (e: KeyboardEvent) => {
  // 如果焦点在输入框中，不处理
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable)) {
    return;
  }

  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      prevPage();
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      nextPage();
      break;
    case 'PageUp':
      e.preventDefault();
      prevPage();
      break;
    case 'PageDown':
      e.preventDefault();
      nextPage();
      break;
    case 'Home':
      e.preventDefault();
      goToPage(1);
      break;
    case 'End':
      e.preventDefault();
      goToPage(totalPages.value);
      break;
    case '-':
    case '_':
      e.preventDefault();
      zoomOut();
      break;
    case '=':
    case '+':
      e.preventDefault();
      zoomIn();
      break;
  }
};

// 点击翻页区域
const handlePageNavClick = (direction: 'next') => {
  nextPage();
};

// 鼠标移动时检测是否在右边缘停留
const handleNavMouseMove = (e: MouseEvent) => {
  if (!containerRef.value) return;
  
  const rect = containerRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = rect.width;
  
  // 清除之前的定时器
  if (navHoverTimer) {
    clearTimeout(navHoverTimer);
    navHoverTimer = null;
  }
  
  // 如果鼠标不在右边缘，立即隐藏按钮
  const inRightEdge = x > width - NAV_EDGE_WIDTH;
  
  if (!inRightEdge) {
    showRightNav.value = false;
    return;
  }
  
  // 鼠标在右边缘，延迟显示按钮（需要停留一段时间）
  navHoverTimer = setTimeout(() => {
    showRightNav.value = true;
  }, NAV_HOVER_DELAY);
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
  
  // 翻页按钮悬停检测
  if (containerRef.value) {
    containerRef.value.addEventListener('mousemove', handleNavMouseMove);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleTextSelection);
  document.removeEventListener('keydown', handleKeyDown);
  
  // 清理翻页按钮定时器
  if (navHoverTimer) {
    clearTimeout(navHoverTimer);
  }
  
  if (containerRef.value) {
    containerRef.value.removeEventListener('mousemove', handleNavMouseMove);
  }
  
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
  overflow: hidden;
  background-color: var(--b3-theme-background);
  position: relative;
  display: flex;
  flex-direction: column;
  outline: none;
}

.pdf-viewer-container:focus {
  outline: none;
}

/* 翻页区域 - 不捕获事件，由JS控制显示 */
.page-nav-area {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* 不捕获任何事件 */
}

.page-nav-right {
  right: 0;
}

.page-nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--b3-theme-on-surface-light);
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.page-nav-btn.visible {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
  cursor: pointer;
}

.page-nav-btn.visible:hover {
  background: var(--b3-theme-surface-light);
  color: var(--b3-theme-primary);
}

.page-nav-btn.visible:active {
  transform: scale(0.95);
  background: var(--b3-theme-primary-light);
  color: var(--b3-theme-primary);
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

/* 页码指示器 - 右下角，默认半透明不遮挡 */
.page-indicator {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 4px 10px;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 12px;
  font-size: 11px;
  color: var(--b3-theme-on-surface);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  opacity: 0.5;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.page-indicator:hover {
  opacity: 1;
}

.page-current {
  font-weight: 600;
  color: var(--b3-theme-primary);
}

.page-divider {
  color: var(--b3-theme-on-surface-light);
}

.page-total {
  color: var(--b3-theme-on-surface-light);
}

/* 缩放控制 */
.zoom-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
  z-index: 200;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.zoom-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.zoom-btn:hover {
  background: var(--b3-theme-surface-light);
  color: var(--b3-theme-primary);
}

.zoom-level {
  font-size: 12px;
  min-width: 42px;
  text-align: center;
  color: var(--b3-theme-on-surface-light);
}

/* PDF内容区域包装器 */
.pdf-content-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  position: relative;
  width: 100%;
  min-height: 0;
  overflow: auto;
  padding: 20px;
}

/* 底部工具栏 */
.bottom-toolbar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: var(--b3-theme-surface);
  border-top: 1px solid var(--b3-border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-left {
  flex: 1;
  justify-content: flex-start;
  position: relative;
}

.toolbar-center {
  flex: 1;
  justify-content: center;
  gap: 8px;
}

.toolbar-right {
  flex: 1;
  justify-content: flex-end;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--b3-theme-surface-light);
  color: var(--b3-theme-primary);
}

.toolbar-btn:active:not(:disabled) {
  transform: scale(0.95);
  background: var(--b3-theme-primary-light);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zoom-display {
  font-size: 13px;
  min-width: 50px;
  text-align: center;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.zoom-display:hover {
  background: var(--b3-theme-surface-light);
}

/* 缩放菜单 */
.zoom-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  background: var(--b3-theme-surface);
  border: 1px solid var(--b3-border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 200;
  min-width: 120px;
}

.zoom-menu-item {
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  cursor: pointer;
  transition: background 0.15s ease;
}

.zoom-menu-item:hover {
  background: var(--b3-theme-surface-light);
  color: var(--b3-theme-primary);
}

.zoom-menu-divider {
  height: 1px;
  background: var(--b3-border-color);
  margin: 4px 0;
}

/* 页码输入 */
.page-input-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-input {
  width: 48px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--b3-border-color);
  border-radius: 4px;
  background: var(--b3-theme-background);
  color: var(--b3-theme-on-surface);
  font-size: 13px;
  text-align: center;
  outline: none;
  transition: border-color 0.15s ease;
}

.page-input:focus {
  border-color: var(--b3-theme-primary);
}

.page-total-text {
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);
}

/* 目录侧边栏 */
.outline-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: var(--b3-theme-surface);
  border-left: 1px solid var(--b3-border-color);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 150;
  display: flex;
  flex-direction: column;
}

.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--b3-border-color);
  font-weight: 600;
  color: var(--b3-theme-on-surface);
}

.outline-close {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--b3-theme-on-surface-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.outline-close:hover {
  background: var(--b3-theme-surface-light);
  color: var(--b3-theme-on-surface);
}

.outline-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.outline-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.outline-empty {
  text-align: center;
  padding: 32px;
  color: var(--b3-theme-on-surface-light);
  font-size: 13px;
}

.outline-tree {
  width: 100%;
}

.outline-item-wrapper {
  width: 100%;
}

.outline-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.outline-item:hover {
  background: var(--b3-theme-surface-light);
}

.outline-item-title {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  line-height: 1.4;
}

.outline-children {
  width: 100%;
}
</style>
