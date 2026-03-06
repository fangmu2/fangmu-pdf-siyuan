/**
 * 鱼骨图（Ishikawa/Fishbone）自动布局算法
 * 支持主骨 + 分支的鱼骨形状排列
 */

import type {
  FreeMindMapEdge,
  FreeMindMapNode,
} from '@/types/mindmapFree'

/** 鱼骨图布局配置 */
export interface FishboneLayoutConfig {
  /** 主骨长度（默认 400px） */
  mainBoneLength: number
  /** 分支角度（默认 45°） */
  branchAngle: number
  /** 分支间距（默认 60px） */
  branchSpacing: number
  /** 节点宽度（默认 120px） */
  nodeWidth: number
  /** 节点高度（默认 40px） */
  nodeHeight: number
  /** 画布宽度 */
  canvasWidth?: number
  /** 画布高度 */
  canvasHeight?: number
}

/** 默认配置 */
const DEFAULT_CONFIG: FishboneLayoutConfig = {
  mainBoneLength: 400,
  branchAngle: 45,
  branchSpacing: 60,
  nodeWidth: 120,
  nodeHeight: 40,
  canvasWidth: 1200,
  canvasHeight: 800,
}

/**
 * 应用鱼骨图布局
 * @param nodes 所有节点
 * @param edges 所有连线
 * @param config 布局配置
 * @returns 布局后的节点和连线
 */
export function applyFishboneLayout(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
  config: Partial<FishboneLayoutConfig> = {},
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

  // 1. 分析树结构，确定层级
  const rootNodes = nodes.filter((n) => !n.parentId || n.parentId === '')

  if (rootNodes.length === 0) {
    return {
      nodes,
      edges,
    }
  }

  // 使用第一个根节点作为主骨
  const root = rootNodes[0]

  // 2. 主骨节点（根节点）放在中心
  const centerX = (finalConfig.canvasWidth || 1200) / 2
  const centerY = (finalConfig.canvasHeight || 800) / 2

  root.position = {
    x: centerX,
    y: centerY,
  }
  root.data.level = 'title'

  // 3. 获取一级子节点（大分支）
  const firstLevelChildren = nodes.filter((n) => n.parentId === root.id)

  // 4. 大分支交替排列在主骨上下两侧
  firstLevelChildren.forEach((child, index) => {
    const side: 'upper' | 'lower' = index % 2 === 0 ? 'upper' : 'lower'
    const branchIndex = Math.floor(index / 2)

    // 计算分支起点在主骨上的位置
    const branchPosition = (branchIndex + 1) * finalConfig.branchSpacing

    // 计算分支终点（节点位置）
    const branchLength = finalConfig.nodeWidth * 1.5

    child.position = {
      x: centerX + branchPosition,
      y: centerY + (side === 'upper' ? -branchLength : branchLength),
    }

    child.data.level = 'h1'

    // 5. 处理二级及以下节点（小分支）
    layoutBranchChildren(child, nodes, side, finalConfig, 'h2')
  })

  // 6. 处理其他根节点（作为独立的主骨分支）
  for (let i = 1; i < rootNodes.length; i++) {
    const otherRoot = rootNodes[i]
    const offset = i * finalConfig.branchSpacing * 2

    otherRoot.position = {
      x: centerX + offset,
      y: centerY,
    }
    otherRoot.data.level = 'title'

    // 处理其子节点
    const children = nodes.filter((n) => n.parentId === otherRoot.id)
    children.forEach((child, index) => {
      const side: 'upper' | 'lower' = index % 2 === 0 ? 'upper' : 'lower'
      const branchIndex = Math.floor(index / 2)
      const branchPosition = (branchIndex + 1) * finalConfig.branchSpacing
      const branchLength = finalConfig.nodeWidth * 1.5

      child.position = {
        x: centerX + offset + branchPosition,
        y: centerY + (side === 'upper' ? -branchLength : branchLength),
      }

      child.data.level = 'h1'

      layoutBranchChildren(child, nodes, side, finalConfig, 'h2')
    })
  }

  return {
    nodes,
    edges,
  }
}

/**
 * 递归排列分支上的子节点
 */
function layoutBranchChildren(
  parentNode: FreeMindMapNode,
  allNodes: FreeMindMapNode[],
  parentSide: 'upper' | 'lower',
  config: FishboneLayoutConfig,
  level: string,
): void {
  const children = allNodes.filter((n) => n.parentId === parentNode.id)

  if (children.length === 0) return

  const branchAngle = parentSide === 'upper' ? -config.branchAngle : config.branchAngle
  const angleRad = branchAngle * Math.PI / 180
  const spacing = config.nodeWidth + 20 // 节点间距

  children.forEach((child) => {
    // 沿分支线等间距排列
    const distance = (children.indexOf(child) + 1) * spacing
    const parentPos = parentNode.position

    child.position = {
      x: parentPos.x + distance * Math.cos(angleRad),
      y: parentPos.y + distance * Math.sin(angleRad),
    }

    child.data.level = level

    // 递归处理下一层
    const nextLevel = level === 'h1' ? 'h2' : level === 'h2' ? 'h3' : 'h4'
    layoutBranchChildren(child, allNodes, parentSide, config, nextLevel)
  })
}

/**
 * 计算鱼骨图布局（返回位置映射）
 * @param nodes 所有节点
 * @param config 布局配置
 * @returns 节点位置映射
 */
export function calculateFishboneLayout(
  nodes: FreeMindMapNode[],
  config: Partial<FishboneLayoutConfig> = {},
): Map<string, { x: number, y: number }> {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  }
  const positions = new Map<string, { x: number, y: number }>()

  if (nodes.length === 0) {
    return positions
  }

  // 找到根节点
  const rootNodes = nodes.filter((n) => !n.parentId || n.parentId === '')

  if (rootNodes.length === 0) {
    return positions
  }

  const root = rootNodes[0]
  const centerX = (finalConfig.canvasWidth || 1200) / 2
  const centerY = (finalConfig.canvasHeight || 800) / 2

  // 设置根节点位置
  positions.set(root.id, {
    x: centerX,
    y: centerY,
  })

  // 获取一级子节点
  const firstLevelChildren = nodes.filter((n) => n.parentId === root.id)

  // 排列一级子节点
  firstLevelChildren.forEach((child, index) => {
    const side: 'upper' | 'lower' = index % 2 === 0 ? 'upper' : 'lower'
    const branchIndex = Math.floor(index / 2)
    const branchPosition = (branchIndex + 1) * finalConfig.branchSpacing
    const branchLength = finalConfig.nodeWidth * 1.5

    positions.set(child.id, {
      x: centerX + branchPosition,
      y: centerY + (side === 'upper' ? -branchLength : branchLength),
    })

    // 递归处理子节点
    layoutBranchPositions(child, nodes, side, finalConfig, positions)
  })

  return positions
}

/**
 * 递归计算分支节点位置
 */
function layoutBranchPositions(
  parentNode: FreeMindMapNode,
  allNodes: FreeMindMapNode[],
  parentSide: 'upper' | 'lower',
  config: FishboneLayoutConfig,
  positions: Map<string, { x: number, y: number }>,
  depth: number = 1,
): void {
  const children = allNodes.filter((n) => n.parentId === parentNode.id)

  if (children.length === 0) return

  const parentPos = positions.get(parentNode.id)
  if (!parentPos) return

  const branchAngle = parentSide === 'upper' ? -config.branchAngle : config.branchAngle
  const angleRad = branchAngle * Math.PI / 180
  const spacing = config.nodeWidth + 20

  children.forEach((child, index) => {
    const distance = (index + 1) * spacing

    positions.set(child.id, {
      x: parentPos.x + distance * Math.cos(angleRad),
      y: parentPos.y + distance * Math.sin(angleRad),
    })

    // 递归处理下一层
    layoutBranchPositions(child, allNodes, parentSide, config, positions, depth + 1)
  })
}

/**
 * 更新节点布局（供 store 调用）
 * @param nodes 所有节点
 * @param updateNodePosition 更新节点位置的回调
 * @param config 布局配置
 */
export function applyFishboneLayoutToNodes(
  nodes: FreeMindMapNode[],
  updateNodePosition: (nodeId: string, position: { x: number, y: number }) => void,
  config: Partial<FishboneLayoutConfig> = {},
): void {
  const positions = calculateFishboneLayout(nodes, config)

  positions.forEach((position, nodeId) => {
    updateNodePosition(nodeId, position)
  })
}
