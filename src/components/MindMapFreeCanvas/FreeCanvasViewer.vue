<script setup lang="ts">
/**
 * MarginNote 风格自由画布思维导图查看器
 * 基于 Vue Flow 实现，集成工具栏、右键菜单、拖拽创建、跨分支关联
 * 第 7 期升级：集成搜索和过滤功能
 */

import { ref, computed, onMounted, onUnmounted, watch, provide } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type {
  Connection,
  Edge as VueFlowEdge,
  NodeDragEvent,
  NodeClickEvent,
  PaneClickEvent,
  NodeMouseEvent,
  EdgeMouseEvent
} from '@vue-flow/core'
import { storeToRefs } from 'pinia'
import { useFreeMindMapStore } from '@/stores/freeMindMapStore'
import { useSnapToGrid } from '@/composables/useSnapToGrid'
import TextCardNode from './TextCardNode.vue'
import ImageCardNode from './ImageCardNode.vue'
import GroupNode from './GroupNode.vue'
import NodeEditDialog from './NodeEditDialog.vue'
import NodeContextMenu from './NodeContextMenu.vue'
import EdgeEditDialog from './EdgeEditDialog.vue'
import EdgeContextMenu from './EdgeContextMenu.vue'
import CanvasToolbar from './CanvasToolbar.vue'
import MindMapSearch from './MindMapSearch.vue'
import NodeFilterPanel from './NodeFilterPanel.vue'
import { useMindMapSearch } from '@/composables/useMindMapSearch'
import type {
  FreeMindMapNode,
  FreeMindMapEdge,
  FreeMindMapNodeData,
  FreeMindMapNodeType,
  FreeMindMapLayout,
  CrossBranchLink
} from '@/types/mindmapFree'
import type { MindMapFilter } from '@/types/mindMapSearch'
// 拖拽工具函数
import {
  findDropTarget,
  calculateDropTargetType,
  isValidDropTarget,
  DropTargetType
} from '@/utils/mindmapDragUtils'
// 拖拽状态管理
import { useMindMapDragStore } from '@/stores/mindMapDragStore'
// 撤销/重做和快捷键管理
import { globalUndoManager, OperationType } from '@/services/undoManager'
import { ShortcutManager } from '@/services/shortcutManager'
// 树状布局
import { applyTreeLayout } from '@/utils/treeLayout'
// 克隆和引用节点功能
import { createCloneNode, createReferenceNode } from '@/services/freeMindMapService'

// 自定义节点类型注册
const nodeTypes = {
  textCard: TextCardNode,
  imageCard: ImageCardNode,
  group: GroupNode
}

// Props
interface Props {
  /** 思维导图块 ID */
  blockId: string
  /** 学习集 ID */
  studySetId?: string
  /** 是否只读模式 */
  readOnly?: boolean
  /** 是否显示网格 */
  showGrid?: boolean
  /** 是否显示控制栏 */
  showControls?: boolean
  /** 是否显示迷你地图 */
  showMiniMap?: boolean
  /** 是否显示工具栏 */
  showToolbar?: boolean
  /** 是否显示链接图谱面板 */
  showLinksPanel?: boolean
  /** 是否显示 PDF 联动配置面板 */
  showPdfLinkagePanel?: boolean
  /** PDF 文件路径（用于联动） */
  pdfPath?: string
  /** 是否显示搜索框 */
  showSearch?: boolean
  /** 是否显示过滤器 */
  showFilter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  studySetId: '',
  readOnly: false,
  showGrid: true,
  showControls: true,
  showMiniMap: false,
  showToolbar: true,
  showLinksPanel: false,
  showPdfLinkagePanel: false,
  pdfPath: '',
  showSearch: false,
  showFilter: false
})

// Emit
const emit = defineEmits<{
  /** 节点点击事件 */
  (e: 'nodeClick', node: FreeMindMapNode): void
  /** 节点双击事件 */
  (e: 'nodeDoubleClick', node: FreeMindMapNode): void
  /** 边点击事件 */
  (e: 'edgeClick', edge: FreeMindMapEdge): void
  /** 数据变更事件 */
  (e: 'change', data: { nodes: FreeMindMapNode[]; edges: FreeMindMapEdge[] }): void
  /** 节点创建事件（拖拽创建） */
  (e: 'node-create', params: {
    title: string
    content: string
    type: 'textCard' | 'imageCard'
    position: { x: number; y: number }
    annotationId?: string
  }): void
}>()

// 编辑对话框状态
const editDialogVisible = ref(false)
const editingNode = ref<FreeMindMapNode | null>(null)
const editingNodeType = ref<FreeMindMapNodeType>('textCard')
const editingNodeData = ref<FreeMindMapNodeData | null>(null)

// 关联线编辑对话框状态
const edgeEditDialogVisible = ref(false)
const editingEdge = ref<CrossBranchLink | null>(null)

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuTarget = ref<{ type: 'node' | 'pane' | 'edge'; nodeId?: string; edgeId?: string } | null>(null)

// 关联线右键菜单状态
const edgeContextMenuVisible = ref(false)
const edgeContextMenuPosition = ref({ x: 0, y: 0 })

// 跨分支关联选中状态
const selectedCrossLinkId = ref<string | null>(null)

// 全屏状态
const isFullscreen = ref(false)

// 搜索和过滤 UI 状态
const showSearchUI = ref(props.showSearch)
const showFilterUI = ref(props.showFilter)

// 使用 Store
const store = useFreeMindMapStore()
const dragStore = useMindMapDragStore()
const {
  nodes,
  edges,
  viewport,
  layout,
  isLoaded,
  isLoading,
  errorMessage
} = storeToRefs(store)

// Vue Flow 内部状态
const {
  fitView: vueFlowFitView,
  zoomIn,
  zoomOut,
  setTransform
} = useVueFlow()

// 本地状态
const containerRef = ref<HTMLElement | null>(null)
const isInitialized = ref(false)
const autoSaveTimer = ref<number | null>(null)
const shortcutManager = ref<ShortcutManager | null>(null)

// 网格吸附功能
const {
  gridSize,
  snapThreshold,
  enabled: snapEnabled,
  snapToGrid,
  toggleEnabled,
  setGridSize
} = useSnapToGrid({
  gridSize: 20,
  snapThreshold: 10,
  enabled: true
})

// Shift 键状态（用于临时禁用吸附）
const isShiftPressed = ref(false)

// 框选状态
const selectionBox = ref({
  startX: 0,
  startY: 0,
  width: 0,
  height: 0,
  visible: false,
  isSelecting: false
})

// 从 Store 获取选中节点用于右键菜单
const { selectedNodeIds } = storeToRefs(store)

// 计算属性 - 获取可见节点（考虑展开/折叠状态）
const visibleNodes = computed(() => {
  const hiddenNodeIds = new Set<string>()

  // 收集所有被折叠节点的子节点 ID
  nodes.value.forEach(node => {
    if (node.data.collapsed || !node.data.isExpanded) {
      // 如果节点被折叠，收集它的所有子孙节点 ID
      const collectChildren = (parentId: string) => {
        const children = nodes.value.filter(n => n.parentId === parentId)
        children.forEach(child => {
          hiddenNodeIds.add(child.id)
          collectChildren(child.id)
        })
      }
      collectChildren(node.id)
    }
  })

  // 过滤掉隐藏的节点
  return nodes.value.filter(n => !hiddenNodeIds.has(n.id))
})

// 计算属性 - 跨分支关联转换为 Vue Flow Edge
const crossLinkEdges = computed(() => {
  const allCrossLinks = store.getAllCrossLinks()
  
  return allCrossLinks.map((link: CrossBranchLink) => {
    const edge: FreeMindMapEdge = {
      id: link.id,
      source: link.sourceNodeId,
      target: link.targetNodeId,
      type: 'smooth', // 使用平滑曲线
      animated: false,
      style: {
        ...link.style,
        stroke: link.style.stroke || '#FF6B6B',
        strokeWidth: link.style.strokeWidth || 2,
        strokeDasharray: link.style.strokeDasharray || '5,5' // 虚线样式
      },
      selected: selectedCrossLinkId.value === link.id,
      selectable: true,
      data: {
        linkType: link.linkType,
        label: link.label,
        isCrossLink: true
      },
      label: link.label || undefined,
      labelStyle: {
        fill: link.style.stroke || '#FF6B6B',
        fontSize: '12px',
        fontWeight: '500'
      },
      labelBgStyle: {
        fill: isDarkMode.value ? '#2d2d2d' : '#ffffff',
        fillOpacity: 0.8
      },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4
    }
    
    return edge
  })
})

// 合并所有边（父子关系边 + 跨分支关联边）
const allEdges = computed(() => {
  // 过滤掉跨分支关联的边（避免重复）
  const parentChildEdges = edges.value.filter(e => !e.data?.isCrossLink)
  return [...parentChildEdges, ...crossLinkEdges.value]
})

// 使用搜索组合式函数（传入可见节点）
const {
  searchQuery,
  searchOptions,
  searchResult,
  isSearching,
  highlightedNodes,
  showSearchPanel,
  showFilterPanel,
  hasActiveSearch,
  hasActiveFilter,
  filteredNodes,
  currentMatchIndex,
  updateSearchQuery,
  executeSearch,
  clearSearch,
  goToPreviousMatch,
  goToNextMatch,
  applyFilter,
  clearFilter,
  highlightNode,
  clearHighlights,
  dispose: disposeSearch
} = useMindMapSearch(nodes, {
  autoSearch: true,
  searchDebounce: 300
})

// 选中的节点用于右键菜单
const selectedNodesForMenu = computed(() => {
  return nodes.value.filter(n => selectedNodeIds.value.includes(n.id))
})

// 计算属性
const isDarkMode = computed(() => {
  return window.siyuan?.config?.appearance?.mode === 1
})

const backgroundColor = computed(() => {
  return isDarkMode.value ? '#1e1e1e' : '#ffffff'
})

// 初始化加载
onMounted(async () => {
  console.log('[FreeCanvasViewer] onMounted, blockId:', props.blockId);

  if (!props.blockId) {
    console.warn('[FreeCanvasViewer] blockId 为空，显示空状态');
    return;
  }

  isLoading.value = true;
  console.log('[FreeCanvasViewer] 当前状态 - isLoading:', isLoading.value, 'nodes:', nodes.value?.length);

  try {
    await store.loadMindMap(props.blockId)
    isInitialized.value = true
    console.log('[FreeCanvasViewer] 加载完成 - isLoaded:', isLoaded.value, 'nodes:', nodes.value?.length);
  } catch (error) {
    console.error('[FreeCanvasViewer] 加载失败:', error);
    errorMessage.value = error instanceof Error ? error.message : '加载失败';
  } finally {
    isLoading.value = false;
  }

  // 启动自动保存
  startAutoSave()

  // 监听 postMessage 事件
  window.addEventListener('message', handlePostMessage)

  // 监听 PDF 摘录创建事件
  window.addEventListener('annotation-created', handleAnnotationCreated as EventListener)
  console.log('[FreeCanvasViewer] 已注册 annotation-created 事件监听')
  
  // 初始化快捷键管理器
  shortcutManager.value = new ShortcutManager(globalUndoManager, store)
  shortcutManager.value.listen()
  console.log('[FreeCanvasViewer] 快捷键管理器已启动（Ctrl+Z 撤销，Ctrl+Shift+Z 重做）')
  
  // 添加键盘事件监听（用于 Shift 键临时禁用吸附）
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

// 清理
onUnmounted(() => {
  stopAutoSave()
  disposeSearch()
  window.removeEventListener('message', handlePostMessage)
  window.removeEventListener('annotation-created', handleAnnotationCreated as EventListener)
  console.log('[FreeCanvasViewer] 已移除事件监听')
  
  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  
  // 销毁快捷键管理器
  if (shortcutManager.value) {
    shortcutManager.value.destroy()
    shortcutManager.value = null
  }
  console.log('[FreeCanvasViewer] 快捷键管理器已销毁')
})

// 监听搜索面板显示
watch([showSearchUI, showFilterUI], ([showS, showF]) => {
  showSearchPanel.value = showS
  showFilterPanel.value = showF
})

// 监听数据变化自动保存
watch([nodes, edges], () => {
  if (isInitialized.value) {
    debouncedSave()
  }
}, { deep: true })

// ==================== 从 PDF 生成思维导图 ====================

/**
 * 从当前 PDF 的标注生成思维导图
 */
async function handleGenerateFromPdf(): Promise<void> {
  if (!props.pdfPath) {
    showMessage('请先设置 PDF 路径', 'info')
    return
  }
  
  isLoading.value = true
  try {
    console.log('[FreeCanvasViewer] 开始从 PDF 标注生成脑图:', props.pdfPath)
    
    // 导入生成服务
    const { generateMindMapFromPdfAnnotations } = await import('@/services/freeMindMapDataIntegrationService')
    
    // 生成节点
    const nodes = await generateMindMapFromPdfAnnotations(props.pdfPath, blockId)
    console.log('[FreeCanvasViewer] 生成节点数量:', nodes.length)
    
    if (nodes.length > 0) {
      // 加载到画布
      store.setNodes(nodes)
      store.setEdges([])
      
      // 保存
      await saveMindMap()
      
      showMessage(`已从 PDF 标注生成 ${nodes.length} 个节点`, 'success')
      
      // 自动适应视图
      setTimeout(() => {
        handleContextMenuZoomToFit()
      }, 100)
    } else {
      showMessage('当前 PDF 没有标注数据', 'info')
    }
  } catch (error) {
    console.error('[FreeCanvasViewer] 生成脑图失败:', error)
    showMessage('生成失败：' + (error as Error).message, 'error')
  } finally {
    isLoading.value = false
  }
}

// 监听全屏状态变化
watch(isFullscreen, (val) => {
  if (val) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
})

// 监听 blockId 变化，重新加载数据
watch(() => props.blockId, async (newBlockId, oldBlockId) => {
  if (newBlockId && newBlockId !== oldBlockId) {
    console.log('[FreeCanvasViewer] blockId 变化，重新加载:', newBlockId);
    await store.loadMindMap(newBlockId);
  }
})

// 监听 PDF 摘录创建事件
const handleAnnotationCreated = (event: CustomEvent) => {
  console.log('[FreeCanvasViewer] 收到 annotation-created 事件:', event.detail);
  const { annotation } = event.detail || {};
  if (!annotation) {
    console.warn('[FreeCanvasViewer] 事件中没有 annotation 数据');
    return;
  }

  // 创建新节点
  const newNode = store.createNode({
    type: 'textCard',
    title: annotation.text?.slice(0, 50) + (annotation.text?.length > 50 ? '...' : '') || '新摘录',
    content: annotation.text || '',
    position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 100 },
    annotationId: annotation.id,
    pdfPath: annotation.pdfPath,
    page: annotation.page,
    rect: annotation.rect
  });

  console.log('[FreeCanvasViewer] 从摘录创建节点:', newNode.id);
  
  // 触发保存
  debouncedSave()
};

// ==================== 事件处理 ====================

/**
 * 处理 postMessage 事件（用于搜索高亮）
 */
function handlePostMessage(event: MessageEvent): void {
  const { type, nodeId, color, highlight } = event.data || {}

  if (type === 'mindmap-focus-node' && nodeId) {
    focusNode(nodeId)
  } else if (type === 'mindmap-highlight-node' && nodeId) {
    highlightNode(nodeId, color)
  } else if (type === 'mindmap-clear-highlights') {
    clearHighlights()
  }
}

/**
 * 节点单击 - 置于顶层
 */
function onNodeClick(event: NodeClickEvent): void {
  const node = event.node as FreeMindMapNode
  emit('nodeClick', node)
  store.selectNode(node.id, false)
  // 点击节点时置于顶层（叠加管理）
  store.bringToFront(node.id)
}

/**
 * 节点双击 - 打开编辑对话框
 */
function onNodeDoubleClick(event: NodeClickEvent): void {
  const node = event.node as FreeMindMapNode
  emit('nodeDoubleClick', node)
  openEditDialog(node)
}

/**
 * 打开编辑对话框
 */
function openEditDialog(node: FreeMindMapNode): void {
  editingNode.value = node
  editingNodeType.value = node.type as FreeMindMapNodeType
  editingNodeData.value = node.data
  editDialogVisible.value = true
}

/**
 * 保存节点编辑
 */
function handleSaveNode(data: Partial<FreeMindMapNodeData>): void {
  if (editingNode.value) {
    store.updateNode({
      id: editingNode.value.id,
      ...data
    })
  }
  editingNode.value = null
  editingNodeData.value = null
}

/**
 * 删除节点
 */
function handleDeleteNode(nodeId: string): void {
  if (nodeId) {
    store.removeNode(nodeId)
  }
  editingNode.value = null
  editingNodeData.value = null
}

/**
 * 画布右键 - 打开上下文菜单
 */
function onContextMenu(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()

  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }

  // 判断点击的是节点、边还是画布
  const target = event.target as HTMLElement
  const nodeElement = target.closest('.vue-flow__node')
  const edgeElement = target.closest('.vue-flow__edge')

  if (edgeElement) {
    // 点击的是边
    const edgeId = edgeElement.getAttribute('data-id')
    if (edgeId) {
      const edge = edges.value.find(e => e.id === edgeId) || crossLinkEdges.value.find(e => e.id === edgeId)
      if (edge?.data?.isCrossLink) {
        // 跨分支关联边
        selectedCrossLinkId.value = edgeId
        contextMenuTarget.value = { type: 'edge', edgeId }
      } else {
        contextMenuTarget.value = { type: 'pane' }
      }
    } else {
      contextMenuTarget.value = { type: 'pane' }
    }
  } else if (nodeElement) {
    const nodeId = nodeElement.getAttribute('data-id')
    if (nodeId) {
      const node = nodes.value.find(n => n.id === nodeId)
      if (node && !selectedNodeIds.value.includes(nodeId)) {
        // 如果点击的节点未被选中，则只选中该节点
        store.clearSelection()
        store.selectNode(nodeId, false)
      }
      contextMenuTarget.value = { type: 'node', nodeId }
    } else {
      contextMenuTarget.value = { type: 'pane' }
    }
  } else {
    contextMenuTarget.value = { type: 'pane' }
  }

  contextMenuVisible.value = true
}

/**
 * 边点击
 */
function onEdgeClick(event: EdgeMouseEvent): void {
  const edge = event.edge as FreeMindMapEdge
  
  // 检查是否是跨分支关联
  if (edge.data?.isCrossLink) {
    // 选中跨分支关联
    selectedCrossLinkId.value = edge.id
    contextMenuTarget.value = { type: 'edge', edgeId: edge.id }
    emit('edgeClick', edge)
  } else {
    // 普通父子关系边
    emit('edgeClick', edge)
  }
}

/**
 * 节点悬停
 */
function onNodeMouseEnter(_event: NodeMouseEvent): void {
  // 可以在这里添加高亮效果
}

/**
 * 节点离开
 */
function onNodeMouseLeave(_event: NodeMouseEvent): void {
  // 移除高亮效果
}

/**
 * 边悬停
 */
function onEdgeMouseEnter(_event: EdgeMouseEvent): void {
  // 可以在这里添加高亮效果
}

/**
 * 边离开
 */
function onEdgeMouseLeave(_event: EdgeMouseEvent): void {
  // 移除高亮效果
}

/**
 * 边右键 - 打开关联线编辑菜单
 */
function onEdgeContextMenu(event: EdgeMouseEvent): void {
  const originalEvent = (event as any).originalEvent as MouseEvent
  if (originalEvent) {
    originalEvent.preventDefault()
    originalEvent.stopPropagation()
  }

  const edge = event.edge as FreeMindMapEdge

  // 查找对应的 CrossBranchLink
  const crossLink = store.getAllCrossLinks().find(l => {
    const vueFlowEdgeId = `cross-${l.sourceNodeId}-${l.targetNodeId}`
    return vueFlowEdgeId === edge.id || l.id === edge.id
  })

  if (crossLink && originalEvent) {
    selectedCrossLinkId.value = crossLink.id
    edgeContextMenuPosition.value = {
      x: originalEvent.clientX,
      y: originalEvent.clientY
    }
    edgeContextMenuVisible.value = true
  }
}

/**
 * 连接处理 - 建立父子关系
 */
function onConnect(connection: Connection): void {
  if (connection.source && connection.target) {
    // 创建连线
    store.createEdge({
      source: connection.source,
      target: connection.target,
      type: 'default'
    })

    // 建立父子关系（源节点为父节点，目标节点为子节点）
    store.setParent(connection.target, connection.source)

    console.log('[FreeCanvasViewer] 建立父子关系:', connection.source, '->', connection.target)
  }
}

/**
 * 节点拖拽开始 - 启动拖拽状态
 */
function onNodeDragStart(event: NodeDragEvent): void {
  // 启动拖拽状态
  dragStore.startDrag([event.node.id])
  console.log('[思维导图] 开始拖拽节点:', event.node.id)
}

/**
 * 节点拖拽中 - 实时更新目标高亮并应用网格吸附
 */
function onNodeDrag(event: NodeDragEvent): void {
  const draggedNode = event.node as FreeMindMapNode
  
  // 按下 Shift 键时临时禁用吸附
  const shouldSnap = snapEnabled.value && !isShiftPressed.value
  if (shouldSnap) {
    // 应用网格吸附
    const snappedPosition = snapToGrid(draggedNode.position)
    if (snappedPosition.x !== draggedNode.position.x || snappedPosition.y !== draggedNode.position.y) {
      // 更新节点位置到吸附位置
      draggedNode.position = snappedPosition
    }
  }
  
  // 计算拖拽目标
  const mousePosition = {
    x: draggedNode.position.x + 100,
    y: draggedNode.position.y + 30
  }
  
  const target = findDropTarget(draggedNode.id, mousePosition, visibleNodes.value)
  
  if (target && isValidDropTarget(draggedNode.id, target.nodeId, visibleNodes.value)) {
    // 更新拖拽目标状态
    dragStore.updateTarget(target.nodeId, target.type, target.rect)
  } else {
    // 清除目标
    dragStore.clearTarget()
  }
}

/**
 * 节点拖拽结束 - 增强版（支持 MarginNote4 风格的拖拽建立关系）
 */
function onNodeDragStop(event: NodeDragEvent): void {
  const draggedNode = event.node as FreeMindMapNode
  
  // 检测是否有拖拽目标
  const mousePosition = {
    x: draggedNode.position.x + 100, // 节点中心 X
    y: draggedNode.position.y + 30   // 节点中心 Y
  }
  
  const target = findDropTarget(draggedNode.id, mousePosition, visibleNodes.value)
  
  if (target && isValidDropTarget(draggedNode.id, target.nodeId, visibleNodes.value)) {
    const targetNode = visibleNodes.value.find(n => n.id === target.nodeId)
    if (targetNode) {
      // 保存操作前的状态（用于撤销）
      const oldParentId = draggedNode.parentId
      const oldPosition = { ...draggedNode.position }
      
      // 建立父子关系
      store.setParent(draggedNode.id, target.nodeId)
      
      // 记录操作历史
      globalUndoManager.record({
        type: OperationType.MOVE_NODE,
        timestamp: Date.now(),
        data: {
          nodeId: draggedNode.id,
          newParentId: target.nodeId
        },
        undoData: {
          oldParentId,
          oldPosition
        },
        redoData: {
          newParentId: target.nodeId
        },
        description: `移动节点 "${draggedNode.data.title}"`
      })
      
      // 显示提示消息
      const actionText = target.type === DropTargetType.CHILD 
        ? '成为子节点' 
        : target.type === DropTargetType.BEFORE 
          ? '成为兄弟节点（前）'
          : '成为兄弟节点（后）'
      console.log(`[思维导图] "${draggedNode.data.title}" ${actionText} "${targetNode.data.title}"`)
    }
  }
  
  // 结束拖拽状态
  dragStore.endDrag()
  debouncedSave()
}

/**
 * 清空选择
 */
function onPaneClick(_event: PaneClickEvent): void {
  store.clearSelection()
}

// ==================== 框选功能 ====================

/**
 * 框选开始（Shift + 鼠标按下）
 */
function onPaneMouseDown(event: MouseEvent): void {
  // 检查是否按下 Shift 键
  if (!event.shiftKey) return
  
  // 检查是否点击在空白区域（不是节点或边）
  const target = event.target as HTMLElement
  if (!target.classList.contains('vue-flow__pane')) return
  
  const containerRect = containerRef.value?.getBoundingClientRect()
  if (!containerRect) return
  
  selectionBox.value = {
    startX: event.clientX - containerRect.left,
    startY: event.clientY - containerRect.top,
    width: 0,
    height: 0,
    visible: true,
    isSelecting: true
  }
  
  // 添加全局事件监听
  document.addEventListener('mousemove', onPaneMouseMove)
  document.addEventListener('mouseup', onPaneMouseUp)
}

/**
 * 框选移动
 */
function onPaneMouseMove(event: MouseEvent): void {
  if (!selectionBox.value.isSelecting || !containerRef.value) return
  
  const containerRect = containerRef.value.getBoundingClientRect()
  const currentX = event.clientX - containerRect.left
  const currentY = event.clientY - containerRect.top
  
  // 计算框选区域
  const startX = Math.min(selectionBox.value.startX, currentX)
  const startY = Math.min(selectionBox.value.startY, currentY)
  const width = Math.abs(currentX - selectionBox.value.startX)
  const height = Math.abs(currentY - selectionBox.value.startY)
  
  selectionBox.value = {
    ...selectionBox.value,
    startX,
    startY,
    width,
    height
  }
}

/**
 * 框选结束
 */
function onPaneMouseUp(event: MouseEvent): void {
  if (!selectionBox.value.isSelecting) return
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', onPaneMouseMove)
  document.removeEventListener('mouseup', onPaneMouseUp)
  
  // 执行框选检测
  if (selectionBox.value.width > 5 && selectionBox.value.height > 5) {
    selectNodesInBox()
  }
  
  // 隐藏框选框
  selectionBox.value = {
    ...selectionBox.value,
    visible: false,
    isSelecting: false
  }
}

/**
 * 检测框选区域内的节点
 */
function selectNodesInBox(): void {
  const box = selectionBox.value
  
  // 获取框选区域的边界
  const boxBounds = {
    left: box.startX,
    top: box.startY,
    right: box.startX + box.width,
    bottom: box.startY + box.height
  }
  
  // 查找所有在框选区域内的节点
  const nodesInBox = visibleNodes.value.filter(node => {
    const nodeBounds = getNodeBounds(node)
    
    // 简单的矩形碰撞检测
    return !(
      nodeBounds.right < boxBounds.left ||
      nodeBounds.left > boxBounds.right ||
      nodeBounds.bottom < boxBounds.top ||
      nodeBounds.top > boxBounds.bottom
    )
  })
  
  // 批量选择节点
  if (nodesInBox.length > 0) {
    nodesInBox.forEach(node => {
      store.selectNode(node.id, true) // true = 多选模式
    })
    console.log(`[FreeCanvasViewer] 框选选中 ${nodesInBox.length} 个节点`)
  }
}

/**
 * 获取节点的边界
 */
function getNodeBounds(node: FreeMindMapNode): {
  left: number
  top: number
  right: number
  bottom: number
} {
  const width = node.style?.width ? parseFloat(node.style.width as string) : 200
  const height = node.style?.height ? parseFloat(node.style.height as string) : 60
  
  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + width,
    bottom: node.position.y + height
  }
}

// 清理框选事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', onPaneMouseMove)
  document.removeEventListener('mouseup', onPaneMouseUp)
})

// ==================== 右键菜单操作 ====================

/**
 * 编辑节点
 */
function handleContextMenuEdit(): void {
  if (selectedNodeIds.value.length === 1) {
    const node = nodes.value.find(n => n.id === selectedNodeIds.value[0])
    if (node) {
      openEditDialog(node)
    }
  }
}

/**
 * 删除节点
 */
function handleContextMenuDelete(): void {
  if (selectedNodeIds.value.length > 0) {
    store.removeNodes(selectedNodeIds.value)
  }
}

/**
 * 复制节点
 */
function handleContextMenuDuplicate(): void {
  if (selectedNodeIds.value.length === 1) {
    const sourceNode = nodes.value.find(n => n.id === selectedNodeIds.value[0])
    if (sourceNode) {
      store.createNode({
        type: sourceNode.type as FreeMindMapNodeType,
        title: sourceNode.data.title + ' (副本)',
        content: sourceNode.data.content,
        position: {
          x: sourceNode.position.x + 30,
          y: sourceNode.position.y + 30
        },
        annotationId: sourceNode.data.annotationId,
        cardId: sourceNode.data.cardId
      })
    }
  }
}

/**
 * 设置节点颜色
 */
function handleContextMenuColor(color: string): void {
  if (selectedNodeIds.value.length > 0) {
    selectedNodeIds.value.forEach(id => {
      const node = nodes.value.find(n => n.id === id)
      if (node) {
        store.updateNode({
          id,
          style: {
            ...node.style,
            backgroundColor: color
          }
        })
      }
    })
  }
}

/**
 * 设置节点层级
 */
function handleContextMenuLevel(level: string): void {
  if (selectedNodeIds.value.length === 1) {
    const node = nodes.value.find(n => n.id === selectedNodeIds.value[0])
    if (node) {
      store.updateNode({
        id: node.id,
        title: node.data.title,
        content: node.data.content,
        position: node.position,
        style: {
          ...node.style,
          backgroundColor: level === 'title' ? '#e6a23c' : undefined
        }
      })
    }
  }
}

/**
 * 创建分组
 */
function handleContextMenuAddGroup(): void {
  if (selectedNodeIds.value.length > 0) {
    // 计算选中节点的中心位置
    const positions = selectedNodeIds.value
      .map(id => nodes.value.find(n => n.id === id))
      .filter(Boolean)
      .map(n => n!.position)

    const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length
    const centerY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length

    store.createNode({
      type: 'group',
      title: '新分组',
      position: { x: centerX - 100, y: centerY - 50 }
    })
  } else {
    store.createNode({
      type: 'group',
      title: '新分组',
      position: { x: 200, y: 200 }
    })
  }
}

/**
 * 创建连线
 */
function handleContextMenuCreateConnection(): void {
  // 简单实现：选中前两个节点创建连线
  if (selectedNodeIds.value.length >= 2) {
    store.createEdge({
      source: selectedNodeIds.value[0],
      target: selectedNodeIds.value[1],
      type: 'default'
    })
  }
}

/**
 * 适应视图
 */
function handleContextMenuZoomToFit(): void {
  vueFlowFitView({ padding: 0.2 })
}

/**
 * 居中视图
 */
function handleContextMenuCenterView(): void {
  setTransform({ x: 0, y: 0, zoom: 1 })
}

/**
 * 合并到父节点
 */
function handleContextMenuMergeToParent(): void {
  if (selectedNodeIds.value.length === 1) {
    const nodeId = selectedNodeIds.value[0]
    const node = nodes.value.find(n => n.id === nodeId)
    const parent = node?.parentId ? nodes.value.find(n => n.id === node.parentId) : null

    if (node && parent) {
      // 将当前节点内容合并到父节点
      const newContent = parent.data.title + '\n\n' + node.data.content
      store.updateNode({
        id: parent.id,
        title: parent.data.title,
        content: newContent
      })

      // 删除当前节点
      store.removeNode(nodeId)
      debouncedSave()
    }
  }
}

/**
 * 从父节点拆分
 */
function handleContextMenuSplitFromParent(): void {
  if (selectedNodeIds.value.length === 1) {
    const nodeId = selectedNodeIds.value[0]
    const node = nodes.value.find(n => n.id === nodeId)

    if (node && node.parentId) {
      // 创建新的独立节点
      store.createNode({
        type: node.type as FreeMindMapNodeType,
        title: node.data.title,
        content: node.data.content,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50
        },
        annotationId: node.data.annotationId,
        cardId: node.data.cardId
      })

      // 清空原节点内容
      store.updateNode({
        id: nodeId,
        title: '',
        content: ''
      })
      debouncedSave()
    }
  }
}

/**
 * 合并选中节点
 */
function handleContextMenuMergeSelected(): void {
  if (selectedNodeIds.value.length >= 2) {
    // 收集所有节点内容
    const contents: string[] = []
    let firstNode: FreeMindMapNode | undefined

    selectedNodeIds.value.forEach(id => {
      const node = nodes.value.find(n => n.id === id)
      if (node) {
        if (!firstNode) firstNode = node
        contents.push(`${node.data.title}: ${node.data.content || ''}`)
      }
    })

    if (firstNode) {
      // 更新第一个节点为合并内容
      store.updateNode({
        id: firstNode.id,
        title: '合并的节点',
        content: contents.join('\n\n---\n\n')
      })

      // 删除其他节点
      selectedNodeIds.value.slice(1).forEach(id => {
        store.removeNode(id)
      })

      debouncedSave()
    }
  }
}

/**
 * 提取子节点
 */
function handleContextMenuExtractChildren(): void {
  if (selectedNodeIds.value.length === 1) {
    const nodeId = selectedNodeIds.value[0]
    const node = nodes.value.find(n => n.id === nodeId)

    if (node) {
      const children = nodes.value.filter(n => n.parentId === nodeId)

      if (children.length > 0) {
        // 将子节点内容合并到当前节点
        const contents = children.map(c => `${c.data.title}: ${c.data.content || ''}`).join('\n\n---\n\n')
        const currentContent = node.data.content || ''
        store.updateNode({
          id: nodeId,
          title: node.data.title,
          content: currentContent + '\n\n' + contents
        })

        // 删除子节点
        children.forEach(child => {
          store.removeNode(child.id)
        })

        debouncedSave()
      }
    }
  }
}

/**
 * 删除跨分支关联
 */
function handleContextMenuDeleteCrossLink(): void {
  if (contextMenuTarget.value?.type === 'edge' && contextMenuTarget.value.edgeId) {
    store.removeCrossBranchLink(contextMenuTarget.value.edgeId)
    selectedCrossLinkId.value = null
    debouncedSave()
  }
}

/**
 * 复制节点
 */
function handleContextMenuCopy(): void {
  if (selectedNodeIds.value.length === 0) {
    console.log('[FreeCanvasViewer] 没有选中的节点')
    return
  }

  store.copyNodes(selectedNodeIds.value)
  console.log(`[FreeCanvasViewer] 已复制 ${selectedNodeIds.value.length} 个节点`)
}

/**
 * 剪切节点
 */
function handleContextMenuCut(): void {
  if (selectedNodeIds.value.length === 0) {
    console.log('[FreeCanvasViewer] 没有选中的节点')
    return
  }

  store.cutNodes(selectedNodeIds.value)
  console.log(`[FreeCanvasViewer] 已剪切 ${selectedNodeIds.value.length} 个节点`)
}

/**
 * 粘贴节点
 */
function handleContextMenuPaste(): void {
  if (!store.hasClipboardData()) {
    console.log('[FreeCanvasViewer] 剪贴板为空')
    return
  }

  const newNodeIds = store.pasteNodes()
  if (newNodeIds.length > 0) {
    console.log(`[FreeCanvasViewer] 已粘贴 ${newNodeIds.length} 个节点`)
    debouncedSave()
  }
}

// ==================== 工具栏操作 ====================

/**
 * 添加节点
 */
function handleToolbarAddNode(type: 'textCard' | 'imageCard'): void {
  store.createNode({
    type,
    title: type === 'textCard' ? '新卡片' : '图片卡片',
    content: '',
    position: { x: 100, y: 100 }
  })
}

/**
 * 添加分组
 */
function handleToolbarAddGroup(): void {
  store.createNode({
    type: 'group',
    title: '新分组',
    position: { x: 150, y: 150 }
  })
}

/**
 * 自动布局
 */
function handleToolbarAutoLayout(direction: 'horizontal' | 'vertical'): void {
  store.setLayout(direction === 'vertical' ? 'vertical' : 'horizontal')
  // TODO: 实现自动布局算法
}

/**
 * 切换网格
 */
function handleToolbarToggleGrid(): void {
  // 由父组件控制
}

/**
 * 切换网格显示
 */
function handleToggleGrid(): void {
  toggleEnabled()
  console.log('[FreeCanvasViewer] 网格吸附', snapEnabled.value ? '已启用' : '已禁用')
}

/**
 * 设置网格大小
 */
function handleSetGridSize(size: number): void {
  setGridSize(size)
  console.log('[FreeCanvasViewer] 网格大小设置为', size, 'px')
}

/**
 * 切换全屏
 */
function handleToolbarToggleFullscreen(): void {
  isFullscreen.value = !isFullscreen.value
}

/**
 * 切换搜索
 */
function handleToolbarToggleSearch(): void {
  showSearchUI.value = !showSearchUI.value
  if (showSearchUI.value) {
    showFilterUI.value = false
  }
}

/**
 * 切换过滤
 */
function handleToolbarToggleFilter(): void {
  showFilterUI.value = !showFilterUI.value
  if (showFilterUI.value) {
    showSearchUI.value = false
  }
}

/**
 * 保存
 */
function handleToolbarSave(): void {
  saveMindMap()
}

/**
 * 导出
 */
function handleToolbarExport(): void {
  // TODO: 实现导出功能
  console.log('导出思维导图')
}

// ==================== 关联线编辑处理 ====================

/**
 * 打开关联线编辑对话框
 */
function openEdgeEditDialog(edge: CrossBranchLink): void {
  editingEdge.value = edge
  edgeEditDialogVisible.value = true
}

/**
 * 保存关联线编辑
 */
function handleSaveEdge(updateData: Partial<CrossBranchLink>): void {
  if (!editingEdge.value) return

  store.updateCrossBranchLink(editingEdge.value.id, updateData)
  editingEdge.value = null
  debouncedSave()
}

/**
 * 删除关联线
 */
function handleDeleteEdge(): void {
  if (editingEdge.value) {
    store.removeCrossBranchLink(editingEdge.value.id)
    editingEdge.value = null
    debouncedSave()
  }
}

/**
 * 快速设置关联颜色
 */
function handleEdgeColor(color: string): void {
  if (selectedCrossLinkId.value) {
    store.updateCrossBranchLink(selectedCrossLinkId.value, {
      style: { stroke: color, arrowColor: color }
    })
    debouncedSave()
  }
}

/**
 * 快速设置关联线型
 */
function handleEdgeStyle(style: string): void {
  if (selectedCrossLinkId.value) {
    store.updateCrossBranchLink(selectedCrossLinkId.value, {
      style: { strokeDasharray: style }
    })
    debouncedSave()
  }
}

/**
 * 快速设置关联线宽
 */
function handleEdgeWidth(width: number): void {
  if (selectedCrossLinkId.value) {
    store.updateCrossBranchLink(selectedCrossLinkId.value, {
      style: { strokeWidth: width }
    })
    debouncedSave()
  }
}

/**
 * 设置关联标签
 */
function handleEdgeLabel(label: string): void {
  if (selectedCrossLinkId.value) {
    store.updateCrossBranchLink(selectedCrossLinkId.value, { label })
    debouncedSave()
  }
}

/**
 * 切换箭头显示
 */
function handleToggleArrow(): void {
  if (selectedCrossLinkId.value) {
    const edge = store.getAllCrossLinks().find(l => l.id === selectedCrossLinkId.value)
    if (edge) {
      store.updateCrossBranchLink(selectedCrossLinkId.value, {
        style: { hasArrow: !edge.style.hasArrow }
      })
      debouncedSave()
    }
  }
}

/**
 * 打开关联线编辑对话框（从右键菜单）
 */
function handleEdgeEditFromMenu(): void {
  if (selectedCrossLinkId.value) {
    const edge = store.getAllCrossLinks().find(l => l.id === selectedCrossLinkId.value)
    if (edge) {
      openEdgeEditDialog(edge)
    }
  }
}

/**
 * 删除关联线（从右键菜单）
 */
function handleDeleteEdgeFromMenu(): void {
  if (selectedCrossLinkId.value) {
    store.removeCrossBranchLink(selectedCrossLinkId.value)
    selectedCrossLinkId.value = null
    debouncedSave()
  }
}

/**
 * 获取节点标题
 */
function getNodeTitle(nodeId: string): string {
  const node = nodes.value.find(n => n.id === nodeId)
  return node?.data.title || ''
}

// ==================== 工具函数 ====================

/**
 * 防抖保存
 */
let saveTimeout: number | null = null
function debouncedSave(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = window.setTimeout(() => {
    saveMindMap()
  }, 1000)
}

/**
 * 保存思维导图
 */
async function saveMindMap(): Promise<void> {
  try {
    await store.saveMindMap()
  } catch (error) {
    console.error('[FreeCanvasViewer] 保存失败:', error)
  }
}

/**
 * 启动自动保存
 */
function startAutoSave(): void {
  autoSaveTimer.value = window.setInterval(() => {
    saveMindMap()
  }, 30000) // 30 秒自动保存
}

/**
 * 停止自动保存
 */
function stopAutoSave(): void {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }
}

/**
 * 适应画布
 */
function handleFitView(): void {
  vueFlowFitView({ padding: 0.2 })
}

/**
 * 应用树状布局（MarginNote4 风格）
 */
function handleApplyTreeLayout(): void {
  applyTreeLayout(nodes.value, (nodeId, position) => {
    const node = nodes.value.find(n => n.id === nodeId)
    if (node) {
      node.position = position
    }
  })
  showMessage('已应用树状布局', 'success')
  debouncedSave()
}

/**
 * 聚焦节点（用于搜索）
 */
function focusNode(nodeId: string): void {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    // 选中节点
    store.selectNode(nodeId, false)
    // 居中显示 - 这里可以通过 Vue Flow 的 fitView 方法实现
    // 但由于 fitView 是针对所有可见节点，我们需要自定义实现
    // 简单做法是设置视图变换使节点居中
    const { x, y } = node.position
    // 获取容器尺寸
    const container = containerRef.value
    if (container) {
      const rect = container.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      // 计算变换
      setTransform({
        x: centerX - x * viewport.zoom,
        y: centerY - y * viewport.zoom,
        zoom: viewport.zoom
      })
    }
  }
}

/**
 * 添加新节点
 */
function addNodeAtPosition(
  title: string,
  content: string,
  type: 'textCard' | 'imageCard',
  position: { x: number; y: number }
): void {
  store.createNode({
    type,
    title,
    content,
    position
  })
}

/**
 * 处理节点展开/折叠切换
 */
function handleToggleExpand(nodeId: string): void {
  store.toggleNodeExpand(nodeId)
  console.log('[FreeCanvasViewer] 切换节点展开/折叠:', nodeId)
}

// 暴露方法给父组件
defineExpose({
  addNodeAtPosition,
  handleFitView,
  saveMindMap,
  focusNode,
  showSearchUI,
  showFilterUI,
  handleToolbarToggleSearch,
  handleToolbarToggleFilter
})

// 提供事件处理函数给子节点组件
provide('onToggleExpand', handleToggleExpand)
provide('onResizeStart', handleResizeStart)
provide('onResize', handleResize)
provide('onResizeEnd', handleResizeEnd)

/**
 * 处理节点缩放开始
 */
function handleResizeStart(nodeId: string): void {
  console.log('[FreeCanvasViewer] 开始缩放节点:', nodeId)
  // 将节点置于顶层
  store.bringToFront(nodeId)
}

/**
 * 处理节点缩放结束
 */
function handleResizeEnd(nodeId: string): void {
  console.log('[FreeCanvasViewer] 结束缩放节点:', nodeId)
  debouncedSave()
}

/**
 * 处理键盘按下事件（Shift 键临时禁用吸附）
 */
function handleKeyDown(event: KeyboardEvent): void {
  // 检查是否在输入框中
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }
  
  if (event.key === 'Shift') {
    isShiftPressed.value = true
    console.log('[FreeCanvasViewer] Shift 键按下，临时禁用网格吸附')
  }
}

/**
 * 处理键盘释放事件
 */
function handleKeyUp(event: KeyboardEvent): void {
  if (event.key === 'Shift') {
    isShiftPressed.value = false
    console.log('[FreeCanvasViewer] Shift 键释放，恢复网格吸附')
  }
}

/**
 * 右键菜单：创建克隆节点
 */
function handleContextMenuCreateClone(): void {
  if (!selectedNode || selectedNodeCount.value !== 1) {
    showMessage('请先选择一个节点', 'info')
    return
  }

  try {
    const targetNode = nodes.value.find(n => n.id === selectedNode)
    if (!targetNode) {
      showMessage('节点不存在', 'error')
      return
    }

    // 创建克隆节点（偏移一点位置）
    const cloneNode = createCloneNode(targetNode, {
      x: targetNode.position.x + 30,
      y: targetNode.position.y + 30
    })

    // 添加到画布
    store.nodes.push(cloneNode)
    debouncedSave()
    showMessage('克隆节点已创建，修改不会同步到原节点', 'success')
  } catch (error) {
    console.error('[FreeCanvasViewer] 创建克隆节点失败:', error)
    showMessage('创建失败', 'error')
  }
}

/**
 * 右键菜单：创建引用节点
 */
function handleContextMenuCreateReference(): void {
  if (!selectedNode || selectedNodeCount.value !== 1) {
    showMessage('请先选择一个节点', 'info')
    return
  }

  try {
    const targetNode = nodes.value.find(n => n.id === selectedNode)
    if (!targetNode) {
      showMessage('节点不存在', 'error')
      return
    }

    // 创建引用节点（偏移一点位置）
    const refNode = createReferenceNode(targetNode, {
      x: targetNode.position.x + 30,
      y: targetNode.position.y + 30
    })

    // 添加到画布
    store.nodes.push(refNode)
    debouncedSave()
    showMessage('引用节点已创建，修改将实时同步', 'success')
  } catch (error) {
    console.error('[FreeCanvasViewer] 创建引用节点失败:', error)
    showMessage('创建失败', 'error')
  }
}
</script>

<template>
  <div
    ref="containerRef"
    class="freemind-canvas-container"
    :class="{ 'dark-mode': isDarkMode }"
  >
    <!-- 加载状态 -->
    <div
      v-if="isLoading"
      class="freemind-loading"
    >
      <span class="freemind-loading-icon">🔄</span>
      <span class="freemind-loading-text">加载思维导图中...</span>
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="errorMessage && nodes?.length === 0"
      class="freemind-error"
    >
      <span class="freemind-error-icon">⚠️</span>
      <span class="freemind-error-text">{{ errorMessage }}</span>
    </div>

    <!-- 工具栏 -->
    <CanvasToolbar
      v-if="showToolbar"
      :layout="layout"
      :zoom="viewport.zoom"
      :show-grid="showGrid"
      :read-only="readOnly"
      :is-fullscreen="isFullscreen"
      :has-active-search="hasActiveSearch"
      :has-active-filter="hasActiveFilter"
      @add-node="handleToolbarAddNode"
      @add-group="handleToolbarAddGroup"
      @auto-layout="handleToolbarAutoLayout"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @zoom-reset="() => setTransform({ x: 0, y: 0, zoom: 1 })"
      @fit-view="handleContextMenuZoomToFit"
      @toggle-grid="handleToolbarToggleGrid"
      @toggle-fullscreen="handleToolbarToggleFullscreen"
      @toggle-search="handleToolbarToggleSearch"
      @toggle-filter="handleToolbarToggleFilter"
      @save="handleToolbarSave"
      @export="handleToolbarExport"
    />

    <!-- 空状态提示 - 当没有节点且不在加载中时显示 -->
    <div
      v-if="!isLoading && (!nodes || nodes.length === 0)"
      class="freemind-empty-state"
    >
      <div class="empty-illustration">
        <svg viewBox="0 0 120 80" class="mindmap-icon">
          <rect x="10" y="30" width="40" height="25" rx="4" fill="#e3f2fd" stroke="#2196f3" stroke-width="2"/>
          <rect x="70" y="10" width="40" height="25" rx="4" fill="#fff3e0" stroke="#ff9800" stroke-width="2"/>
          <rect x="70" y="45" width="40" height="25" rx="4" fill="#e8f5e9" stroke="#4caf50" stroke-width="2"/>
          <line x1="50" y1="42" x2="70" y2="22" stroke="#90a4ae" stroke-width="2" stroke-dasharray="4"/>
          <line x1="50" y1="42" x2="70" y2="57" stroke="#90a4ae" stroke-width="2" stroke-dasharray="4"/>
        </svg>
      </div>
      <h3 class="empty-title">开始创建思维导图</h3>
      <p class="empty-desc">在左侧 PDF 中选择文本并创建标注</p>
      <p class="empty-desc">卡片将自动显示在这里</p>
      <button
        class="add-demo-btn"
        @click="handleToolbarAddNode('textCard')"
      >
        <svg viewBox="0 0 24 24" class="btn-icon">
          <path d="M12 4v16m8-8H4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        添加示例卡片
      </button>
    </div>

    <!-- Vue Flow 画布 -->
    <VueFlow
      v-if="visibleNodes && visibleNodes.length > 0"
      ref="containerRef"
      :nodes="visibleNodes"
      :edges="allEdges"
      :node-types="nodeTypes"
      :default-zoom="1"
      :min-zoom="0.1"
      :max-zoom="4"
      :fit-view-on-init="true"
      :pan-on-scroll="true"
      :zoom-on-scroll="true"
      :zoom-on-pinch="true"
      :select-nodes-on-drag="false"
      :select-edges-on-drag="false"
      :connection-line-options="{ style: { stroke: '#409eff', strokeWidth: 2 } }"
      :delete-key-code="['Backspace', 'Delete']"
      :multi-selection-key-code="['Shift', 'Meta', 'Control']"
      :selection-key-code="['Shift']"
      :snap-to-grid="false"
      :snap-grid="[15, 15]"
      :nodes-draggable="!readOnly"
      :nodes-connectable="!readOnly"
      :elements-selectable="true"
      :prevent-scrolling="false"
      :auto-connect="true"
      :elevate-nodes-on-select="true"
      :only-render-visible-elements="true"
      :connection-radius="30"
      :select-nodes-on-connect="false"
      @connect="onConnect"
      @node-click="onNodeClick"
      @node-double-click="onNodeDoubleClick"
      @edge-click="onEdgeClick"
      @edge-contextmenu="onEdgeContextMenu"
      @node-mouse-enter="onNodeMouseEnter"
      @node-mouse-leave="onNodeMouseLeave"
      @edge-mouse-enter="onEdgeMouseEnter"
      @edge-mouse-leave="onEdgeMouseLeave"
      @node-drag-start="onNodeDragStart"
      @node-drag="onNodeDrag"
      @node-drag-stop="onNodeDragStop"
      @pane-click="onPaneClick"
      @pane-mousedown="onPaneMouseDown"
      @contextmenu="onContextMenu"
    >
      <!-- 控制工具栏 -->
      <Controls
        v-if="showControls"
        class="freemind-controls"
        :show-interactive="false"
      />

      <!-- 框选区域 -->
      <div
        v-if="selectionBox.visible"
        class="selection-box"
        :style="{
          left: selectionBox.startX + 'px',
          top: selectionBox.startY + 'px',
          width: selectionBox.width + 'px',
          height: selectionBox.height + 'px'
        }"
      />
    </VueFlow>

    <!-- 自定义 SVG 网格层 -->
    <svg
      v-if="showGrid && visibleNodes && visibleNodes.length > 0"
      class="grid-layer"
      :width="containerRef?.clientWidth || '100%'"
      :height="containerRef?.clientHeight || '100%'"
    >
      <defs>
        <pattern
          id="grid"
          :width="gridSize"
          :height="gridSize"
          patternUnits="userSpaceOnUse"
        >
          <path
            :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`"
            fill="none"
            stroke="var(--b3-border-color, #ccc)"
            stroke-width="0.5"
            stroke-opacity="0.3"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>

    <!-- 搜索面板 -->
    <MindMapSearch
      v-if="showSearchUI"
      :nodes="nodes"
      :show-panel="showSearchPanel"
      @update:show-panel="showSearchUI = $event"
      @focus-node="focusNode"
    />

    <!-- 过滤面板 -->
    <NodeFilterPanel
      v-if="showFilterUI"
      :nodes="nodes"
      :show-panel="showFilterPanel"
      @update:show-panel="showFilterUI = $event"
      @filter-change="applyFilter"
    />

    <!-- 节点数量统计 -->
    <div class="freemind-stats">
      <span>节点：{{ nodes?.length || 0 }}</span>
      <span class="freemind-stats-divider">|</span>
      <span>连线：{{ allEdges?.length || 0 }}</span>
      <span v-if="store.crossBranchLinks.length > 0" class="freemind-stats-crosslink">
        | 关联：{{ store.crossBranchLinks.length }}
      </span>
      <span v-if="hasActiveSearch" class="freemind-stats-search">
        | 搜索：{{ searchResult?.matchedNodeIds?.length || 0 }}
      </span>
      <span v-if="hasActiveFilter" class="freemind-stats-filter">
        | 过滤：{{ filteredNodes?.length || 0 }}
      </span>
    </div>

    <!-- 编辑对话框 -->
    <NodeEditDialog
      v-model="editDialogVisible"
      :node-type="editingNodeType"
      :node-data="editingNodeData"
      :read-only="readOnly"
      @save="handleSaveNode"
      @delete="handleDeleteNode"
    />

    <!-- 右键菜单 -->
    <NodeContextMenu
      v-model="contextMenuVisible"
      :x="contextMenuPosition.x"
      :y="contextMenuPosition.y"
      :selected-nodes="selectedNodesForMenu"
      :menu-target="contextMenuTarget"
      :read-only="readOnly"
      @edit="handleContextMenuEdit"
      @delete="handleContextMenuDelete"
      @duplicate="handleContextMenuDuplicate"
      @create-clone="handleContextMenuCreateClone"
      @create-reference="handleContextMenuCreateReference"
      @color="handleContextMenuColor"
      @level="handleContextMenuLevel"
      @add-group="handleContextMenuAddGroup"
      @create-connection="handleContextMenuCreateConnection"
      @zoom-to-fit="handleContextMenuZoomToFit"
      @center-view="handleContextMenuCenterView"
      @merge-to-parent="handleContextMenuMergeToParent"
      @split-from-parent="handleContextMenuSplitFromParent"
      @merge-selected="handleContextMenuMergeSelected"
      @extract-children="handleContextMenuExtractChildren"
      @delete-cross-link="handleContextMenuDeleteCrossLink"
      @copy="handleContextMenuCopy"
      @cut="handleContextMenuCut"
      @paste="handleContextMenuPaste"
    />

    <!-- 关联线编辑对话框 -->
    <EdgeEditDialog
      v-model="edgeEditDialogVisible"
      :edge="editingEdge"
      :source-node-title="editingEdge ? getNodeTitle(editingEdge.sourceNodeId) : ''"
      :target-node-title="editingEdge ? getNodeTitle(editingEdge.targetNodeId) : ''"
      :read-only="readOnly"
      @save="handleSaveEdge"
      @delete="handleDeleteEdge"
    />

    <!-- 关联线右键菜单 -->
    <EdgeContextMenu
      v-model="edgeContextMenuVisible"
      :x="edgeContextMenuPosition.x"
      :y="edgeContextMenuPosition.y"
      :edge="edgeContextMenuVisible ? store.getAllCrossLinks().find(l => l.id === selectedCrossLinkId) || null : null"
      :source-node-title="selectedCrossLinkId ? getNodeTitle(store.getAllCrossLinks().find(l => l.id === selectedCrossLinkId)?.sourceNodeId || '') : ''"
      :target-node-title="selectedCrossLinkId ? getNodeTitle(store.getAllCrossLinks().find(l => l.id === selectedCrossLinkId)?.targetNodeId || '') : ''"
      :read-only="readOnly"
      @edit="handleEdgeEditFromMenu"
      @delete="handleDeleteEdgeFromMenu"
      @color="handleEdgeColor"
      @style="handleEdgeStyle"
      @width="handleEdgeWidth"
      @label="handleEdgeLabel"
      @toggle-arrow="handleToggleArrow"
    />
  </div>
</template>

<style>
/* 需要全局的样式 */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
</style>

<style scoped>
.freemind-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: v-bind(backgroundColor);
  overflow: hidden;
}

/* 网格层 */
.grid-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.freemind-canvas-container.dark-mode {
  --vf-bg: #1e1e1e;
  --vf-node-bg: #2d2d2d;
  --vf-node-border: #444;
  --vf-text-color: #e0e0e0;
}

/* 加载状态 */
.freemind-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.freemind-loading-icon {
  font-size: 48px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.freemind-loading-text {
  font-size: 14px;
  color: var(--siyuan-secondary-text, #666);
}

/* 错误状态 */
.freemind-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.freemind-error-icon {
  font-size: 48px;
}

.freemind-error-text {
  font-size: 14px;
  color: #f56c6c;
}

/* 空状态 */
.freemind-empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 24px;
  max-width: 280px;
}

.empty-illustration {
  margin-bottom: 20px;
}

.mindmap-icon {
  width: 120px;
  height: 80px;
  opacity: 0.8;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--siyuan-text, #333);
  margin: 0 0 12px 0;
}

.empty-desc {
  font-size: 13px;
  color: var(--siyuan-secondary-text, #666);
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.add-demo-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-demo-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* 控制工具栏样式覆盖 */
.freemind-controls {
  background: var(--siyuan-block-bg, #fff);
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.freemind-controls button {
  color: var(--siyuan-text, #333);
}

.freemind-controls button:hover {
  background: var(--siyuan-hover-bg, #f5f5f5);
}

/* 深色主题适配 */
:deep(.vue-flow__background) {
  fill: var(--siyuan-bg, #fff);
}

:deep(.vue-flow__node) {
  cursor: pointer;
}

:deep(.vue-flow__edge-path) {
  stroke: var(--siyuan-border, #999);
  stroke-width: 2;
}

/* 跨分支关联边样式 */
:deep(.vue-flow__edge[data-is-cross-link="true"]) {
  pointer-events: all;
  cursor: pointer;
}

:deep(.vue-flow__edge[data-is-cross-link="true"] .vue-flow__edge-path) {
  stroke-dasharray: 5, 5;
  stroke: #FF6B6B;
  stroke-width: 2;
  transition: all 0.2s ease;
}

:deep(.vue-flow__edge[data-is-cross-link="true"].selected .vue-flow__edge-path) {
  stroke: #ff4757;
  stroke-width: 3;
  filter: drop-shadow(0 0 4px rgba(255, 71, 87, 0.5));
}

:deep(.vue-flow__edge[data-is-cross-link="true"]:hover .vue-flow__edge-path) {
  stroke: #ff6b81;
  stroke-width: 3;
}

/* 边标签样式 */
:deep(.vue-flow__edge-text) {
  font-size: 12px;
  font-weight: 500;
  pointer-events: all;
  cursor: pointer;
}

:deep(.vue-flow__connection-line) {
  stroke: #409eff;
  stroke-width: 2;
}

/* 框选区域样式 */
.selection-box {
  position: absolute;
  pointer-events: none;
  background: rgba(64, 158, 255, 0.1);
  border: 2px solid rgba(64, 158, 255, 0.8);
  border-radius: 4px;
  z-index: 1000;
  transition: background 0.1s ease;
}

/* 选中节点效果 */
:deep(.vue-flow__node.selected) {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

/* 布局切换动画 */
.node-transition {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.3s ease,
              width 0.3s ease,
              height 0.3s ease;
}

/* 节点进入动画 */
.node-enter-active {
  animation: nodeEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes nodeEnter {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 节点离开动画 */
.node-leave-active {
  animation: nodeLeave 0.3s ease-in;
}

@keyframes nodeLeave {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}

/* 布局切换淡入淡出 */
.layout-transition {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 连线动画 */
:deep(.vue-flow__edge-path) {
  transition: stroke-dashoffset 0.3s ease,
              stroke 0.3s ease,
              stroke-width 0.3s ease;
}

/* 连线进入动画 */
.edge-enter-active {
  animation: edgeAppear 0.3s ease-out;
}

@keyframes edgeAppear {
  from {
    opacity: 0;
    stroke-dashoffset: 100;
  }
  to {
    opacity: 1;
    stroke-dashoffset: 0;
  }
}

/* 画布缩放动画 */
:deep(.vue-flow__viewport) {
  transition: transform 0.2s ease-out;
}

/* 框选区域动画 */
.selection-box {
  animation: selectionBoxAppear 0.1s ease-out;
}

@keyframes selectionBoxAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 性能优化 - 硬件加速 */
:deep(.vue-flow__node),
:deep(.vue-flow__edge),
:deep(.vue-flow__viewport) {
  will-change: transform;
}

/* 减少动画对性能的影响 */
@media (prefers-reduced-motion: reduce) {
  .node-enter-active,
  .node-leave-active,
  .edge-enter-active,
  .layout-transition {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* 统计信息 */
.freemind-stats {
  position: absolute;
  bottom: 16px;
  left: 16px;
  padding: 8px 12px;
  background: var(--siyuan-block-bg, rgba(255, 255, 255, 0.9));
  border: 1px solid var(--siyuan-border, #e0e0e0);
  border-radius: 6px;
  font-size: 12px;
  color: var(--siyuan-secondary-text, #666);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
}

.freemind-stats-divider {
  color: var(--siyuan-border, #ccc);
}

.freemind-stats-search,
.freemind-stats-filter {
  color: var(--siyuan-primary, #409eff);
  font-weight: 500;
}

/* 深色主题适配 */
:deep(.vue-flow.dark) {
  --vf-bg: #1e1e1e;
  --vf-node-bg: #2d2d2d;
  --vf-node-border: #444;
  --vf-text-color: #e0e0e0;
}
</style>
