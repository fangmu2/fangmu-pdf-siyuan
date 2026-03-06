/**
 * 大纲视图拖拽工具函数
 * 支持 MarginNote 风格的拖拽排序和层级调整
 */

/** 大纲节点接口 */
export interface OutlineNode {
  /** 节点 ID */
  id: string
  /** 节点文本 */
  text: string
  /** 节点层级（深度） */
  level: number
  /** 是否展开 */
  expanded: boolean
  /** 是否有子节点 */
  hasChildren: boolean
  /** 父节点 ID */
  parentId: string | null
  /** 子节点列表 */
  children: OutlineNode[]
  /** 标注信息（可选） */
  annotation?: any
}

/** 拖拽目标类型 */
export enum OutlineDropTargetType {
  /** 成为兄弟节点（之前） */
  BEFORE = 'before',
  /** 成为子节点 */
  CHILD = 'child',
  /** 成为兄弟节点（之后） */
  AFTER = 'after',
}

/** 拖拽目标信息 */
export interface OutlineDropTarget {
  /** 目标节点 ID */
  nodeId: string
  /** 目标类型 */
  type: OutlineDropTargetType
  /** 目标节点在 visibleNodes 中的索引 */
  index: number
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
): OutlineDropTargetType {
  const nodeTop = targetRect.top
  const nodeHeight = targetRect.height

  // 将节点分为三个区域
  const topThreshold = nodeTop + nodeHeight * 0.33
  const bottomThreshold = nodeTop + nodeHeight * 0.67

  if (mousePosition.y < topThreshold) {
    return OutlineDropTargetType.BEFORE
  } else if (mousePosition.y > bottomThreshold) {
    return OutlineDropTargetType.AFTER
  } else {
    return OutlineDropTargetType.CHILD
  }
}

/**
 * 验证拖拽目标是否合法
 * 防止循环依赖（子节点不能成为父节点的父节点）
 *
 * @param draggedNodeId - 被拖拽的节点 ID
 * @param targetNodeId - 目标节点 ID
 * @param nodes - 所有节点列表（树形结构）
 * @returns 是否合法
 */
export function isValidDropTarget(
  draggedNodeId: string,
  targetNodeId: string,
  nodes: OutlineNode[],
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
 * @param nodes - 所有节点列表（树形结构）
 * @returns A 是否是 B 的后代
 */
function isDescendant(
  nodeIdA: string,
  nodeIdB: string,
  nodes: OutlineNode[],
): boolean {
  // 查找节点 B
  const findNode = (nodeList: OutlineNode[], id: string): OutlineNode | null => {
    for (const node of nodeList) {
      if (node.id === id) return node
      if (node.children.length > 0) {
        const found = findNode(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  const nodeB = findNode(nodes, nodeIdB)
  if (!nodeB) return false

  // 如果 A 是 B 的父节点，则 B 是 A 的后代
  if (nodeB.parentId === nodeIdA) {
    return true
  }

  // 递归检查 B 的父节点
  if (nodeB.parentId) {
    // 找到父节点
    const parent = findNode(nodes, nodeB.parentId)
    if (parent) {
      return isDescendant(nodeIdA, parent.id, nodes)
    }
  }

  return false
}

/**
 * 查找节点在树中的位置
 * @param nodes - 节点树
 * @param nodeId - 节点 ID
 * @returns 节点及其父节点信息
 */
export function findNodeInTree(
  nodes: OutlineNode[],
  nodeId: string,
): { node: OutlineNode, parent: OutlineNode | null } | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return {
        node,
        parent: null,
      }
    }
    if (node.children.length > 0) {
      const found = findNodeInTree(node.children, nodeId)
      if (found) {
        return {
          node: found.node,
          parent: node,
        }
      }
    }
  }
  return null
}

/**
 * 从树中移除节点
 * @param nodes - 节点树
 * @param nodeId - 要移除的节点 ID
 * @returns 被移除的节点，如果没有找到则返回 null
 */
export function removeNodeFromTree(
  nodes: OutlineNode[],
  nodeId: string,
): OutlineNode | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === nodeId) {
      const removed = nodes.splice(i, 1)[0]
      return removed
    }
    if (nodes[i].children.length > 0) {
      const removed = removeNodeFromTree(nodes[i].children, nodeId)
      if (removed) {
        nodes[i].hasChildren = nodes[i].children.length > 0
        return removed
      }
    }
  }
  return null
}

/**
 * 将节点插入到指定位置
 * @param nodes - 节点树
 * @param nodeToInsert - 要插入的节点
 * @param targetNodeId - 目标节点 ID
 * @param targetType - 目标类型
 */
export function insertNodeIntoTree(
  nodes: OutlineNode[],
  nodeToInsert: OutlineNode,
  targetNodeId: string,
  targetType: OutlineDropTargetType,
): void {
  // 找到目标节点
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === targetNodeId) {
      handleTargetFound(nodes, i, nodeToInsert, targetType)
      return
    }
    if (nodes[i].children.length > 0) {
      const found = findAndInsertInSubtree(nodes[i].children, nodeToInsert, targetNodeId, targetType)
      if (found) return
    }
  }
}

function findAndInsertInSubtree(
  subtree: OutlineNode[],
  nodeToInsert: OutlineNode,
  targetNodeId: string,
  targetType: OutlineDropTargetType,
): boolean {
  for (let i = 0; i < subtree.length; i++) {
    if (subtree[i].id === targetNodeId) {
      handleTargetFound(subtree, i, nodeToInsert, targetType)
      return true
    }
    if (subtree[i].children.length > 0) {
      const found = findAndInsertInSubtree(subtree[i].children, nodeToInsert, targetNodeId, targetType)
      if (found) return true
    }
  }
  return false
}

function handleTargetFound(
  nodeList: OutlineNode[],
  targetIndex: number,
  nodeToInsert: OutlineNode,
  targetType: OutlineDropTargetType,
): void {
  const targetNode = nodeList[targetIndex]

  switch (targetType) {
    case OutlineDropTargetType.BEFORE:
      // 插入到目标节点之前（作为兄弟节点）
      nodeToInsert.parentId = targetNode.parentId
      nodeToInsert.level = targetNode.level
      nodeList.splice(targetIndex, 0, nodeToInsert)
      break

    case OutlineDropTargetType.AFTER:
      // 插入到目标节点之后（作为兄弟节点）
      nodeToInsert.parentId = targetNode.parentId
      nodeToInsert.level = targetNode.level
      nodeList.splice(targetIndex + 1, 0, nodeToInsert)
      break

    case OutlineDropTargetType.CHILD:
      // 作为目标节点的子节点
      nodeToInsert.parentId = targetNode.id
      nodeToInsert.level = targetNode.level + 1
      targetNode.children.push(nodeToInsert)
      targetNode.hasChildren = true
      break
  }
}

/**
 * 更新节点的 level 信息（递归）
 */
export function updateNodeLevels(
  nodes: OutlineNode[],
  parentLevel: number = 0,
): void {
  for (const node of nodes) {
    node.level = parentLevel + 1
    if (node.children.length > 0) {
      updateNodeLevels(node.children, node.level)
    }
  }
}
