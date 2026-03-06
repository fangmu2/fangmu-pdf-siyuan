/**
 * 思维导图链接图谱增强服务
 * @fileoverview 提供跨分支关联、远程知识联系、一键跳转等功能
 */

import type {
  CrossBranchLink,
  FreeMindMapEdge,
  FreeMindMapNode,
  LayoutSuggestion,
  NodeLinkRelation,
  RemoteKnowledgeLink,
  ViewportFocusConfig,
} from '@/types/mindmapFree'
import {
  getBlockAttrs,
  setBlockAttrs,
} from '@/api'

/**
 * 思源块属性键名
 */
const CROSS_LINKS_KEY = 'custom-mindmap-crosslinks'
const REMOTE_LINKS_KEY = 'custom-mindmap-remotelinks'

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

/**
 * 验证块 ID 是否有效
 */
function isValidBlockId(id: string): boolean {
  return !!id && id.length >= 22 && /^\d{14}-[a-z0-9]{7}$/.test(id)
}

// ==================== 跨分支关联管理 ====================

/**
 * 创建跨分支关联（虚线连接）
 * @param mindMapBlockId 思维导图块 ID
 * @param sourceNodeId 源节点 ID
 * @param targetNodeId 目标节点 ID
 * @param linkType 关联类型
 * @param label 关联说明/标签
 * @returns 跨分支关联
 */
export async function createCrossBranchLink(
  mindMapBlockId: string,
  sourceNodeId: string,
  targetNodeId: string,
  linkType: 'relation' | 'seeAlso' | 'contrast' | 'cause' | 'example' = 'relation',
  label?: string,
): Promise<CrossBranchLink | null> {
  // 验证块 ID
  if (!isValidBlockId(mindMapBlockId)) {
    console.warn('[MindMapLinkEnhanceService] 无效的块 ID:', mindMapBlockId)
    return null
  }

  try {
    const crossLink: CrossBranchLink = {
      id: generateId(),
      sourceNodeId,
      targetNodeId,
      linkType,
      label,
      style: {
        strokeDasharray: '5,5',
        stroke: getLinkColorByType(linkType),
        strokeWidth: 2,
        hasArrow: true,
        arrowColor: getLinkColorByType(linkType),
      },
      createdAt: now(),
    }

    // 保存到思源块属性
    await saveCrossLinksToBlock(mindMapBlockId, crossLink)

    return crossLink
  } catch (error) {
    console.error('[MindMapLinkEnhanceService] 创建跨分支关联失败:', error)
    return null
  }
}

/**
 * 获取跨分支关联列表
 * @param mindMapBlockId 思维导图块 ID
 * @returns 跨分支关联列表
 */
export async function getCrossBranchLinks(mindMapBlockId: string): Promise<CrossBranchLink[]> {
  // 验证块 ID
  if (!isValidBlockId(mindMapBlockId)) {
    console.warn('[MindMapLinkEnhanceService] 无效的块 ID:', mindMapBlockId)
    return []
  }

  try {
    const attrs = await getBlockAttrs(mindMapBlockId)
    if (!attrs) return []

    const linksStr = attrs[CROSS_LINKS_KEY]
    if (!linksStr) return []

    const parsed = JSON.parse(linksStr)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('[MindMapLinkEnhanceService] 获取跨分支关联失败:', error)
    return []
  }
}

/**
 * 删除跨分支关联
 * @param mindMapBlockId 思维导图块 ID
 * @param linkId 关联 ID
 * @returns 是否成功
 */
export async function deleteCrossBranchLink(
  mindMapBlockId: string,
  linkId: string,
): Promise<boolean> {
  // 验证块 ID
  if (!isValidBlockId(mindMapBlockId)) {
    console.warn('[MindMapLinkEnhanceService] 无效的块 ID:', mindMapBlockId)
    return false
  }

  try {
    const links = await getCrossBranchLinks(mindMapBlockId)
    const filteredLinks = links.filter((l) => l.id !== linkId)

    await setBlockAttrs(mindMapBlockId, {
      [CROSS_LINKS_KEY]: JSON.stringify(filteredLinks),
    })

    return true
  } catch (error) {
    console.error('[MindMapLinkEnhanceService] 删除跨分支关联失败:', error)
    return false
  }
}

/**
 * 根据关联类型获取连线颜色
 */
function getLinkColorByType(type: string): string {
  const colors: Record<string, string> = {
    relation: '#409eff', // 蓝色 - 关联
    seeAlso: '#67c23a', // 绿色 - 参见
    contrast: '#e6a23c', // 橙色 - 对比
    cause: '#f56c6c', // 红色 - 因果
    example: '#909399', // 灰色 - 示例
  }
  return colors[type] || '#409eff'
}

/**
 * 保存跨分支关联到块属性
 */
async function saveCrossLinksToBlock(mindMapBlockId: string, link: CrossBranchLink): Promise<void> {
  const links = await getCrossBranchLinks(mindMapBlockId)
  links.push(link)

  await setBlockAttrs(mindMapBlockId, {
    [CROSS_LINKS_KEY]: JSON.stringify(links),
  })
}

// ==================== 远程知识联系管理 ====================

/**
 * 创建远程知识联系
 * @param mindMapBlockId 思维导图块 ID
 * @param sourceNodeId 源节点 ID
 * @param targetId 目标 ID
 * @param targetType 目标类型
 * @param linkType 联系类型
 * @param description 联系说明
 * @param targetTitle 目标标题
 * @returns 远程知识联系
 */
export async function createRemoteKnowledgeLink(
  mindMapBlockId: string,
  sourceNodeId: string,
  targetId: string,
  targetType: 'node' | 'annotation' | 'document' | 'external',
  linkType: 'reference' | 'relation' | 'seeAlso' | 'quote' = 'relation',
  description?: string,
  targetTitle?: string,
): Promise<RemoteKnowledgeLink | null> {
  // 验证块 ID
  if (!isValidBlockId(mindMapBlockId)) {
    console.warn('[MindMapLinkEnhanceService] 无效的块 ID:', mindMapBlockId)
    return null
  }

  try {
    const remoteLink: RemoteKnowledgeLink = {
      id: generateId(),
      sourceNodeId,
      targetType,
      targetId,
      linkType,
      description,
      targetTitle,
      createdAt: now(),
    }

    // 保存到思源块属性
    await saveRemoteLinksToBlock(mindMapBlockId, remoteLink)

    return remoteLink
  } catch (error) {
    console.error('[MindMapLinkEnhanceService] 创建远程知识联系失败:', error)
    return null
  }
}

/**
 * 获取远程知识联系列表
 * @param mindMapBlockId 思维导图块 ID
 * @returns 远程知识联系列表
 */
export async function getRemoteKnowledgeLinks(mindMapBlockId: string): Promise<RemoteKnowledgeLink[]> {
  // 验证块 ID
  if (!isValidBlockId(mindMapBlockId)) {
    console.warn('[MindMapLinkEnhanceService] 无效的块 ID:', mindMapBlockId)
    return []
  }

  try {
    const attrs = await getBlockAttrs(mindMapBlockId)
    if (!attrs) return []

    const linksStr = attrs[REMOTE_LINKS_KEY]
    if (!linksStr) return []

    const parsed = JSON.parse(linksStr)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('[MindMapLinkEnhanceService] 获取远程知识联系失败:', error)
    return []
  }
}

/**
 * 删除远程知识联系
 * @param mindMapBlockId 思维导图块 ID
 * @param linkId 联系 ID
 * @returns 是否成功
 */
export async function deleteRemoteKnowledgeLink(
  mindMapBlockId: string,
  linkId: string,
): Promise<boolean> {
  // 验证块 ID
  if (!isValidBlockId(mindMapBlockId)) {
    console.warn('[MindMapLinkEnhanceService] 无效的块 ID:', mindMapBlockId)
    return false
  }

  try {
    const links = await getRemoteKnowledgeLinks(mindMapBlockId)
    const filteredLinks = links.filter((l) => l.id !== linkId)

    await setBlockAttrs(mindMapBlockId, {
      [REMOTE_LINKS_KEY]: JSON.stringify(filteredLinks),
    })

    return true
  } catch (error) {
    console.error('[MindMapLinkEnhanceService] 删除远程知识联系失败:', error)
    return false
  }
}

/**
 * 保存远程知识联系到块属性
 */
async function saveRemoteLinksToBlock(mindMapBlockId: string, link: RemoteKnowledgeLink): Promise<void> {
  const links = await getRemoteKnowledgeLinks(mindMapBlockId)
  links.push(link)

  await setBlockAttrs(mindMapBlockId, {
    [REMOTE_LINKS_KEY]: JSON.stringify(links),
  })
}

// ==================== 节点链接关系分析 ====================

/**
 * 分析节点链接关系
 * @param nodeId 节点 ID
 * @param nodes 所有节点
 * @param edges 所有连线
 * @param crossLinks 跨分支关联
 * @param remoteLinks 远程知识联系
 * @returns 节点链接关系
 */
export function analyzeNodeLinks(
  nodeId: string,
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
  crossLinks: CrossBranchLink[],
  remoteLinks: RemoteKnowledgeLink[],
): NodeLinkRelation {
  // 防护：检查数组是否有效
  const safeNodes = nodes || []
  const safeEdges = edges || []
  const safeCrossLinks = crossLinks || []
  const safeRemoteLinks = remoteLinks || []

  // 直接关联（通过 edges）
  const directLinks = safeEdges
    .filter((e) => e.source === nodeId || e.target === nodeId)
    .map((e) => e.source === nodeId ? e.target : e.source)

  // 跨分支关联
  const crossLinksNodeIds = safeCrossLinks
    .filter((l) => l.sourceNodeId === nodeId || l.targetNodeId === nodeId)
    .map((l) => l.sourceNodeId === nodeId ? l.targetNodeId : l.sourceNodeId)

  // 远程知识联系
  const nodeRemoteLinks = safeRemoteLinks.filter((l) => l.sourceNodeId === nodeId)

  // 父节点
  const parentNode = safeNodes.find((n) => n.id === safeNodes.find((node) => node.id === nodeId)?.parentId)

  // 子节点
  const childIds = safeNodes
    .filter((n) => n.parentId === nodeId)
    .map((n) => n.id)

  return {
    nodeId,
    directLinks,
    crossLinks: crossLinksNodeIds,
    remoteLinks: nodeRemoteLinks,
    parentId: parentNode?.id,
    childIds,
  }
}

// ==================== 一键跳转功能 ====================

/**
 * 生成视图定位配置
 * @param targetNodeId 目标节点 ID
 * @param currentZoom 当前缩放
 * @param highlight 是否高亮
 * @returns 视图定位配置
 */
export function createViewportFocusConfig(
  targetNodeId: string,
  currentZoom?: number,
  highlight: boolean = true,
  highlightColor?: string,
  duration: number = 500,
): ViewportFocusConfig {
  return {
    targetNodeId,
    zoom: currentZoom || 1.2,
    highlight,
    highlightColor: highlightColor || '#409eff',
    duration,
  }
}

/**
 * 计算节点位置（用于视图定位）
 * @param nodeId 节点 ID
 * @param nodes 节点列表
 * @returns 节点位置或 null
 */
export function getNodePosition(
  nodeId: string,
  nodes: FreeMindMapNode[],
): { x: number, y: number } | null {
  // 防护：检查 nodes 是否有效
  if (!nodes || !Array.isArray(nodes)) {
    return null
  }

  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return null

  return node.position
}

// ==================== 智能布局建议 ====================

/**
 * 分析节点并生成布局建议
 * @param nodes 节点列表
 * @param edges 连线列表
 * @returns 布局建议列表
 */
export function generateLayoutSuggestions(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
): LayoutSuggestion[] {
  // 防护：检查输入是否有效
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return []
  }
  if (!edges || !Array.isArray(edges)) {
    return []
  }

  const suggestions: LayoutSuggestion[] = []

  // 1. 聚类分析 - 检测密集区域
  const clusters = detectNodeClusters(nodes)
  if (clusters.length > 0) {
    suggestions.push({
      id: generateId(),
      type: 'cluster',
      description: `发现 ${clusters.length} 个节点聚类`,
      nodeIds: clusters.flatMap((c) => c.nodeIds),
      layoutConfig: {
        direction: 'horizontal',
        groups: clusters.map((c, i) => ({
          groupId: `cluster-${i}`,
          nodeIds: c.nodeIds,
          title: `聚类 ${i + 1}`,
        })),
      },
      confidence: clusters.length > 1 ? 0.8 : 0.5,
    })
  }

  // 2. 序列分析 - 检测线性关系
  const sequences = detectNodeSequences(nodes, edges)
  if (sequences.length > 0) {
    for (const seq of sequences) {
      if (seq.nodeIds.length >= 3) {
        suggestions.push({
          id: generateId(),
          type: 'sequence',
          description: `发现包含 ${seq.nodeIds.length} 个节点的序列关系`,
          nodeIds: seq.nodeIds,
          layoutConfig: {
            direction: seq.direction,
            rootId: seq.nodeIds[0],
          },
          confidence: Math.min(0.9, seq.nodeIds.length * 0.15),
        })
      }
    }
  }

  // 3. 层级分析 - 检测树状结构
  const hierarchy = detectHierarchy(nodes, edges)
  if (hierarchy.rootIds.length > 0) {
    suggestions.push({
      id: generateId(),
      type: 'hierarchy',
      description: `发现 ${hierarchy.rootIds.length} 个根节点的层级结构`,
      nodeIds: hierarchy.nodeIds,
      layoutConfig: {
        direction: 'vertical',
        rootId: hierarchy.rootIds[0],
      },
      confidence: 0.7,
    })
  }

  // 4. 放射状分析 - 检测中心节点
  const radial = detectRadialPattern(nodes, edges)
  if (radial.centerNodeId) {
    suggestions.push({
      id: generateId(),
      type: 'radial',
      description: `发现以"${radial.centerNodeTitle}"为中心的放射状结构`,
      nodeIds: radial.nodeIds,
      layoutConfig: {
        direction: 'radial',
        rootId: radial.centerNodeId,
      },
      confidence: radial.connectedNodes / radial.totalNodes,
    })
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * 检测节点聚类
 */
function detectNodeClusters(nodes: FreeMindMapNode[]): { nodeIds: string[], centroid: { x: number, y: number } }[] {
  // 防护：检查 nodes 是否有效
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return []
  }

  // 简单的基于距离的聚类
  const clusters: { nodeIds: string[], centroid: { x: number, y: number } }[] = []
  const used = new Set<string>()

  for (const node of nodes) {
    if (used.has(node.id)) continue

    const cluster = {
      nodeIds: [node.id],
      centroid: {
        x: node.position.x,
        y: node.position.y,
      },
    }
    used.add(node.id)

    // 查找附近的节点
    for (const other of nodes) {
      if (used.has(other.id)) continue

      const distance = Math.sqrt(
        (other.position.x - node.position.x) ** 2
        + (other.position.y - node.position.y) ** 2,
      )

      if (distance < 200) { // 阈值
        cluster.nodeIds.push(other.id)
        cluster.centroid.x = (cluster.centroid.x + other.position.x) / cluster.nodeIds.length
        cluster.centroid.y = (cluster.centroid.y + other.position.y) / cluster.nodeIds.length
        used.add(other.id)
      }
    }

    if (cluster.nodeIds.length > 1) {
      clusters.push(cluster)
    }
  }

  return clusters
}

/**
 * 检测节点序列
 */
function detectNodeSequences(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
): { nodeIds: string[], direction: 'horizontal' | 'vertical' }[] {
  const sequences: { nodeIds: string[], direction: 'horizontal' | 'vertical' }[] = []
  const visited = new Set<string>()

  // 构建邻接表
  const adj = new Map<string, string[]>()
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, [])
    if (!adj.has(edge.target)) adj.set(edge.target, [])
    adj.get(edge.source)!.push(edge.target)
    adj.get(edge.target)!.push(edge.source)
  }

  // DFS 查找路径
  function findPath(startId: string, path: string[]): void {
    if (path.length > 1) {
      // 判断方向
      const firstNode = nodes.find((n) => n.id === path[0])
      const lastNode = nodes.find((n) => n.id === path[path.length - 1])
      if (firstNode && lastNode) {
        const dx = Math.abs(lastNode.position.x - firstNode.position.x)
        const dy = Math.abs(lastNode.position.y - firstNode.position.y)
        sequences.push({
          nodeIds: [...path],
          direction: dx > dy ? 'horizontal' : 'vertical',
        })
      }
    }

    const neighbors = adj.get(startId) || []
    for (const neighbor of neighbors) {
      if (!path.includes(neighbor) && path.length < 10) {
        findPath(neighbor, [...path, neighbor])
      }
    }
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      findPath(node.id, [node.id])
      visited.add(node.id)
    }
  }

  return sequences
}

/**
 * 检测层级结构
 */
function detectHierarchy(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
): { rootIds: string[], nodeIds: string[] } {
  const rootIds: string[] = []
  const allNodeIds = new Set(nodes.map((n) => n.id))
  const childIds = new Set<string>()

  // 找出所有有子节点的节点
  for (const edge of edges) {
    childIds.add(edge.target)
  }

  // 没有父节点的节点是根节点
  for (const nodeId of allNodeIds) {
    if (!childIds.has(nodeId)) {
      rootIds.push(nodeId)
    }
  }

  return {
    rootIds,
    nodeIds: Array.from(allNodeIds),
  }
}

/**
 * 检测放射状模式
 */
function detectRadialPattern(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
): { centerNodeId: string | null, centerNodeTitle: string, nodeIds: string[], connectedNodes: number, totalNodes: number } {
  // 找出连接数最多的节点
  const connectionCount = new Map<string, number>()

  for (const edge of edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1)
    connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1)
  }

  let maxConnections = 0
  let centerNodeId: string | null = null

  for (const [nodeId, count] of connectionCount) {
    if (count > maxConnections) {
      maxConnections = count
      centerNodeId = nodeId
    }
  }

  if (!centerNodeId || maxConnections < 3) {
    return {
      centerNodeId: null,
      centerNodeTitle: '',
      nodeIds: [],
      connectedNodes: 0,
      totalNodes: nodes.length,
    }
  }

  const centerNode = nodes.find((n) => n.id === centerNodeId)
  const connectedNodeIds = new Set<string>()

  // 找出与中心节点直接相连的节点
  for (const edge of edges) {
    if (edge.source === centerNodeId) connectedNodeIds.add(edge.target)
    if (edge.target === centerNodeId) connectedNodeIds.add(edge.source)
  }

  return {
    centerNodeId,
    centerNodeTitle: centerNode?.data.title || '',
    nodeIds: [centerNodeId, ...Array.from(connectedNodeIds)],
    connectedNodes: connectedNodeIds.size,
    totalNodes: nodes.length,
  }
}

// ==================== 工具函数 ====================

/**
 * 将跨分支关联转换为 Vue Flow 连线
 * @param crossLink 跨分支关联
 * @returns Vue Flow 连线配置
 */
export function crossLinkToVueFlowEdge(crossLink: CrossBranchLink): Partial<FreeMindMapEdge> {
  return {
    id: `cross-${crossLink.id}`,
    source: crossLink.sourceNodeId,
    target: crossLink.targetNodeId,
    type: 'smooth',
    animated: true,
    style: {
      stroke: crossLink.style.stroke,
      strokeWidth: crossLink.style.strokeWidth,
      strokeDasharray: crossLink.style.strokeDasharray,
    },
  }
}

/**
 * 将远程知识联系转换为 Vue Flow 连线
 * @param remoteLink 远程知识联系
 * @returns Vue Flow 连线配置
 */
export function remoteLinkToVueFlowEdge(remoteLink: RemoteKnowledgeLink): Partial<FreeMindMapEdge> {
  const colors: Record<string, string> = {
    reference: '#909399',
    relation: '#409eff',
    seeAlso: '#67c23a',
    quote: '#e6a23c',
  }

  return {
    id: `remote-${remoteLink.id}`,
    source: remoteLink.sourceNodeId,
    target: remoteLink.targetId,
    type: 'step',
    animated: false,
    style: {
      stroke: colors[remoteLink.linkType] || '#909399',
      strokeWidth: 1.5,
      strokeDasharray: '3,3',
    },
  }
}
