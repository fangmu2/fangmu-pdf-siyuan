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
import TextCardNode from './TextCardNode.vue'
import ImageCardNode from './ImageCardNode.vue'
import GroupNode from './GroupNode.vue'
import NodeEditDialog from './NodeEditDialog.vue'
import NodeContextMenu from './NodeContextMenu.vue'
import CanvasToolbar from './CanvasToolbar.vue'
import MindMapSearch from './MindMapSearch.vue'
import NodeFilterPanel from './NodeFilterPanel.vue'
import { useMindMapSearch } from '@/composables/useMindMapSearch'
import type {
  FreeMindMapNode,
  FreeMindMapEdge,
  FreeMindMapNodeData,
  FreeMindMapNodeType,
  FreeMindMapLayout
} from '@/types/mindmapFree'
import type { MindMapFilter } from '@/types/mindMapSearch'

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

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuTarget = ref<{ type: 'node' | 'pane'; nodeId?: string } | null>(null)

// 全屏状态
const isFullscreen = ref(false)

// 搜索和过滤 UI 状态
const showSearchUI = ref(props.showSearch)
const showFilterUI = ref(props.showFilter)

// 使用 Store
const store = useFreeMindMapStore()
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
  console.log('[FreeCanvasViewer] 已注册 annotation-created 事件监听');
})

// 清理
onUnmounted(() => {
  stopAutoSave()
  disposeSearch()
  window.removeEventListener('message', handlePostMessage)
  window.removeEventListener('annotation-created', handleAnnotationCreated as EventListener)
  console.log('[FreeCanvasViewer] 已移除事件监听');
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
    annotationId: annotation.id
  });

  console.log('[FreeCanvasViewer] 从摘录创建节点:', newNode.id);
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

  // 判断点击的是节点还是画布
  const target = event.target as HTMLElement
  const nodeElement = target.closest('.vue-flow__node')

  if (nodeElement) {
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
  emit('edgeClick', edge)
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
 * 节点拖拽结束
 */
function onNodeDragStop(_event: NodeDragEvent): void {
  debouncedSave()
}

/**
 * 清空选择
 */
function onPaneClick(_event: PaneClickEvent): void {
  store.clearSelection()
}

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
 * 处理节点缩放
 */
function handleResize(nodeId: string, size: { width: number; height: number }): void {
  store.updateNodeSize(nodeId, size)
}

/**
 * 处理节点缩放结束
 */
function handleResizeEnd(nodeId: string): void {
  console.log('[FreeCanvasViewer] 结束缩放节点:', nodeId)
  debouncedSave()
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
      :nodes="visibleNodes"
      :edges="edges || []"
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
      @node-mouse-enter="onNodeMouseEnter"
      @node-mouse-leave="onNodeMouseLeave"
      @edge-mouse-enter="onEdgeMouseEnter"
      @edge-mouse-leave="onEdgeMouseLeave"
      @node-drag-stop="onNodeDragStop"
      @pane-click="onPaneClick"
      @contextmenu="onContextMenu"
    >
      <!-- 背景网格 -->
      <Background
        v-if="showGrid"
        :color="isDarkMode ? '#444' : '#ccc'"
        :gap="20"
        :size="1"
      />

      <!-- 控制工具栏 -->
      <Controls
        v-if="showControls"
        class="freemind-controls"
        :show-interactive="false"
      />
    </VueFlow>

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
      <span>连线：{{ edges?.length || 0 }}</span>
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
      :read-only="readOnly"
      @edit="handleContextMenuEdit"
      @delete="handleContextMenuDelete"
      @duplicate="handleContextMenuDuplicate"
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

:deep(.vue-flow__connection-line) {
  stroke: #409eff;
  stroke-width: 2;
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
