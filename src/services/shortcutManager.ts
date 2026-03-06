/**
 * 思维导图快捷键服务
 * 提供全局快捷键支持（Ctrl+Z 撤销、Ctrl+Shift+Z 重做）
 */

import type { UndoManager } from './undoManager'
import type { useFreeMindMapStore } from '@/stores/freeMindMapStore'

/**
 * 快捷键管理器
 */
export class ShortcutManager {
  private undoManager: UndoManager
  private store: ReturnType<typeof useFreeMindMapStore>
  private keyBindings: Map<string, (e: KeyboardEvent) => void>
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(
    undoManager: UndoManager,
    store: ReturnType<typeof useFreeMindMapStore>,
  ) {
    this.undoManager = undoManager
    this.store = store
    this.keyBindings = new Map()

    // 注册默认快捷键
    this.registerDefaults()
  }

  /**
   * 注册默认快捷键
   */
  private registerDefaults() {
    // Ctrl+Z - 撤销
    this.register('ctrl+z', (e) => this.handleUndo(e))

    // Ctrl+Shift+Z 或 Ctrl+Y - 重做
    this.register('ctrl+shift+z', (e) => this.handleRedo(e))
    this.register('ctrl+y', (e) => this.handleRedo(e))

    // Ctrl+C - 复制
    this.register('ctrl+c', (e) => this.handleCopy(e))

    // Ctrl+X - 剪切
    this.register('ctrl+x', (e) => this.handleCut(e))

    // Ctrl+V - 粘贴
    this.register('ctrl+v', (e) => this.handlePaste(e))
  }

  /**
   * 注册快捷键
   */
  register(key: string, handler: (e: KeyboardEvent) => void) {
    this.keyBindings.set(key.toLowerCase(), handler)
  }

  /**
   * 处理撤销
   */
  private handleUndo(e: KeyboardEvent) {
    e.preventDefault()

    const operation = this.undoManager.undo()
    if (!operation) {
      console.log('[快捷键] 没有可撤销的操作')
      return
    }

    // 执行撤销逻辑
    this.executeUndo(operation)

    this.undoManager.finishUndoRedo()
    console.log('[快捷键] 撤销完成')
  }

  /**
   * 处理重做
   */
  private handleRedo(e: KeyboardEvent) {
    e.preventDefault()

    const operation = this.undoManager.redo()
    if (!operation) {
      console.log('[快捷键] 没有可重做的操作')
      return
    }

    // 执行重做逻辑
    this.executeRedo(operation)

    this.undoManager.finishUndoRedo()
    console.log('[快捷键] 重做完成')
  }

  /**
   * 处理复制
   */
  private handleCopy(e: KeyboardEvent) {
    e.preventDefault()

    const selectedIds = this.store.selectedNodeIds
    if (selectedIds.length === 0) {
      console.log('[快捷键] 没有选中的节点')
      return
    }

    this.store.copyNodes(selectedIds)
    console.log(`[快捷键] 已复制 ${selectedIds.length} 个节点`)
  }

  /**
   * 处理剪切
   */
  private handleCut(e: KeyboardEvent) {
    e.preventDefault()

    const selectedIds = this.store.selectedNodeIds
    if (selectedIds.length === 0) {
      console.log('[快捷键] 没有选中的节点')
      return
    }

    this.store.cutNodes(selectedIds)
    console.log(`[快捷键] 已剪切 ${selectedIds.length} 个节点`)
  }

  /**
   * 处理粘贴
   */
  private handlePaste(e: KeyboardEvent) {
    e.preventDefault()

    if (!this.store.hasClipboardData()) {
      console.log('[快捷键] 剪贴板为空')
      return
    }

    const newNodeIds = this.store.pasteNodes()
    if (newNodeIds.length > 0) {
      console.log(`[快捷键] 已粘贴 ${newNodeIds.length} 个节点`)
    }
  }

  /**
   * 执行撤销
   */
  private executeUndo(operation: any) {
    console.log('[快捷键] 执行撤销:', operation.type)

    switch (operation.type) {
      case 'move_node':
        // 撤销节点移动：恢复到原父节点
        if (operation.undoData.oldParentId) {
          this.store.setParent(operation.data.nodeId, operation.undoData.oldParentId)
        }
        if (operation.undoData.oldPosition) {
          this.store.updateNode({
            id: operation.data.nodeId,
            position: operation.undoData.oldPosition,
          })
        }
        break

      case 'create_node':
        // 撤销节点创建：删除节点
        this.store.removeNode(operation.data.nodeId)
        break

      case 'delete_node':
        // 撤销节点删除：恢复节点（简化实现）
        console.log('[撤销删除] 节点恢复功能待完善:', operation.data.nodeId)
        break

      case 'merge_node':
        // 撤销节点合并：恢复原内容
        this.store.updateNode({
          id: operation.data.targetNodeId,
          content: operation.undoData.originalContent,
        })
        break
    }
  }

  /**
   * 执行重做
   */
  private executeRedo(operation: any) {
    console.log('[快捷键] 执行重做:', operation.type)

    switch (operation.type) {
      case 'move_node':
        // 重做节点移动：移动到新父节点
        if (operation.redoData.newParentId) {
          this.store.setParent(operation.data.nodeId, operation.redoData.newParentId)
        }
        if (operation.redoData.newPosition) {
          this.store.updateNode({
            id: operation.data.nodeId,
            position: operation.redoData.newPosition,
          })
        }
        break

      case 'create_node':
        // 重做节点创建：重新创建
        this.store.createNode(operation.redoData.node)
        break

      case 'delete_node':
        // 重做节点删除：再次删除
        this.store.removeNode(operation.data.nodeId)
        break

      case 'merge_node':
        // 重做节点合并：重新合并（简化实现）
        console.log('[重做合并] 节点合并重做功能待完善')
        break
    }
  }

  /**
   * 监听键盘事件
   */
  listen() {
    if (typeof window === 'undefined') return

    this.keydownHandler = (e) => {
      const key = this.buildKey(e)
      const handler = this.keyBindings.get(key)

      if (handler) {
        handler(e)
      }
    }
    window.addEventListener('keydown', this.keydownHandler)
  }

  /**
   * 构建快捷键字符串
   */
  private buildKey(e: KeyboardEvent): string {
    const parts: string[] = []

    if (e.ctrlKey || e.metaKey) {
      parts.push('ctrl')
    }

    if (e.shiftKey) {
      parts.push('shift')
    }

    if (e.altKey) {
      parts.push('alt')
    }

    parts.push(e.key.toLowerCase())

    return parts.join('+')
  }

  /**
   * 销毁监听器
   */
  destroy() {
    this.keyBindings.clear()
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }
  }
}
