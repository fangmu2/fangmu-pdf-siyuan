/**
 * 概念图（力导向）布局算法
 * 支持节点根据关联强度自动聚类分布
 * @fileoverview 实现力导向图布局，包括排斥力、弹簧力和聚类优化
 */

import type {
  FreeMindMapEdge,
  FreeMindMapNode,
} from '@/types/mindmapFree'

/**
 * 概念图布局配置
 */
export interface ConceptMapConfig {
  /** 排斥力（节点之间的排斥，默认 500） */
  repulsion: number
  /** 弹簧长度（相连节点之间的理想距离，默认 100） */
  springLength: number
  /** 弹簧强度（胡克定律系数，默认 0.1） */
  springStrength: number
  /** 阻尼（速度衰减，默认 0.9） */
  damping: number
  /** 最大迭代次数（默认 300） */
  maxIterations: number
  /** 画布宽度（默认 2000） */
  canvasWidth?: number
  /** 画布高度（默认 2000） */
  canvasHeight?: number
}

/**
 * 物理节点（用于力导向计算）
 */
interface PhysicsNode {
  id: string
  x: number
  y: number
  vx: number // X 轴速度
  vy: number // Y 轴速度
  fx: number // X 轴受力
  fy: number // Y 轴受力
  fixed: boolean // 是否固定
}

/** 默认配置 */
const DEFAULT_CONFIG: ConceptMapConfig = {
  repulsion: 500,
  springLength: 100,
  springStrength: 0.1,
  damping: 0.9,
  maxIterations: 300,
  canvasWidth: 2000,
  canvasHeight: 2000,
}

/**
 * 应用概念图布局（力导向布局）
 * @param nodes 所有节点
 * @param edges 所有连线
 * @param config 布局配置
 * @returns 布局后的节点和连线
 */
export function applyConceptMapLayout(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
  config: Partial<ConceptMapConfig> = {},
): { nodes: FreeMindMapNode[], edges: FreeMindMapEdge[] } {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  if (nodes.length === 0) {
    return {
      nodes,
      edges,
    }
  }

  // 1. 检测聚类并初始化位置
  const clusters = detectClusters(nodes, edges)
  initializeClusterPositions(nodes, clusters, finalConfig)

  // 2. 初始化物理节点
  const physicsNodes: PhysicsNode[] = nodes.map((node) => ({
    id: node.id,
    x: node.position.x || Math.random() * (finalConfig.canvasWidth! - 100) + 50,
    y: node.position.y || Math.random() * (finalConfig.canvasHeight! - 100) + 50,
    vx: 0,
    vy: 0,
    fx: 0,
    fy: 0,
    fixed: node.data.level === 'title' || false, // 根节点固定
  }))

  // 3. 力导向迭代
  for (let iteration = 0; iteration < finalConfig.maxIterations; iteration++) {
    // 3.1 计算排斥力（所有节点之间）
    calculateRepulsion(physicsNodes, finalConfig.repulsion)

    // 3.2 计算弹簧力（相连节点之间）
    calculateSpringForce(physicsNodes, edges, finalConfig)

    // 3.3 更新位置和速度
    updatePositions(physicsNodes, finalConfig)
  }

  // 4. 更新节点位置
  physicsNodes.forEach((pNode) => {
    const node = nodes.find((n) => n.id === pNode.id)!
    node.position.x = pNode.x
    node.position.y = pNode.y
  })

  return {
    nodes,
    edges,
  }
}

/**
 * 计算节点之间的排斥力
 */
function calculateRepulsion(physicsNodes: PhysicsNode[], repulsion: number): void {
  for (let i = 0; i < physicsNodes.length; i++) {
    for (let j = i + 1; j < physicsNodes.length; j++) {
      const nodeA = physicsNodes[i]
      const nodeB = physicsNodes[j]

      const dx = nodeB.x - nodeA.x
      const dy = nodeB.y - nodeA.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 0.1) continue // 避免除零

      // 排斥力与距离平方成反比
      const force = repulsion / (distance * distance)
      const fx = (dx / distance) * force
      const fy = (dy / distance) * force

      if (!nodeA.fixed) {
        nodeA.fx -= fx
        nodeA.fy -= fy
      }
      if (!nodeB.fixed) {
        nodeB.fx += fx
        nodeB.fy += fy
      }
    }
  }
}

/**
 * 计算相连节点之间的弹簧力（胡克定律）
 */
function calculateSpringForce(
  physicsNodes: PhysicsNode[],
  edges: FreeMindMapEdge[],
  config: ConceptMapConfig,
): void {
  const nodeMap = new Map<string, PhysicsNode>(physicsNodes.map((n) => [n.id, n]))

  edges.forEach((edge) => {
    const source = nodeMap.get(edge.source)
    const target = nodeMap.get(edge.target)

    if (!source || !target) return

    const dx = target.x - source.x
    const dy = target.y - source.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 0.1) return

    // 弹簧力（胡克定律）：F = k * (x - L)
    const force = (distance - config.springLength) * config.springStrength
    const fx = (dx / distance) * force
    const fy = (dy / distance) * force

    if (!source.fixed) {
      source.fx += fx
      source.fy += fy
    }
    if (!target.fixed) {
      target.fx -= fx
      target.fy -= fy
    }
  })
}

/**
 * 更新节点位置和速度
 */
function updatePositions(physicsNodes: PhysicsNode[], config: ConceptMapConfig): void {
  const margin = 50
  const maxWidth = config.canvasWidth! - margin * 2
  const maxHeight = config.canvasHeight! - margin * 2
  const maxSpeed = 10

  physicsNodes.forEach((node) => {
    if (node.fixed) {
      node.fx = 0
      node.fy = 0
      return
    }

    // 应用力（加速度）
    node.vx = (node.vx + node.fx) * config.damping
    node.vy = (node.vy + node.fy) * config.damping

    // 限制最大速度
    node.vx = Math.max(-maxSpeed, Math.min(maxSpeed, node.vx))
    node.vy = Math.max(-maxSpeed, Math.min(maxSpeed, node.vy))

    // 更新位置
    node.x += node.vx
    node.y += node.vy

    // 边界限制（带反弹效果）
    if (node.x < margin) {
      node.x = margin
      node.vx *= -0.5
    }
    if (node.x > maxWidth + margin) {
      node.x = maxWidth + margin
      node.vx *= -0.5
    }
    if (node.y < margin) {
      node.y = margin
      node.vy *= -0.5
    }
    if (node.y > maxHeight + margin) {
      node.y = maxHeight + margin
      node.vy *= -0.5
    }

    // 清除力
    node.fx = 0
    node.fy = 0
  })
}

/**
 * 检测聚类（使用连通分量算法）
 * @param nodes 所有节点
 * @param edges 所有连线
 * @returns 节点 ID 到聚类 ID 的映射
 */
export function detectClusters(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
): Map<string, number> {
  const clusters: Map<string, number> = new Map()
  const visited = new Set<string>()
  let clusterId = 0

  // 构建邻接表
  const adjacency = new Map<string, string[]>()
  nodes.forEach((node) => {
    adjacency.set(node.id, [])
  })

  edges.forEach((edge) => {
    adjacency.get(edge.source)?.push(edge.target)
    adjacency.get(edge.target)?.push(edge.source)
  })

  // BFS 查找连通分量
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const queue = [node.id]

      while (queue.length > 0) {
        const currentId = queue.shift()!
        if (visited.has(currentId)) continue
        visited.add(currentId)
        clusters.set(currentId, clusterId)

        // 添加邻居
        const neighbors = adjacency.get(currentId) || []
        neighbors.forEach((neighborId) => {
          if (!visited.has(neighborId)) {
            queue.push(neighborId)
          }
        })
      }

      clusterId++
    }
  })

  return clusters
}

/**
 * 根据聚类初始化节点位置
 * @param nodes 所有节点
 * @param clusters 节点到聚类的映射
 * @param config 布局配置
 */
export function initializeClusterPositions(
  nodes: FreeMindMapNode[],
  clusters: Map<string, number>,
  config: ConceptMapConfig,
): void {
  const clusterCenters: Map<number, { x: number, y: number }> = new Map()
  const clusterSizes: Map<number, number> = new Map()

  // 统计每个聚类的节点数量
  clusters.forEach((clusterId) => {
    clusterSizes.set(clusterId, (clusterSizes.get(clusterId) || 0) + 1)
  })

  const numClusters = Math.max(...Array.from(clusters.values()), 0) + 1

  if (numClusters === 0) return

  // 将聚类中心分布在画布上（圆形分布）
  const centerX = config.canvasWidth! / 2
  const centerY = config.canvasHeight! / 2
  const radius = Math.min(config.canvasWidth!, config.canvasHeight!) * 0.35
  const angleStep = (2 * Math.PI) / numClusters

  for (let i = 0; i < numClusters; i++) {
    clusterCenters.set(i, {
      x: centerX + Math.cos(i * angleStep) * radius,
      y: centerY + Math.sin(i * angleStep) * radius,
    })
  }

  // 设置节点初始位置（在聚类中心周围随机分布）
  nodes.forEach((node) => {
    const clusterId = clusters.get(node.id)!
    const center = clusterCenters.get(clusterId)!
    const clusterSize = clusterSizes.get(clusterId) || 1

    // 根据聚类大小调整分布范围
    const spread = Math.min(200, 100 + clusterSize * 10)

    node.position.x = center.x + (Math.random() - 0.5) * spread * 2
    node.position.y = center.y + (Math.random() - 0.5) * spread * 2
  })
}

/**
 * 计算概念图布局（返回位置映射）
 * @param nodes 所有节点
 * @param config 布局配置
 * @returns 节点位置映射
 */
export function calculateConceptMapLayout(
  nodes: FreeMindMapNode[],
  config: Partial<ConceptMapConfig> = {},
): Map<string, { x: number, y: number }> {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  }
  const positions = new Map<string, { x: number, y: number }>()

  if (nodes.length === 0) {
    return positions
  }

  // 创建节点副本进行计算
  const nodesCopy = nodes.map((n) => ({
    ...n,
    position: { ...n.position },
  }))

  // 应用布局
  const { nodes: layoutNodes } = applyConceptMapLayout(nodesCopy, [], finalConfig)

  // 返回位置映射
  layoutNodes.forEach((node) => {
    positions.set(node.id, {
      x: node.position.x,
      y: node.position.y,
    })
  })

  return positions
}

/**
 * 更新节点布局（供 store 调用）
 * @param nodes 所有节点
 * @param edges 所有连线
 * @param updateNodePosition 更新节点位置的回调
 * @param config 布局配置
 */
export function applyConceptMapLayoutToNodes(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
  updateNodePosition: (nodeId: string, position: { x: number, y: number }) => void,
  config: Partial<ConceptMapConfig> = {},
): void {
  const { nodes: layoutNodes } = applyConceptMapLayout(nodes, edges, config)

  layoutNodes.forEach((node) => {
    updateNodePosition(node.id, node.position)
  })
}
