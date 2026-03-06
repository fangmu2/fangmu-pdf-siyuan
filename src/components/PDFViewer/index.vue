<!-- src/components/PDFViewer/index.vue -->
<template>
  <div
    ref="containerRef"
    class="pdf-viewer-container"
    tabindex="0"
    @keydown="handlePageKeyDown"
  >
    <!-- 加载提示 -->
    <div
      v-if="pdfLoader.loading"
      class="loading-overlay"
    >
      <div class="b3-spin"></div>
      <span>正在加载 PDF...</span>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="pdfLoader.error"
      class="error-overlay"
    >
      <span class="error-icon">⚠️</span>
      <span>{{ pdfLoader.error }}</span>
    </div>

    <!-- PDF 内容区域 -->
    <div class="pdf-content-wrapper">
      <!-- 右侧翻页区域 -->
      <div
        class="page-nav-area page-nav-right"
        title="下一页 (→)"
      >
        <div
          class="page-nav-btn"
          :class="{ visible: navigation.showRightNav }"
          @click="navigation.nextPage(totalPages.value)"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
          >
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </div>
      </div>

      <!-- PDF 渲染层容器 -->
      <div
        ref="pageContainerRef"
        class="pdf-page-container"
      >
        <!-- Canvas 渲染层 -->
        <PDFCanvas
          :page="currentPageObj"
          :scale="navigation.scale"
          :container-width="containerWidth"
          @rendered="handleCanvasRendered"
          @error="handleRenderError"
        />

        <!-- 文本选择层 -->
        <PDFTextLayer
          :page="currentPageObj"
          :viewport="renderer.currentViewport"
          @text-selected="handleTextSelected"
        />

        <!-- 高亮层 -->
        <PDFHighlightLayer
          :annotations="currentPageAnnotations"
          :selected-annotation="selection.selectedAnnotation"
          :viewport="renderer.currentViewport"
          :scale="navigation.scale"
          @annotation-click="handleAnnotationClick"
          @annotation-delete="handleAnnotationDelete"
        />

        <!-- 图片框选层 -->
        <div
          v-if="props.extractMode === 'image'"
          ref="imageSelectLayerRef"
          class="image-select-layer"
          @mousedown="startImageSelect"
          @mousemove="updateImageSelect"
          @mouseup="endImageSelect"
        ></div>

        <!-- 形状标注层 -->
        <PdfShapeOverlay
          v-if="currentPageShapes.length > 0 || toolbarValue.shapeTool"
          :shapes="currentPageShapes"
          :preview-shape="previewShape"
          :container-width="currentViewport?.width || 0"
          :container-height="currentViewport?.height || 0"
          :scale="navigation.scale"
          :css-page-height="currentViewport?.height || 0"
          :shape-tool="toolbarValue.shapeTool"
          :shape-color="toolbarValue.shapeColor"
          :shape-line-width="2"
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
    <div
      v-if="props.extractMode === 'image'"
      class="image-mode-hint"
    >
      📷 图片摘录模式 - 在 PDF 上框选区域截图
    </div>

    <!-- 顶部工具栏 -->
    <PDFViewerToolbar
      v-if="totalPages.value > 0"
      :current-page="navigation.currentPage"
      :total-pages="totalPages.value"
      :scale="navigation.scale"
      :view-mode="navigation.viewMode"
      :dark-mode="navigation.darkMode"
      :show-outline="showOutline"
      :show-thumbnails="showThumbnails"
      :show-bookmarks="showBookmarks"
      :progress="progress"
      @page-change="navigation.goToPage"
      @zoom-in="navigation.zoomIn"
      @zoom-out="navigation.zoomOut"
      @zoom-change="navigation.setZoom"
      @view-mode-change="navigation.setViewMode"
      @rotate="navigation.rotate"
      @toggle-outline="toggleOutline"
      @toggle-thumbnails="toggleThumbnails"
      @toggle-bookmarks="toggleBookmarks"
      @toggle-dark-mode="navigation.toggleDarkMode"
      @add-bookmark="addBookmark"
      @export-pdf="exportPdfData"
    />

    <!-- 底部工具栏 -->
    <PDFBottomBar
      v-if="totalPages.value > 0"
      v-model="toolbarValue"
      :current-page="navigation.currentPage"
      :total-pages="totalPages.value"
      :handwriting-visible="isHandwritingLayerVisible"
      @page-change="navigation.goToPage"
      @toggle-handwriting="toggleHandwritingLayer"
    />

    <!-- 左侧边栏：缩略图/书签 -->
    <div
      v-if="showThumbnails || showBookmarks"
      class="left-sidebar"
    >
      <div class="sidebar-tabs">
        <button
          class="tab-btn"
          :class="{ active: showThumbnails }"
          title="缩略图"
          @click="showThumbnails = true; showBookmarks = false;"
        >
          🖼️
        </button>
        <button
          class="tab-btn"
          :class="{ active: showBookmarks }"
          title="书签"
          @click="showBookmarks = true; showThumbnails = false;"
        >
          🔖
        </button>
        <button
          class="tab-btn close-btn"
          title="关闭"
          @click="showThumbnails = false; showBookmarks = false;"
        >
          ×
        </button>
      </div>
      <div class="sidebar-content">
        <PDFThumbnails
          v-if="showThumbnails && pdfLoader.pdfDoc"
          :pdf-document="pdfLoader.pdfDoc"
          :current-page="navigation.currentPage"
          scroll-mode="vertical"
          @page-click="navigation.goToPage"
        />
        <div
          v-if="showBookmarks"
          class="bookmarks-list"
        >
          <div
            v-if="bookmarks.length === 0"
            class="empty-state"
          >
            暂无书签
          </div>
          <div
            v-for="bookmark in bookmarks"
            :key="bookmark.id"
            class="bookmark-item"
            :class="{ active: navigation.currentPage === bookmark.pageNumber }"
            @click="navigation.goToPage(bookmark.pageNumber, totalPages.value)"
          >
            <span class="bookmark-icon">🔖</span>
            <span class="bookmark-title">{{ bookmark.title || `第${bookmark.pageNumber}页` }}</span>
            <button
              class="bookmark-delete"
              @click.stop="removeBookmark(bookmark.id)"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 目录侧边栏 -->
    <PDFOutlineSidebar
      :visible="showOutline"
      :outline="outline"
      :loading="outlineLoading"
      @close="showOutline = false"
      @navigate="handleOutlineNavigate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { PDFAnnotation, ShapeAnnotation, ExtractMode } from '@/types/annotation'
import { usePDFLoader } from '@/composables/usePDFLoader'
import { usePDFRenderer } from '@/composables/usePDFRenderer'
import { usePDFSelection } from '@/composables/usePDFSelection'
import { usePDFNavigation } from '@/composables/usePDFNavigation'
import PDFCanvas from './PDFCanvas.vue'
import PDFTextLayer from './PDFTextLayer.vue'
import PDFHighlightLayer from './PDFHighlightLayer.vue'
import PDFBottomBar from './PDFBottomBar.vue'
import PDFViewerToolbar from '../PDFViewerToolbar.vue'
import PDFOutlineSidebar from './PDFOutlineSidebar.vue'
import PDFThumbnails from '../PDFThumbnails.vue'
import PdfShapeOverlay from '../PdfShapeOverlay.vue'
import HandwritingLayer from '../HandwritingLayer.vue'

const props = defineProps<{
  pdfPath: string
  currentPage: number
  annotations?: PDFAnnotation[]
  highlightAnnotation?: PDFAnnotation | null
  extractMode?: ExtractMode
}>()

const emit = defineEmits<{
  (e: 'loaded', numPages: number): void
  (e: 'page-change', page: number): void
  (e: 'text-selected', data: {
    text: string
    page: number
    rect: [number, number, number, number] | null
    annotationType?: 'highlight' | 'underline' | 'strikethrough' | 'wavy'
    color?: string
  }): void
  (e: 'image-selected', data: {
    canvasRect: { x: number, y: number, width: number, height: number }
    pdfRect: [number, number, number, number]
    page: number
  }): void
  (e: 'annotation-delete', annotation: PDFAnnotation): void
  (e: 'annotation-click', annotation: PDFAnnotation): void
  (e: 'annotation-created', annotation: PDFAnnotation): void
  (e: 'shape-created', shape: ShapeAnnotation): void
}>()

// 使用 composables
const pdfLoader = usePDFLoader()
const renderer = usePDFRenderer()
const selection = usePDFSelection()
const navigation = usePDFNavigation(props.currentPage, 1.0)

// 引用
const containerRef = ref<HTMLElement>()
const pageContainerRef = ref<HTMLElement>()
const imageSelectLayerRef = ref<HTMLElement>()

// 状态
const containerWidth = ref(0)
const currentPageObj = ref<any>(null)
const currentViewport = ref<any>(null)
const showOutline = ref(false)
const showThumbnails = ref(false)
const showBookmarks = ref(false)
const outline = ref<any[]>([])
const outlineLoading = ref(false)
const bookmarks = ref<any[]>([])
const isHandwritingLayerEnabled = ref(false)
const isHandwritingLayerVisible = ref(false)
const previewShape = ref<ShapeAnnotation | null>(null)
const shapeAnnotations = ref<ShapeAnnotation[]>([])

// 工具栏值
const toolbarValue = ref({
  annotationType: 'highlight' as const,
  highlightColor: 'yellow',
  shapeTool: null as 'rectangle' | 'circle' | 'arrow' | null,
  shapeColor: '#ef4444',
})

// 计算属性
const totalPages = computed(() => pdfLoader.totalPages)
const progress = computed(() => navigation.calculateProgress(totalPages.value))

const currentPageAnnotations = computed(() => {
  if (!props.annotations) return []
  return props.annotations.filter((ann) => ann.page === props.currentPage)
})

const currentPageShapes = computed(() => {
  return shapeAnnotations.value.filter((shape) => shape.page === props.currentPage)
})

// PDF 加载
const loadPdf = async () => {
  const doc = await pdfLoader.loadPdf(props.pdfPath)
  if (doc) {
    emit('loaded', doc.numPages)
    await renderCurrentPage()
  }
}

// 渲染当前页
const renderCurrentPage = async (pageNum?: number) => {
  if (!pdfLoader.pdfDoc || !pageContainerRef.value) return

  const pageToRender = pageNum ?? navigation.currentPage
  currentPageObj.value = await pdfLoader.getPage(pageToRender)

  // 更新容器宽度
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth - 40
  }
}

// Canvas 渲染完成处理
const handleCanvasRendered = (viewport: any) => {
  currentViewport.value = viewport
}

// 渲染错误处理
const handleRenderError = (error: Error) => {
  console.error('[PDFViewer] 渲染错误:', error)
}

// 文本选择处理
const handleTextSelected = (data: { text: string, page: number, rect: [number, number, number, number] | null }) => {
  emit('text-selected', {
    ...data,
    annotationType: toolbarValue.value.annotationType,
    color: toolbarValue.value.highlightColor,
  })
}

// 标注点击处理
const handleAnnotationClick = (annotation: PDFAnnotation) => {
  selection.setSelectedAnnotation(annotation)
  emit('annotation-click', annotation)
}

// 标注删除处理
const handleAnnotationDelete = (annotation: PDFAnnotation) => {
  selection.setSelectedAnnotation(null)
  emit('annotation-delete', annotation)
}

// 形状工具相关
const setShapeTool = (tool: 'rectangle' | 'circle' | 'arrow' | null) => {
  toolbarValue.value.shapeTool = tool
}

const handleDrawingStart = (point: { x: number, y: number }) => {
  console.log('[PDFViewer] 开始绘制:', point)
}

const handleDrawingUpdate = (point: { x: number, y: number }) => {
  // 绘制中的实时更新
}

const handleDrawingEnd = () => {
  if (previewShape.value) {
    const isValid = validateShape(previewShape.value)
    if (isValid) {
      shapeAnnotations.value.push({ ...previewShape.value })
      emit('shape-created', previewShape.value)
    }
    previewShape.value = null
  }
}

const validateShape = (shape: ShapeAnnotation): boolean => {
  const minSize = 10
  if (shape.shapeType === 'rectangle' || shape.shapeType === 'circle') {
    return (shape.width || 0) >= minSize && (shape.height || 0) >= minSize
  } else if (shape.shapeType === 'arrow') {
    const dx = (shape.endX || 0) - (shape.startX || 0)
    const dy = (shape.endY || 0) - (shape.startY || 0)
    const length = Math.sqrt(dx * dx + dy * dy)
    return length >= minSize
  }
  return false
}

const handleShapeClick = (shape: ShapeAnnotation) => {
  handleShapeSelect(shape)
}

const handleShapeSelect = (shape: ShapeAnnotation | null) => {
  shapeAnnotations.value.forEach((s) => {
    s.isSelected = s.id === shape?.id
  })
}

const handleShapeMove = (shape: ShapeAnnotation, dx: number, dy: number) => {
  const pdfDx = dx / navigation.scale
  const pdfDy = -dy / navigation.scale

  if (shape.shapeType === 'rectangle' || shape.shapeType === 'circle') {
    if (shape.x !== undefined) shape.x += pdfDx
    if (shape.y !== undefined) shape.y += pdfDy
  } else if (shape.shapeType === 'arrow') {
    if (shape.startX !== undefined) shape.startX += pdfDx
    if (shape.startY !== undefined) shape.startY += pdfDy
    if (shape.endX !== undefined) shape.endX += pdfDx
    if (shape.endY !== undefined) shape.endY += pdfDy
  }
  shape.updated = Date.now()
}

const handleShapeResize = (shape: ShapeAnnotation, handleType: any, dx: number, dy: number) => {
  const pdfDx = dx / navigation.scale
  const pdfDy = -dy / navigation.scale
  const minSize = 10

  if (shape.shapeType === 'rectangle' || shape.shapeType === 'circle') {
    // 简化处理，实际需要完整实现
    shape.updated = Date.now()
  }
  shape.updated = Date.now()
}

// 图片框选
let isSelecting = false
let selectionStart = { x: 0, y: 0 }
let selectionDiv: HTMLDivElement | null = null
let lastImageSelectTime = 0

const startImageSelect = (e: MouseEvent) => {
  if (props.extractMode !== 'image' || !imageSelectLayerRef.value) return

  isSelecting = true
  const rect = imageSelectLayerRef.value.getBoundingClientRect()
  selectionStart = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }

  selectionDiv = document.createElement('div')
  selectionDiv.className = 'image-selection-box'
  selectionDiv.style.cssText = `
    position: absolute;
    border: 2px solid #1890ff;
    background: rgba(24, 144, 255, 0.2);
    pointer-events: none;
    z-index: 100;
    left: ${selectionStart.x}px;
    top: ${selectionStart.y}px;
    width: 0;
    height: 0;
  `
  imageSelectLayerRef.value.appendChild(selectionDiv)
}

const updateImageSelect = (e: MouseEvent) => {
  if (!isSelecting || !selectionDiv || !imageSelectLayerRef.value) return

  const rect = imageSelectLayerRef.value.getBoundingClientRect()
  const currentX = e.clientX - rect.left
  const currentY = e.clientY - rect.top

  const left = Math.min(selectionStart.x, currentX)
  const top = Math.min(selectionStart.y, currentY)
  const width = Math.abs(currentX - selectionStart.x)
  const height = Math.abs(currentY - selectionStart.y)

  selectionDiv.style.left = `${left}px`
  selectionDiv.style.top = `${top}px`
  selectionDiv.style.width = `${width}px`
  selectionDiv.style.height = `${height}px`
}

const endImageSelect = (e: MouseEvent) => {
  if (!isSelecting || !selectionDiv || !imageSelectLayerRef.value) return

  const now = Date.now()
  if (now - lastImageSelectTime < 500) {
    isSelecting = false
    selectionDiv.remove()
    selectionDiv = null
    return
  }
  lastImageSelectTime = now

  isSelecting = false

  const rect = imageSelectLayerRef.value.getBoundingClientRect()
  const currentX = e.clientX - rect.left
  const currentY = e.clientY - rect.top

  const left = Math.min(selectionStart.x, currentX)
  const top = Math.min(selectionStart.y, currentY)
  const width = Math.abs(currentX - selectionStart.x)
  const height = Math.abs(currentY - selectionStart.y)

  selectionDiv.remove()
  selectionDiv = null

  if (width < 10 || height < 10) return

  // 计算 PDF 坐标并触发事件
  if (currentPageObj.value && currentViewport.value) {
    const viewport = currentPageObj.value.getViewport({ scale: 1 })
    const pdfScale = viewport.width / (pageContainerRef.value?.clientWidth || 1)

    const pdfX1 = left * pdfScale
    const pdfY1 = viewport.height - (top + height) * pdfScale
    const pdfX2 = (left + width) * pdfScale
    const pdfY2 = viewport.height - top * pdfScale

    emit('image-selected', {
      canvasRect: { x: left, y: top, width, height },
      pdfRect: [pdfX1, pdfY1, pdfX2, pdfY2],
      page: navigation.currentPage,
    })
  }
}

// 目录导航
const handleOutlineNavigate = async (item: any) => {
  if (item.dest) {
    const pageNum = await pdfLoader.navigateToDestination(item.dest)
    if (pageNum) {
      navigation.goToPage(pageNum, totalPages.value, (page) => emit('page-change', page))
      showOutline.value = false
    }
  }
}

// 侧边栏控制
const toggleOutline = async () => {
  showOutline.value = !showOutline.value
  if (showOutline.value && outline.value.length === 0 && pdfLoader.pdfDoc) {
    outlineLoading.value = true
    outline.value = await pdfLoader.getOutline()
    outlineLoading.value = false
  }
}

const toggleThumbnails = () => {
  showThumbnails.value = !showThumbnails.value
  if (showThumbnails.value) {
    showBookmarks.value = false
    showOutline.value = false
  }
}

const toggleBookmarks = () => {
  showBookmarks.value = !showBookmarks.value
  if (showBookmarks.value) {
    showThumbnails.value = false
    showOutline.value = false
  }
}

// 书签功能
const addBookmark = () => {
  const bookmark = {
    id: `bookmark_${Date.now()}`,
    pageNumber: navigation.currentPage,
    title: `第${navigation.currentPage}页`,
    createdAt: Date.now(),
  }
  bookmarks.value.push(bookmark)
  bookmarks.value.sort((a, b) => a.pageNumber - b.pageNumber)
}

const removeBookmark = (id: string) => {
  bookmarks.value = bookmarks.value.filter((b) => b.id !== id)
}

// 导出功能
const exportPdfData = () => {
  const data = {
    pdfPath: props.pdfPath,
    currentPage: navigation.currentPage,
    bookmarks: bookmarks.value,
    annotations: props.annotations,
    exportedAt: Date.now(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pdf-data-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 手写图层控制
const toggleHandwritingLayer = () => {
  if (!isHandwritingLayerEnabled.value) {
    isHandwritingLayerEnabled.value = true
  }
  isHandwritingLayerVisible.value = !isHandwritingLayerVisible.value
}

const handleResetLearning = () => {
  console.log('Learning reset triggered')
}

// 键盘处理
const handlePageKeyDown = (e: KeyboardEvent) => {
  navigation.handlePageKeyDown(
    e,
    totalPages.value,
    (page) => emit('page-change', page),
    () => navigation.zoomIn(() => renderCurrentPage()),
    () => navigation.zoomOut(() => renderCurrentPage()),
  )
}

// 监听变化
watch(() => props.pdfPath, () => {
  loadPdf()
}, { immediate: true })

watch(() => props.currentPage, (newPage) => {
  navigation.syncExternalPage(newPage)
  renderCurrentPage()
})

watch(() => navigation.currentPage, (newPage, oldPage) => {
  if (newPage !== oldPage && pdfLoader.pdfDoc) {
    renderCurrentPage(newPage)
    emit('page-change', newPage)
  }
})

watch(() => props.annotations, () => {
  // 标注变化时自动重新渲染高亮层（由组件内部处理）
}, { deep: true })

onMounted(() => {
  loadPdf()
})

onBeforeUnmount(() => {
  pdfLoader.cleanup()
  renderer.cleanup()
  selection.cleanup()
  navigation.cleanup()
})
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

.page-nav-area {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
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

.pdf-page-container {
  position: relative;
  display: inline-block;
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

.image-selection-box {
  position: absolute;
  border: 2px solid #1890ff !important;
  background: rgba(24, 144, 255, 0.2) !important;
  pointer-events: none;
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
}

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
</style>
