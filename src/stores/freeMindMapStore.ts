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
  FreeMindMapLayout,
  MindMapViewport,
  CreateNodeParams,
  UpdateNodeParams,
  CreateEdgeParams,
  CrossBranchLink,
  CrossLinkType
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
import { clipboardService, generateNewNodeId, generateNewEdgeId } from '@/services/clipboardService'

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

  /** 跨分支关联列表（虚线连接） */
  const crossBranchLinks = ref<CrossBranchLink[]>([])

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

  /** 获取跨分支关联数量 */
  const crossLinkCount = computed(() => crossBranchLinks.value.length)

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
   * 获取子节点列表
   * @param parentId 父节点 ID
   * @returns 子节点列表
   */
  function getChildren(parentId: string): FreeMindMapNode[] {
    return nodes.value.filter(n => n.parentId === parentId)
  }

  /**
   * 获取父节点
   * @param childId 子节点 ID
   * @returns 父节点，不存在则返回 null
   */
  function getParent(childId: string): FreeMindMapNode | null {
    const node = nodes.value.find(n => n.id === childId)
    if (!node || !node.parentId) return null
    return nodes.value.find(n => n.id === node.parentId) || null
  }

  /**
   * 设置父节点（建立父子关系）
   * @param childId 子节点 ID
   * @param parentId 父节点 ID
   */
  function setParent(childId: string, parentId: string): void {
    const child = nodes.value.find(n => n.id === childId)
    const parent = nodes.value.find(n => n.id === parentId)
    if (!child || !parent) return

    // 移除旧的父子关系
    if (child.parentId) {
      const oldParent = nodes.value.find(n => n.id === child.parentId)
      if (oldParent && oldParent.data.childrenIds) {
        oldParent.data.childrenIds = oldParent.data.childrenIds.filter(id => id !== childId)
      }
    }

    // 建立新的父子关系
    child.parentId = parentId
    if (!parent.data.childrenIds) {
      parent.data.childrenIds = []
    }
    if (!parent.data.childrenIds.includes(childId)) {
      parent.data.childrenIds.push(childId)
    }

    // 创建连线（如果不存在）
    const exists = edges.value.some(e => e.source === parentId && e.target === childId)
    if (!exists) {
      createEdge({ source: parentId, target: childId, type: 'default' })
    }
  }

  /**
   * 移除父节点（断开父子关系）
   * @param childId 子节点 ID
   */
  function removeParent(childId: string): void {
    const child = nodes.value.find(n => n.id === childId)
    if (!child || !child.parentId) return

    const parent = nodes.value.find(n => n.id === child.parentId)
    if (parent && parent.data.childrenIds) {
      parent.data.childrenIds = parent.data.childrenIds.filter(id => id !== childId)
    }

    // 删除父子连线
    edges.value = edges.value.filter(e => !(e.source === child.parentId && e.target === childId))
    child.parentId = undefined
  }

  /**
   * 切换节点展开/折叠状态
   * @param nodeId 节点 ID
   */
  function toggleNodeExpand(nodeId: string): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return

    // 同时更新 collapsed 和 isExpanded 保持兼容
    node.data.collapsed = !node.data.collapsed
    node.data.isExpanded = !node.data.collapsed
  }

  /**
   * 展开节点
   * @param nodeId 节点 ID
   */
  function expandNode(nodeId: string): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return
    node.data.collapsed = false
    node.data.isExpanded = true
  }

  /**
   * 折叠节点
   * @param nodeId 节点 ID
   */
  function collapseNode(nodeId: string): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return
    node.data.collapsed = true
    node.data.isExpanded = false
  }

  /**
   * 获取可见的子节点（考虑展开/折叠状态）
   * @param nodeId 节点 ID
   * @returns 可见的子节点列表
   */
  function getVisibleChildren(nodeId: string): FreeMindMapNode[] {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node || node.data.collapsed || !node.data.isExpanded) {
      return []
    }
    return getChildren(nodeId)
  }

  /**
   * 更新节点尺寸
   * @param nodeId 节点 ID
   * @param size 新尺寸
   */
  function updateNodeSize(nodeId: string, size: { width: number; height: number }): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return

    node.data.size = size
    node.style = {
      ...node.style,
      width: `${size.width}px`,
      height: `${size.height}px`
    }
  }

  /**
   * 将节点置于顶层
   * @param nodeId 节点 ID
   */
  function bringToFront(nodeId: string): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return

    const maxZ = Math.max(...nodes.value.map(n => n.zIndex || 0), 0)
    node.zIndex = maxZ + 1
    node.data.zIndex = maxZ + 1
  }

  /**
   * 添加跨分支关联
   * @param nodeId 节点 ID
   * @param targetNodeId 目标节点 ID
   * @param relationType 关联类型
   * @param label 关联标签
   */
  function addNodeRelation(
    nodeId: string,
    targetNodeId: string,
    relationType: 'dashed' | 'solid' = 'dashed',
    label?: string
  ): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return

    if (!node.data.relations) {
      node.data.relations = []
    }

    const relation = {
      id: `rel-${Date.now()}`,
      targetNodeId: targetNodeId,
      type: relationType,
      label: label || ''
    }

    node.data.relations.push(relation)
  }

  /**
   * 移除跨分支关联
   * @param nodeId 节点 ID
   * @param relationId 关联 ID
   */
  function removeNodeRelation(nodeId: string, relationId: string): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node || !node.data.relations) return

    node.data.relations = node.data.relations.filter(r => r.id !== relationId)
  }

  /**
   * 创建跨分支关联（虚线连接）
   * @param sourceNodeId 源节点 ID
   * @param targetNodeId 目标节点 ID
   * @param linkType 关联类型
   * @param label 关联标签
   * @param color 关联颜色
   */
  function createCrossBranchLink(
    sourceNodeId: string,
    targetNodeId: string,
    linkType: CrossLinkType = 'relation',
    label?: string,
    color?: string
  ): CrossBranchLink {
    // 检查是否已存在
    const exists = crossBranchLinks.value.some(
      link => link.sourceNodeId === sourceNodeId && link.targetNodeId === targetNodeId
    )
    if (exists) {
      throw new Error('该关联已存在')
    }

    const link: CrossBranchLink = {
      id: `cross-${Date.now()}`,
      sourceNodeId,
      targetNodeId,
      linkType,
      label: label || '',
      style: {
        strokeDasharray: '5,5', // 虚线样式
        stroke: color || '#FF6B6B', // 默认红色虚线
        strokeWidth: 2,
        hasArrow: true,
        arrowColor: color || '#FF6B6B'
      },
      createdAt: Date.now()
    }

    crossBranchLinks.value.push(link)

    // 同时在源节点上记录关联关系
    const sourceNode = nodes.value.find(n => n.id === sourceNodeId)
    if (sourceNode && !sourceNode.data.relations) {
      sourceNode.data.relations = []
    }
    if (sourceNode) {
      sourceNode.data.relations?.push({
        id: link.id,
        targetNodeId,
        type: 'dashed',
        label,
        color
      })
    }

    return link
  }

  /**
   * 删除跨分支关联
   * @param linkId 关联 ID
   */
  function removeCrossBranchLink(linkId: string): void {
    // 从 crossBranchLinks 中删除
    crossBranchLinks.value = crossBranchLinks.value.filter(l => l.id !== linkId)

    // 从节点的 relations 中删除
    nodes.value.forEach(node => {
      if (node.data.relations) {
        node.data.relations = node.data.relations.filter(r => r.id !== linkId)
      }
    })
  }

  /**
   * 更新跨分支关联
   * @param linkId 关联 ID
   * @param updateData 更新数据
   * @returns 更新后的关联
   */
  function updateCrossBranchLink(
    linkId: string,
    updateData: Partial<CrossBranchLink>
  ): CrossBranchLink | null {
    const linkIndex = crossBranchLinks.value.findIndex(l => l.id === linkId)
    if (linkIndex === -1) {
      console.warn('[FreeMindMapStore] 未找到关联:', linkId)
      return null
    }

    const link = crossBranchLinks.value[linkIndex]
    const updatedLink: CrossBranchLink = {
      ...link,
      ...updateData,
      style: {
        ...link.style,
        ...(updateData.style || {})
      }
    }

    crossBranchLinks.value[linkIndex] = updatedLink

    // 同时更新节点的 relations 中的标签
    if (updateData.label !== undefined) {
      const sourceNode = nodes.value.find(n => n.id === updatedLink.sourceNodeId)
      if (sourceNode?.data.relations) {
        const relation = sourceNode.data.relations.find(r => r.id === linkId)
        if (relation) {
          relation.label = updateData.label
        }
      }
    }

    // 同时更新颜色
    if (updateData.style?.stroke) {
      const sourceNode = nodes.value.find(n => n.id === updatedLink.sourceNodeId)
      if (sourceNode?.data.relations) {
        const relation = sourceNode.data.relations.find(r => r.id === linkId)
        if (relation) {
          relation.color = updateData.style.stroke
        }
      }
    }

    return updatedLink
  }

  /**
   * 获取节点的所有跨分支关联
   * @param nodeId 节点 ID
   * @returns 关联列表
   */
  function getNodeCrossLinks(nodeId: string): CrossBranchLink[] {
    return crossBranchLinks.value.filter(
      link => link.sourceNodeId === nodeId || link.targetNodeId === nodeId
    )
  }

  /**
   * 获取所有跨分支关联（用于渲染）
   */
  function getAllCrossLinks(): CrossBranchLink[] {
    return crossBranchLinks.value
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

  /**
   * 复制节点到剪贴板
   * @param nodeIds 要复制的节点 ID 列表
   */
  function copyNodes(nodeIds: string[]): void {
    const nodesToCopy = nodes.value.filter(n => nodeIds.includes(n.id))
    if (nodesToCopy.length === 0) {
      console.warn('[FreeMindMapStore] 没有要复制的节点')
      return
    }

    // 获取相关的连线
    const edgesToCopy = edges.value.filter(
      e => nodesToCopy.some(n => n.id === e.source || n.id === e.target)
    )

    clipboardService.copy(nodesToCopy, edgesToCopy, studySetId.value, currentMindMapId.value)
    console.log(`[FreeMindMapStore] 已复制 ${nodesToCopy.length} 个节点`)
  }

  /**
   * 剪切节点到剪贴板
   * @param nodeIds 要剪切的节点 ID 列表
   */
  function cutNodes(nodeIds: string[]): void {
    const nodesToCut = nodes.value.filter(n => nodeIds.includes(n.id))
    if (nodesToCut.length === 0) {
      console.warn('[FreeMindMapStore] 没有要剪切的节点')
      return
    }

    // 获取相关的连线
    const edgesToCut = edges.value.filter(
      e => nodesToCut.some(n => n.id === e.source || n.id === e.target)
    )

    // 复制到剪贴板
    clipboardService.copy(nodesToCut, edgesToCut, studySetId.value, currentMindMapId.value)

    // 删除原节点
    deleteNodes(nodeIds)
    console.log(`[FreeMindMapStore] 已剪切 ${nodesToCut.length} 个节点`)
  }

  /**
   * 从剪贴板粘贴节点
   * @param targetPosition 粘贴位置（可选，默认在视图中心）
   * @returns 新创建的节点 ID 列表
   */
  function pasteNodes(targetPosition?: { x: number; y: number }): string[] {
    const clipboardData = clipboardService.paste()
    if (!clipboardData || clipboardData.data.nodes.length === 0) {
      console.log('[FreeMindMapStore] 剪贴板为空，无法粘贴')
      return []
    }

    const { nodes: sourceNodes, edges: sourceEdges } = clipboardData.data

    // 计算粘贴偏移量
    const offset = calculatePasteOffset(sourceNodes, targetPosition)

    // 创建节点 ID 映射（旧 ID -> 新 ID）
    const idMap = new Map<string, string>()

    // 创建新节点
    const newNodes: FreeMindMapNode[] = []
    sourceNodes.forEach(node => {
      const newId = generateNewNodeId()
      idMap.set(node.id, newId)

      const newNode: FreeMindMapNode = {
        ...JSON.parse(JSON.stringify(node)), // 深度克隆
        id: newId,
        position: {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y
        },
        parentId: undefined, // 清除父子关系（跨画布时）
        selected: false
      }

      newNodes.push(newNode)
    })

    // 添加新节点到画布
    nodes.value.push(...newNodes)

    // 创建新连线
    const newEdges: FreeMindMapEdge[] = []
    sourceEdges.forEach(edge => {
      const newSource = idMap.get(edge.source)
      const newTarget = idMap.get(edge.target)

      if (!newSource || !newTarget) {
        // 如果连线的一端不在复制的节点中，跳过该连线
        return
      }

      const newEdge: FreeMindMapEdge = {
        ...JSON.parse(JSON.stringify(edge)),
        id: generateNewEdgeId(),
        source: newSource,
        target: newTarget,
        selected: false
      }

      newEdges.push(newEdge)
    })

    // 添加新连线到画布
    edges.value.push(...newEdges)

    // 选中新创建的节点
    const newNodeIds = newNodes.map(n => n.id)
    selectedNodeIds.value = newNodeIds

    console.log(`[FreeMindMapStore] 已粘贴 ${newNodes.length} 个节点和 ${newEdges.length} 个连线`)
    return newNodeIds
  }

  /**
   * 清空剪贴板
   */
  function clearClipboard(): void {
    clipboardService.clear()
  }

  /**
   * 检查剪贴板是否有数据
   */
  function hasClipboardData(): boolean {
    return clipboardService.hasData()
  }

  /**
   * 计算粘贴偏移量
   * @param nodes 要粘贴的节点列表
   * @param targetPosition 目标位置
   * @returns 偏移量
   */
  function calculatePasteOffset(
    nodes: FreeMindMapNode[],
    targetPosition?: { x: number; y: number }
  ): { x: number; y: number } {
    if (targetPosition) {
      return { x: targetPosition.x, y: targetPosition.y }
    }

    // 如果没有目标位置，使用视图中心
    if (nodes.length === 0) {
      return { x: 100, y: 100 }
    }

    // 计算节点中心
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    nodes.forEach(node => {
      if (node.position.x < minX) minX = node.position.x
      if (node.position.y < minY) minY = node.position.y
      if (node.position.x > maxX) maxX = node.position.x
      if (node.position.y > maxY) maxY = node.position.y
    })

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    // 计算视图中心的偏移
    const viewportCenterX = -viewport.value.x / viewport.value.zoom
    const viewportCenterY = -viewport.value.y / viewport.value.zoom

    return {
      x: viewportCenterX - centerX + 50, // 50px 偏移避免完全重叠
      y: viewportCenterY - centerY + 50
    }
  }

  return {
    // State
    currentMindMapId,
    studySetId,
    layout,
    nodes,
    edges,
    crossBranchLinks,
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
    crossLinkCount,
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
    deleteNodes,
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
    setShowMiniMap,
    // 新增：层级关系管理
    getChildren,
    getParent,
    setParent,
    removeParent,
    toggleNodeExpand,
    expandNode,
    collapseNode,
    getVisibleChildren,
    updateNodeSize,
    bringToFront,
    addNodeRelation,
    removeNodeRelation,
    // 新增：跨分支关联管理
    createCrossBranchLink,
    removeCrossBranchLink,
    updateCrossBranchLink,
    getNodeCrossLinks,
    getAllCrossLinks,
    // 新增：剪贴板功能
    copyNodes,
    cutNodes,
    pasteNodes,
    clearClipboard,
    hasClipboardData
  }
})
