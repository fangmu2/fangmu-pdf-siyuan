/**
 * MarginNote 风格自由画布思维导图服务
 * @fileoverview 封装自由画布思维导图的数据操作和思源 API 交互
 * 集成数据持久化和标注数据同步功能
 */

import type {
  FreeMindMapOptions,
  FreeMindMapNode,
  FreeMindMapEdge,
  CreateNodeParams,
  UpdateNodeParams,
  CreateEdgeParams,
  AutoLayoutOptions,
  ExportOptions,
  ExportResult
} from '@/types/mindmapFree'
import { updateBlock, getBlock } from '@/api'
import {
  loadMindMapFromBlock,
  saveMindMapToBlock,
  getMindMapPdfPath,
  setMindMapPdfPath,
  getMindMapStudySetId,
  setMindMapStudySetId
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
    const defaultConfig = createDefaultMindMapConfig(blockId || 'temp-' + Date.now())
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
        readOnly: false
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
      layout: (attrs.mindmap_layout as FreeMindMapOptions['layout']) ||
            (attrs.custom_freemind_layout as FreeMindMapOptions['layout']) || 'free',
      nodes: parsed.nodes || [],
      edges: parsed.edges || [],
      viewport: parsed.viewport || { zoom: 1, x: 0, y: 0 },
      showGrid: parsed.showGrid !== false,
      showMiniMap: parsed.showMiniMap || false,
      showControls: parsed.showControls !== false,
      readOnly: parsed.readOnly || false
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
      layout: options.layout
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
      readOnly: options.readOnly
    }

    await updateBlock({
      dataType: 'markdown',
      data: '',
      id: options.id,
      attrs: {
        [MINDMAP_DATA_KEY]: JSON.stringify(data),
        mindmap_study_set_id: options.studySetId,
        mindmap_layout: options.layout
      }
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
    viewport: { zoom: 1, x: 0, y: 0 },
    showGrid: true,
    showMiniMap: false,
    showControls: true,
    readOnly: false
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
  blockId: string
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
  nodes: FreeMindMapNode[]
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
      isExpanded: true,  // 新增：默认展开
      sortOrder: 0,
      zIndex: 0,          // 新增：默认 Z 轴层级
      childrenIds: [],    // 新增：子节点 ID 列表
      relations: []       // 新增：跨分支关联
    },
    style: {
      width: params.type === 'textCard' ? '200px' : params.type === 'imageCard' ? '250px' : '400px',
      height: params.type === 'group' ? '300px' : undefined
    } as any,
    class: `node-${params.type}`,
    parentId: params.parentId,  // 新增：父节点 ID
    zIndex: 0                   // 新增：Z 轴层级
  }

  return node
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
      isExpanded: params.collapsed !== undefined ? !params.collapsed : node.data.isExpanded  // 兼容旧版 collapsed
    },
    position: params.position ?? node.position,
    style: {
      ...node.style,
      ...params.style
    }
  }
}

/**
 * 删除节点
 * @param nodes 节点列表
 * @param nodeId 要删除的节点 ID
 * @returns 删除后的节点列表
 */
export function deleteNode(nodes: FreeMindMapNode[], nodeId: string): FreeMindMapNode[] {
  return nodes.filter(n => n.id !== nodeId)
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
      strokeDasharray: params.type === 'default' ? '5,5' : undefined
    }
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
  return edges.filter(e => e.id !== edgeId)
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
  target: string
): FreeMindMapEdge[] {
  return edges.filter(e => !(e.source === source && e.target === target))
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
  options: AutoLayoutOptions
): FreeMindMapNode[] {
  const { direction, nodeSpacing, levelSpacing, center = true } = options

  // 构建层级关系
  const levelMap = new Map<string, number>()
  const childrenMap = new Map<string, string[]>()

  // 初始化
  nodes.forEach(node => {
    childrenMap.set(node.id, [])
    levelMap.set(node.id, 0)
  })

  // 根据连线计算层级
  edges.forEach(edge => {
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
  const rootNodes = nodes.filter(n => levelMap.get(n.id) === 0)

  // 计算每个节点的宽度位置
  const positionedNodes = new Map<string, { x: number; y: number }>()

  // 递归布局
  function layoutNode(nodeId: string, x: number, y: number, level: number): void {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    const nodeWidth = direction === 'horizontal' ? 200 : 250
    const nodeHeight = direction === 'horizontal' ? 100 : 80

    positionedNodes.set(nodeId, { x, y })

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
  let currentY = center ? 0 : 100

  rootNodes.forEach((root, index) => {
    layoutNode(root.id, currentX, currentY, 0)
    currentX += 400 // 多个根节点时错开
  })

  // 更新节点位置
  return nodes.map(node => {
    const pos = positionedNodes.get(node.id)
    if (pos) {
      return {
        ...node,
        position: pos
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
  startPosition: { x: number; y: number } = { x: 100, y: 100 }
): { nodes: FreeMindMapNode[]; edges: FreeMindMapEdge[] } {
  const nodes: FreeMindMapNode[] = []
  const edges: FreeMindMapEdge[] = []

  // 创建根节点
  const rootNode = createNode({
    type: 'textCard',
    title: '思维导图',
    content: '从标注自动生成',
    position: startPosition,
    annotationId: 'root'
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
        y: startPosition.y + Math.floor(index / 5) * 150
      },
      annotationId: annotation.id
    })

    // 设置颜色
    if (annotation.color) {
      node.data.color = annotation.color
      node.style = {
        ...node.style,
        borderColor: String(annotation.color)
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
      const parentNode = nodes.find(n => n.annotationId === annotation.parentId)
      if (parentNode) {
        edges.push(
          createEdge({
            source: parentNode.id,
            target: node.id,
            type: 'default'
          })
        )
      }
    } else {
      // 没有父节点，连接到根节点
      edges.push(
        createEdge({
          source: rootNode.id,
          target: node.id,
          type: 'default'
        })
      )
    }
  })

  return { nodes, edges }
}

/**
 * 导出思维导图为图片
 * @param container 画布容器元素
 * @param options 导出选项
 * @returns 导出结果
 */
export async function exportMindMap(
  container: HTMLElement | null,
  options: ExportOptions
): Promise<ExportResult> {
  if (!container) {
    return {
      success: false,
      data: '',
      error: '容器元素不存在'
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
        edges: []
      })
      return {
        success: true,
        data
      }
    }

    // 图片导出需要使用 html2canvas 或类似库
    // 这里返回一个占位实现
    return {
      success: false,
      data: '',
      error: '图片导出功能需要安装 html2canvas 库'
    }
  } catch (error) {
    return {
      success: false,
      data: '',
      error: error instanceof Error ? error.message : '导出失败'
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
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach(node => {
    const x = node.position.x
    const y = node.position.y
    const width = parseInt(node.style?.width as string) || 200
    const height = parseInt(node.style?.height as string) || 100

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
    height: maxY - minY
  }
}
