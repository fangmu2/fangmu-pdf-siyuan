/**
 * 思维导图拖拽工具函数
 * 支持 MarginNote4 风格的拖拽目标判定和节点重组
 */

import type { FreeMindMapNode } from '@/types/mindmapFree'

/** 拖拽目标类型 */
export enum DropTargetType {
  /** 成为兄弟节点（之前） */
  BEFORE = 'before',
  /** 成为子节点 */
  CHILD = 'child',
  /** 成为兄弟节点（之后） */
  AFTER = 'after',
}

/** 拖拽目标信息 */
export interface DropTarget {
  /** 目标节点 ID */
  nodeId: string
  /** 目标类型 */
  type: DropTargetType
  /** 目标节点位置 */
  rect: DOMRect
}

/**
 * 查找拖拽目标节点
 * @param draggedNodeId - 被拖拽的节点 ID
 * @param mousePosition - 鼠标位置
 * @param nodes - 所有节点列表
 * @param threshold - 检测阈值（像素）
 * @returns 拖拽目标信息，如果没有找到则返回 null
 */
export function findDropTarget(
  draggedNodeId: string,
  mousePosition: { x: number, y: number },
  nodes: FreeMindMapNode[],
  threshold = 100,
): DropTarget | null {
  // 排除被拖拽的节点本身
  const otherNodes = nodes.filter((n) => n.id !== draggedNodeId)

  // 查找最近的节点
  let nearestNode: FreeMindMapNode | null = null
  let minDistance = Infinity

  for (const node of otherNodes) {
    const nodeCenter = {
      x: node.position.x + 100, // 假设节点宽度约 200px，取中心
      y: node.position.y + 30, // 假设节点高度约 60px，取中心
    }

    const distance = Math.sqrt(
      (mousePosition.x - nodeCenter.x) ** 2
      + (mousePosition.y - nodeCenter.y) ** 2,
    )

    if (distance < threshold && distance < minDistance) {
      minDistance = distance
      nearestNode = node
    }
  }

  if (!nearestNode) return null

  // 创建临时的 DOMRect 用于计算（实际使用时应该从 DOM 元素获取）
  const rect = {
    left: nearestNode.position.x,
    top: nearestNode.position.y,
    right: nearestNode.position.x + 200,
    bottom: nearestNode.position.y + 60,
    width: 200,
    height: 60,
    x: nearestNode.position.x,
    y: nearestNode.position.y,
    toJSON: () => ({}),
  } as DOMRect

  // 判断目标类型
  const type = calculateDropTargetType(mousePosition, rect)

  return {
    nodeId: nearestNode.id,
    type,
    rect,
  }
}

/**
 * 计算拖拽目标类型
 * 根据鼠标在节点上的位置，判断是成为子节点还是兄弟节点
 *
 * MarginNote4 规则：
 * - 上 1/3 区域：成为兄弟节点（之前）
 * - 中间 1/3 区域：成为子节点
 * - 下 1/3 区域：成为兄弟节点（之后）
 *
 * @param mousePosition - 鼠标位置
 * @param targetRect - 目标节点位置
 * @returns 目标类型
 */
export function calculateDropTargetType(
  mousePosition: { x: number, y: number },
  targetRect: DOMRect,
): DropTargetType {
  const nodeTop = targetRect.top
  const nodeHeight = targetRect.height

  // 将节点分为三个区域
  const topThreshold = nodeTop + nodeHeight * 0.33
  const bottomThreshold = nodeTop + nodeHeight * 0.67

  if (mousePosition.y < topThreshold) {
    return DropTargetType.BEFORE
  } else if (mousePosition.y > bottomThreshold) {
    return DropTargetType.AFTER
  } else {
    return DropTargetType.CHILD
  }
}

/**
 * 验证拖拽目标是否合法
 * 防止循环依赖（子节点不能成为父节点的父节点）
 *
 * @param draggedNodeId - 被拖拽的节点 ID
 * @param targetNodeId - 目标节点 ID
 * @param nodes - 所有节点列表
 * @returns 是否合法
 */
export function isValidDropTarget(
  draggedNodeId: string,
  targetNodeId: string,
  nodes: FreeMindMapNode[],
): boolean {
  // 不能拖拽到自己身上
  if (draggedNodeId === targetNodeId) {
    return false
  }

  // 检查是否会造成循环依赖
  return !isDescendant(draggedNodeId, targetNodeId, nodes)
}

/**
 * 检查节点 A 是否是节点 B 的后代
 * @param nodeIdA - 节点 A
 * @param nodeIdB - 节点 B
 * @param nodes - 所有节点列表
 * @returns A 是否是 B 的后代
 */
function isDescendant(
  nodeIdA: string,
  nodeIdB: string,
  nodes: FreeMindMapNode[],
): boolean {
  const nodeB = nodes.find((n) => n.id === nodeIdB)
  if (!nodeB) return false

  // 如果 A 是 B 的父节点，则 B 是 A 的后代
  if (nodeB.parentId === nodeIdA) {
    return true
  }

  // 递归检查 B 的父节点
  if (nodeB.parentId) {
    return isDescendant(nodeIdA, nodeB.parentId, nodes)
  }

  return false
}

/**
 * 获取节点的实际 DOM 边界
 * @param node - 节点
 * @param container - 容器元素
 * @returns 节点的 DOMRect
 */
export function getNodeBounds(
  node: FreeMindMapNode,
  container?: HTMLElement,
): DOMRect {
  // 如果提供了容器，尝试从 DOM 获取实际位置
  if (container) {
    const element = container.querySelector(`[data-node-id="${node.id}"]`)
    if (element) {
      return element.getBoundingClientRect()
    }
  }

  // 否则使用估算值
  const width = (node.style?.width as number) || 200
  const height = (node.style?.height as number) || 60

  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + width,
    bottom: node.position.y + height,
    width,
    height,
    x: node.position.x,
    y: node.position.y,
    toJSON: () => ({}),
  } as DOMRect
}

/**
 * 计算两个节点之间的距离
 */
export function getDistanceBetweenNodes(
  nodeA: FreeMindMapNode,
  nodeB: FreeMindMapNode,
): number {
  const centerA = {
    x: nodeA.position.x + 100,
    y: nodeA.position.y + 30,
  }
  const centerB = {
    x: nodeB.position.x + 100,
    y: nodeB.position.y + 30,
  }

  return Math.sqrt(
    (centerA.x - centerB.x) ** 2
    + (centerA.y - centerB.y) ** 2,
  )
}
