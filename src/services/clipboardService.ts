/**
 * 剪贴板服务
 * @fileoverview 提供思维导图节点的内存剪贴板功能，支持复制/粘贴/剪切操作
 */

import type {
  FreeMindMapEdge,
  FreeMindMapNode,
} from '@/types/mindmapFree'

/**
 * 剪贴板数据类型
 */
export interface ClipboardData {
  /** 数据类型 */
  type: 'node' | 'nodes'
  /** 数据内容 */
  data: {
    /** 节点列表 */
    nodes: FreeMindMapNode[]
    /** 连线列表 */
    edges: FreeMindMapEdge[]
    /** 来源学习集 ID */
    studySetId: string
    /** 来源画布 ID */
    canvasId?: string
    /** 复制时间戳 */
    copiedAt: number
  }
}

/**
 * 剪贴板服务类
 * 使用内存剪贴板，不支持跨应用复制
 */
class ClipboardService {
  /** 内存剪贴板存储 */
  private clipboard: ClipboardData | null = null

  /**
   * 复制节点到剪贴板
   * @param nodes 要复制的节点列表
   * @param edges 要复制的连线列表
   * @param studySetId 来源学习集 ID
   * @param canvasId 来源画布 ID（可选）
   */
  copy(
    nodes: FreeMindMapNode[],
    edges: FreeMindMapEdge[],
    studySetId: string,
    canvasId?: string,
  ): void {
    if (!nodes || nodes.length === 0) {
      console.warn('[ClipboardService] 没有要复制的节点')
      return
    }

    // 深度克隆节点数据，避免引用问题
    const clonedNodes = JSON.parse(JSON.stringify(nodes))
    const clonedEdges = JSON.parse(JSON.stringify(edges))

    this.clipboard = {
      type: nodes.length > 1 ? 'nodes' : 'node',
      data: {
        nodes: clonedNodes,
        edges: clonedEdges,
        studySetId,
        canvasId,
        copiedAt: Date.now(),
      },
    }

    console.log(`[ClipboardService] 已复制 ${nodes.length} 个节点到剪贴板`)
  }

  /**
   * 从剪贴板粘贴数据
   * @returns 剪贴板数据，如果为空则返回 null
   */
  paste(): ClipboardData | null {
    if (!this.clipboard) {
      console.log('[ClipboardService] 剪贴板为空')
      return null
    }

    console.log(`[ClipboardService] 从剪贴板粘贴 ${this.clipboard.data.nodes.length} 个节点`)
    return this.clipboard
  }

  /**
   * 清空剪贴板
   */
  clear(): void {
    this.clipboard = null
    console.log('[ClipboardService] 剪贴板已清空')
  }

  /**
   * 检查剪贴板是否有数据
   * @returns 是否有数据
   */
  hasData(): boolean {
    return this.clipboard !== null && this.clipboard.data.nodes.length > 0
  }

  /**
   * 获取剪贴板中的节点数量
   * @returns 节点数量
   */
  getNodeCount(): number {
    return this.clipboard?.data.nodes.length ?? 0
  }

  /**
   * 获取剪贴板数据来源信息
   * @returns 来源学习集 ID 和画布 ID
   */
  getSourceInfo(): { studySetId: string, canvasId?: string } | null {
    if (!this.clipboard) return null
    return {
      studySetId: this.clipboard.data.studySetId,
      canvasId: this.clipboard.data.canvasId,
    }
  }
}

/**
 * 单例模式导出
 */
export const clipboardService = new ClipboardService()

/**
 * 辅助函数：生成新节点 ID
 */
export function generateNewNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 辅助函数：生成新连线 ID
 */
export function generateNewEdgeId(): string {
  return `edge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 辅助函数：计算粘贴偏移量
 * 避免新节点覆盖原节点
 * @param nodes 要粘贴的节点列表
 * @param offset 基础偏移量（像素）
 * @returns 偏移后的节点位置
 */
export function calculatePasteOffset(
  nodes: FreeMindMapNode[],
  offset: number = 30,
): { x: number, y: number } {
  if (!nodes || nodes.length === 0) {
    return {
      x: offset,
      y: offset,
    }
  }

  // 找到所有节点的最小 X 和 Y 坐标
  let minX = Infinity
  let minY = Infinity

  nodes.forEach((node) => {
    if (node.position.x < minX) minX = node.position.x
    if (node.position.y < minY) minY = node.position.y
  })

  // 返回偏移量
  return {
    x: offset,
    y: offset,
  }
}
