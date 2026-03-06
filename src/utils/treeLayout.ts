/**
 * 树状布局算法 - MarginNote4 风格
 * 从左到右自动展开的层级布局
 */

import type { FreeMindMapNode } from '@/types/mindmapFree'

/** 布局配置 */
export interface TreeLayoutConfig {
  /** 节点水平间距 */
  nodeHorizontalGap: number
  /** 节点垂直间距 */
  nodeVerticalGap: number
  /** 层级缩进 */
  levelIndent: number
  /** 根节点 X 坐标 */
  rootX: number
  /** 根节点 Y 坐标 */
  rootY: number
}

/** 默认配置 */
const DEFAULT_CONFIG: TreeLayoutConfig = {
  nodeHorizontalGap: 50,
  nodeVerticalGap: 10,
  levelIndent: 200,
  rootX: 50,
  rootY: 50,
}

/** 布局后的节点信息 */
export interface LayoutNode {
  node: FreeMindMapNode
  x: number
  y: number
  level: number
  children: LayoutNode[]
}

/**
 * 计算树状布局
 * @param nodes 所有节点
 * @param config 布局配置
 * @returns 布局后的节点位置
 */
export function calculateTreeLayout(
  nodes: FreeMindMapNode[],
  config: Partial<TreeLayoutConfig> = {},
): Map<string, { x: number, y: number }> {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  }
  const positions = new Map<string, { x: number, y: number }>()

  // 找到根节点（没有父节点的节点）
  const rootNodes = nodes.filter((n) => !n.parentId || n.parentId === '')

  if (rootNodes.length === 0) return positions

  // 构建树形结构
  const tree = buildTree(rootNodes[0], nodes)

  // 计算每个子树的高度
  const subtreeHeights = new Map<string, number>()
  calculateSubtreeHeights(tree, subtreeHeights)

  // 分配位置
  const currentY = finalConfig.rootY
  assignPositions(tree, positions, subtreeHeights, finalConfig, 0, { value: currentY })

  return positions
}

/**
 * 构建 DOM 树形结构
 */
function buildTree(
  root: FreeMindMapNode,
  allNodes: FreeMindMapNode[],
): LayoutNode {
  const childrenIds = root.data.childrenIds || []
  const children = childrenIds
    .map((id) => allNodes.find((n) => n.id === id))
    .filter(Boolean)
    .map((node) => buildTree(node!, allNodes)) as LayoutNode[]

  return {
    node: root,
    x: 0,
    y: 0,
    level: 0,
    children,
  }
}

/**
 * 计算子树高度（用于垂直布局）
 */
function calculateSubtreeHeights(
  node: LayoutNode,
  heights: Map<string, number>,
): number {
  if (node.children.length === 0) {
    heights.set(node.node.id, 1)
    return 1
  }

  const height = node.children.reduce((sum, child) => {
    return sum + calculateSubtreeHeights(child, heights)
  }, 0)

  heights.set(node.node.id, height)
  return height
}

/**
 * 分配节点位置
 */
function assignPositions(
  node: LayoutNode,
  positions: Map<string, { x: number, y: number }>,
  subtreeHeights: Map<string, number>,
  config: TreeLayoutConfig,
  level: number,
  currentY: { value: number },
): void {
  // 设置当前节点位置
  node.level = level
  node.x = config.rootX + level * config.levelIndent
  node.y = currentY.value

  positions.set(node.node.id, {
    x: node.x,
    y: node.y,
  })

  // 为子节点分配位置
  node.children.forEach((child, index) => {
    if (index > 0) {
      // 增加垂直间距
      currentY.value += config.nodeVerticalGap
    }
    assignPositions(child, positions, subtreeHeights, config, level + 1, currentY)
  })

  // 移动到下一个可用 Y 位置
  if (node.children.length > 0) {
    const lastChild = node.children[node.children.length - 1]
    const lastChildHeight = subtreeHeights.get(lastChild.node.id) || 1
    currentY.value += lastChildHeight * (60 + config.nodeVerticalGap) - (subtreeHeights.get(node.node.id) || 1) * config.nodeVerticalGap
  } else {
    currentY.value += 60 + config.nodeVerticalGap // 节点高度约 60px
  }
}

/**
 * 更新节点布局
 */
export function applyTreeLayout(
  nodes: FreeMindMapNode[],
  updateNodePosition: (nodeId: string, position: { x: number, y: number }) => void,
): void {
  const positions = calculateTreeLayout(nodes)

  positions.forEach((position, nodeId) => {
    updateNodePosition(nodeId, position)
  })
}

/**
 * 获取层级路径（用于面包屑导航）
 */
export function getNodePath(
  nodeId: string,
  nodes: FreeMindMapNode[],
): FreeMindMapNode[] {
  const path: FreeMindMapNode[] = []
  let current = nodes.find((n) => n.id === nodeId)

  while (current) {
    path.unshift(current)
    if (current.parentId) {
      current = nodes.find((n) => n.id === current!.parentId)
    } else {
      current = null
    }
  }

  return path
}
