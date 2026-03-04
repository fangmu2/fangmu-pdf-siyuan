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
        <!-- 形状标注层 -->
        <PdfShapeOverlay
          v-if="currentPageShapes.length > 0 || shapeTool || previewShape"
          :shapes="currentPageShapes"
          :preview-shape="previewShape"
          :container-width="currentViewport?.width || 0"
          :container-height="currentViewport?.height || 0"
          :scale="scale"
          :css-page-height="currentViewport?.height || 0"
          @shape-click="handleShapeClick"
          @shape-select="handleShapeSelect"
          @shape-move="handleShapeMove"
          @shape-resize="handleShapeResize"
          @drawing-start="handleDrawingStart"
          @drawing-update="handleDrawingUpdate"
          @drawing-end="handleDrawingEnd"
        />
        <!-- 手写图层 -->
        <HandwritingLayer
          v-if="isHandwritingLayerEnabled"
          :pdf-path="props.pdfPath"
          :page="props.currentPage"
          :is-visible="isHandwritingLayerVisible"
          @reset-learning="handleResetLearning"
        />
      </div>
    </div>

    <!-- 框选提示 -->
    <div v-if="extractMode === 'image'" class="image-mode-hint">
      📷 图片摘录模式 - 在PDF上框选区域截图
    </div>

    <!-- 顶部工具栏 -->
    <div class="top-toolbar" v-if="totalPages > 0">
      <!-- 左侧工具栏 -->
      <div class="toolbar-left">
        <!-- 导航按钮 -->
        <button
          class="tool-btn"
          @click="prevPage"
          :disabled="currentPage <= 1"
          title="上一页 (PageUp)"
        >
          <span>◀</span>
        </button>
        <button
          class="tool-btn"
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          title="下一页 (PageDown)"
        >
          <span>▶</span>
        </button>

        <!-- 页码输入 -->
        <div class="page-input-group">
          <input
            type="number"
            :value="currentPage"
            @change="handlePageInput"
            @keyup.enter="handlePageInput"
            min="1"
            :max="totalPages"
            class="page-input"
          />
          <span class="page-total">/ {{ totalPages }}</span>
        </div>

        <div class="toolbar-divider"></div>

        <!-- 阅读模式切换 -->
        <div class="tool-group">
          <button
            class="tool-btn"
            :class="{ active: viewMode === 'single' }"
            @click="setViewMode('single')"
            title="单页模式"
          >
            <span>📄</span>
          </button>
          <button
            class="tool-btn"
            :class="{ active: viewMode === 'double' }"
            @click="setViewMode('double')"
            title="双页模式"
          >
            <span>📖</span>
          </button>
          <button
            class="tool-btn"
            :class="{ active: viewMode === 'continuous' }"
            @click="setViewMode('continuous')"
            title="连续滚动"
          >
            <span>📜</span>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- 缩放控制 -->
        <div class="zoom-group">
          <button
            class="tool-btn"
            @click="zoomOut"
            title="缩小"
          >
            <span>🔍-</span>
          </button>
          <select
            :value="scale"
            @change="setZoom(parseFloat($event.target.value))"
            class="zoom-select"
          >
            <option v-for="level in zoomLevels" :key="level" :value="level">
              {{ Math.round(level * 100) }}%
            </option>
            <option value="fit-width">适应宽度</option>
            <option value="fit-page">适应页面</option>
            <option value="actual">实际大小</option>
          </select>
          <button
            class="tool-btn"
            @click="zoomIn"
            title="放大"
          >
            <span>🔍+</span>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- 旋转 -->
        <button
          class="tool-btn"
          @click="rotate"
          title="顺时针旋转"
        >
          <span>🔄</span>
        </button>
      </div>

      <!-- 右侧工具栏 -->
      <div class="toolbar-right">
        <!-- 进度条 -->
        <div class="progress-group">
          <span class="progress-label">进度</span>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <span class="progress-text">{{ Math.round(progress) }}%</span>
        </div>

        <div class="toolbar-divider"></div>

        <!-- 侧边栏切换 -->
        <button
          class="tool-btn"
          :class="{ active: showOutline }"
          @click="toggleOutline"
          title="目录"
        >
          <span>📑</span>
        </button>
        <button
          class="tool-btn"
          :class="{ active: showThumbnails }"
          @click="toggleThumbnails"
          title="缩略图"
        >
          <span>🖼️</span>
        </button>
        <button
          class="tool-btn"
          :class="{ active: showBookmarks }"
          @click="toggleBookmarks"
          title="书签"
        >
          <span>🔖</span>
        </button>


        <!-- 深色模式 -->
        <button
          class="tool-btn"
          :class="{ active: darkMode }"
          @click="toggleDarkMode"
          title="深色模式"
        >
          <span>🌙</span>
        </button>

        <!-- 更多选项 -->
        <div class="dropdown">
          <button class="tool-btn dropdown-toggle" title="更多选项">
            <span>⋮</span>
          </button>
          <div class="dropdown-menu">
            <button @click="addBookmark" class="dropdown-item">
              <span>🔖</span> 添加书签
            </button>
            <button @click="showSearchPanel = !showSearchPanel" class="dropdown-item">
              <span>🔍</span> 搜索
            </button>
            <hr class="dropdown-divider" />
            <button @click="exportPdfData" class="dropdown-item">
              <span>📤</span> 导出
            </button>
            <button @click="showSettingsPanel = !showSettingsPanel" class="dropdown-item">
              <span>⚙️</span> 设置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部工具栏（保留原有功能，添加高亮颜色选择） -->
    <div class="bottom-toolbar" v-if="totalPages > 0">
      <!-- 左侧：标注类型选择器 -->
      <div class="toolbar-section toolbar-left">
        <div class="annotation-type-selector">
          <button
            v-for="type in annotationTypes"
            :key="type.value"
            :class="['type-btn', { active: selectedAnnotationType === type.value }]"
            :title="type.label"
            @click="selectedAnnotationType = type.value"
          >
            <span class="type-icon">{{ type.icon }}</span>
            <span class="type-label">{{ type.label }}</span>
          </button>
        </div>

        <div class="toolbar-divider-vertical"></div>

        <!-- 形状工具 -->
        <div class="shape-tools">
          <button
            :class="['shape-btn', { active: shapeTool === 'rectangle' }]"
            title="矩形标注"
            @click="setShapeTool('rectangle')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          </button>
          <button
            :class="['shape-btn', { active: shapeTool === 'circle' }]"
            title="圆形标注"
            @click="setShapeTool('circle')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9" />
            </svg>
          </button>
          <button
            :class="['shape-btn', { active: shapeTool === 'arrow' }]"
            title="箭头标注"
            @click="setShapeTool('arrow')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 中间：形状颜色选择器 -->
      <div class="toolbar-section toolbar-center" v-if="shapeTool">
        <div class="shape-color-picker">
          <button
            v-for="color in shapeColors"
            :key="color.value"
            :class="['color-btn', { active: selectedShapeColor === color.value }]"
            :style="{ backgroundColor: color.hex }"
            :title="color.name"
            @click="selectedShapeColor = color.value"
          ></button>
        </div>
      </div>

      <!-- 中间：高亮颜色选择器 -->
      <div class="toolbar-section toolbar-center">
        <div class="highlight-color-picker">
          <button
            v-for="color in highlightColors"
            :key="color.value"
            :class="['color-btn', { active: selectedHighlightColor === color.value }]"
            :style="{ backgroundColor: color.hex }"
            :title="color.name"
            @click="selectedHighlightColor = color.value"
          ></button>
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

      <!-- 右侧：手写开关 -->
      <div class="toolbar-section toolbar-right">
        <button
          @click="toggleHandwritingLayer"
          class="toolbar-btn"
          :class="{ active: isHandwritingLayerVisible }"
          title="手写笔记"
        >
          <span>✏️</span>
        </button>
      </div>
    </div>

    <!-- 左侧边栏：缩略图/书签 -->
    <div v-if="showThumbnails || showBookmarks" class="left-sidebar">
      <div class="sidebar-tabs">
        <button
          class="tab-btn"
          :class="{ active: showThumbnails }"
          @click="showThumbnails = true; showBookmarks = false;"
          title="缩略图"
        >
          🖼️
        </button>
        <button
          class="tab-btn"
          :class="{ active: showBookmarks }"
          @click="showBookmarks = true; showThumbnails = false;"
          title="书签"
        >
          🔖
        </button>
        <button
          class="tab-btn close-btn"
          @click="showThumbnails = false; showBookmarks = false;"
          title="关闭"
        >
          ✕
        </button>
      </div>
      <div class="sidebar-content">
        <PDFThumbnails
          v-if="showThumbnails && pdfDoc"
          :pdf-document="pdfDoc"
          :current-page="currentPage"
          scroll-mode="vertical"
          @page-click="goToPage"
        />
        <div v-if="showBookmarks" class="bookmarks-list">
          <div v-if="bookmarks.length === 0" class="empty-state">
            暂无书签
          </div>
          <div
            v-for="bookmark in bookmarks"
            :key="bookmark.id"
            class="bookmark-item"
            :class="{ active: currentPage === bookmark.pageNumber }"
            @click="goToPage(bookmark.pageNumber)"
          >
            <span class="bookmark-icon">🔖</span>
            <span class="bookmark-title">{{ bookmark.title || `第${bookmark.pageNumber}页` }}</span>
            <button class="bookmark-delete" @click.stop="removeBookmark(bookmark.id)">×</button>
          </div>
        </div>
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
import type { PDFAnnotation, AnnotationColor, ExtractMode, ShapeAnnotation, ResizeHandle } from '../types/annotation';
import HandwritingLayer from './HandwritingLayer.vue'; // 导入手写图层组件
import PdfShapeOverlay from './PdfShapeOverlay.vue'; // 导入形状叠加层组件

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
  (e: 'text-selected', data: { 
    text: string; 
    page: number; 
    rect: [number, number, number, number] | null;
    annotationType?: 'highlight' | 'underline' | 'strikethrough' | 'wavy';
    color?: string;
  }): void;
  (e: 'image-selected', data: {
    canvasRect: { x: number; y: number; width: number; height: number };
    pdfRect: [number, number, number, number];
    page: number
  }): void;
  (e: 'annotation-delete', annotation: PDFAnnotation): void;
  (e: 'annotation-click', annotation: PDFAnnotation): void;
  (e: 'annotation-created', annotation: PDFAnnotation): void;
  (e: 'highlight-color-change', color: string): void;
  (e: 'annotation-type-change', type: 'highlight' | 'underline' | 'strikethrough' | 'wavy'): void;
  (e: 'shape-tool-change', tool: 'rectangle' | 'circle' | 'arrow' | null): void;
  (e: 'shape-created', shape: ShapeAnnotation): void;
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
const currentPage = ref(1);

// 翻页按钮显示状态
const showRightNav = ref(false);

// 底部工具栏状态
const showZoomMenu = ref(false);
const showOutline = ref(false);
const showThumbnails = ref(false);
const showBookmarks = ref(false);
const showSearchPanel = ref(false);
const showSettingsPanel = ref(false);
const outline = ref<any[]>([]);
const outlineLoading = ref(false);
const bookmarks = ref<any[]>([]);

// 阅读模式
const viewMode = ref<'single' | 'double' | 'continuous'>('single');
const darkMode = ref(false);
const rotation = ref(0);

// 连续滚动模式状态
const renderedPages = ref<number[]>([]);

// 缩放级别选项
const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

// 阅读进度
const progress = computed(() => {
  if (totalPages.value === 0) return 0;
  return (currentPage.value / totalPages.value) * 100;
});

// 高亮颜色选择
const highlightColors = [
  { value: 'yellow', name: '黄色', hex: '#fef08a' },
  { value: 'green', name: '绿色', hex: '#bbf7d0' },
  { value: 'blue', name: '蓝色', hex: '#bfdbfe' },
  { value: 'red', name: '红色', hex: '#fecaca' },
  { value: 'purple', name: '紫色', hex: '#e9d5ff' },
  { value: 'orange', name: '橙色', hex: '#fed7aa' },
];
const selectedHighlightColor = ref('yellow');

// 标注类型选择
const annotationTypes = [
  { value: 'highlight' as const, label: '高亮', icon: '🖍️' },
  { value: 'underline' as const, label: '下划线', icon: 'U̲' },
  { value: 'strikethrough' as const, label: '删除线', icon: 'S̶' },
  { value: 'wavy' as const, label: '波浪线', icon: '〰️' },
];
const selectedAnnotationType = ref<'highlight' | 'underline' | 'strikethrough' | 'wavy'>('highlight');

// 形状工具状态
const shapeTool = ref<'rectangle' | 'circle' | 'arrow' | null>(null);
const selectedShapeColor = ref('#ef4444');
const selectedShapeLineWidth = ref(2);

// 形状颜色选项
const shapeColors = [
  { value: '#ef4444', name: '红色', hex: '#ef4444' },
  { value: '#3b82f6', name: '蓝色', hex: '#3b82f6' },
  { value: '#22c55e', name: '绿色', hex: '#22c55e' },
  { value: '#f59e0b', name: '橙色', hex: '#f59e0b' },
  { value: '#8b5cf6', name: '紫色', hex: '#8b5cf6' },
  { value: '#000000', name: '黑色', hex: '#000000' },
];

// 形状标注列表
const shapeAnnotations = ref<ShapeAnnotation[]>([]);
const previewShape = ref<ShapeAnnotation | null>(null);

// 当前页的形状标注
const currentPageShapes = computed(() => {
  return shapeAnnotations.value.filter(shape => shape.page === props.currentPage);
});

// 监听颜色变化并通知父组件
watch(selectedHighlightColor, (newColor) => {
  emit('highlight-color-change', newColor);
}, { immediate: true });

// 监听标注类型变化并通知父组件
watch(selectedAnnotationType, (newType) => {
  emit('annotation-type-change', newType);
}, { immediate: true });

// 监听形状工具变化并通知父组件
watch(shapeTool, (newTool) => {
  emit('shape-tool-change', newTool);
}, { immediate: true });

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

// 手写图层状态
const isHandwritingLayerEnabled = ref(false); // 是否启用整个手写图层功能
const isHandwritingLayerVisible = ref(false); // 手写图层是否可见

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

// 当前渲染任务
let currentRenderTask: { cancel: () => void } | null = null;

// 渲染当前页
const renderCurrentPage = async (pageNum?: number) => {
  if (!pdfDoc || !canvasRef.value || !containerRef.value || !textLayerRef.value || !highlightLayerRef.value) return;

  // 取消之前的渲染任务
  if (currentRenderTask) {
    currentRenderTask.cancel();
    currentRenderTask = null;
  }

  try {
    // 使用传入的页码或当前页码
    const pageToRender = pageNum ?? currentPage.value;

    console.log('[PDFViewer] 渲染页面:', pageToRender);

    // 连续滚动模式特殊处理
    if (viewMode.value === 'continuous') {
      await renderContinuousScroll();
      return;
    }

    currentPageObj = await pdfDoc.getPage(pageToRender);

    const containerWidth = containerRef.value.clientWidth - 40;

    // 渲染 Canvas（带取消支持）
    const renderPromise = renderPage(currentPageObj, canvasRef.value, containerWidth * scale.value);

    // 创建可取消的渲染任务
    currentRenderTask = {
      cancel: () => {
        // PDF.js 渲染任务无法直接取消，但可以忽略结果
        console.log('[PDFViewer] 渲染任务已取消');
      }
    };

    const viewport = await renderPromise;

    // 任务完成，清除引用
    currentRenderTask = null;

    // 缓存 viewport
    currentViewport = viewport;

    // 渲染文本层（使用官方 API）
    await renderTextLayer(currentPageObj, textLayerRef.value, viewport);

    // 设置页面容器尺寸
    if (pageContainerRef.value) {
      pageContainerRef.value.style.width = canvasRef.value.style.width;
      pageContainerRef.value.style.height = canvasRef.value.style.height;
    }

    // 绘制标注高亮（DOM 方式）
    renderHighlights();

  } catch (e: any) {
    // 忽略取消错误
    if (e.name === 'RenderingCancelledException') {
      console.log('[PDFViewer] 渲染已取消');
      return;
    }
    console.error('渲染页面失败:', e);
    error.value = '渲染失败';
  }
};

// 连续滚动模式渲染
const renderContinuousScroll = async () => {
  if (!pdfDoc || !canvasRef.value || !containerRef.value) return;

  try {
    const containerWidth = containerRef.value.clientWidth - 40;
    const pageContainer = pageContainerRef.value;

    if (!pageContainer) return;

    // 清空容器
    pageContainer.innerHTML = '';

    // 渲染当前页及前后各 2 页（共 5 页）
    const pagesToRender = [];
    const startPage = Math.max(1, props.currentPage - 2);
    const endPage = Math.min(totalPages.value, props.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pagesToRender.push(i);
    }

    renderedPages.value = pagesToRender;

    // 为每页创建容器
    for (const pageNum of pagesToRender) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = await renderPage(page, canvasRef.value, containerWidth * scale.value);

      // 创建页面容器
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'continuous-page-wrapper';
      pageWrapper.dataset.pageNumber = pageNum;

      // 创建 canvas
      const pageCanvas = document.createElement('canvas');
      pageCanvas.className = 'pdf-canvas continuous-page-canvas';
      pageCanvas.style.width = viewport.width + 'px';
      pageCanvas.style.height = viewport.height + 'px';
      pageWrapper.appendChild(pageCanvas);

      // 渲染到 canvas
      const renderContext = {
        canvasContext: pageCanvas.getContext('2d')!,
        viewport: viewport
      };
      await page.render(renderContext).promise;

      // 创建文本层容器
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'pdf-text-layer continuous-text-layer';
      pageWrapper.appendChild(textLayerDiv);

      // 渲染文本层
      await renderTextLayer(page, textLayerDiv, viewport);

      // 创建高亮层容器
      const highlightDiv = document.createElement('div');
      highlightDiv.className = 'highlight-layer continuous-highlight-layer';
      highlightDiv.style.width = viewport.width + 'px';
      highlightDiv.style.height = viewport.height + 'px';
      pageWrapper.appendChild(highlightDiv);

      // 存储页面数据以便后续渲染高亮
      pageWrapper.dataset.viewport = JSON.stringify({
        scale: viewport.scale,
        width: viewport.width,
        height: viewport.height
      });

      pageContainer.appendChild(pageWrapper);

      // 渲染该页的标注高亮
      renderPageHighlights(pageNum, highlightDiv, viewport);
    }

    // 滚动到当前页
    const currentPageWrapper = pageContainer.querySelector(`[data-page-number="${props.currentPage}"]`);
    if (currentPageWrapper) {
      currentPageWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  } catch (e: any) {
    console.error('连续滚动渲染失败:', e);
    error.value = '渲染失败';
  }
};

// 渲染单页高亮
const renderPageHighlights = (pageNum: number, highlightLayer: HTMLElement, viewport: any) => {
  if (!highlightLayer) return;

  const pageAnnotations = props.annotations?.filter(ann => ann.page === pageNum) || [];
  const scale = viewport.scale || 1;
  const cssPageHeight = viewport.height;

  highlightLayer.innerHTML = '';
  highlightLayer.style.width = viewport.width + 'px';
  highlightLayer.style.height = viewport.height + 'px';

  for (const ann of pageAnnotations) {
    const [pdfX1, pdfY1, pdfX2, pdfY2] = ann.rect;

    const cssX = pdfX1 * scale;
    const cssY = cssPageHeight - pdfY2 * scale;
    const cssWidth = (pdfX2 - pdfX1) * scale;
    const cssHeight = Math.max((pdfY2 - pdfY1) * scale, 14);

    const colors = LEVEL_COLORS[ann.level] || ANNOTATION_COLORS[ann.color] || ANNOTATION_COLORS.yellow;
    const isSelected = selectedAnnotation.value?.id === ann.id;

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

    // 添加角标
    if (ann.isImage) {
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

    // 删除按钮
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

    highlight.addEventListener('mouseenter', () => {
      deleteBtn.style.opacity = '1';
    });
    highlight.addEventListener('mouseleave', () => {
      if (selectedAnnotation.value?.id !== ann.id) {
        deleteBtn.style.opacity = '0';
      }
    });

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      emit('annotation-delete', ann);
      selectedAnnotation.value = null;
    });

    if (isSelected) {
      deleteBtn.style.opacity = '1';
    }

    highlight.appendChild(deleteBtn);
    highlightLayer.appendChild(highlight);
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
    rect,
    annotationType: selectedAnnotationType.value,
    color: selectedHighlightColor.value,
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

// 工具栏功能
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

const toggleThumbnails = () => {
  showThumbnails.value = !showThumbnails.value;
  if (showThumbnails.value) {
    showBookmarks.value = false;
    showOutline.value = false;
  }
};

const toggleBookmarks = () => {
  showBookmarks.value = !showBookmarks.value;
  if (showBookmarks.value) {
    showThumbnails.value = false;
    showOutline.value = false;
  }
};

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value;
};

const setViewMode = (mode: 'single' | 'double' | 'continuous') => {
  viewMode.value = mode;
  console.log('[PDFViewer] 切换阅读模式:', mode);

  // 切换模式后重新渲染
  nextTick(() => {
    renderCurrentPage();
  });
};

const rotate = () => {
  rotation.value = (rotation.value + 90) % 360;
};

// 书签功能
const addBookmark = () => {
  const bookmark = {
    id: `bookmark_${Date.now()}`,
    pageNumber: currentPage.value,
    title: `第${currentPage.value}页`,
    createdAt: Date.now()
  };
  bookmarks.value.push(bookmark);
  bookmarks.value.sort((a, b) => a.pageNumber - b.pageNumber);
};

const removeBookmark = (id: string) => {
  bookmarks.value = bookmarks.value.filter(b => b.id !== id);
};

// 导出功能
const exportPdfData = () => {
  const data = {
    pdfPath: props.pdfPath,
    currentPage: currentPage.value,
    bookmarks: bookmarks.value,
    annotations: props.annotations,
    exportedAt: Date.now()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pdf-data-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
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

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  // 使用本地 currentPage.value 进行比较，避免 props 更新延迟问题
  if (page === currentPage.value) return;

  console.log('[PDFViewer] 翻页:', currentPage.value, '->', page);

  // 先更新本地状态
  currentPage.value = page;

  // 通知父组件（watch 会触发渲染）
  emit('page-change', page);
};

const prevPage = () => {
  goToPage(currentPage.value - 1);
};

const nextPage = () => {
  goToPage(currentPage.value + 1);
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
const handlePageNavClick = () => {
  nextPage();
};

// 保存当前页面到学习集进度
const saveProgressToLearningSet = (pdfPath: string, page: number) => {
  // 只保存日志，不实际遍历学习集
  // 因为学习集进度应该由学习集组件自己管理
  console.log(`[PDFViewer] 进度更新：${pdfPath}, 第${page}页`);
};

// 页面变化时保存进度 - 只在有学习集时保存
watch(() => props.currentPage, (newPage, oldPage) => {
  if (newPage !== oldPage && props.pdfPath) {
    saveProgressToLearningSet(props.pdfPath, newPage);
  }
});

// 手写图层控制方法
const toggleHandwritingLayer = () => {
  // 首次启用时激活功能
  if (!isHandwritingLayerEnabled.value) {
    isHandwritingLayerEnabled.value = true;
  }
  // 切换可见性
  isHandwritingLayerVisible.value = !isHandwritingLayerVisible.value;
};

// 重置学习功能
const handleResetLearning = () => {
  // 发出重置学习事件，通知父组件执行重置操作
  console.log('Learning reset triggered for PDF:', props.pdfPath, 'Page:', props.currentPage);
  // 可以在这里添加清理标注等操作
  // 例如：清除当前页面的所有标注
  const pageAnnotations = props.annotations?.filter(ann => ann.page === props.currentPage) || [];
  pageAnnotations.forEach(ann => {
    emit('annotation-delete', ann);
  });
};

// ========== 形状工具相关方法 ==========
/**
 * 设置形状工具
 */
const setShapeTool = (tool: 'rectangle' | 'circle' | 'arrow' | null) => {
  shapeTool.value = tool;
  console.log('[PDFViewer] 设置形状工具:', tool);
};

/**
 * 开始绘制
 */
const handleDrawingStart = (point: { x: number; y: number }) => {
  console.log('[PDFViewer] 开始绘制:', point);
};

/**
 * 更新绘制
 */
const handleDrawingUpdate = (point: { x: number; y: number }) => {
  // 绘制中的实时更新由 PdfShapeOverlay 组件处理
};

/**
 * 结束绘制
 */
const handleDrawingEnd = () => {
  console.log('[PDFViewer] 结束绘制');
  
  // 从 previewShape 获取最终形状数据
  if (previewShape.value) {
    // 验证形状是否有效
    const isValid = validateShape(previewShape.value);
    if (isValid) {
      // 添加到形状列表
      shapeAnnotations.value.push({ ...previewShape.value });
      // 触发创建事件
      emit('shape-created', previewShape.value);
    }
    previewShape.value = null;
  }
};

/**
 * 验证形状是否有效
 */
const validateShape = (shape: ShapeAnnotation): boolean => {
  const minSize = 10;
  
  if (shape.shapeType === 'rectangle' || shape.shapeType === 'circle') {
    return (shape.width || 0) >= minSize && (shape.height || 0) >= minSize;
  } else if (shape.shapeType === 'arrow') {
    const dx = (shape.endX || 0) - (shape.startX || 0);
    const dy = (shape.endY || 0) - (shape.startY || 0);
    const length = Math.sqrt(dx * dx + dy * dy);
    return length >= minSize;
  }
  
  return false;
};

/**
 * 形状点击
 */
const handleShapeClick = (shape: ShapeAnnotation) => {
  console.log('[PDFViewer] 形状点击:', shape);
  // 选中形状
  handleShapeSelect(shape);
};

/**
 * 形状选中
 */
const handleShapeSelect = (shape: ShapeAnnotation | null) => {
  console.log('[PDFViewer] 形状选中:', shape);
  // 更新形状的选中状态
  shapeAnnotations.value.forEach(s => {
    s.isSelected = s.id === shape?.id;
  });
};

/**
 * 形状移动
 */
const handleShapeMove = (shape: ShapeAnnotation, dx: number, dy: number) => {
  console.log('[PDFViewer] 形状移动:', shape.id, dx, dy);
  
  // 将 CSS 坐标准换回 PDF 坐标（考虑 scale）
  const pdfDx = dx / scale.value;
  const pdfDy = -dy / scale.value; // Y 轴翻转
  
  if (shape.shapeType === 'rectangle' || shape.shapeType === 'circle') {
    if (shape.x !== undefined) shape.x += pdfDx;
    if (shape.y !== undefined) shape.y += pdfDy;
  } else if (shape.shapeType === 'arrow') {
    if (shape.startX !== undefined) shape.startX += pdfDx;
    if (shape.startY !== undefined) shape.startY += pdfDy;
    if (shape.endX !== undefined) shape.endX += pdfDx;
    if (shape.endY !== undefined) shape.endY += pdfDy;
  }
  
  shape.updated = Date.now();
};

/**
 * 形状调整大小
 */
const handleShapeResize = (shape: ShapeAnnotation, handleType: ResizeHandle, dx: number, dy: number) => {
  console.log('[PDFViewer] 形状调整:', shape.id, handleType, dx, dy);
  
  // 将 CSS 坐标准换回 PDF 坐标
  const pdfDx = dx / scale.value;
  const pdfDy = -dy / scale.value; // Y 轴翻转
  
  const minSize = 10;
  
  if (shape.shapeType === 'rectangle' || shape.shapeType === 'circle') {
    switch (handleType) {
      case 'nw':
        if (shape.x !== undefined) shape.x += pdfDx;
        if (shape.y !== undefined) shape.y += pdfDy;
        if (shape.width !== undefined) shape.width = Math.max(shape.width - pdfDx, minSize);
        if (shape.height !== undefined) shape.height = Math.max(shape.height - pdfDy, minSize);
        break;
      case 'n':
        if (shape.y !== undefined) shape.y += pdfDy;
        if (shape.height !== undefined) shape.height = Math.max(shape.height - pdfDy, minSize);
        break;
      case 'ne':
        if (shape.y !== undefined) shape.y += pdfDy;
        if (shape.width !== undefined) shape.width = Math.max(shape.width + pdfDx, minSize);
        if (shape.height !== undefined) shape.height = Math.max(shape.height - pdfDy, minSize);
        break;
      case 'e':
        if (shape.width !== undefined) shape.width = Math.max(shape.width + pdfDx, minSize);
        break;
      case 'se':
        if (shape.width !== undefined) shape.width = Math.max(shape.width + pdfDx, minSize);
        if (shape.height !== undefined) shape.height = Math.max(shape.height + pdfDy, minSize);
        break;
      case 's':
        if (shape.height !== undefined) shape.height = Math.max(shape.height + pdfDy, minSize);
        break;
      case 'sw':
        if (shape.x !== undefined) shape.x += pdfDx;
        if (shape.width !== undefined) shape.width = Math.max(shape.width - pdfDx, minSize);
        if (shape.height !== undefined) shape.height = Math.max(shape.height + pdfDy, minSize);
        break;
      case 'w':
        if (shape.x !== undefined) shape.x += pdfDx;
        if (shape.width !== undefined) shape.width = Math.max(shape.width - pdfDx, minSize);
        break;
    }
  } else if (shape.shapeType === 'arrow') {
    if (handleType === 'nw') {
      if (shape.startX !== undefined) shape.startX += pdfDx;
      if (shape.startY !== undefined) shape.startY += pdfDy;
    } else if (handleType === 'se') {
      if (shape.endX !== undefined) shape.endX += pdfDx;
      if (shape.endY !== undefined) shape.endY += pdfDy;
    }
  }
  
  shape.updated = Date.now();
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

// 同步当前页
watch(() => props.currentPage, (newPage) => {
  currentPage.value = newPage;
}, { immediate: true });

// 监听本地 currentPage 变化，重新渲染（带防抖）
let renderTimer: ReturnType<typeof setTimeout> | null = null;

watch(() => currentPage.value, (newPage, oldPage) => {
  if (newPage !== oldPage && pdfDoc) {
    console.log('[PDFViewer] currentPage 变化，重新渲染:', newPage);

    // 清除之前的定时器
    if (renderTimer) {
      clearTimeout(renderTimer);
    }

    // 防抖 50ms，避免快速翻页时重复渲染
    renderTimer = setTimeout(() => {
      renderCurrentPage(newPage);
      renderTimer = null;
    }, 50);
  }
});

// 监听 PDF 跳转事件
const handlePdfNavigateTo = async (event: CustomEvent) => {
  const detail = event.detail as {
    pdfPath: string;
    page: number;
    rect?: { x1: number; y1: number; x2: number; y2: number };
    scale?: number;
    highlight?: boolean;
    highlightColor?: string;
  };

  console.log('[PDFViewer] 收到跳转事件:', detail);

  // 如果 PDF 不同，先加载 PDF
  if (detail.pdfPath !== props.pdfPath) {
    // 通知父组件切换 PDF
    emit('page-change', detail.page);
    // 等待 PDF 加载完成后高亮
    setTimeout(() => {
      if (detail.highlight && detail.rect) {
        highlightRect(detail.rect, detail.highlightColor || 'yellow');
      }
    }, 500);
    return;
  }

  // 跳转到指定页
  if (detail.page !== props.currentPage) {
    goToPage(detail.page);
  }

  // 高亮显示区域
  if (detail.highlight && detail.rect) {
    nextTick(() => {
      highlightRect(detail.rect!, detail.highlightColor || 'yellow');
    });
  }
};

// 高亮显示 PDF 区域
const highlightRect = (
  rect: { x1: number; y1: number; x2: number; y2: number },
  color: string = 'yellow'
) => {
  if (!highlightLayerRef.value || !currentViewport) return;

  const scale = currentViewport.scale || 1;
  const cssPageHeight = currentViewport.height;

  // PDF 坐标转 CSS 坐标
  const cssX = rect.x1 * scale;
  const cssY = cssPageHeight - rect.y2 * scale;
  const cssWidth = (rect.x2 - rect.x1) * scale;
  const cssHeight = Math.max((rect.y2 - rect.y1) * scale, 14);

  // 颜色映射
  const colorMap: Record<string, string> = {
    yellow: 'rgba(255, 217, 61, 0.6)',
    green: 'rgba(107, 203, 119, 0.6)',
    blue: 'rgba(77, 150, 255, 0.6)',
    red: 'rgba(255, 107, 107, 0.6)',
    purple: 'rgba(155, 89, 182, 0.6)',
    orange: 'rgba(254, 202, 87, 0.6)',
  };

  // 创建临时高亮元素
  const highlight = document.createElement('div');
  highlight.className = 'highlight-element-temp';
  highlight.style.cssText = `
    position: absolute;
    left: ${cssX}px;
    top: ${cssY}px;
    width: ${cssWidth}px;
    height: ${cssHeight}px;
    background-color: ${colorMap[color] || colorMap.yellow};
    border: 3px solid ${colorMap[color] || colorMap.yellow};
    border-radius: 3px;
    pointer-events: none;
    z-index: 100;
    animation: highlight-pulse 0.5s ease-in-out 3;
  `;

  highlightLayerRef.value.appendChild(highlight);

  // 3 秒后移除
  setTimeout(() => {
    highlight.remove();
  }, 3000);
};

// 监听高亮事件
const handlePdfHighlightRect = async (event: CustomEvent) => {
  const detail = event.detail as {
    coordinates: any;
    duration: number;
  };

  console.log('[PDFViewer] 收到高亮事件:', detail);

  if (detail.coordinates?.rect) {
    const rect = detail.coordinates.rect;
    highlightRect(rect, 'yellow');
  }
};

// 添加 CSS 动画
const addHighlightAnimation = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes highlight-pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.7;
        transform: scale(1.05);
      }
    }
  `;
  document.head.appendChild(style);
};

// 监听变化
watch([() => props.pdfPath, () => currentPage], () => {
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

  // 监听 PDF 跳转和高亮事件
  window.addEventListener('pdf-navigate-to', handlePdfNavigateTo as EventListener);
  window.addEventListener('pdf-highlight-rect', handlePdfHighlightRect as EventListener);

  // 添加高亮动画
  addHighlightAnimation();
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

  // 移除事件监听
  window.removeEventListener('pdf-navigate-to', handlePdfNavigateTo as EventListener);
  window.removeEventListener('pdf-highlight-rect', handlePdfHighlightRect as EventListener);

  if (pdfDoc) {
    pdfDoc.destroy();
  }
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
  }
});
</script>

<style scoped lang="scss">
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

/* 顶部工具栏 */
.top-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: var(--b3-theme-surface);
  border-bottom: 1px solid var(--b3-theme-divider);
  gap: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 4px;
  background: var(--b3-theme-background);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;

  &:hover:not(:disabled) {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  span {
    font-size: 16px;
  }
}

.tool-group {
  display: flex;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--b3-theme-divider);
  margin: 0 4px;
}

.page-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;

  .page-input {
    width: 50px;
    padding: 4px 8px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 4px;
    background: var(--b3-theme-background);
    text-align: center;
    font-size: 12px;

    &:focus {
      border-color: var(--b3-theme-primary);
      outline: none;
    }
  }

  .page-total {
    color: var(--b3-theme-text-secondary);
  }
}

.zoom-group {
  display: flex;
  align-items: center;
  gap: 2px;

  .zoom-select {
    width: 80px;
    padding: 4px 8px;
    border: 1px solid var(--b3-theme-divider);
    border-radius: 4px;
    background: var(--b3-theme-background);
    font-size: 12px;
    cursor: pointer;

    &:focus {
      border-color: var(--b3-theme-primary);
      outline: none;
    }
  }
}

.progress-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;

  .progress-label {
    color: var(--b3-theme-text-secondary);
  }

  .progress-bar {
    width: 100px;
    height: 6px;
    background: var(--b3-theme-divider);
    border-radius: 3px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: var(--b3-theme-primary);
      transition: width 0.3s;
    }
  }

  .progress-text {
    min-width: 35px;
    text-align: right;
    color: var(--b3-theme-text-secondary);
  }
}

.dropdown {
  position: relative;

  .dropdown-toggle {
    width: 32px;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 1000;
    min-width: 160px;
    padding: 4px 0;
    margin-top: 4px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-divider);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: none;
  }

  &:hover .dropdown-menu {
    display: block;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    text-align: left;

    &:hover {
      background: var(--b3-theme-primary-light);
    }

    span {
      font-size: 14px;
    }
  }

  .dropdown-divider {
    margin: 4px 0;
    border: none;
    border-top: 1px solid var(--b3-theme-divider);
  }
}

/* 左侧边栏 */
.left-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 200px;
  height: calc(100% - 48px);
  background: var(--b3-theme-surface);
  border-right: 1px solid var(--b3-theme-divider);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 150;
  display: flex;
  flex-direction: column;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid var(--b3-theme-divider);

  .tab-btn {
    flex: 1;
    padding: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    transition: background 0.2s;

    &:hover {
      background: var(--b3-theme-surface-light);
    }

    &.active {
      background: var(--b3-theme-primary-light);
    }

    &.close-btn {
      font-size: 14px;
      color: var(--b3-theme-text-secondary);
    }
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

.bookmarks-list {
  padding: 8px;

  .empty-state {
    text-align: center;
    padding: 32px;
    color: var(--b3-theme-text-secondary);
    font-size: 13px;
  }

  .bookmark-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: var(--b3-theme-surface-light);
    }

    &.active {
      background: var(--b3-theme-primary-light);
    }

    .bookmark-icon {
      font-size: 14px;
    }

    .bookmark-title {
      flex: 1;
      font-size: 13px;
      color: var(--b3-theme-text);
    }

    .bookmark-delete {
      width: 20px;
      height: 20px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--b3-theme-text-secondary);
      cursor: pointer;
      font-size: 14px;

      &:hover {
        background: var(--b3-theme-danger-light);
        color: var(--b3-theme-danger);
      }
    }
  }
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

/* ======================================== 标注类型选择器 ======================================== */
.annotation-type-selector {
  display: flex;
  align-items: center;
  gap: 4px;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 4px;
  background: var(--b3-theme-background);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 12px;
  color: var(--b3-theme-on-surface);

  &:hover {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
  }

  .type-icon {
    font-size: 14px;
    font-weight: bold;
  }

  .type-label {
    white-space: nowrap;
  }
}

/* ======================================== 高亮颜色选择器 ======================================== */
.highlight-color-picker {
  display: flex;
  align-items: center;
  gap: 4px;
}

.color-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    transform: scale(1.15);
    border-color: rgba(0, 0, 0, 0.3);
  }

  &.active {
    border-color: var(--b3-theme-on-surface);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
    transform: scale(1.1);
  }
}

/* ======================================== 形状工具 ======================================== */
.toolbar-divider-vertical {
  width: 1px;
  height: 24px;
  background: var(--b3-theme-divider);
  margin: 0 8px;
}

.shape-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.shape-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--b3-theme-divider);
  border-radius: 4px;
  background: var(--b3-theme-background);
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--b3-theme-on-surface);

  &:hover {
    background: var(--b3-theme-primary-light);
    border-color: var(--b3-theme-primary);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--b3-theme-primary);
    color: white;
    border-color: var(--b3-theme-primary);
    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
  }

  svg {
    width: 18px;
    height: 18px;
  }
}

/* ======================================== 形状颜色选择器 ======================================== */
.shape-color-picker {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ======================================== 形状叠加层 ======================================== */
.pdf-shape-overlay {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
  z-index: 10;

  g {
    pointer-events: auto;

    &:hover {
      opacity: 0.9;
    }
  }
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--b3-border-color);
  margin: 0 8px;
}

.outline-item-title {
  font-size: 13px;
  color: var(--b3-theme-on-surface);
  line-height: 1.4;
}

.outline-children {
  width: 100%;
}

/* 连续滚动模式样式 */
.continuous-page-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  page-break-after: always;

  &:last-child {
    margin-bottom: 0;
  }
}

.continuous-page-canvas {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
}

.continuous-text-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.continuous-text-layer :deep(.textLayer) {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1;
}

.continuous-text-layer :deep(.textLayer > span) {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}

.continuous-highlight-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 6;
}

/* 连续滚动模式下的 PDF 内容包装器 */
.pdf-content-wrapper:has(.continuous-page-wrapper) {
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
