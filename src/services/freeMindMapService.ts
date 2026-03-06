/**
 * MarginNote 风格自由画布思维导图服务
 * @fileoverview 封装自由画布思维导图的数据操作和思源 API 交互
 * 集成数据持久化和标注数据同步功能
 */

import type {
  AutoLayoutOptions,
  CreateEdgeParams,
  CreateNodeParams,
  CrossBranchLink,
  ExportOptions,
  ExportResult,
  FreeMindMapEdge,
  FreeMindMapNode,
  FreeMindMapOptions,
  SubMindMap, // 新增：子脑图类型
  UpdateNodeParams,
} from '@/types/mindmapFree'
import {
  getBlock,
  updateBlock,
} from '@/api'
import {
  getMindMapPdfPath,
  getMindMapStudySetId,
  loadMindMapFromBlock,
  saveMindMapToBlock,
  setMindMapPdfPath,
  setMindMapStudySetId,
} from './freeMindMapDataIntegrationService'

/**
 * 思维导图数据键名（向后兼容）
 */
const MINDMAP_DATA_KEY = 'mindmap-free-data'

/**
 * 思维导图数据键名（新版本，使用统一前缀）
 */
const MINDMAP_DATA_KEY_NEW = 'custom-freemind-data'

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

/**
 * 验证块 ID 是否有效
 * @param id 块 ID
 *
 * 有效的块 ID 格式：
 * - 思源标准格式：20240101120000-abc1234 (14 位时间戳 + 7 位随机字符)
 * - 临时格式：temp-1709280000000-abc123 (用于 PDF 思维导图的 localStorage 映射)
 */
function isValidBlockId(id: string): boolean {
  if (!id) return false

  // 接受临时 ID 格式（用于 PDF 思维导图）
  if (id.startsWith('temp-')) {
    return true
  }

  // 思源标准块 ID 格式
  return id.length >= 22 && /^\d{14}-[a-z0-9]{7}$/.test(id)
}

/**
 * 获取思维导图数据
 * @param blockId 思维导图块 ID
 * @returns 思维导图配置
 */
export async function getFreeMindMap(blockId: string): Promise<FreeMindMapOptions | null> {
  console.log('[FreeMindMapService] getFreeMindMap 开始, blockId:', blockId)

  // 验证 blockId
  if (!isValidBlockId(blockId)) {
    console.warn('[FreeMindMapService] 无效的块 ID:', blockId)
    const defaultConfig = createDefaultMindMapConfig(blockId || `temp-${Date.now()}`)
    console.log('[FreeMindMapService] 返回默认配置:', defaultConfig)
    return defaultConfig
  }

  try {
    // 优先尝试从新的数据集成服务加载
    console.log('[FreeMindMapService] 尝试从数据集成服务加载...')
    const integratedData = await loadMindMapFromBlock(blockId)
    console.log('[FreeMindMapService] loadMindMapFromBlock 返回:', integratedData)
    if (integratedData) {
      // 获取关联的学习集 ID
      const studySetId = await getMindMapStudySetId(blockId)
      const pdfPath = await getMindMapPdfPath(blockId)

      return {
        id: blockId,
        studySetId: studySetId || '',
        layout: integratedData.layout,
        nodes: integratedData.nodes,
        edges: integratedData.edges,
        viewport: integratedData.viewport,
        showGrid: true,
        showMiniMap: false,
        showControls: true,
        readOnly: false,
      }
    }

    // 向后兼容：尝试从旧格式加载
    const block = await getBlock(blockId)
    if (!block) {
      return null
    }

    const attrs = (block as any).attrs || {}
    const dataStr = attrs[MINDMAP_DATA_KEY] || attrs[MINDMAP_DATA_KEY_NEW]

    if (!dataStr) {
      // 返回默认配置
      return createDefaultMindMapConfig(blockId)
    }

    const parsed = JSON.parse(dataStr)
    return {
      id: blockId,
      studySetId: attrs.mindmap_study_set_id || attrs.custom_freemind_studyset || '',
      layout: (attrs.mindmap_layout as FreeMindMapOptions['layout'])
        || (attrs.custom_freemind_layout as FreeMindMapOptions['layout']) || 'free',
      nodes: parsed.nodes || [],
      edges: parsed.edges || [],
      viewport: parsed.viewport || {
        zoom: 1,
        x: 0,
        y: 0,
      },
      showGrid: parsed.showGrid !== false,
      showMiniMap: parsed.showMiniMap || false,
      showControls: parsed.showControls !== false,
      readOnly: parsed.readOnly || false,
    }
  } catch (error) {
    console.error('[FreeMindMapService] 获取思维导图数据失败:', error)
    return createDefaultMindMapConfig(blockId)
  }
}

/**
 * 保存思维导图数据
 * @param options 思维导图配置
 */
export async function saveFreeMindMap(options: FreeMindMapOptions): Promise<void> {
  try {
    // 使用新的数据集成服务保存（思源块属性持久化）
    await saveMindMapToBlock(options.id, {
      nodes: options.nodes,
      edges: options.edges,
      viewport: options.viewport,
      layout: options.layout,
    })

    // 保存学习集 ID
    if (options.studySetId) {
      await setMindMapStudySetId(options.id, options.studySetId)
    }

    // 保存 PDF 路径（如果有）
    if ((options as any)._pdfPath) {
      await setMindMapPdfPath(options.id, (options as any)._pdfPath)
    }

    // 向后兼容：同时保存旧格式
    const data = {
      nodes: options.nodes,
      edges: options.edges,
      viewport: options.viewport,
      showGrid: options.showGrid,
      showMiniMap: options.showMiniMap,
      showControls: options.showControls,
      readOnly: options.readOnly,
    }

    await updateBlock({
      dataType: 'markdown',
      data: '',
      id: options.id,
      attrs: {
        [MINDMAP_DATA_KEY]: JSON.stringify(data),
        mindmap_study_set_id: options.studySetId,
        mindmap_layout: options.layout,
      },
    })
  } catch (error) {
    console.error('[FreeMindMapService] 保存思维导图数据失败:', error)
    throw error
  }
}

/**
 * 创建默认思维导图配置
 * @param blockId 思维导图块 ID
 * @returns 默认配置
 */
function createDefaultMindMapConfig(blockId: string): FreeMindMapOptions {
  return {
    id: blockId,
    studySetId: '',
    layout: 'free',
    nodes: [],
    edges: [],
    viewport: {
      zoom: 1,
      x: 0,
      y: 0,
    },
    showGrid: true,
    showMiniMap: false,
    showControls: true,
    readOnly: false,
  }
}

/**
 * 从 PDF 标注生成思维导图
 * @param pdfPath PDF 文件路径
 * @param blockId 思维导图块 ID
 * @returns 生成的节点列表
 */
export async function generateMindMapFromPdf(
  pdfPath: string,
  blockId: string,
): Promise<FreeMindMapNode[]> {
  const { generateMindMapFromPdfAnnotations } = await import('./freeMindMapDataIntegrationService')
  return generateMindMapFromPdfAnnotations(pdfPath, blockId)
}

/**
 * 同步思维导图节点到思源标注
 * @param blockId 思维导图块 ID
 * @param nodes 思维导图节点
 */
export async function syncMindMapToAnnotations(
  blockId: string,
  nodes: FreeMindMapNode[],
): Promise<void> {
  const { syncMindMapNodesToAnnotations } = await import('./freeMindMapDataIntegrationService')
  return syncMindMapNodesToAnnotations(blockId, nodes)
}

/**
 * 创建新节点
 * @param params 创建参数
 * @returns 新节点
 */
export function createNode(params: CreateNodeParams): FreeMindMapNode {
  const id = params.annotationId || params.cardId || generateId()

  const node: FreeMindMapNode = {
    id,
    type: params.type,
    position: params.position,
    data: {
      title: params.title,
      content: params.content || '',
      annotationId: params.annotationId,
      cardId: params.cardId,
      collapsed: false,
      isExpanded: true, // 新增：默认展开
      sortOrder: 0,
      zIndex: 0, // 新增：Z 轴层级
      childrenIds: [], // 新增：子节点 ID 列表
      relations: [], // 新增：跨分支关联
      // === MarginNote 4 兼容性字段 ===
      nodeType: 'normal',
      syncChanges: false,
    },
    style: {
      width: params.type === 'textCard' ? '200px' : params.type === 'imageCard' ? '250px' : '400px',
      height: params.type === 'group' ? '300px' : undefined,
    } as any,
    class: `node-${params.type}`,
    parentId: params.parentId, // 新增：父节点 ID
    zIndex: 0, // 新增：Z 轴层级
  }

  return node
}

/**
 * 创建克隆节点（复制内容，不同步修改）
 * @param sourceNode 源节点
 * @param position 新位置
 * @returns 克隆节点
 */
export function createCloneNode(
  sourceNode: FreeMindMapNode,
  position: { x: number, y: number },
): FreeMindMapNode {
  const newNode: FreeMindMapNode = {
    ...sourceNode,
    id: generateId(),
    position,
    data: {
      ...sourceNode.data,
      // === 克隆节点特有字段 ===
      nodeType: 'clone',
      sourceNodeId: sourceNode.id,
      syncChanges: false,
      // 复制内容但不复制关联 ID（避免冲突）
      annotationId: undefined,
      cardId: undefined,
    },
    style: { ...sourceNode.style },
    class: sourceNode.class,
    parentId: undefined, // 克隆节点独立
    zIndex: 0,
  }

  return newNode
}

/**
 * 创建引用节点（镜像节点，同步修改）
 * @param sourceNode 源节点
 * @param position 新位置
 * @returns 引用节点
 */
export function createReferenceNode(
  sourceNode: FreeMindMapNode,
  position: { x: number, y: number },
): FreeMindMapNode {
  const newNode: FreeMindMapNode = {
    ...sourceNode,
    id: generateId(),
    position,
    data: {
      ...sourceNode.data,
      // === 引用节点特有字段 ===
      nodeType: 'reference',
      sourceNodeId: sourceNode.id,
      syncChanges: true,
      // 保持关联 ID（同步需要）
      annotationId: sourceNode.data.annotationId,
      cardId: sourceNode.data.cardId,
    },
    style: { ...sourceNode.style },
    class: `${sourceNode.class} node-reference`,
    parentId: undefined, // 引用节点独立
    zIndex: 0,
  }

  return newNode
}

/**
 * 更新节点
 * @param node 原节点
 * @param params 更新参数
 * @returns 更新后的节点
 */
export function updateNode(node: FreeMindMapNode, params: UpdateNodeParams): FreeMindMapNode {
  return {
    ...node,
    data: {
      ...node.data,
      title: params.title ?? node.data.title,
      content: params.content ?? node.data.content,
      collapsed: params.collapsed ?? node.data.collapsed,
      isExpanded: params.collapsed !== undefined ? !params.collapsed : node.data.isExpanded, // 兼容旧版 collapsed
    },
    position: params.position ?? node.position,
    style: {
      ...node.style,
      ...params.style,
    },
  }
}

/**
 * 删除节点
 * @param nodes 节点列表
 * @param nodeId 要删除的节点 ID
 * @returns 删除后的节点列表
 */
export function deleteNode(nodes: FreeMindMapNode[], nodeId: string): FreeMindMapNode[] {
  return nodes.filter((n) => n.id !== nodeId)
}

/**
 * 查找所有引用指定节点的节点
 * @param sourceNodeId 源节点 ID
 * @param nodes 所有节点
 * @returns 引用节点列表
 */
export function findReferenceNodes(
  sourceNodeId: string,
  nodes: FreeMindMapNode[],
): FreeMindMapNode[] {
  return nodes.filter(
    (node) =>
      node.data.nodeType === 'reference'
      && node.data.sourceNodeId === sourceNodeId
      && node.data.syncChanges === true,
  )
}

/**
 * 同步更新引用节点
 * @param sourceNode 源节点
 * @param nodes 所有节点
 * @returns 更新后的节点列表
 */
export function syncReferenceNodeUpdates(
  sourceNode: FreeMindMapNode,
  nodes: FreeMindMapNode[],
): FreeMindMapNode[] {
  // 查找所有引用该节点的节点
  const references = findReferenceNodes(sourceNode.id, nodes)

  if (references.length === 0) {
    return nodes
  }

  console.log('[FreeMindMapService] 同步引用节点更新，引用数量:', references.length)

  // 同步更新所有引用节点
  return nodes.map((node) => {
    const reference = references.find((ref) => ref.id === node.id)
    if (reference) {
      return {
        ...node,
        data: {
          ...node.data,
          // 同步关键字段
          title: sourceNode.data.title,
          content: sourceNode.data.content,
          isExpanded: sourceNode.data.isExpanded,
          collapsed: sourceNode.data.collapsed,
          // 保持引用节点的独立字段
          nodeType: 'reference',
          sourceNodeId: sourceNode.id,
          syncChanges: true,
        },
        style: { ...sourceNode.style },
        class: `${sourceNode.class?.replace(' node-reference', '')} node-reference`,
      }
    }
    return node
  })
}

/**
 * 更新节点（带同步逻辑）
 * @param node 原节点
 * @param params 更新参数
 * @param allNodes 所有节点列表（用于同步引用节点）
 * @returns 更新后的节点列表
 */
export function updateNodeWithSync(
  node: FreeMindMapNode,
  params: UpdateNodeParams,
  allNodes: FreeMindMapNode[],
): FreeMindMapNode[] {
  // 1. 更新当前节点
  const updatedNode = updateNode(node, params)

  // 2. 如果是引用节点，找到源节点并反向同步
  if (node.data.nodeType === 'reference' && node.data.sourceNodeId) {
    const sourceNode = allNodes.find((n) => n.id === node.data.sourceNodeId)
    if (sourceNode) {
      // 更新源节点
      const updatedSource = updateNode(sourceNode, params)
      // 递归同步所有引用节点
      return syncReferenceNodeUpdates(updatedSource, allNodes)
    }
  }

  // 3. 如果是普通节点或克隆节点，同步所有引用节点
  const finalNodes = syncReferenceNodeUpdates(updatedNode, allNodes)

  // 4. 替换当前节点
  const index = finalNodes.findIndex((n) => n.id === node.id)
  if (index !== -1) {
    finalNodes[index] = updatedNode
  }

  return finalNodes
}

/**
 * 创建连线
 * @param params 创建参数
 * @returns 新连线
 */
export function createEdge(params: CreateEdgeParams): FreeMindMapEdge {
  const id = `${params.source}-${params.target}-${generateId()}`

  const edge: FreeMindMapEdge = {
    id,
    source: params.source,
    target: params.target,
    type: params.type || 'default',
    animated: true,
    style: {
      stroke: '#999',
      strokeWidth: 2,
      strokeDasharray: params.type === 'default' ? '5,5' : undefined,
    },
  }

  return edge
}

/**
 * 删除连线
 * @param edges 连线列表
 * @param edgeId 要删除的连线 ID
 * @returns 删除后的连线列表
 */
export function deleteEdge(edges: FreeMindMapEdge[], edgeId: string): FreeMindMapEdge[] {
  return edges.filter((e) => e.id !== edgeId)
}

/**
 * 根据源和目标删除连线
 * @param edges 连线列表
 * @param source 源节点 ID
 * @param target 目标节点 ID
 * @returns 删除后的连线列表
 */
export function deleteEdgeBySourceTarget(
  edges: FreeMindMapEdge[],
  source: string,
  target: string,
): FreeMindMapEdge[] {
  return edges.filter((e) => !(e.source === source && e.target === target))
}

/**
 * 自动布局（树状）
 * @param nodes 节点列表
 * @param edges 连线列表
 * @param options 布局选项
 * @returns 布局后的节点列表
 */
export function autoLayout(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
  options: AutoLayoutOptions,
): FreeMindMapNode[] {
  const {
    direction,
    nodeSpacing,
    levelSpacing,
    center = true,
  } = options

  // 构建层级关系
  const levelMap = new Map<string, number>()
  const childrenMap = new Map<string, string[]>()

  // 初始化
  nodes.forEach((node) => {
    childrenMap.set(node.id, [])
    levelMap.set(node.id, 0)
  })

  // 根据连线计算层级
  edges.forEach((edge) => {
    const children = childrenMap.get(edge.source) || []
    children.push(edge.target)
    childrenMap.set(edge.source, children)

    // 子节点层级 = 父节点层级 + 1
    const parentLevel = levelMap.get(edge.source) || 0
    const currentLevel = levelMap.get(edge.target) || 0
    if (currentLevel <= parentLevel) {
      levelMap.set(edge.target, parentLevel + 1)
    }
  })

  // 找到根节点（层级为 0 的节点）
  const rootNodes = nodes.filter((n) => levelMap.get(n.id) === 0)

  // 计算每个节点的宽度位置
  const positionedNodes = new Map<string, { x: number, y: number }>()

  // 递归布局
  function layoutNode(nodeId: string, x: number, y: number, level: number): void {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return

    const nodeWidth = direction === 'horizontal' ? 200 : 250
    const nodeHeight = direction === 'horizontal' ? 100 : 80

    positionedNodes.set(nodeId, {
      x,
      y,
    })

    const children = childrenMap.get(nodeId) || []
    if (children.length === 0) return

    // 计算子节点总宽度
    const totalChildrenWidth = children.length * nodeSpacing + (children.length - 1) * 20

    if (direction === 'horizontal') {
      // 水平布局：子节点在右侧
      const childStartX = x + nodeWidth + levelSpacing
      const childStartY = y - (totalChildrenWidth / 2) + (nodeWidth / 2)

      children.forEach((childId, index) => {
        const childY = childStartY + index * (nodeSpacing + 20)
        layoutNode(childId, childStartX, childY, level + 1)
      })
    } else {
      // 垂直布局：子节点在下方
      const childStartX = x - (totalChildrenWidth / 2) + (nodeWidth / 2)
      const childStartY = y + nodeHeight + levelSpacing

      children.forEach((childId, index) => {
        const childX = childStartX + index * (nodeSpacing + 20)
        layoutNode(childId, childX, childStartY, level + 1)
      })
    }
  }

  // 从根节点开始布局
  let currentX = center ? 0 : 100
  const currentY = center ? 0 : 100

  rootNodes.forEach((root, index) => {
    layoutNode(root.id, currentX, currentY, 0)
    currentX += 400 // 多个根节点时错开
  })

  // 更新节点位置
  return nodes.map((node) => {
    const pos = positionedNodes.get(node.id)
    if (pos) {
      return {
        ...node,
        position: pos,
      }
    }
    return node
  })
}

/**
 * 从标注数据创建思维导图节点
 * @param annotations 标注数据列表
 * @param startPosition 起始位置
 * @returns 节点和连线列表
 */
export function createNodesFromAnnotations(
  annotations: Array<{
    id: string
    text: string
    note?: string
    page?: number
    color?: string
    level?: string
    parentId?: string
  }>,
  startPosition: { x: number, y: number } = {
    x: 100,
    y: 100,
  },
): { nodes: FreeMindMapNode[], edges: FreeMindMapEdge[] } {
  const nodes: FreeMindMapNode[] = []
  const edges: FreeMindMapEdge[] = []

  // 创建根节点
  const rootNode = createNode({
    type: 'textCard',
    title: '思维导图',
    content: '从标注自动生成',
    position: startPosition,
    annotationId: 'root',
  })
  nodes.push(rootNode)

  // 为每个标注创建节点
  annotations.forEach((annotation, index) => {
    const node = createNode({
      type: annotation.text ? 'textCard' : 'imageCard',
      title: annotation.text?.substring(0, 50) || '图片摘录',
      content: annotation.note || '',
      position: {
        x: startPosition.x + (index % 5) * 250,
        y: startPosition.y + Math.floor(index / 5) * 150,
      },
      annotationId: annotation.id,
    })

    // 设置颜色
    if (annotation.color) {
      node.data.color = annotation.color
      node.style = {
        ...node.style,
        borderColor: String(annotation.color),
      }
    }

    // 设置页码
    if (annotation.page) {
      node.data.page = annotation.page
    }

    // 设置层级
    if (annotation.level) {
      node.data.level = annotation.level
    }

    nodes.push(node)

    // 如果有父节点，创建连线
    if (annotation.parentId) {
      const parentNode = nodes.find((n) => n.annotationId === annotation.parentId)
      if (parentNode) {
        edges.push(
          createEdge({
            source: parentNode.id,
            target: node.id,
            type: 'default',
          }),
        )
      }
    } else {
      // 没有父节点，连接到根节点
      edges.push(
        createEdge({
          source: rootNode.id,
          target: node.id,
          type: 'default',
        }),
      )
    }
  })

  return {
    nodes,
    edges,
  }
}

/**
 * 导出思维导图为图片
 * @param container 画布容器元素
 * @param options 导出选项
 * @returns 导出结果
 */
export async function exportMindMap(
  container: HTMLElement | null,
  options: ExportOptions,
): Promise<ExportResult> {
  if (!container) {
    return {
      success: false,
      data: '',
      error: '容器元素不存在',
    }
  }

  try {
    if (options.format === 'json') {
      // 导出为 JSON
      const data = JSON.stringify({
        format: 'freemindmap',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        nodes: [],
        edges: [],
      })
      return {
        success: true,
        data,
      }
    }

    // 图片导出需要使用 html2canvas 或类似库
    // 这里返回一个占位实现
    return {
      success: false,
      data: '',
      error: '图片导出功能需要安装 html2canvas 库',
    }
  } catch (error) {
    return {
      success: false,
      data: '',
      error: error instanceof Error ? error.message : '导出失败',
    }
  }
}

/**
 * 计算节点边界
 * @param nodes 节点列表
 * @returns 边界框
 */
export function calculateNodeBounds(nodes: FreeMindMapNode[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
} {
  if (nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
    }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach((node) => {
    const x = node.position.x
    const y = node.position.y
    const width = Number.parseInt(node.style?.width as string) || 200
    const height = Number.parseInt(node.style?.height as string) || 100

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)
  })

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * 更新跨分支关联样式
 * @param link 关联线
 * @param updateData 更新数据
 * @returns 更新后的关联线
 */
export function updateCrossBranchLinkUtil(
  link: CrossBranchLink,
  updateData: Partial<CrossBranchLink>,
): CrossBranchLink {
  return {
    ...link,
    ...updateData,
    style: {
      ...link.style,
      ...(updateData.style || {}),
    },
  }
}

// ==================== 子脑图功能 ====================

/**
 * 创建子脑图
 * @param parentMapId 父脑图 ID
 * @param title 子脑图标题
 * @param rootNode 根节点
 * @returns 子脑图对象
 */
export function createSubMindMap(
  parentMapId: string,
  title: string,
  rootNode: FreeMindMapNode,
): SubMindMap {
  const now = Date.now()
  const subMapId = `submap_${now}_${generateId()}`

  // 创建根节点（更新为 submap 类型）
  const subMapRootNode = {
    ...rootNode,
    id: `${subMapId}_root`,
    data: {
      ...rootNode.data,
      nodeType: 'submap' as const,
      subMapId,
      subMapNodeCount: 0,
      subMapSummary: `子脑图：${title}`,
    },
  }

  return {
    id: subMapId,
    parentMapId,
    rootNodeId: subMapRootNode.id,
    title,
    summary: `子脑图包含 "${title}" 的详细内容`,
    nodes: [subMapRootNode],
    edges: [],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 删除子脑图
 * @param subMapId 子脑图 ID
 * @param allSubMaps 所有子脑图列表
 * @returns 删除后的子脑图列表
 */
export function deleteSubMindMap(
  subMapId: string,
  allSubMaps: SubMindMap[],
): SubMindMap[] {
  return allSubMaps.filter((sm) => sm.id !== subMapId)
}

/**
 * 将节点转换为子脑图节点
 * @param node 要转换的节点
 * @param subMap 子脑图对象
 * @returns 更新后的节点
 */
export function convertNodeToSubMapNode(
  node: FreeMindMapNode,
  subMap: SubMindMap,
): FreeMindMapNode {
  return {
    ...node,
    data: {
      ...node.data,
      nodeType: 'submap',
      subMapId: subMap.id,
      subMapNodeCount: subMap.nodes.length,
      subMapSummary: subMap.summary,
    },
  }
}

/**
 * 更新子脑图统计信息
 * @param subMap 子脑图
 * @returns 更新后的子脑图
 */
export function updateSubMapStats(subMap: SubMindMap): SubMindMap {
  return {
    ...subMap,
    summary: `包含 ${subMap.nodes.length} 个节点，${subMap.edges.length} 条连线`,
    updatedAt: Date.now(),
  }
}

// ==================== 脑图切换逻辑 ====================

/**
 * 脑图导航历史项
 */
export interface MindMapHistoryItem {
  /** 脑图 ID */
  mapId: string
  /** 脑图标题 */
  title: string
  /** 深度（0=主脑图，1=子脑图，以此类推） */
  depth: number
  /** 进入时间 */
  timestamp: number
}

/**
 * 脑图导航历史
 */
export interface MindMapNavigationHistory {
  /** 历史记录 */
  history: MindMapHistoryItem[]
  /** 当前位置索引 */
  currentIndex: number
}

/**
 * 创建导航历史
 * @param rootMapId 根脑图 ID
 * @param rootTitle 根脑图标题
 * @returns 导航历史对象
 */
export function createNavigationHistory(
  rootMapId: string,
  rootTitle: string,
): MindMapNavigationHistory {
  return {
    history: [
      {
        mapId: rootMapId,
        title: rootTitle,
        depth: 0,
        timestamp: Date.now(),
      },
    ],
    currentIndex: 0,
  }
}

/**
 * 进入子脑图
 * @param history 当前导航历史
 * @param subMapId 子脑图 ID
 * @param subMapTitle 子脑图标题
 * @returns 更新后的导航历史
 */
export function navigateToSubMap(
  history: MindMapNavigationHistory,
  subMapId: string,
  subMapTitle: string,
): MindMapNavigationHistory {
  const currentItem = history.history[history.currentIndex]
  const newDepth = currentItem.depth + 1

  // 裁剪当前位置之后的历史记录
  const newHistory = history.history.slice(0, history.currentIndex + 1)

  // 添加新的历史记录
  newHistory.push({
    mapId: subMapId,
    title: subMapTitle,
    depth: newDepth,
    timestamp: Date.now(),
  })

  return {
    history: newHistory,
    currentIndex: newHistory.length - 1,
  }
}

/**
 * 返回上级脑图
 * @param history 当前导航历史
 * @returns 更新后的导航历史，如果已经在根节点则返回 null
 */
export function navigateToParent(
  history: MindMapNavigationHistory,
): MindMapNavigationHistory | null {
  if (history.currentIndex <= 0) {
    return null // 已经在根节点
  }

  return {
    ...history,
    currentIndex: history.currentIndex - 1,
  }
}

/**
 * 跳转到指定历史位置
 * @param history 当前导航历史
 * @param index 目标位置索引
 * @returns 更新后的导航历史
 */
export function navigateToHistory(
  history: MindMapNavigationHistory,
  index: number,
): MindMapNavigationHistory {
  if (index < 0 || index >= history.history.length) {
    return history
  }

  return {
    ...history,
    currentIndex: index,
  }
}

/**
 * 获取当前脑图信息
 * @param history 导航历史
 * @returns 当前脑图信息
 */
export function getCurrentMindMap(
  history: MindMapNavigationHistory,
): MindMapHistoryItem {
  return history.history[history.currentIndex]
}

/**
 * 获取面包屑导航路径
 * @param history 导航历史
 * @returns 面包屑路径数组
 */
export function getBreadcrumbPath(
  history: MindMapNavigationHistory,
): MindMapHistoryItem[] {
  return history.history.slice(0, history.currentIndex + 1)
}

/**
 * 将关联线数据序列化保存
 * @param links 关联线列表
 * @returns 序列化后的字符串
 */
export function serializeCrossBranchLinks(links: CrossBranchLink[]): string {
  return JSON.stringify(links.map((link) => ({
    id: link.id,
    sourceNodeId: link.sourceNodeId,
    targetNodeId: link.targetNodeId,
    linkType: link.linkType,
    label: link.label,
    style: link.style,
    createdAt: link.createdAt,
  })))
}

/**
 * 从序列化数据解析关联线
 * @param dataStr 序列化字符串
 * @returns 关联线列表
 */
export function deserializeCrossBranchLinks(dataStr: string): CrossBranchLink[] {
  try {
    const parsed = JSON.parse(dataStr)
    return parsed.map((item: any) => ({
      ...item,
      style: {
        strokeDasharray: item.style?.strokeDasharray || '5,5',
        stroke: item.style?.stroke || '#FF6B6B',
        strokeWidth: item.style?.strokeWidth || 2,
        hasArrow: item.style?.hasArrow ?? true,
        arrowColor: item.style?.arrowColor || item.style?.stroke || '#FF6B6B',
      },
    }))
  } catch (error) {
    console.error('[FreeMindMapService] 解析关联线数据失败:', error)
    return []
  }
}
