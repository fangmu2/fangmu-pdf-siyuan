/**
 * MarginNote 风格自由画布思维导图组合式函数
 * @fileoverview 封装自由画布思维导图的常用操作，包括键盘快捷键
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import { useFreeMindMapStore } from '@/stores/freeMindMapStore'
import type {
  FreeMindMapNode,
  FreeMindMapEdge,
  FreeMindMapNodeType,
  CreateNodeParams,
  UpdateNodeParams,
  CreateEdgeParams,
  ExportOptions,
  ExportResult,
  FreeMindMapLayout
} from '@/types/mindmapFree'
import { exportMindMap as exportMindMapUtil, autoLayout as autoLayoutUtil } from '@/services/freeMindMapService'

interface UseFreeMindMapOptions {
  /** 思维导图块 ID */
  blockId: string
  /** 学习集 ID */
  studySetId?: string
  /** 是否自动加载 */
  autoLoad?: boolean
  /** 是否启用键盘快捷键 */
  enableKeyboardShortcuts?: boolean
  /** 容器引用 */
  containerRef?: Ref<HTMLElement | null>
}

interface UseFreeMindMapReturn {
  // 状态
  nodes: Ref<FreeMindMapNode[]>
  edges: Ref<FreeMindMapEdge[]>
  isLoading: Ref<boolean>
  isLoaded: Ref<boolean>
  errorMessage: Ref<string>
  selectedNodes: Ref<FreeMindMapNode[]>

  // 计算属性
  nodeCount: Ref<number>
  edgeCount: Ref<number>

  // 初始化
  load: (blockId: string) => Promise<void>
  create: (blockId: string, studySetId: string) => Promise<void>

  // 节点操作
  addNode: (params: Omit<CreateNodeParams, 'position'> & { position?: { x: number; y: number } }) => FreeMindMapNode
  updateNode: (nodeId: string, params: UpdateNodeParams) => void
  removeNode: (nodeId: string) => void
  removeNodes: (nodeIds: string[]) => void
  duplicateNode: (nodeId: string) => FreeMindMapNode | null

  // 连线操作
  addEdge: (params: CreateEdgeParams) => FreeMindMapEdge
  removeEdge: (edgeId: string) => void

  // 选择操作
  selectNode: (nodeId: string, multi?: boolean) => void
  clearSelection: () => void
  selectAll: () => void

  // 视图操作
  fitView: () => void
  zoomIn: () => void
  zoomOut: () => void
  zoomReset: () => void
  setLayout: (layout: FreeMindMapLayout) => void

  // 导出
  exportMindMap: (options: ExportOptions) => Promise<ExportResult>

  // 保存
  save: () => Promise<void>

  // 重置
  reset: () => void

  // 键盘快捷键
  setupKeyboardShortcuts: () => void
  cleanupKeyboardShortcuts: () => void
}

/**
 * 自由画布思维导图组合式函数
 * @param options 配置选项
 * @returns 思维导图操作 API
 */
export function useFreeMindMap(
  options: UseFreeMindMapOptions
): UseFreeMindMapReturn {
  const {
    blockId,
    studySetId = '',
    autoLoad = true,
    enableKeyboardShortcuts = true,
    containerRef: externalContainerRef
  } = options

  // 使用 Store
  const store = useFreeMindMapStore()

  // 本地状态
  const internalContainerRef = ref<HTMLElement | null>(null)
  const containerRef = externalContainerRef || internalContainerRef

  // 从 Store 获取状态
  const nodes = computed(() => store.nodes).value as Ref<FreeMindMapNode[]>
  const edges = computed(() => store.edges).value as Ref<FreeMindMapEdge[]>
  const isLoading = computed(() => store.isLoading).value as Ref<boolean>
  const isLoaded = computed(() => store.isLoaded).value as Ref<boolean>
  const errorMessage = computed(() => store.errorMessage).value as Ref<string>
  const selectedNodes = computed(() => store.selectedNodes).value as Ref<FreeMindMapNode[]>

  // 计算属性
  const nodeCount = computed(() => store.nodeCount)
  const edgeCount = computed(() => store.edgeCount)

  // 键盘事件处理函数引用
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null

  // 初始化
  onMounted(() => {
    if (autoLoad && blockId) {
      load(blockId)
    }
    if (enableKeyboardShortcuts) {
      setupKeyboardShortcuts()
    }
  })

  onUnmounted(() => {
    cleanupKeyboardShortcuts()
    reset()
  })

  /**
   * 设置键盘快捷键
   */
  function setupKeyboardShortcuts(): void {
    keydownHandler = (e: KeyboardEvent) => {
      // 忽略输入框中的按键事件
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      const isCtrl = e.ctrlKey || e.metaKey

      // Ctrl/Cmd + S: 保存
      if (isCtrl && e.key === 's') {
        e.preventDefault()
        save()
      }

      // Ctrl/Cmd + F: 适应视图
      if (isCtrl && e.key === 'f') {
        e.preventDefault()
        fitView()
      }

      // Ctrl/Cmd + 0: 重置缩放
      if (isCtrl && e.key === '0') {
        e.preventDefault()
        zoomReset()
      }

      // Ctrl/Cmd + +/-: 缩放
      if (isCtrl && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        zoomIn()
      }
      if (isCtrl && e.key === '-') {
        e.preventDefault()
        zoomOut()
      }

      // Delete/Backspace: 删除选中节点
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        const selectedIds = store.selectedNodeIds
        if (selectedIds.length > 0) {
          store.removeNodes(selectedIds)
        }
      }

      // Ctrl/Cmd + A: 全选
      if (isCtrl && e.key === 'a') {
        e.preventDefault()
        selectAll()
      }

      // Ctrl/Cmd + D: 复制选中节点
      if (isCtrl && e.key === 'd') {
        e.preventDefault()
        const selectedIds = store.selectedNodeIds
        if (selectedIds.length === 1) {
          duplicateNode(selectedIds[0])
        }
      }

      // Escape: 清空选择
      if (e.key === 'Escape') {
        e.preventDefault()
        clearSelection()
      }

      // T: 添加文本卡片
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        addNode({ type: 'textCard', title: '新卡片' })
      }

      // G: 添加分组
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault()
        // 在画布中心添加分组
        const position = {
          x: 200,
          y: 200
        }
        store.createNode({
          type: 'group',
          title: '新分组',
          position
        })
      }
    }

    document.addEventListener('keydown', keydownHandler)
  }

  /**
   * 清理键盘快捷键
   */
  function cleanupKeyboardShortcuts(): void {
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler)
      keydownHandler = null
    }
  }

  /**
   * 加载思维导图
   */
  async function load(id: string): Promise<void> {
    await store.loadMindMap(id)
  }

  /**
   * 创建新思维导图
   */
  async function create(id: string, setId: string): Promise<void> {
    await store.createMindMap(id, setId)
  }

  /**
   * 添加节点
   */
  function addNode(
    params: Omit<CreateNodeParams, 'position'> & { position?: { x: number; y: number } }
  ): FreeMindMapNode {
    // 默认位置在画布中心附近
    const position = params.position || {
      x: Math.random() * 200 + 100,
      y: Math.random() * 200 + 100
    }

    return store.createNode({
      ...params,
      position
    })
  }

  /**
   * 复制节点
   */
  function duplicateNode(nodeId: string): FreeMindMapNode | null {
    const sourceNode = nodes.value.find(n => n.id === nodeId)
    if (!sourceNode) return null

    const newNode = store.createNode({
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

    // 复制样式
    if (sourceNode.data.color) {
      store.updateNode({
        id: newNode.id,
        color: sourceNode.data.color
      })
    }

    return newNode
  }

  /**
   * 更新节点
   */
  function updateNode(nodeId: string, params: UpdateNodeParams): void {
    store.updateNode(nodeId, params)
  }

  /**
   * 删除节点
   */
  function removeNode(nodeId: string): void {
    store.removeNode(nodeId)
  }

  /**
   * 批量删除节点
   */
  function removeNodes(nodeIds: string[]): void {
    store.removeNodes(nodeIds)
  }

  /**
   * 添加连线
   */
  function addEdge(params: CreateEdgeParams): FreeMindMapEdge {
    return store.createEdge(params)
  }

  /**
   * 删除连线
   */
  function removeEdge(edgeId: string): void {
    store.removeEdge(edgeId)
  }

  /**
   * 选择节点
   */
  function selectNode(nodeId: string, multi = false): void {
    store.selectNode(nodeId, multi)
  }

  /**
   * 清空选择
   */
  function clearSelection(): void {
    store.clearSelection()
  }

  /**
   * 适应画布
   */
  function fitView(): void {
    store.fitView()
  }

  /**
   * 全选
   */
  function selectAll(): void {
    nodes.value.forEach(node => {
      store.selectNode(node.id, true)
    })
  }

  /**
   * 放大
   */
  function zoomIn(): void {
    store.updateViewport({ zoom: Math.min(store.viewport.zoom * 1.2, 4) })
  }

  /**
   * 缩小
   */
  function zoomOut(): void {
    store.updateViewport({ zoom: Math.max(store.viewport.zoom / 1.2, 0.1) })
  }

  /**
   * 重置缩放
   */
  function zoomReset(): void {
    store.updateViewport({ zoom: 1, x: 0, y: 0 })
  }

  /**
   * 设置布局模式
   */
  function setLayout(layout: FreeMindMapLayout): void {
    store.setLayout(layout)
    if (layout !== 'free') {
      // 应用自动布局
      const direction = layout === 'vertical' ? 'vertical' : 'horizontal'
      const layoutNodes = autoLayoutUtil(nodes.value, edges.value, {
        direction,
        nodeSpacing: 250,
        levelSpacing: 150,
        center: true
      })
      // 更新节点位置
      layoutNodes.forEach((node, index) => {
        if (nodes.value[index]) {
          nodes.value[index].position = node.position
        }
      })
    }
  }

  /**
   * 导出思维导图
   */
  async function exportMindMap(options: ExportOptions): Promise<ExportResult> {
    return exportMindMapUtil(containerRef.value, options)
  }

  /**
   * 保存思维导图
   */
  async function save(): Promise<void> {
    await store.saveMindMap()
  }

  /**
   * 重置
   */
  function reset(): void {
    store.reset()
  }

  return {
    // 状态
    nodes,
    edges,
    isLoading,
    isLoaded,
    errorMessage,
    selectedNodes,
    // 计算属性
    nodeCount,
    edgeCount,
    // 方法
    load,
    create,
    addNode,
    updateNode,
    removeNode,
    removeNodes,
    duplicateNode,
    addEdge,
    removeEdge,
    selectNode,
    clearSelection,
    selectAll,
    fitView,
    zoomIn,
    zoomOut,
    zoomReset,
    setLayout,
    exportMindMap,
    save,
    reset,
    setupKeyboardShortcuts,
    cleanupKeyboardShortcuts
  }
}
