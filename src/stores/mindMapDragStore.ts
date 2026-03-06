/**
 * 思维导图拖拽状态管理
 * 用于在拖拽过程中跟踪目标和状态
 */

import type { DropTargetType } from '@/utils/mindmapDragUtils'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

/** 拖拽状态 */
export interface DragState {
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 被拖拽的节点 ID 列表 */
  draggedNodeIds: string[]
  /** 目标节点 ID */
  targetNodeId: string | null
  /** 目标类型 */
  targetType: DropTargetType | null
  /** 目标节点位置（用于显示指示器） */
  targetRect: DOMRect | null
}

/**
 * 思维导图拖拽状态 Store
 */
export const useMindMapDragStore = defineStore('mindMapDrag', () => {
  // 拖拽状态
  const state = reactive<DragState>({
    isDragging: false,
    draggedNodeIds: [],
    targetNodeId: null,
    targetType: null,
    targetRect: null,
  })

  /** 开始拖拽 */
  function startDrag(nodeIds: string[]) {
    state.isDragging = true
    state.draggedNodeIds = nodeIds
    state.targetNodeId = null
    state.targetType = null
    state.targetRect = null
  }

  /** 更新拖拽目标 */
  function updateTarget(
    targetNodeId: string,
    targetType: DropTargetType,
    targetRect: DOMRect,
  ) {
    state.targetNodeId = targetNodeId
    state.targetType = targetType
    state.targetRect = targetRect
  }

  /** 清除拖拽目标 */
  function clearTarget() {
    state.targetNodeId = null
    state.targetType = null
    state.targetRect = null
  }

  /** 结束拖拽 */
  function endDrag() {
    state.isDragging = false
    state.draggedNodeIds = []
    clearTarget()
  }

  /** 判断节点是否是当前拖拽目标 */
  function isTargetNode(nodeId: string): boolean {
    return state.targetNodeId === nodeId
  }

  /** 获取目标节点的样式类 */
  function getTargetHighlightClass(nodeId: string): string {
    if (!isTargetNode(nodeId)) return ''

    switch (state.targetType) {
      case 'child':
        return 'drop-target-child'
      case 'before':
        return 'drop-target-before'
      case 'after':
        return 'drop-target-after'
      default:
        return ''
    }
  }

  return {
    // 状态
    state,
    isDragging: () => state.isDragging,
    draggedNodeIds: () => state.draggedNodeIds,
    targetNodeId: () => state.targetNodeId,
    targetType: () => state.targetType,
    targetRect: () => state.targetRect,

    // 方法
    startDrag,
    updateTarget,
    clearTarget,
    endDrag,
    isTargetNode,
    getTargetHighlightClass,
  }
})
