<template>
  <div class="pdf-mindmap-link-viewer">
    <!-- 工具栏 -->
    <div class="link-viewer-toolbar">
      <div class="toolbar-section">
        <SyButton @click="toggleAutoSync" :active="autoSync">
          <SyIcon icon="sync" />
          自动同步
        </SyButton>
        <SyButton @click="syncNow" :disabled="isSyncing">
          <SyIcon icon="refresh" :spin="isSyncing" />
          立即同步
        </SyButton>
        <SyButton @click="toggleFullscreen" :active="isFullscreen">
          <SyIcon icon="fullscreen" />
          全屏
        </SyButton>
      </div>

      <div class="toolbar-section">
        <SyButton @click="showAnnotationPanel = !showAnnotationPanel" :active="showAnnotationPanel">
          <SyIcon icon="list" />
          标注列表
        </SyButton>
        <SyButton @click="clearAllMindMapNodes">
          <SyIcon icon="delete" />
          清空导图
        </SyButton>
      </div>
    </div>

    <!-- 主容器 -->
    <div class="link-viewer-container">
      <!-- 左侧 PDF 阅读器 -->
      <div class="pdf-panel">
        <PDFViewer
          ref="pdfViewerRef"
          :pdf-path="pdfPath"
          :current-page="currentPage"
          :annotations="pdfAnnotations"
          :extract-mode="extractMode"
          @page-change="handlePageChange"
          @text-selected="handleTextSelected"
          @image-selected="handleImageSelected"
          @annotation-created="handleAnnotationCreated"
        />
      </div>

      <!-- 分隔条 -->
      <div
        class="splitter"
        @mousedown="startResize"
        :class="{ 'resizing': isResizing }"
      >
        <div class="splitter-handle">
          <SyIcon icon="dragHandle" />
        </div>
      </div>

      <!-- 右侧思维导图 -->
      <div class="mindmap-panel" @dragenter="handleCanvasDragEnter" @dragover.prevent @drop="handleCanvasDrop">
        <FreeCanvasViewer
          v-if="mindMapStore.isLoaded"
          ref="mindMapRef"
          :study-set-id="studySetId"
          :show-toolbar="true"
          :show-controls="true"
          :show-grid="true"
          :show-links-panel="showLinksPanel"
          :show-pdf-linkage-panel="showPdfSettingsPanel"
          :pdf-path="pdfPath"
          @node-click="handleNodeClick"
          @node-create="handleNodeCreate"
          @change="handleMindMapChange"
        />
        <div v-else class="empty-state">
          <SyIcon icon="mindmap" size="48" />
          <p>正在加载思维导图...</p>
        </div>

        <!-- 链接图谱面板 -->
        <LinksGraphPanel
          v-model="showLinksPanel"
          :nodes="mindMapStore.nodes"
          :edges="mindMapStore.edges"
          @node-focus="handleNodeFocus"
          @link-create="handleLinkCreate"
        />

        <!-- PDF 联动配置面板 -->
        <PdfLinkageSettings
          v-model="showPdfSettingsPanel"
          :config="linkageConfig"
          :highlighted-nodes="highlightedNodes"
          :color-mappings="colorMappings"
          @config-change="handleConfigChange"
          @clear-highlights="clearAllHighlights"
        />
      </div>
    </div>

    <!-- 标注列表面板 -->
    <div
      v-if="showAnnotationPanel"
      class="annotation-panel"
      :class="{ 'collapsed': annotationPanelCollapsed }"
    >
      <div class="panel-header" @click="annotationPanelCollapsed = !annotationPanelCollapsed">
        <span>标注列表 ({{ annotations.length }})</span>
        <SyButton size="small" @click.stop="annotationPanelCollapsed = !annotationPanelCollapsed">
          <SyIcon :icon="annotationPanelCollapsed ? 'down' : 'up'" />
        </SyButton>
      </div>

      <!-- 快捷操作按钮 -->
      <div class="quick-actions">
        <SyButton
          size="small"
          :active="showLinksPanel"
          @click="showLinksPanel = !showLinksPanel"
          title="链接图谱"
        >
          <SyIcon icon="link" />
        </SyButton>
        <SyButton
          size="small"
          :active="showPdfSettingsPanel"
          @click="showPdfSettingsPanel = !showPdfSettingsPanel"
          title="PDF 联动设置"
        >
          <SyIcon icon="settings" />
        </SyButton>
      </div>

      <div v-if="!annotationPanelCollapsed" class="annotation-list">
        <div
          v-for="annotation in annotations"
          :key="annotation.id"
          class="annotation-item"
          :class="{ 'highlighted': highlightedAnnotationId === annotation.id }"
          @click="highlightAnnotation(annotation.id)"
        >
          <div class="annotation-color" :style="{ backgroundColor: annotation.color || '#fef3c7' }" />
          <div class="annotation-content">
            <div class="annotation-text">{{ annotation.text || '图片摘录' }}</div>
            <div class="annotation-meta">
              <span>第{{ annotation.page }}页</span>
              <span v-if="annotation.note">📝</span>
            </div>
          </div>
          <div class="annotation-actions">
            <SyButton
              size="small"
              @click.stop="addToMindMap(annotation)"
              title="添加到导图"
            >
              <SyIcon icon="add" />
            </SyButton>
            <SyButton
              size="small"
              variant="danger"
              @click.stop="deleteAnnotation(annotation.id)"
              title="删除"
            >
              <SyIcon icon="delete" />
            </SyButton>
          </div>
        </div>

        <div v-if="annotations.length === 0" class="empty-message">
          暂无标注，请在 PDF 中选择文本或图片创建标注
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PDFViewer from './PDFViewer.vue'
import FreeCanvasViewer from './MindMapFreeCanvas/FreeCanvasViewer.vue'
import LinksGraphPanel from './MindMapFreeCanvas/LinksGraphPanel.vue'
import PdfLinkageSettings from './MindMapFreeCanvas/PdfLinkageSettings.vue'
import SyButton from './SiyuanTheme/SyButton.vue'
import SyIcon from './SiyuanTheme/SyIcon.vue'
import { useFreeMindMapStore } from '@/stores/freeMindMapStore'
import { usePdfMindMapLinkage } from '@/composables/usePdfMindMapLinkage'
import { LearningSetService } from '@/services/learningSetService'
import type { FreeMindMapNode } from '@/types/mindmapFree'
import type { PDFAnnotation, ExtractMode } from '@/types/annotation'

// Props
interface Props {
  /** PDF 文档 ID */
  pdfDocId: string
  /** 学习集 ID */
  studySetId?: string
  /** 思维导图块 ID */
  mindMapBlockId?: string
}

const props = withDefaults(defineProps<Props>(), {
  studySetId: '',
  mindMapBlockId: ''
})

// Emits
const emit = defineEmits<{
  close: []
}>()

// Refs
const pdfViewerRef = ref<InstanceType<typeof PDFViewer> | null>(null)
const mindMapRef = ref<InstanceType<typeof FreeCanvasViewer> | null>(null)

// 状态
const autoSync = ref(true)
const isSyncing = ref(false)
const isFullscreen = ref(false)
const showAnnotationPanel = ref(true)
const annotationPanelCollapsed = ref(false)
const isResizing = ref(false)
const highlightedAnnotationId = ref<string | null>(null)

// PDF 相关状态
const pdfPath = ref('')
const currentPage = ref(1)
const extractMode = ref<ExtractMode>('text')
const pdfAnnotations = ref<PDFAnnotation[]>([])

// 标注列表
const annotations = ref<PDFAnnotation[]>([])

// Store
const mindMapStore = useFreeMindMapStore()

// 使用 PDF 联动组合式函数
const {
  config: linkageConfig,
  highlightedNodes,
  colorMappings,
  handlePdfTextSelection,
  handlePdfAnnotationCreated: handleLinkageAnnotationCreated,
  highlightNode,
  unhighlightNode,
  clearAllHighlights,
  setDragData,
  handleCanvasDragEnter,
  handleCanvasDrop
} = usePdfMindMapLinkage(mindMapStore)

// 计算属性
const splitPosition = ref(50)

// 面板显示状态
const showLinksPanel = ref(false)
const showPdfSettingsPanel = ref(false)

// 生命周期
onMounted(async () => {
  await loadAnnotations()
  setupEventListeners()
})

onUnmounted(() => {
  removeEventListeners()
})

// ==================== 标注管理 ====================

/**
 * 加载标注列表
 */
async function loadAnnotations(): Promise<void> {
  try {
    // 从当前学习集加载标注
    const currentSet = LearningSetService.getCurrentLearningSet()
    if (currentSet) {
      annotations.value = currentSet.annotations || []
      pdfAnnotations.value = annotations.value.filter(a => a.pdfPath)

      // 如果开启自动同步，将标注添加到思维导图
      if (autoSync.value) {
        await syncAnnotationsToMindMap(pdfAnnotations.value)
      }
    }
  } catch (error) {
    console.error('[PdfMindMapLinkViewer] 加载标注失败:', error)
  }
}

/**
 * 处理标注创建
 */
async function handleAnnotationCreated(annotation: PDFAnnotation): Promise<void> {
  annotations.value.push(annotation)
  pdfAnnotations.value.push(annotation)

  // 使用联动服务处理标注创建
  if (linkageConfig.value.enableRealtimeHighlight) {
    await handleLinkageAnnotationCreated(annotation)
  }

  // 自动添加到思维导图
  if (autoSync.value) {
    await addToMindMap(annotation)
  }
}

/**
 * 处理文本选择
 */
function handleTextSelected(data: { text: string; page: number; rect: [number, number, number, number] | null }): void {
  console.log('[PdfMindMapLinkViewer] 文本选择:', data)
  // 使用联动服务处理文本选择
  if (linkageConfig.value.enableDragToCreate) {
    handlePdfTextSelection(data)
  }
}

/**
 * 处理图片选择
 */
function handleImageSelected(data: {
  canvasRect: { x: number; y: number; width: number; height: number }
  pdfRect: [number, number, number, number]
  page: number
}): void {
  console.log('[PdfMindMapLinkViewer] 图片选择:', data)
}

/**
 * 高亮标注
 */
function highlightAnnotation(annotationId: string): void {
  highlightedAnnotationId.value = annotationId
}

/**
 * 删除标注
 */
async function deleteAnnotation(annotationId: string): Promise<void> {
  try {
    annotations.value = annotations.value.filter(a => a.id !== annotationId)
    pdfAnnotations.value = pdfAnnotations.value.filter(a => a.id !== annotationId)

    // 从思维导图中删除对应节点
    const node = mindMapStore.nodes.find(n => n.data.annotationId === annotationId)
    if (node) {
      mindMapStore.removeNode(node.id)
      unhighlightNode(node.id)
    }
  } catch (error) {
    console.error('[PdfMindMapLinkViewer] 删除标注失败:', error)
  }
}

// ==================== 思维导图同步 ====================

/**
 * 同步标注到思维导图
 */
async function syncAnnotationsToMindMap(annotationsToSync: PDFAnnotation[]): Promise<void> {
  isSyncing.value = true

  try {
    // 获取当前思维导图已有节点
    const existingAnnotationIds = new Set(
      mindMapStore.nodes
        .filter(n => n.data.annotationId)
        .map(n => n.data.annotationId as string)
    )

    // 添加新标注
    for (const annotation of annotationsToSync) {
      if (!existingAnnotationIds.has(annotation.id)) {
        await addAnnotationToMindMap(annotation)
      }
    }
  } catch (error) {
    console.error('[PdfMindMapLinkViewer] 同步标注失败:', error)
  } finally {
    isSyncing.value = false
  }
}

/**
 * 添加标注到思维导图
 */
async function addToMindMap(annotation: PDFAnnotation): Promise<void> {
  // 检查是否已存在
  const existingNode = mindMapStore.nodes.find(n => n.data.annotationId === annotation.id)
  if (existingNode) {
    console.log('[PdfMindMapLinkViewer] 标注已在导图中:', annotation.id)
    return
  }

  await addAnnotationToMindMap(annotation)
}

/**
 * 内部方法：添加标注到思维导图
 */
async function addAnnotationToMindMap(annotation: PDFAnnotation): Promise<void> {
  try {
    // 计算节点位置（避免重叠）
    const existingNodes = mindMapStore.nodes
    const offsetY = existingNodes.length * 120
    const position = {
      x: 100 + (existingNodes.length % 5) * 20,
      y: 100 + offsetY
    }

    // 创建节点
    mindMapStore.createNode({
      type: annotation.text ? 'textCard' : 'imageCard',
      title: annotation.text?.substring(0, 50) || '图片摘录',
      content: annotation.note || '',
      position,
      annotationId: annotation.id,
      page: annotation.page
    })

    console.log('[PdfMindMapLinkViewer] 已添加标注到导图:', annotation.id)
  } catch (error) {
    console.error('[PdfMindMapLinkViewer] 添加标注到导图失败:', error)
  }
}

/**
 * 立即同步
 */
async function syncNow(): Promise<void> {
  await loadAnnotations()
}

/**
 * 切换自动同步
 */
function toggleAutoSync(): void {
  autoSync.value = !autoSync.value
  if (autoSync.value) {
    syncNow()
  }
}

/**
 * 清空所有导图节点
 */
function clearAllMindMapNodes(): void {
  if (confirm('确定要清空思维导图中所有节点吗？标注数据不会被删除。')) {
    mindMapStore.clearAllNodes()
    clearAllHighlights()
  }
}

// ==================== 事件处理 ====================

/**
 * 节点点击 - 跳转到 PDF 位置
 */
async function handleNodeClick(node: FreeMindMapNode): Promise<void> {
  if (node.data.annotationId && pdfViewerRef.value) {
    // 高亮标注
    highlightedAnnotationId.value = node.data.annotationId as string
    // 使用联动服务高亮节点
    if (linkageConfig.value.enableRealtimeHighlight) {
      highlightNode(node.id, '#409eff', 'manual')
    }
    // TODO: 实现跳转到 PDF 位置
  }
}

/**
 * 节点创建（拖拽创建）
 */
function handleNodeCreate(params: {
  title: string
  content: string
  type: 'textCard' | 'imageCard'
  position: { x: number; y: number }
  annotationId?: string
}): void {
  console.log('[PdfMindMapLinkViewer] 节点创建:', params)
  // 节点已由 FreeCanvasViewer 内部创建
}

/**
 * 节点聚焦（一键跳转）
 */
function handleNodeFocus(nodeId: string): void {
  const node = mindMapStore.nodes.find(n => n.id === nodeId)
  if (node && node.data.annotationId) {
    highlightAnnotation(node.data.annotationId as string)
  }
}

/**
 * 链接创建
 */
function handleLinkCreate(data: { sourceNodeId: string; targetNodeId: string; linkType: string }): void {
  console.log('[PdfMindMapLinkViewer] 链接创建:', data)
}

/**
 * 配置变更
 */
function handleConfigChange(newConfig: typeof linkageConfig.value): void {
  console.log('[PdfMindMapLinkViewer] 配置变更:', newConfig)
}

/**
 * 思维导图变更
 */
function handleMindMapChange(data: { nodes: FreeMindMapNode[]; edges: FreeMindMapNode[] }): void {
  console.log('[PdfMindMapLinkViewer] 导图变更:', data)
}

/**
 * 页码变更
 */
function handlePageChange(page: number): void {
  currentPage.value = page
}

// ==================== 分隔条拖拽 ====================

function startResize(): void {
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(e: MouseEvent): void {
  if (!isResizing.value) return

  const container = document.querySelector('.link-viewer-container') as HTMLElement
  if (!container) return

  const rect = container.getBoundingClientRect()
  const percentage = ((e.clientX - rect.left) / rect.width) * 100

  if (percentage >= 30 && percentage <= 70) {
    splitPosition.value = percentage
    container.style.setProperty('--split-position', `${percentage}%`)
  }
}

function stopResize(): void {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// ==================== 全屏 ====================

function toggleFullscreen(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// ==================== 事件监听 ====================

function setupEventListeners(): void {
  // 监听全屏变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
}

function removeEventListeners(): void {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
}

function handleFullscreenChange(): void {
  isFullscreen.value = !!document.fullscreenElement
}

// 暴露方法给父组件
defineExpose({
  syncNow,
  highlightAnnotation,
  addToMindMap
})
</script>

<style scoped lang="scss">
.pdf-mindmap-link-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--b3-theme-background);
  overflow: hidden;
}

/* 工具栏 */
.link-viewer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);

  .toolbar-section {
    display: flex;
    gap: 8px;
  }
}

/* 主容器 */
.link-viewer-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  --split-position: 50%;

  .pdf-panel {
    width: var(--split-position, 50%);
    overflow: hidden;
  }

  .splitter {
    width: 8px;
    background: var(--b3-border-color);
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;

    &:hover, &.resizing {
      background: var(--b3-theme-primary);
    }

    .splitter-handle {
      opacity: 0.5;
      color: var(--b3-theme-on-surface);
    }
  }

  .mindmap-panel {
    flex: 1;
    overflow: hidden;
    min-width: 300px;
    position: relative;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--b3-theme-placeholder);
      gap: 12px;
    }
  }
}

/* 标注列表面板 */
.annotation-panel {
  position: absolute;
  top: 0;
  left: var(--split-position, 50%);
  width: 280px;
  height: 100%;
  background: var(--b3-theme-surface);
  border-left: 1px solid var(--b3-border-color);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  transition: transform 0.3s ease;

  &.collapsed {
    transform: translateX(calc(-100% + 40px));

    .panel-header {
      writing-mode: vertical-rl;
      padding: 12px 8px;
    }

    .annotation-list {
      display: none;
    }
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid var(--b3-border-color);
    background: var(--b3-theme-surface-hover);
    cursor: pointer;
    font-weight: 500;
  }

  /* 快捷操作按钮 */
  .quick-actions {
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--b3-border-color);
    background: var(--b3-theme-surface-light);
  }

  .annotation-list {
    height: calc(100% - 90px);
    overflow-y: auto;
    padding: 8px;

    .annotation-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: var(--b3-theme-surface-hover);
      }

      &.highlighted {
        background: var(--b3-theme-primary-light);
      }

      .annotation-color {
        width: 4px;
        min-height: 40px;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .annotation-content {
        flex: 1;
        min-width: 0;

        .annotation-text {
          font-size: 13px;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .annotation-meta {
          display: flex;
          gap: 8px;
          margin-top: 4px;
          font-size: 11px;
          color: var(--b3-theme-secondary-text);
        }
      }

      .annotation-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      &:hover .annotation-actions {
        opacity: 1;
      }
    }

    .empty-message {
      text-align: center;
      color: var(--b3-theme-placeholder);
      padding: 20px;
      font-size: 13px;
    }
  }
}
</style>
