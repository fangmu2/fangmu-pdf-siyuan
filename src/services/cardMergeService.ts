/**
 * 思维导图节点合并服务
 * 支持 MarginNote4 风格的节点合并功能
 */

import type { FreeMindMapNode } from '@/types/mindmapFree'
import { useFreeMindMapStore } from '@/stores/freeMindMapStore'

/** 合并选项 */
export interface MergeOptions {
  /** 分隔符，默认为换行 */
  separator?: string
  /** 是否保留原节点内容，默认为 true */
  keepOriginal?: boolean
  /** 是否转移子节点，默认为 true */
  transferChildren?: boolean
}

/** 合并结果 */
export interface MergeResult {
  /** 合并后的节点 ID */
  targetNodeId: string
  /** 被合并的节点 ID 列表 */
  mergedNodeIds: string[]
  /** 合并后的内容 */
  mergedContent: string
  /** 转移的子节点数量 */
  transferredChildrenCount: number
}

/**
 * 合并多个节点到目标节点
 * @param store - 思维导图 Store
 * @param sourceNodeIds - 源节点 ID 列表（被合并的节点）
 * @param targetNodeId - 目标节点 ID（合并后的节点）
 * @param options - 合并选项
 * @returns 合并结果
 */
export function mergeNodes(
  store: ReturnType<typeof useFreeMindMapStore>,
  sourceNodeIds: string[],
  targetNodeId: string,
  options: MergeOptions = {},
): MergeResult | null {
  const {
    separator = '\n',
    keepOriginal = true,
    transferChildren = true,
  } = options

  // 获取所有节点
  const targetNode = store.nodes.find((n) => n.id === targetNodeId)
  const sourceNodes = sourceNodeIds.map((id) => store.nodes.find((n) => n.id === id)).filter(Boolean) as FreeMindMapNode[]

  if (!targetNode || sourceNodes.length === 0) {
    console.error('[合并节点] 无效的节点 ID')
    return null
  }

  // 1. 收集所有内容
  const contents = sourceNodes.map((node) => node.data.content || node.data.title)
  const mergedContent = contents.join(separator)

  // 2. 更新目标节点内容
  const newContent = targetNode.data.content
    ? `${targetNode.data.content}${separator}${mergedContent}`
    : mergedContent

  store.updateNode({
    id: targetNodeId,
    content: newContent,
  })

  // 3. 转移子节点
  let transferredChildrenCount = 0

  if (transferChildren) {
    sourceNodes.forEach((sourceNode) => {
      // 获取源节点的所有子节点
      const children = store.getChildren(sourceNode.id)

      children.forEach((child) => {
        // 将子节点的父节点设置为目标节点
        store.setParent(child.id, targetNodeId)
        transferredChildrenCount++
      })
    })
  }

  // 4. 删除源节点（如果不需要保留）
  if (!keepOriginal) {
    sourceNodeIds.forEach((id) => {
      store.removeNode(id)
    })
  }

  // 5. 记录操作日志
  console.log('[合并节点]', {
    targetNodeId,
    sourceNodeIds,
    newContentLength: newContent.length,
    transferredChildrenCount,
  })

  return {
    targetNodeId,
    mergedNodeIds: sourceNodeIds,
    mergedContent: newContent,
    transferredChildrenCount,
  }
}

/**
 * 批量合并节点（用户框选多个节点后合并）
 * @param store - 思维导图 Store
 * @param nodeIds - 要合并的节点 ID 列表
 * @param keepFirst - 是否保留第一个节点作为目标，默认为 true
 * @returns 合并结果
 */
export function batchMergeNodes(
  store: ReturnType<typeof useFreeMindMapStore>,
  nodeIds: string[],
  keepFirst: boolean = true,
): MergeResult | null {
  if (nodeIds.length < 2) {
    console.warn('[批量合并] 至少需要 2 个节点')
    return null
  }

  // 选择目标节点
  const targetNodeId = keepFirst ? nodeIds[0] : nodeIds[nodeIds.length - 1]
  const sourceNodeIds = nodeIds.filter((id) => id !== targetNodeId)

  return mergeNodes(store, sourceNodeIds, targetNodeId)
}

/**
 * 检查节点是否可以合并
 * @param sourceNodeIds - 源节点 ID 列表
 * @param targetNodeId - 目标节点 ID
 * @returns 是否合法
 */
export function canMergeNodes(
  sourceNodeIds: string[],
  targetNodeId: string,
): boolean {
  // 不能合并到自己
  if (sourceNodeIds.includes(targetNodeId)) {
    return false
  }

  // 至少需要一个源节点
  if (sourceNodeIds.length === 0) {
    return false
  }

  return true
}

/**
 * 撤销合并操作
 * @param store - 思维导图 Store
 * @param mergeResult - 之前的合并结果
 * @param originalContent - 合并前的内容（需要提前保存）
 * @returns 是否成功
 */
export function undoMerge(
  store: ReturnType<typeof useFreeMindMapStore>,
  mergeResult: MergeResult,
  originalContent: string,
): boolean {
  const targetNode = store.nodes.find((n) => n.id === mergeResult.targetNodeId)

  if (!targetNode) {
    console.error('[撤销合并] 目标节点不存在')
    return false
  }

  // 恢复目标节点内容
  store.updateNode({
    id: mergeResult.targetNodeId,
    content: originalContent,
  })

  // 恢复被转移的子节点（简化实现）
  console.log('[撤销合并] 子节点恢复功能待完善')

  console.log('[撤销合并]', mergeResult)
  return true
}
