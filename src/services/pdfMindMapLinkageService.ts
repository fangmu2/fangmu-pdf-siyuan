/**
 * PDF 与思维导图联动服务
 * @fileoverview 提供实时高亮同步、拖拽创建节点、智能布局建议、标注颜色映射等功能
 */

import type {
  FreeMindMapNode,
  FreeMindMapEdge,
  HighlightState,
  PdfLinkageConfig,
  AnnotationColorMapping,
  CreateNodeParams,
  LayoutSuggestion
} from '@/types/mindmapFree'
import type { Annotation } from '@/types/annotation'
import { generateLayoutSuggestions } from './mindmapLinkEnhanceService'

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

/**
 * 获取当前时间戳
 */
function now(): number {
  return Date.now()
}

// ==================== PDF 联动配置管理 ====================

/**
 * 默认联动配置
 */
const DEFAULT_LINKAGE_CONFIG: PdfLinkageConfig = {
  enableRealtimeHighlight: true,
  enableDragToCreate: true,
  enableSmartLayout: true,
  enableColorMapping: true,
  enableAutoSyncEnhanced: true,
  autoSyncDelay: 300,
  batchSyncThreshold: 5
}

let currentConfig: PdfLinkageConfig = { ...DEFAULT_LINKAGE_CONFIG }

/**
 * 获取联动配置
 */
export function getPdfLinkageConfig(): PdfLinkageConfig {
  return { ...currentConfig }
}

/**
 * 更新联动配置
 * @param config 配置更新
 */
export function updatePdfLinkageConfig(config: Partial<PdfLinkageConfig>): void {
  currentConfig = { ...currentConfig, ...config }
}

/**
 * 重置联动配置
 */
export function resetPdfLinkageConfig(): void {
  currentConfig = { ...DEFAULT_LINKAGE_CONFIG }
}

// ==================== 实时高亮同步 ====================

/**
 * 当前高亮状态列表
 */
const highlightStates: Map<string, HighlightState> = new Map()

/**
 * PDF 选中文本事件处理
 * @param selection 选中的文本内容
 * @param pageNumber 页码
 * @param rect 选中区域坐标
 * @param callback 回调函数，用于创建节点
 */
export function handlePdfTextSelection(
  selection: string,
  pageNumber: number,
  rect: { x: number; y: number; width: number; height: number },
  callback?: (node: FreeMindMapNode) => void
): void {
  if (!currentConfig.enableRealtimeHighlight) return

  console.log('[PDF Linkage] 文本选中:', { selection, pageNumber, rect })

  // 触发高亮效果（由组件处理）
  dispatchHighlightEvent('pdf-selection', selection)
}

/**
 * PDF 标注创建事件处理
 * @param annotation 标注信息
 * @param nodes 现有节点列表
 * @param edges 现有连线列表
 * @returns 是否已存在关联节点
 */
export function handlePdfAnnotationCreated(
  annotation: Annotation,
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[]
): { exists: boolean; nodeId?: string } {
  if (!currentConfig.enableRealtimeHighlight) {
    return { exists: false }
  }

  // 检查是否已存在关联节点
  const existingNode = nodes.find(n => n.data.annotationId === annotation.id)

  if (existingNode) {
    // 高亮现有节点
    highlightNode(existingNode.id, 'pdf-annotation')
    return { exists: true, nodeId: existingNode.id }
  }

  // 触发高亮效果（提示用户可创建新节点）
  dispatchHighlightEvent('pdf-annotation', annotation.content)

  return { exists: false }
}

/**
 * 高亮思维导图节点
 * @param nodeId 节点 ID
 * @param reason 高亮原因
 * @param color 高亮颜色
 */
export function highlightNode(
  nodeId: string,
  reason: HighlightState['reason'] = 'manual',
  color: string = '#409eff'
): void {
  const state: HighlightState = {
    nodeId,
    isHighlighted: true,
    color,
    reason,
    startTime: now()
  }

  highlightStates.set(nodeId, state)

  // 触发自定义事件
  const event = new CustomEvent('mindmap-node-highlight', {
    detail: { nodeId, isHighlighted: true, color, reason }
  })
  window.dispatchEvent(event)
}

/**
 * 取消节点高亮
 * @param nodeId 节点 ID
 */
export function unhighlightNode(nodeId: string): void {
  highlightStates.delete(nodeId)

  const event = new CustomEvent('mindmap-node-highlight', {
    detail: { nodeId, isHighlighted: false }
  })
  window.dispatchEvent(event)
}

/**
 * 清除所有高亮
 */
export function clearAllHighlights(): void {
  const nodeIds = Array.from(highlightStates.keys())
  highlightStates.clear()

  const event = new CustomEvent('mindmap-clear-highlights', {
    detail: { nodeIds }
  })
  window.dispatchEvent(event)
}

/**
 * 获取当前高亮状态
 * @param nodeId 节点 ID
 */
export function getHighlightState(nodeId: string): HighlightState | undefined {
  return highlightStates.get(nodeId)
}

/**
 * 分发高亮事件
 */
function dispatchHighlightEvent(reason: HighlightState['reason'], content: string): void {
  const event = new CustomEvent('pdf-mindmap-highlight-request', {
    detail: { reason, content, timestamp: now() }
  })
  window.dispatchEvent(event)
}

// ==================== 拖拽创建节点 ====================

/**
 * 拖拽数据类型
 */
export interface DragData {
  type: 'pdf-text' | 'pdf-image' | 'annotation'
  content: string
  pageNumber: number
  rect?: { x: number; y: number; width: number; height: number }
  imageUrl?: string
  annotationId?: string
  color?: string
}

/**
 * 设置拖拽数据
 * @param event DragEvent
 * @param data 拖拽数据
 */
export function setDragData(event: DragEvent, data: DragData): void {
  if (!currentConfig.enableDragToCreate) return

  event.dataTransfer?.setData('application/x-mindmap-drag', JSON.stringify(data))
  event.dataTransfer!.effectAllowed = 'copy'

  // 设置拖拽预览
  const dragImage = createDragImage(data)
  if (dragImage) {
    event.dataTransfer?.setDragImage(dragImage, 20, 20)
  }
}

/**
 * 处理画布拖拽进入
 * @param event DragEvent
 */
export function handleCanvasDragEnter(event: DragEvent): boolean {
  if (!currentConfig.enableDragToCreate) return false

  const types = event.dataTransfer?.types || []
  return types.includes('application/x-mindmap-drag')
}

/**
 * 处理画布拖拽放置
 * @param event DragEvent
 * @param canvasX 画布 X 坐标
 * @param canvasY 画布 Y 坐标
 * @returns 创建的节点参数或 null
 */
export function handleCanvasDrop(
  event: DragEvent,
  canvasX: number,
  canvasY: number
): CreateNodeParams | null {
  if (!currentConfig.enableDragToCreate) return null

  const dragDataStr = event.dataTransfer?.getData('application/x-mindmap-drag')
  if (!dragDataStr) return null

  try {
    const dragData: DragData = JSON.parse(dragDataStr)

    // 根据拖拽类型创建节点
    if (dragData.type === 'pdf-text') {
      return {
        type: 'textCard',
        title: dragData.content.substring(0, 50) + (dragData.content.length > 50 ? '...' : ''),
        content: dragData.content,
        position: { x: canvasX, y: canvasY },
        annotationId: dragData.annotationId
      }
    }

    if (dragData.type === 'pdf-image' && dragData.imageUrl) {
      return {
        type: 'imageCard',
        title: `第 ${dragData.pageNumber} 页摘录`,
        content: dragData.content,
        position: { x: canvasX, y: canvasY },
        annotationId: dragData.annotationId,
        cardId: generateId()
      }
    }

    if (dragData.type === 'annotation') {
      return {
        type: dragData.imageUrl ? 'imageCard' : 'textCard',
        title: dragData.content.substring(0, 50) + (dragData.content.length > 50 ? '...' : ''),
        content: dragData.content,
        position: { x: canvasX, y: canvasY },
        annotationId: dragData.annotationId,
        imageUrl: dragData.imageUrl
      }
    }

    return null
  } catch (error) {
    console.error('[PDF Linkage] 解析拖拽数据失败:', error)
    return null
  }
}

/**
 * 创建拖拽预览图片
 */
function createDragImage(data: DragData): HTMLDivElement | null {
  const div = document.createElement('div')
  div.style.cssText = `
    padding: 8px 12px;
    background: #fff;
    border: 1px solid #409eff;
    border-radius: 4px;
    font-size: 12px;
    max-width: 200px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  `
  div.textContent = data.content.substring(0, 100) + (data.content.length > 100 ? '...' : '')
  return div
}

// ==================== 智能布局建议 ====================

/**
 * 分析节点并生成布局建议（带 PDF 上下文）
 * @param nodes 节点列表
 * @param edges 连线列表
 * @param pdfAnnotations PDF 标注列表
 * @returns 布局建议列表
 */
export function generateSmartLayoutSuggestions(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
  pdfAnnotations?: Annotation[]
): LayoutSuggestion[] {
  if (!currentConfig.enableSmartLayout) {
    return []
  }

  // 基础布局分析
  const suggestions = generateLayoutSuggestions(nodes, edges)

  // 如果有 PDF 标注，添加基于页码的分组建议
  if (pdfAnnotations && pdfAnnotations.length > 0) {
    const pageGroups = groupNodesByPage(nodes, pdfAnnotations)
    if (pageGroups.length > 1) {
      suggestions.push({
        id: generateId(),
        type: 'cluster',
        description: `按 PDF 页码分组（${pageGroups.length} 页）`,
        nodeIds: pageGroups.flatMap(g => g.nodeIds),
        layoutConfig: {
          direction: 'vertical',
          groups: pageGroups.map((g, i) => ({
            groupId: `page-${g.pageNumber}`,
            nodeIds: g.nodeIds,
            title: `第 ${g.pageNumber} 页`
          }))
        },
        confidence: 0.85
      })
    }
  }

  return suggestions
}

/**
 * 按页码分组节点
 */
function groupNodesByPage(
  nodes: FreeMindMapNode[],
  annotations: Annotation[]
): { pageNumber: number; nodeIds: string[] }[] {
  const annotationPageMap = new Map<string, number>()
  annotations.forEach(a => annotationPageMap.set(a.id, a.pageNumber))

  const pageGroups = new Map<number, string[]>()

  for (const node of nodes) {
    const annotationId = node.data.annotationId
    if (annotationId) {
      const pageNumber = annotationPageMap.get(annotationId)
      if (pageNumber !== undefined) {
        if (!pageGroups.has(pageNumber)) {
          pageGroups.set(pageNumber, [])
        }
        pageGroups.get(pageNumber)!.push(node.id)
      }
    }
  }

  return Array.from(pageGroups.entries()).map(([pageNumber, nodeIds]) => ({
    pageNumber,
    nodeIds
  }))
}

/**
 * 应用布局建议
 * @param suggestion 布局建议
 * @param nodes 当前节点列表
 * @returns 更新后的节点位置
 */
export function applyLayoutSuggestion(
  suggestion: LayoutSuggestion,
  nodes: FreeMindMapNode[]
): { nodeId: string; x: number; y: number }[] {
  const updates: { nodeId: string; x: number; y: number }[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  const { layoutConfig } = suggestion
  const spacing = 150
  const verticalSpacing = 100

  if (suggestion.type === 'cluster' && layoutConfig.groups) {
    let startX = 0
    for (const group of layoutConfig.groups) {
      const groupNodes = group.nodeIds.map(id => nodeMap.get(id)).filter(Boolean) as FreeMindMapNode[]
      if (groupNodes.length === 0) continue

      // 计算组内布局
      groupNodes.forEach((node, index) => {
        updates.push({
          nodeId: node.id,
          x: startX + (index % 5) * spacing,
          y: Math.floor(index / 5) * verticalSpacing
        })
      })

      startX += Math.ceil(group.nodeIds.length / 5) * spacing + 100
    }
  } else if (suggestion.type === 'sequence' || suggestion.type === 'hierarchy') {
    const direction = layoutConfig.direction
    const rootId = layoutConfig.rootId
    const root = rootId ? nodeMap.get(rootId) : nodes[0]

    if (root) {
      // BFS 遍历
      const visited = new Set<string>()
      const queue: [{ nodeId: string; x: number; y: number }] = [{ nodeId: root.id, x: 0, y: 0 }]
      visited.add(root.id)

      while (queue.length > 0) {
        const current = queue.shift()!
        updates.push({ nodeId: current.nodeId, x: current.x, y: current.y })

        // 查找子节点
        const children = nodes.filter(n => n.parentId === current.nodeId)
        children.forEach((child, index) => {
          if (!visited.has(child.id)) {
            visited.add(child.id)
            queue.push({
              nodeId: child.id,
              x: direction === 'horizontal' ? current.x + spacing : current.x + (index - children.length / 2) * spacing,
              y: direction === 'horizontal' ? current.y + (index - children.length / 2) * verticalSpacing : current.y + verticalSpacing
            })
          }
        })
      }

      // 居中处理
      const allX = updates.map(u => u.x)
      const allY = updates.map(u => u.y)
      const minX = Math.min(...allX)
      const minY = Math.min(...allY)

      updates.forEach(u => {
        u.x -= minX + (Math.max(...allX) - minX) / 2
        u.y -= minY + (Math.max(...allY) - minY) / 2
      })
    }
  } else if (suggestion.type === 'radial' && layoutConfig.rootId) {
    const root = nodeMap.get(layoutConfig.rootId)
    if (root) {
      updates.push({ nodeId: root.id, x: 0, y: 0 })

      const children = nodes.filter(n => n.parentId === layoutConfig.rootId)
      const angleStep = (2 * Math.PI) / children.length

      children.forEach((child, index) => {
        const angle = index * angleStep - Math.PI / 2
        const radius = 200
        updates.push({
          nodeId: child.id,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        })
      })
    }
  }

  return updates
}

// ==================== 标注颜色映射 ====================

/**
 * 颜色映射缓存
 */
const colorMappingCache: Map<string, AnnotationColorMapping> = new Map()

/**
 * 创建标注颜色映射
 * @param annotationId 标注 ID
 * @param annotationColor 标注颜色
 * @param nodeId 节点 ID
 * @param autoSync 是否自动同步
 * @returns 颜色映射
 */
export function createColorMapping(
  annotationId: string,
  annotationColor: string,
  nodeId: string,
  autoSync: boolean = true
): AnnotationColorMapping {
  const mapping: AnnotationColorMapping = {
    id: generateId(),
    annotationId,
    annotationColor,
    nodeId,
    nodeBorderColor: annotationColor,
    nodeBackgroundColor: lightenColor(annotationColor, 0.8),
    autoSync
  }

  colorMappingCache.set(annotationId, mapping)

  // 触发事件
  const event = new CustomEvent('mindmap-color-mapping-created', {
    detail: mapping
  })
  window.dispatchEvent(event)

  return mapping
}

/**
 * 获取标注颜色映射
 * @param annotationId 标注 ID
 */
export function getColorMapping(annotationId: string): AnnotationColorMapping | undefined {
  return colorMappingCache.get(annotationId)
}

/**
 * 根据标注颜色更新节点样式
 * @param annotation 标注信息
 * @param nodeId 节点 ID
 * @returns 节点样式更新
 */
export function getNodeStyleFromAnnotation(
  annotation: Annotation,
  nodeId: string
): { borderColor: string; backgroundColor?: string } | null {
  if (!currentConfig.enableColorMapping) return null

  let mapping = colorMappingCache.get(annotation.id)

  if (!mapping) {
    // 自动创建映射
    mapping = createColorMapping(
      annotation.id,
      annotation.color || '#409eff',
      nodeId
    )
  }

  if (mapping && mapping.autoSync) {
    return {
      borderColor: mapping.nodeBorderColor,
      backgroundColor: mapping.nodeBackgroundColor
    }
  }

  return null
}

/**
 * 清除颜色映射
 * @param annotationId 标注 ID
 */
export function clearColorMapping(annotationId?: string): void {
  if (annotationId) {
    colorMappingCache.delete(annotationId)
  } else {
    colorMappingCache.clear()
  }

  const event = new CustomEvent('mindmap-color-mappings-cleared', {
    detail: { annotationId }
  })
  window.dispatchEvent(event)
}

/**
 * 颜色变亮
 */
function lightenColor(color: string, factor: number): string {
  // 解析颜色
  let r: number, g: number, b: number

  if (color.startsWith('#')) {
    const hex = color.slice(1)
    r = parseInt(hex.substr(0, 2), 16)
    g = parseInt(hex.substr(2, 2), 16)
    b = parseInt(hex.substr(4, 2), 16)
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      r = parseInt(match[1])
      g = parseInt(match[2])
      b = parseInt(match[3])
    } else {
      return color
    }
  } else {
    return color
  }

  // 变亮
  r = Math.min(255, Math.round(r + (255 - r) * factor))
  g = Math.min(255, Math.round(g + (255 - g) * factor))
  b = Math.min(255, Math.round(b + (255 - b) * factor))

  return `rgb(${r}, ${g}, ${b})`
}

// ==================== 自动同步增强 ====================

/**
 * 批量同步队列
 */
const syncQueue: Array<{
  annotation: Annotation
  action: 'create' | 'update' | 'delete'
  timestamp: number
}> = []

let syncTimer: number | null = null

/**
 * 添加同步任务
 * @param annotation 标注
 * @param action 操作类型
 */
export function queueSync(annotation: Annotation, action: 'create' | 'update' | 'delete'): void {
  if (!currentConfig.enableAutoSyncEnhanced) return

  syncQueue.push({
    annotation,
    action,
    timestamp: now()
  })

  // 防抖处理
  if (syncTimer) {
    clearTimeout(syncTimer)
  }

  syncTimer = window.setTimeout(() => {
    processSyncQueue()
  }, currentConfig.autoSyncDelay)
}

/**
 * 处理同步队列
 */
function processSyncQueue(): void {
  if (syncQueue.length === 0) return

  // 批量处理
  const batch = [...syncQueue]
  syncQueue.length = 0

  // 触发自定义事件，由组件处理实际同步逻辑
  const event = new CustomEvent('mindmap-batch-sync', {
    detail: {
      operations: batch,
      timestamp: now()
    }
  })
  window.dispatchEvent(event)

  console.log('[PDF Linkage] 批量同步:', batch.length, '个操作')
}

/**
 * 立即同步
 */
export function flushSync(): void {
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }
  processSyncQueue()
}

/**
 * 取消待同步任务
 */
export function cancelPendingSync(): void {
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }
  syncQueue.length = 0
}

// ==================== 工具函数 ====================

/**
 * 从 PDF 坐标转换为画布坐标
 * @param rect PDF 坐标
 * @param pdfScale PDF 缩放比例
 * @param canvasOffset 画布偏移
 * @returns 画布坐标
 */
export function pdfRectToCanvasCoords(
  rect: { x: number; y: number; width: number; height: number },
  pdfScale: number,
  canvasOffset: { x: number; y: number }
): { x: number; y: number; width: number; height: number } {
  return {
    x: rect.x * pdfScale + canvasOffset.x,
    y: rect.y * pdfScale + canvasOffset.y,
    width: rect.width * pdfScale,
    height: rect.height * pdfScale
  }
}

/**
 * 从画布坐标转换为 PDF 坐标
 * @param x 画布 X
 * @param y 画布 Y
 * @param pdfScale PDF 缩放比例
 * @param canvasOffset 画布偏移
 * @returns PDF 坐标
 */
export function canvasCoordsToPdfRect(
  x: number,
  y: number,
  pdfScale: number,
  canvasOffset: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: (x - canvasOffset.x) / pdfScale,
    y: (y - canvasOffset.y) / pdfScale
  }
}

/**
 * 检查节点是否在视口内
 * @param nodePosition 节点位置
 * @param viewport 视口信息
 * @returns 是否在视口内
 */
export function isNodeInViewport(
  nodePosition: { x: number; y: number },
  viewport: { x: number; y: number; width: number; height: number; zoom: number }
): boolean {
  const { x, y } = nodePosition
  const { x: vx, y: vy, width: vw, height: vh, zoom } = viewport

  return (
    x * zoom + vx >= 0 &&
    x * zoom + vx <= vw &&
    y * zoom + vy >= 0 &&
    y * zoom + vy <= vh
  )
}
