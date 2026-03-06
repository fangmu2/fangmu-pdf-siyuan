/**
 * 思维导图撤销/重做服务
 * 使用 Command Pattern 实现操作的撤销和重做
 */

import type { FreeMindMapNode } from '@/types/mindmapFree'

/** 操作类型 */
export enum OperationType {
  /** 创建节点 */
  CREATE_NODE = 'create_node',
  /** 删除节点 */
  DELETE_NODE = 'delete_node',
  /** 移动节点（拖拽建立关系） */
  MOVE_NODE = 'move_node',
  /** 合并节点 */
  MERGE_NODE = 'merge_node',
  /** 更新节点 */
  UPDATE_NODE = 'update_node',
  /** 创建关联线 */
  CREATE_LINK = 'create_link',
  /** 删除关联线 */
  DELETE_LINK = 'delete_link',
}

/** 操作数据接口 */
export interface Operation {
  /** 操作类型 */
  type: OperationType
  /** 操作时间戳 */
  timestamp: number
  /** 操作数据 */
  data: any
  /** 撤销数据（用于恢复） */
  undoData: any
  /** 重做数据（用于重新执行） */
  redoData?: any
  /** 操作描述 */
  description?: string
}

/**
 * 撤销/重做管理器
 */
export class UndoManager {
  /** 撤销栈 */
  private undoStack: Operation[] = []
  /** 重做栈 */
  private redoStack: Operation[] = []
  /** 最大历史记录数量 */
  private maxHistorySize: number = 50
  /** 是否正在撤销/重做 */
  private isUndoingRedoing: boolean = false

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize
  }

  /**
   * 记录操作
   */
  record(operation: Operation) {
    // 如果正在撤销/重做，不记录新操作
    if (this.isUndoingRedoing) return

    // 添加到撤销栈
    this.undoStack.push(operation)

    // 限制历史记录数量
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift()
    }

    // 清空重做栈（执行新操作后，重做栈清空）
    this.redoStack = []

    console.log('[撤销管理器] 记录操作:', operation.type, operation.description)
  }

  /**
   * 撤销
   */
  undo(): Operation | null {
    if (this.undoStack.length === 0) {
      console.warn('[撤销管理器] 没有可撤销的操作')
      return null
    }

    const operation = this.undoStack.pop()!
    this.redoStack.push(operation)
    this.isUndoingRedoing = true

    console.log('[撤销管理器] 撤销操作:', operation.type)

    return operation
  }

  /**
   * 重做
   */
  redo(): Operation | null {
    if (this.redoStack.length === 0) {
      console.warn('[撤销管理器] 没有可重做的操作')
      return null
    }

    const operation = this.redoStack.pop()!
    this.undoStack.push(operation)
    this.isUndoingRedoing = true

    console.log('[撤销管理器] 重做操作:', operation.type)

    return operation
  }

  /**
   * 标记撤销/重做完成
   */
  finishUndoRedo() {
    this.isUndoingRedoing = false
  }

  /**
   * 清空历史记录
   */
  clear() {
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * 获取撤销栈大小
   */
  getUndoStackSize(): number {
    return this.undoStack.length
  }

  /**
   * 获取重做栈大小
   */
  getRedoStackSize(): number {
    return this.redoStack.length
  }

  /**
   * 获取最新的操作
   */
  getLatestOperation(): Operation | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null
  }
}

/**
 * 节点移动操作数据结构
 */
export interface MoveNodeData {
  /** 节点 ID */
  nodeId: string
  /** 原父节点 ID */
  oldParentId?: string
  /** 新父节点 ID */
  newParentId?: string
  /** 原位置 */
  oldPosition?: { x: number, y: number }
  /** 新位置 */
  newPosition?: { x: number, y: number }
  /** 移动类型 */
  moveType: 'reparent' | 'reorder' | 'both'
}

/**
 * 节点合并操作数据结构
 */
export interface MergeNodeData {
  /** 目标节点 ID */
  targetNodeId: string
  /** 被合并的节点 ID 列表 */
  sourceNodeIds: string[]
  /** 合并后的内容 */
  mergedContent: string
  /** 原内容（用于撤销） */
  originalContent: string
  /** 转移的子节点信息 */
  transferredChildren: Array<{
    childId: string
    oldParentId: string
    newParentId: string
  }>
}

/**
 * 节点创建操作数据结构
 */
export interface CreateNodeData {
  /** 节点数据 */
  node: FreeMindMapNode
}

/**
 * 节点删除操作数据结构
 */
export interface DeleteNodeData {
  /** 节点 ID */
  nodeId: string
  /** 节点数据（用于恢复） */
  node: FreeMindMapNode
  /** 子节点列表（用于恢复层级关系） */
  children: FreeMindMapNode[]
}

// 创建全局撤销管理器实例
export const globalUndoManager = new UndoManager(50)
