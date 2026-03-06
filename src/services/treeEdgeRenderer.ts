/**
 * 树状布局连接线渲染服务
 * @fileoverview 为树状布局模式下的父子节点添加连接线渲染
 */

import type {
  FreeMindMapEdge,
  FreeMindMapNode,
} from '@/types/mindmapFree'

/**
 * 树状连接线配置
 */
export interface TreeEdgeConfig {
  /** 线条颜色 */
  stroke: string
  /** 线条宽度 */
  strokeWidth: number
  /** 虚线样式（'none' 表示实线） */
  strokeDasharray: string
  /** 是否显示箭头 */
  hasArrow: boolean
}

/**
 * 默认连接线配置
 */
const DEFAULT_EDGE_CONFIG: TreeEdgeConfig = {
  stroke: '#999',
  strokeWidth: 2,
  strokeDasharray: 'none',
  hasArrow: false,
}

/**
 * 在树状布局模式下，为父子节点添加连接线
 * @param nodes 节点列表
 * @param existingEdges 现有连线列表
 * @param config 连接线配置
 * @returns 包含树状连接线的完整连线列表
 */
export function renderTreeEdges(
  nodes: FreeMindMapNode[],
  existingEdges: FreeMindMapEdge[] = [],
  config: Partial<TreeEdgeConfig> = {},
): FreeMindMapEdge[] {
  const finalConfig: TreeEdgeConfig = {
    ...DEFAULT_EDGE_CONFIG,
    ...config,
  }
  const treeEdges: FreeMindMapEdge[] = []

  // 创建节点 ID 到节点的映射，提高查找效率
  const nodeMap = new Map<string, FreeMindMapNode>()
  nodes.forEach((node) => nodeMap.set(node.id, node))

  // 遍历所有节点，为有父节点的节点创建连接线
  nodes.forEach((node) => {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId)

      if (parent) {
        // 检查是否已存在该父子关系的连线
        const exists = existingEdges.some(
          (e) => e.source === parent.id && e.target === node.id,
        )

        if (!exists) {
          // 创建新的树状连接线
          treeEdges.push({
            id: `tree-edge-${parent.id}-${node.id}`,
            source: parent.id,
            target: node.id,
            type: 'smooth', // 使用平滑曲线
            style: {
              stroke: finalConfig.stroke,
              strokeWidth: finalConfig.strokeWidth,
              strokeDasharray: finalConfig.strokeDasharray === 'none' ? undefined : finalConfig.strokeDasharray,
            },
            animated: false,
          })
        }
      }
    }
  })

  // 合并现有连线和新增的树状连接线
  return [...existingEdges, ...treeEdges]
}

/**
 * 移除树状连接线
 * @param edges 所有连线列表
 * @param treeEdgeIds 树状连接线 ID 列表
 * @returns 移除树状连接线后的连线列表
 */
export function removeTreeEdges(
  edges: FreeMindMapEdge[],
  treeEdgeIds: string[] = [],
): FreeMindMapEdge[] {
  return edges.filter((edge) => !treeEdgeIds.find((id) => edge.id === id))
}

/**
 * 获取所有树状连接线的 ID
 * @param nodes 节点列表
 * @returns 树状连接线 ID 列表
 */
export function getTreeEdgeIds(nodes: FreeMindMapNode[]): string[] {
  const edgeIds: string[] = []

  nodes.forEach((node) => {
    if (node.parentId) {
      edgeIds.push(`tree-edge-${node.parentId}-${node.id}`)
    }
  })

  return edgeIds
}

/**
 * 更新树状连接线样式
 * @param edges 所有连线列表
 * @param config 新的连接线配置
 * @returns 更新样式后的连线列表
 */
export function updateTreeEdgeStyle(
  edges: FreeMindMapEdge[],
  config: Partial<TreeEdgeConfig>,
): FreeMindMapEdge[] {
  return edges.map((edge) => {
    // 检查是否为树状连接线
    if (edge.id.startsWith('tree-edge-')) {
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: config.stroke ?? edge.style?.stroke,
          strokeWidth: config.strokeWidth ?? edge.style?.strokeWidth,
          strokeDasharray: config.strokeDasharray === 'none'
            ? undefined
            : (config.strokeDasharray ?? edge.style?.strokeDasharray),
        },
      }
    }
    return edge
  })
}

/**
 * 生成连接线样式对象
 * @param config 连接线配置
 * @returns SVG 样式字符串
 */
export function generateEdgeStyle(config: TreeEdgeConfig): string {
  let style = `stroke: ${config.stroke}; stroke-width: ${config.strokeWidth}px;`

  if (config.strokeDasharray !== 'none') {
    style += ` stroke-dasharray: ${config.strokeDasharray};`
  }

  return style
}

/**
 * 预设连接线样式
 */
export const EDGE_PRESETS = {
  /** 默认实线 */
  default: {
    stroke: '#999',
    strokeWidth: 2,
    strokeDasharray: 'none' as const,
    hasArrow: false,
  },
  /** 虚线样式 */
  dashed: {
    stroke: '#999',
    strokeWidth: 2,
    strokeDasharray: '5,5' as const,
    hasArrow: false,
  },
  /** 点线样式 */
  dotted: {
    stroke: '#999',
    strokeWidth: 2,
    strokeDasharray: '2,2' as const,
    hasArrow: false,
  },
  /** 强调样式（红色） */
  emphasized: {
    stroke: '#FF6B6B',
    strokeWidth: 3,
    strokeDasharray: 'none' as const,
    hasArrow: true,
  },
  /** 低透明度样式 */
  subtle: {
    stroke: '#CCC',
    strokeWidth: 1,
    strokeDasharray: 'none' as const,
    hasArrow: false,
  },
}
