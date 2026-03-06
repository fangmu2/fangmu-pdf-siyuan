/**
 * PDF 与思维导图联动组合式函数
 * @fileoverview 提供实时高亮同步、拖拽创建节点、智能布局建议、标注颜色映射等功能的 Vue 3 组合式 API
 */

import type { Ref } from 'vue'
import type { DragData } from '@/services/pdfMindMapLinkageService'
import type { Annotation } from '@/types/annotation'
import type {
  AnnotationColorMapping,
  CreateNodeParams,
  FreeMindMapEdge,
  FreeMindMapNode,
  HighlightState,
  LayoutSuggestion,
  PdfLinkageConfig,
} from '@/types/mindmapFree'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'
import {
  applyLayoutSuggestion,
  cancelPendingSync,
  clearAllHighlights,
  clearColorMapping,
  createColorMapping,

  flushSync,
  generateSmartLayoutSuggestions,
  getColorMapping,
  getNodeStyleFromAnnotation,
  getPdfLinkageConfig,
  handleCanvasDragEnter,
  handleCanvasDrop,
  handlePdfAnnotationCreated,
  handlePdfTextSelection,
  highlightNode as highlightNodeService,
  queueSync,
  resetPdfLinkageConfig,
  setDragData as setDragDataService,
  unhighlightNode,
  updatePdfLinkageConfig as updateConfig,
} from '@/services/pdfMindMapLinkageService'

export interface UsePdfMindMapLinkageOptions {
  /** 是否启用联动功能 */
  enabled?: boolean
  /** 节点列表引用 */
  nodes?: Ref<FreeMindMapNode[]>
  /** 连线列表引用 */
  edges?: Ref<FreeMindMapEdge[]>
  /** 初始配置 */
  initialConfig?: Partial<PdfLinkageConfig>
}

export interface UsePdfMindMapLinkageReturn {
  // 配置管理
  config: ComputedRef<PdfLinkageConfig>
  updateConfig: (newConfig: Partial<PdfLinkageConfig>) => void
  resetConfig: () => void

  // 实时高亮同步
  highlightedNodes: Ref<Map<string, HighlightState>>
  handleTextSelection: (
    selection: string,
    pageNumber: number,
    rect: { x: number, y: number, width: number, height: number },
  ) => void
  handleAnnotationCreated: (annotation: Annotation) => { exists: boolean, nodeId?: string }
  highlightNode: (nodeId: string, color?: string, reason?: HighlightState['reason']) => void
  unhighlightNode: (nodeId: string) => void
  clearHighlights: () => void

  // 拖拽创建节点
  handleDragStart: (event: DragEvent, data: DragData) => void
  handleDragEnter: (event: DragEvent) => boolean
  handleDrop: (
    event: DragEvent,
    canvasX: number,
    canvasY: number,
  ) => CreateNodeParams | null

  // 智能布局建议
  layoutSuggestions: Ref<LayoutSuggestion[]>
  refreshLayoutSuggestions: (annotations?: Annotation[]) => void
  applySuggestion: (suggestion: LayoutSuggestion) => { nodeId: string, x: number, y: number }[]

  // 标注颜色映射
  colorMappings: Ref<Map<string, AnnotationColorMapping>>
  createColorMapping: (
    annotationId: string,
    annotationColor: string,
    nodeId: string,
    autoSync?: boolean,
  ) => AnnotationColorMapping
  getColorMapping: (annotationId: string) => AnnotationColorMapping | undefined
  getNodeStyle: (annotation: Annotation, nodeId: string) => { borderColor: string, backgroundColor?: string } | null
  clearColorMappings: (annotationId?: string) => void

  // 自动同步
  queueSync: (annotation: Annotation, action: 'create' | 'update' | 'delete') => void
  flushSync: () => void
  cancelSync: () => void

  // 事件监听器管理
  setupEventListeners: () => void
  cleanupEventListeners: () => void
}

/**
 * PDF 与思维导图联动组合式函数
 */
export function usePdfMindMapLinkage(
  options: UsePdfMindMapLinkageOptions = {},
): UsePdfMindMapLinkageReturn {
  const {
    enabled = true,
    nodes,
    edges,
    initialConfig,
  } = options

  // 初始化配置
  if (initialConfig && enabled) {
    updateConfig(initialConfig)
  }

  // ==================== 配置管理 ====================

  const config = computed(() => getPdfLinkageConfig())

  function updateConfigWrapper(newConfig: Partial<PdfLinkageConfig>): void {
    if (enabled) {
      updateConfig(newConfig)
    }
  }

  function resetConfigWrapper(): void {
    if (enabled) {
      resetPdfLinkageConfig()
    }
  }

  // ==================== 实时高亮同步 ====================

  const highlightedNodes = ref<Map<string, HighlightState>>(new Map())

  /**
   * 处理文本选中
   */
  function handleTextSelection(
    selection: string,
    pageNumber: number,
    rect: { x: number, y: number, width: number, height: number },
  ): void {
    if (!enabled) return
    handlePdfTextSelection(selection, pageNumber, rect)
  }

  /**
   * 处理标注创建
   */
  function handleAnnotationCreated(annotation: Annotation): { exists: boolean, nodeId?: string } {
    if (!enabled || !nodes) {
      return { exists: false }
    }

    const result = handlePdfAnnotationCreated(annotation, nodes.value, edges?.value || [])

    if (result.exists && result.nodeId) {
      // 更新高亮状态
      const state: HighlightState = {
        nodeId: result.nodeId,
        isHighlighted: true,
        color: '#409eff',
        reason: 'pdf-annotation',
        startTime: Date.now(),
      }
      highlightedNodes.value.set(result.nodeId, state)
    }

    return result
  }

  /**
   * 高亮节点
   */
  function highlightNode(
    nodeId: string,
    color: string = '#409eff',
    reason: HighlightState['reason'] = 'manual',
  ): void {
    if (!enabled) return

    highlightNodeService(nodeId, reason, color)

    const state: HighlightState = {
      nodeId,
      isHighlighted: true,
      color,
      reason,
      startTime: Date.now(),
    }
    highlightedNodes.value.set(nodeId, state)
  }

  /**
   * 取消节点高亮
   */
  function unhighlightNodeWrapper(nodeId: string): void {
    if (!enabled) return

    unhighlightNode(nodeId)
    highlightedNodes.value.delete(nodeId)
  }

  /**
   * 清除所有高亮
   */
  function clearHighlightsWrapper(): void {
    if (!enabled) return

    clearAllHighlights()
    highlightedNodes.value.clear()
  }

  // ==================== 拖拽创建节点 ====================

  /**
   * 处理拖拽开始
   */
  function handleDragStart(event: DragEvent, data: DragData): void {
    if (!enabled || !config.value.enableDragToCreate) return
    setDragDataService(event, data)
  }

  /**
   * 处理拖拽进入
   */
  function handleDragEnterWrapper(event: DragEvent): boolean {
    if (!enabled || !config.value.enableDragToCreate) return false
    return handleCanvasDragEnter(event)
  }

  /**
   * 处理拖拽放置
   */
  function handleDropWrapper(
    event: DragEvent,
    canvasX: number,
    canvasY: number,
  ): CreateNodeParams | null {
    if (!enabled || !config.value.enableDragToCreate) return null
    return handleCanvasDrop(event, canvasX, canvasY)
  }

  // ==================== 智能布局建议 ====================

  const layoutSuggestions = ref<LayoutSuggestion[]>([])

  /**
   * 刷新布局建议
   */
  function refreshLayoutSuggestions(annotations?: Annotation[]): void {
    if (!enabled || !config.value.enableSmartLayout || !nodes || !edges) return

    layoutSuggestions.value = generateSmartLayoutSuggestions(
      nodes.value,
      edges.value,
      annotations,
    )
  }

  /**
   * 应用布局建议
   */
  function applySuggestionWrapper(suggestion: LayoutSuggestion): { nodeId: string, x: number, y: number }[] {
    if (!nodes) return []
    return applyLayoutSuggestion(suggestion, nodes.value)
  }

  // ==================== 标注颜色映射 ====================

  const colorMappings = ref<Map<string, AnnotationColorMapping>>(new Map())

  /**
   * 创建颜色映射
   */
  function createColorMappingWrapper(
    annotationId: string,
    annotationColor: string,
    nodeId: string,
    autoSync: boolean = true,
  ): AnnotationColorMapping {
    const mapping = createColorMapping(annotationId, annotationColor, nodeId, autoSync)
    colorMappings.value.set(annotationId, mapping)
    return mapping
  }

  /**
   * 获取颜色映射
   */
  function getColorMappingWrapper(annotationId: string): AnnotationColorMapping | undefined {
    return getColorMapping(annotationId)
  }

  /**
   * 获取节点样式
   */
  function getNodeStyleWrapper(
    annotation: Annotation,
    nodeId: string,
  ): { borderColor: string, backgroundColor?: string } | null {
    if (!enabled || !config.value.enableColorMapping) return null

    const style = getNodeStyleFromAnnotation(annotation, nodeId)
    if (style) {
      // 更新缓存
      const mapping = getColorMapping(annotation.id)
      if (mapping) {
        colorMappings.value.set(annotation.id, mapping)
      }
    }
    return style
  }

  /**
   * 清除颜色映射
   */
  function clearColorMappingsWrapper(annotationId?: string): void {
    if (!enabled) return

    clearColorMapping(annotationId)
    if (annotationId) {
      colorMappings.value.delete(annotationId)
    } else {
      colorMappings.value.clear()
    }
  }

  // ==================== 自动同步 ====================

  function queueSyncWrapper(annotation: Annotation, action: 'create' | 'update' | 'delete'): void {
    if (!enabled || !config.value.enableAutoSyncEnhanced) return
    queueSync(annotation, action)
  }

  function flushSyncWrapper(): void {
    if (!enabled) return
    flushSync()
  }

  function cancelSyncWrapper(): void {
    if (!enabled) return
    cancelPendingSync()
  }

  // ==================== 事件监听器管理 ====================

  /**
   * 处理高亮事件
   */
  function handleHighlightEvent(event: Event): void {
    const customEvent = event as CustomEvent<{
      nodeId: string
      isHighlighted: boolean
      color?: string
      reason?: HighlightState['reason']
    }>

    const {
      nodeId,
      isHighlighted,
      color,
      reason,
    } = customEvent.detail

    if (isHighlighted) {
      const state: HighlightState = {
        nodeId,
        isHighlighted: true,
        color: color || '#409eff',
        reason: reason || 'manual',
        startTime: Date.now(),
      }
      highlightedNodes.value.set(nodeId, state)
    } else {
      highlightedNodes.value.delete(nodeId)
    }
  }

  /**
   * 处理清除高亮事件
   */
  function handleClearHighlightsEvent(): void {
    highlightedNodes.value.clear()
  }

  /**
   * 处理批量同步事件
   */
  function handleBatchSyncEvent(event: Event): void {
    const customEvent = event as CustomEvent<{
      operations: Array<{
        annotation: Annotation
        action: 'create' | 'update' | 'delete'
        timestamp: number
      }>
      timestamp: number
    }>

    // 这里可以触发自定义逻辑
    console.log('[usePdfMindMapLinkage] 批量同步:', customEvent.detail.operations.length, '个操作')
  }

  /**
   * 设置事件监听器
   */
  function setupEventListeners(): void {
    if (!enabled) return

    window.addEventListener('mindmap-node-highlight', handleHighlightEvent as EventListener)
    window.addEventListener('mindmap-clear-highlights', handleClearHighlightsEvent as EventListener)
    window.addEventListener('mindmap-batch-sync', handleBatchSyncEvent as EventListener)
  }

  /**
   * 清理事件监听器
   */
  function cleanupEventListeners(): void {
    window.removeEventListener('mindmap-node-highlight', handleHighlightEvent as EventListener)
    window.removeEventListener('mindmap-clear-highlights', handleClearHighlightsEvent)
    window.removeEventListener('mindmap-batch-sync', handleBatchSyncEvent as EventListener)
  }

  // ==================== 生命周期 ====================

  onMounted(() => {
    if (enabled) {
      setupEventListeners()
    }
  })

  onUnmounted(() => {
    cleanupEventListeners()
    cancelSyncWrapper()
  })

  // ==================== 返回 ====================

  return {
    // 配置管理
    config,
    updateConfig: updateConfigWrapper,
    resetConfig: resetConfigWrapper,

    // 实时高亮同步
    highlightedNodes,
    handleTextSelection,
    handleAnnotationCreated,
    highlightNode,
    unhighlightNode: unhighlightNodeWrapper,
    clearHighlights: clearHighlightsWrapper,

    // 拖拽创建节点
    handleDragStart,
    handleDragEnter: handleDragEnterWrapper,
    handleDrop: handleDropWrapper,

    // 智能布局建议
    layoutSuggestions,
    refreshLayoutSuggestions,
    applySuggestion: applySuggestionWrapper,

    // 标注颜色映射
    colorMappings,
    createColorMapping: createColorMappingWrapper,
    getColorMapping: getColorMappingWrapper,
    getNodeStyle: getNodeStyleWrapper,
    clearColorMappings: clearColorMappingsWrapper,

    // 自动同步
    queueSync: queueSyncWrapper,
    flushSync: flushSyncWrapper,
    cancelSync: cancelSyncWrapper,

    // 事件监听器管理
    setupEventListeners,
    cleanupEventListeners,
  }
}

export default usePdfMindMapLinkage
