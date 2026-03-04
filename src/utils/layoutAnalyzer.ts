/**
 * 布局分析器 - 智能布局推荐功能
 * 根据节点数量、层级、关联度分析，推荐最佳布局
 * @fileoverview 提供图结构分析和布局评分系统
 */

import type { FreeMindMapNode, FreeMindMapEdge } from '@/types/mindmapFree'

/**
 * 布局分析结果
 */
export interface LayoutAnalysis {
  /** 节点数量 */
  nodeCount: number
  /** 最大层级深度 */
  maxDepth: number
  /** 平均连接数 */
  avgConnections: number
  /** 是否有时间戳 */
  hasTimestamps: boolean
  /** 是否层级结构 */
  isHierarchical: boolean
  /** 聚类数量 */
  clusterCount: number
}

/**
 * 布局推荐
 */
export interface LayoutRecommendation {
  /** 布局类型 */
  layoutType: 'tree' | 'fishbone' | 'timeline' | 'concept'
  /** 推荐置信度 (0-1) */
  confidence: number
  /** 推荐原因 */
  reason: string
  /** 布局得分 */
  score: number
}

/**
 * 分析图结构
 * @param nodes 所有节点
 * @param edges 所有连线
 * @returns 布局分析结果
 */
export function analyzeGraph(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[]
): LayoutAnalysis {
  // 1. 节点数量
  const nodeCount = nodes.length

  if (nodeCount === 0) {
    return {
      nodeCount: 0,
      maxDepth: 0,
      avgConnections: 0,
      hasTimestamps: false,
      isHierarchical: false,
      clusterCount: 0
    }
  }

  // 2. 计算最大深度（BFS）
  const maxDepth = calculateMaxDepth(nodes, edges)

  // 3. 平均连接数
  const totalConnections = edges.length * 2
  const avgConnections = nodeCount > 0 ? totalConnections / nodeCount : 0

  // 4. 检查是否有时间戳
  const hasTimestamps = nodes.some(n => n.data.timestamp)

  // 5. 判断是否层级结构
  const isHierarchical = maxDepth > 2 && avgConnections < 2

  // 6. 计算聚类数量
  const clusterCount = detectClusters(nodes, edges).size

  return {
    nodeCount,
    maxDepth,
    avgConnections,
    hasTimestamps,
    isHierarchical,
    clusterCount
  }
}

/**
 * 推荐布局
 * @param analysis 布局分析结果
 * @returns 布局推荐列表（按得分排序）
 */
export function recommendLayout(analysis: LayoutAnalysis): LayoutRecommendation[] {
  const recommendations: LayoutRecommendation[] = []

  // 树状布局评分
  if (analysis.isHierarchical || analysis.maxDepth >= 2) {
    const score = calculateTreeScore(analysis)
    if (score > 30) {
      recommendations.push({
        layoutType: 'tree',
        confidence: score / 100,
        reason: `层级结构明显（${analysis.maxDepth}层），适合树状布局`,
        score
      })
    }
  }

  // 鱼骨图评分
  if (analysis.maxDepth <= 3 && analysis.avgConnections < 3) {
    const score = calculateFishboneScore(analysis)
    if (score > 30) {
      recommendations.push({
        layoutType: 'fishbone',
        confidence: score / 100,
        reason: analysis.maxDepth === 2
          ? '两级结构，适合鱼骨图分析'
          : `层级较浅（${analysis.maxDepth}层），适合鱼骨图`,
        score
      })
    }
  }

  // 时间轴评分
  if (analysis.hasTimestamps) {
    const score = calculateTimelineScore(analysis)
    recommendations.push({
      layoutType: 'timeline',
      confidence: score / 100,
      reason: `节点包含时间信息，适合时间轴展示`,
      score
    })
  }

  // 概念图评分
  if (analysis.clusterCount > 1 || analysis.avgConnections > 2 || !analysis.isHierarchical) {
    const score = calculateConceptScore(analysis)
    if (score > 30) {
      recommendations.push({
        layoutType: 'concept',
        confidence: score / 100,
        reason: analysis.clusterCount > 1
          ? `多聚类（${analysis.clusterCount}个），适合概念图`
          : analysis.avgConnections > 2
            ? `高连接度（${analysis.avgConnections.toFixed(1)}），适合概念图`
            : '非层级结构，适合概念图',
        score
      })
    }
  }

  // 如果没有推荐，默认推荐树状布局
  if (recommendations.length === 0 && analysis.nodeCount > 0) {
    recommendations.push({
      layoutType: 'tree',
      confidence: 0.5,
      reason: '默认树状布局',
      score: 50
    })
  }

  // 按得分排序
  return recommendations.sort((a, b) => b.score - a.score)
}

/**
 * 计算树状布局得分
 */
function calculateTreeScore(analysis: LayoutAnalysis): number {
  let score = 0

  // 层级深度适中（3-5 层最佳）
  if (analysis.maxDepth >= 3 && analysis.maxDepth <= 5) {
    score += 40
  } else if (analysis.maxDepth > 1) {
    score += 20
  }

  // 连接度低（树状特征）
  if (analysis.avgConnections < 2) {
    score += 30
  } else if (analysis.avgConnections < 3) {
    score += 15
  }

  // 节点数量适中
  if (analysis.nodeCount >= 10 && analysis.nodeCount <= 100) {
    score += 30
  } else if (analysis.nodeCount > 0) {
    score += 15
  }

  return score
}

/**
 * 计算鱼骨图布局得分
 */
function calculateFishboneScore(analysis: LayoutAnalysis): number {
  let score = 0

  // 两级结构最佳
  if (analysis.maxDepth === 2) {
    score += 50
  } else if (analysis.maxDepth === 3) {
    score += 25
  }

  // 连接度适中
  if (analysis.avgConnections >= 1.5 && analysis.avgConnections <= 3) {
    score += 30
  }

  // 节点数量适中
  if (analysis.nodeCount >= 5 && analysis.nodeCount <= 50) {
    score += 20
  }

  return score
}

/**
 * 计算时间轴布局得分
 */
function calculateTimelineScore(analysis: LayoutAnalysis): number {
  let score = 0

  // 有时间戳直接高分
  if (analysis.hasTimestamps) {
    score += 60
  }

  // 节点数量适中
  if (analysis.nodeCount >= 5 && analysis.nodeCount <= 200) {
    score += 25
  }

  // 时间跨度合理
  score += 15

  return score
}

/**
 * 计算概念图布局得分
 */
function calculateConceptScore(analysis: LayoutAnalysis): number {
  let score = 0

  // 多聚类
  if (analysis.clusterCount > 1) {
    score += 30
  }

  // 高连接度
  if (analysis.avgConnections > 2) {
    score += 30
  } else if (analysis.avgConnections > 1.5) {
    score += 15
  }

  // 节点数量
  if (analysis.nodeCount >= 10) {
    score += 20
  }

  // 非层级结构
  if (!analysis.isHierarchical) {
    score += 20
  }

  return score
}

/**
 * 计算最大深度（BFS 遍历）
 */
function calculateMaxDepth(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[]
): number {
  if (nodes.length === 0) return 0

  // 找到根节点（没有父节点的节点）
  const parentIds = new Set(edges.map(e => e.target))
  const rootNodes = nodes.filter(n => !parentIds.has(n.id))

  if (rootNodes.length === 0) {
    // 如果没有明确的根节点，使用第一个节点
    return 1
  }

  // 构建邻接表
  const adjacencyMap = new Map<string, string[]>()
  edges.forEach(edge => {
    if (!adjacencyMap.has(edge.source)) {
      adjacencyMap.set(edge.source, [])
    }
    adjacencyMap.get(edge.source)!.push(edge.target)
  })

  // 从根节点开始 BFS
  let maxDepth = 0
  const queue: Array<{ id: string; level: number }> = rootNodes.map(n => ({
    id: n.id,
    level: 1
  }))
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)

    maxDepth = Math.max(maxDepth, level)

    const children = adjacencyMap.get(id) || []
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 })
      }
    })
  }

  return maxDepth
}

/**
 * 检测聚类数量（使用并查集算法）
 */
function detectClusters(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[]
): Set<string> {
  if (nodes.length === 0) return new Set()

  // 并查集
  const parent = new Map<string, string>()
  const rank = new Map<string, number>()

  // 初始化
  nodes.forEach(node => {
    parent.set(node.id, node.id)
    rank.set(node.id, 0)
  })

  // 查找根节点（带路径压缩）
  const find = (x: string): string => {
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)!))
    }
    return parent.get(x)!
  }

  // 合并集合（按秩合并）
  const union = (x: string, y: string): void => {
    const rootX = find(x)
    const rootY = find(y)

    if (rootX === rootY) return

    const rankX = rank.get(rootX) || 0
    const rankY = rank.get(rootY) || 0

    if (rankX < rankY) {
      parent.set(rootX, rootY)
    } else if (rankX > rankY) {
      parent.set(rootY, rootX)
    } else {
      parent.set(rootY, rootX)
      rank.set(rootX, rankX + 1)
    }
  }

  // 合并所有连接的节点
  edges.forEach(edge => {
    union(edge.source, edge.target)
  })

  // 统计聚类数量
  const clusters = new Set<string>()
  nodes.forEach(node => {
    clusters.add(find(node.id))
  })

  return clusters
}

/**
 * 获取布局中文名称
 */
export function getLayoutName(layoutType: string): string {
  const names: Record<string, string> = {
    tree: '树状布局',
    fishbone: '鱼骨图',
    timeline: '时间轴',
    concept: '概念图'
  }
  return names[layoutType] || layoutType
}

/**
 * 获取布局图标
 */
export function getLayoutIcon(layoutType: string): string {
  const icons: Record<string, string> = {
    tree: '🌳',
    fishbone: '🐟',
    timeline: '📅',
    concept: '💡'
  }
  return icons[layoutType] || '📊'
}
