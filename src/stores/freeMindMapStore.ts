/**
 * MarginNote 风格自由画布思维导图状态管理
 * @fileoverview 使用 Pinia 管理自由画布思维导图的全局状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  FreeMindMapOptions,
  FreeMindMapNode,
  FreeMindMapEdge,
  FreeMindMapNodeType,
  FreeMindMapLayout,
  MindMapViewport,
  CreateNodeParams,
  UpdateNodeParams,
  CreateEdgeParams
} from '@/types/mindmapFree'
import {
  getFreeMindMap,
  saveFreeMindMap,
  createNode as createNodeUtil,
  updateNode as updateNodeUtil,
  deleteNode as deleteNodeUtil,
  createEdge as createEdgeUtil,
  deleteEdge as deleteEdgeUtil,
  deleteEdgeBySourceTarget,
  autoLayout,
  calculateNodeBounds
} from '@/services/freeMindMapService'

/**
 * 自由画布思维导图 Store
 */
export const useFreeMindMapStore = defineStore('freeMindMap', () => {
  // ==================== State ====================

  /** 当前思维导图 ID */
  const currentMindMapId = ref<string>('')

  /** 所属学习集 ID */
  const studySetId = ref<string>('')

  /** 布局模式 */
  const layout = ref<FreeMindMapLayout>('free')

  /** 节点列表 */
  const nodes = ref<FreeMindMapNode[]>([])

  /** 连线列表 */
  const edges = ref<FreeMindMapEdge[]>([])

  /** 视图状态 */
  const viewport = ref<MindMapViewport>({
    zoom: 1,
    x: 0,
    y: 0
  })

  /** 是否显示网格背景 */
  const showGrid = ref(true)

  /** 是否显示迷你地图 */
  const showMiniMap = ref(false)

  /** 是否显示控制工具栏 */
  const showControls = ref(true)

  /** 是否只读模式 */
  const readOnly = ref(false)

  /** 选中的节点 ID 列表 */
  const selectedNodeIds = ref<string[]>([])

  /** 是否已加载 */
  const isLoaded = ref(false)

  /** 加载状态 */
  const isLoading = ref(false)

  /** 错误信息 */
  const errorMessage = ref<string>('')

  // ==================== Getters ====================

  /** 获取选中的节点 */
  const selectedNodes = computed(() => {
    return nodes.value.filter(n => selectedNodeIds.value.includes(n.id))
  })

  /** 获取节点数量 */
  const nodeCount = computed(() => nodes.value.length)

  /** 获取连线数量 */
  const edgeCount = computed(() => edges.value.length)

  /** 获取根节点（没有父节点的节点） */
  const rootNodes = computed(() => {
    const parentIds = new Set(edges.value.map(e => e.target))
    return nodes.value.filter(n => !parentIds.has(n.id))
  })

  /** 获取节点边界 */
  const bounds = computed(() => calculateNodeBounds(nodes.value))

  // ==================== Actions ====================

  /**
   * 加载思维导图
   * @param blockId 思维导图块 ID
   */
  async function loadMindMap(blockId: string): Promise<void> {
    console.log('[FreeMindMapStore] loadMindMap 开始, blockId:', blockId)
    isLoading.value = true
    errorMessage.value = ''

    try {
      const data = await getFreeMindMap(blockId)
      console.log('[FreeMindMapStore] getFreeMindMap 返回:', data)
      if (data) {
        currentMindMapId.value = data.id
        studySetId.value = data.studySetId
        layout.value = data.layout
        nodes.value = data.nodes as FreeMindMapNode[]
        edges.value = data.edges as FreeMindMapEdge[]
        viewport.value = data.viewport
        showGrid.value = data.showGrid
        showMiniMap.value = data.showMiniMap
        showControls.value = data.showControls
        readOnly.value = data.readOnly
        isLoaded.value = true
        console.log('[FreeMindMapStore] 数据已加载, nodes数量:', nodes.value?.length)
      } else {
        console.warn('[FreeMindMapStore] getFreeMindMap 返回 null')
        // 创建默认空数据
        nodes.value = []
        edges.value = []
        isLoaded.value = true
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '加载失败'
      console.error('[FreeMindMapStore] 加载思维导图失败:', error)
      // 出错时也要设置默认值
      nodes.value = []
      edges.value = []
      isLoaded.value = true
    } finally {
      isLoading.value = false
      console.log('[FreeMindMapStore] loadMindMap 完成, isLoading:', isLoading.value)
    }
  }

  /**
   * 保存思维导图
   */
  async function saveMindMap(): Promise<void> {
    if (!currentMindMapId.value) {
      errorMessage.value = '思维导图 ID 不存在'
      return
    }

    try {
      const options: FreeMindMapOptions = {
        id: currentMindMapId.value,
        studySetId: studySetId.value,
        layout: layout.value,
        nodes: nodes.value,
        edges: edges.value,
        viewport: viewport.value,
        showGrid: showGrid.value,
        showMiniMap: showMiniMap.value,
        showControls: showControls.value,
        readOnly: readOnly.value
      }

      await saveFreeMindMap(options)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '保存失败'
      console.error('[FreeMindMapStore] 保存思维导图失败:', error)
      throw error
    }
  }

  /**
   * 创建新思维导图
   * @param blockId 思维导图块 ID
   * @param _studySetId 学习集 ID
   */
  async function createMindMap(blockId: string, _studySetId: string): Promise<void> {
    currentMindMapId.value = blockId
    studySetId.value = _studySetId
    layout.value = 'free'
    nodes.value = []
    edges.value = []
    viewport.value = { zoom: 1, x: 0, y: 0 }
    showGrid.value = true
    showMiniMap.value = false
    showControls.value = true
    readOnly.value = false
    selectedNodeIds.value = []
    isLoaded.value = true

    // 创建根节点
    const rootNode = createNodeUtil({
      type: 'textCard',
      title: '中心主题',
      content: '双击编辑内容',
      position: { x: 0, y: 0 }
    })
    nodes.value.push(rootNode)

    await saveMindMap()
  }

  /**
   * 创建节点
   * @param params 创建参数
   */
  function createNode(params: CreateNodeParams): FreeMindMapNode {
    const node = createNodeUtil(params)
    nodes.value.push(node)
    return node
  }

  /**
   * 更新节点
   * @param params 更新参数（包含节点 ID）
   */
  function updateNode(params: UpdateNodeParams & { id: string }): void {
    const { id, ...updateData } = params
    const index = nodes.value.findIndex(n => n.id === id)
    if (index === -1) return

    const node = nodes.value[index]
    const updatedNode = updateNodeUtil(node, updateData)
    nodes.value[index] = updatedNode
  }

  /**
   * 删除节点
   * @param nodeId 节点 ID
   */
  function _deleteNodeInternal(nodeId: string): void {
    // 删除相关连线
    edges.value = edges.value.filter(
      e => e.source !== nodeId && e.target !== nodeId
    )

    // 删除节点
    nodes.value = deleteNodeUtil(nodes.value, nodeId)

    // 从选中列表移除
    selectedNodeIds.value = selectedNodeIds.value.filter(id => id !== nodeId)
  }

  /**
   * 删除节点（公开方法）
   * @param nodeId 节点 ID
   */
  function deleteNode(nodeId: string): void {
    _deleteNodeInternal(nodeId)
  }

  /**
   * 删除节点（别名，兼容 NodeEditDialog）
   * @param nodeId 节点 ID
   */
  function removeNode(nodeId: string): void {
    _deleteNodeInternal(nodeId)
  }

  /**
   * 批量删除节点
   * @param nodeIds 节点 ID 列表
   */
  function removeNodes(nodeIds: string[]): void {
    nodeIds.forEach(id => {
      // 删除相关连线
      edges.value = edges.value.filter(
        e => e.source !== id && e.target !== id
      )
    })

    // 删除节点
    nodes.value = nodes.value.filter(n => !nodeIds.includes(n.id))

    // 从选中列表移除
    selectedNodeIds.value = selectedNodeIds.value.filter(id => !nodeIds.includes(id))
  }

  /**
   * 批量删除节点（别名，兼容 FreeCanvasViewer）
   * @param nodeIds 节点 ID 列表
   */
  function deleteNodes(nodeIds: string[]): void {
    removeNodes(nodeIds)
  }


  /**
   * 创建连线
   * @param params 创建参数
   */
  function createEdge(params: CreateEdgeParams): FreeMindMapEdge {
    // 先删除已存在的连线
    edges.value = deleteEdgeBySourceTarget(edges.value, params.source, params.target)

    const edge = createEdgeUtil(params)
    edges.value.push(edge)
    return edge
  }

  /**
   * 删除连线
   * @param edgeId 连线 ID
   */
  function removeEdge(edgeId: string): void {
    edges.value = deleteEdgeUtil(edges.value, edgeId)
  }

  /**
   * 选择节点
   * @param nodeId 节点 ID
   * @param multi 是否多选
   */
  function selectNode(nodeId: string, multi = false): void {
    if (multi) {
      if (!selectedNodeIds.value.includes(nodeId)) {
        selectedNodeIds.value.push(nodeId)
      }
    } else {
      selectedNodeIds.value = [nodeId]
    }
  }

  /**
   * 取消选择节点
   * @param nodeId 节点 ID
   */
  function deselectNode(nodeId: string): void {
    selectedNodeIds.value = selectedNodeIds.value.filter(id => id !== nodeId)
  }

  /**
   * 清空选择
   */
  function clearSelection(): void {
    selectedNodeIds.value = []
  }

  /**
   * 更新视图
   * @param newViewport 新视图状态
   */
  function updateViewport(newViewport: Partial<MindMapViewport>): void {
    viewport.value = {
      ...viewport.value,
      ...newViewport
    }
  }

  /**
   * 自动布局
   * @param direction 布局方向
   */
  function applyAutoLayout(direction: 'horizontal' | 'vertical' = 'horizontal'): void {
    const layoutNodes = autoLayout(
      nodes.value,
      edges.value,
      {
        direction,
        nodeSpacing: 250,
        levelSpacing: 150,
        center: true
      }
    )
    nodes.value = layoutNodes

    // 居中视图
    const bounds = calculateNodeBounds(nodes.value)
    viewport.value = {
      zoom: 1,
      x: -bounds.minX + 100,
      y: -bounds.minY + 100
    }
  }

  /**
   * 适应画布（显示所有节点）
   */
  function fitView(): void {
    const bounds = calculateNodeBounds(nodes.value)
    if (bounds.width === 0 || bounds.height === 0) return

    // 计算合适的缩放比例
    const containerWidth = 800 // 假设容器宽度
    const containerHeight = 600 // 假设容器高度
    const scaleX = containerWidth / bounds.width
    const scaleY = containerHeight / bounds.height
    const zoom = Math.min(scaleX, scaleY, 1) * 0.9

    viewport.value = {
      zoom,
      x: -bounds.minX + (containerWidth - bounds.width * zoom) / (2 * zoom),
      y: -bounds.minY + (containerHeight - bounds.height * zoom) / (2 * zoom)
    }
  }

  /**
   * 重置思维导图
   */
  function reset(): void {
    currentMindMapId.value = ''
    studySetId.value = ''
    layout.value = 'free'
    nodes.value = []
    edges.value = []
    viewport.value = { zoom: 1, x: 0, y: 0 }
    showGrid.value = true
    showMiniMap.value = false
    showControls.value = true
    readOnly.value = false
    selectedNodeIds.value = []
    isLoaded.value = false
    isLoading.value = false
    errorMessage.value = ''
  }

  /**
   * 设置布局模式
   * @param newLayout 新布局模式
   */
  function setLayout(newLayout: FreeMindMapLayout): void {
    layout.value = newLayout
  }

  /**
   * 切换只读模式
   * @param value 只读状态
   */
  function setReadOnly(value: boolean): void {
    readOnly.value = value
  }

  /**
   * 切换网格显示
   * @param value 是否显示网格
   */
  function setShowGrid(value: boolean): void {
    showGrid.value = value
  }

  /**
   * 切换迷你地图显示
   * @param value 是否显示迷你地图
   */
  function setShowMiniMap(value: boolean): void {
    showMiniMap.value = value
  }

  return {
    // State
    currentMindMapId,
    studySetId,
    layout,
    nodes,
    edges,
    viewport,
    showGrid,
    showMiniMap,
    showControls,
    readOnly,
    selectedNodeIds,
    isLoaded,
    isLoading,
    errorMessage,
    // Getters
    selectedNodes,
    nodeCount,
    edgeCount,
    rootNodes,
    bounds,
    // Actions
    loadMindMap,
    saveMindMap,
    createMindMap,
    createNode,
    updateNode,
    removeNode,
    removeNodes,
    createEdge,
    removeEdge,
    selectNode,
    deselectNode,
    clearSelection,
    updateViewport,
    applyAutoLayout,
    fitView,
    reset,
    setLayout,
    setReadOnly,
    setShowGrid,
    setShowMiniMap
  }
})
