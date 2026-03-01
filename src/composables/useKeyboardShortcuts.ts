<script setup lang="ts">
/**
 * 键盘快捷键组合式函数
 * MarginNote 风格的键盘快捷操作
 */

import { onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description?: string
}

export interface KeyboardShortcutsOptions {
  // 是否启用快捷键
  enabled?: Ref<boolean>
  // 自定义快捷键配置
  shortcuts?: ShortcutConfig[]
  // 阻止默认事件的键位
  preventDefaultKeys?: string[]
}

/**
 * 默认快捷键配置
 */
const defaultShortcuts: ShortcutConfig[] = [
  // 节点操作
  {
    key: 'n',
    handler: () => {},
    description: '添加文字卡片',
  },
  {
    key: 'i',
    handler: () => {},
    description: '添加图片卡片',
  },
  {
    key: 'g',
    handler: () => {},
    description: '创建分组',
  },
  {
    key: 'Delete',
    handler: () => {},
    description: '删除选中节点',
  },
  {
    key: 'Backspace',
    handler: () => {},
    description: '删除选中节点',
  },

  // 编辑操作
  {
    key: 'Enter',
    handler: () => {},
    description: '编辑选中节点',
  },
  {
    key: 'Escape',
    handler: () => {},
    description: '取消选择/关闭对话框',
  },
  {
    key: 'd',
    ctrl: true,
    handler: () => {},
    description: '复制节点',
  },
  {
    key: 'v',
    ctrl: true,
    handler: () => {},
    description: '粘贴节点',
  },
  {
    key: 'c',
    ctrl: true,
    handler: () => {},
    description: '复制节点',
  },
  {
    key: 'x',
    ctrl: true,
    handler: () => {},
    description: '剪切节点',
  },
  {
    key: 'z',
    ctrl: true,
    handler: () => {},
    description: '撤销',
  },
  {
    key: 'y',
    ctrl: true,
    handler: () => {},
    description: '重做',
  },

  // 视图操作
  {
    key: '0',
    ctrl: true,
    handler: () => {},
    description: '适应视图',
  },
  {
    key: '=',
    ctrl: true,
    handler: () => {},
    description: '放大',
  },
  {
    key: '-',
    ctrl: true,
    handler: () => {},
    description: '缩小',
  },
  {
    key: '1',
    handler: () => {},
    description: '自由布局',
  },
  {
    key: '2',
    handler: () => {},
    description: '树状布局',
  },
  {
    key: '3',
    handler: () => {},
    description: '垂直布局',
  },
  {
    key: '4',
    handler: () => {},
    description: '水平布局',
  },

  // 合并/拆分
  {
    key: 'm',
    ctrl: true,
    handler: () => {},
    description: '合并到父节点',
  },
  {
    key: 's',
    ctrl: true,
    handler: () => {},
    description: '拆分为独立节点',
  },

  // 其他
  {
    key: 'f',
    ctrl: true,
    handler: () => {},
    description: '搜索节点',
  },
  {
    key: 'r',
    ctrl: true,
    handler: () => {},
    description: '切换实时同步',
  },
  {
    key: ' ',
    handler: () => {},
    description: '切换网格显示',
  },
]

/**
 * 键盘快捷键组合式函数
 * @param options 配置选项
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const {
    enabled,
    shortcuts = defaultShortcuts,
    preventDefaultKeys = ['Delete', 'Backspace', 'Enter', 'Escape'],
  } = options

  // 存储快捷键处理函数
  const handlers = new Map<string, ShortcutConfig>()

  /**
   * 生成快捷键唯一标识
   */
  function createShortcutKey(config: ShortcutConfig): string {
    const parts: string[] = []
    if (config.ctrl) parts.push('Ctrl')
    if (config.shift) parts.push('Shift')
    if (config.alt) parts.push('Alt')
    parts.push(config.key.toLowerCase())
    return parts.join('+')
  }

  /**
   * 注册快捷键
   */
  function registerShortcut(config: ShortcutConfig): void {
    const shortcutKey = createShortcutKey(config)
    handlers.set(shortcutKey, config)
  }

  /**
   * 注销快捷键
   */
  function unregisterShortcut(config: ShortcutConfig): void {
    const shortcutKey = createShortcutKey(config)
    handlers.delete(shortcutKey)
  }

  /**
   * 处理键盘按下事件
   */
  function handleKeyDown(event: KeyboardEvent): void {
    // 检查是否启用
    if (enabled?.value === false) return

    // 检查是否在输入框中
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    // 构建快捷键标识
    const pressedKey: string[] = []
    if (event.ctrlKey || event.metaKey) pressedKey.push('Ctrl')
    if (event.shiftKey) pressedKey.push('Shift')
    if (event.altKey) pressedKey.push('Alt')
    pressedKey.push(event.key.toLowerCase())

    const shortcutKey = pressedKey.join('+')

    // 查找匹配的快捷键
    const config = handlers.get(shortcutKey)
    if (config) {
      // 阻止默认事件
      if (preventDefaultKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
        event.preventDefault()
      }

      // 执行处理函数
      config.handler()
    }
  }

  /**
   * 批量注册快捷键
   */
  function registerAll(shortcuts: ShortcutConfig[]): void {
    shortcuts.forEach(shortcut => registerShortcut(shortcut))
  }

  /**
   * 批量注销快捷键
   */
  function unregisterAll(shortcuts: ShortcutConfig[]): void {
    shortcuts.forEach(shortcut => unregisterShortcut(shortcut))
  }

  /**
   * 更新快捷键处理函数
   */
  function updateHandler(key: string, ctrl = false, shift = false, alt = false, handler: () => void): void {
    const config = { key, ctrl, shift, alt, handler }
    unregisterShortcut(config)
    registerShortcut(config)
  }

  // 自动注册默认快捷键
  onMounted(() => {
    registerAll(shortcuts)
    window.addEventListener('keydown', handleKeyDown)
  })

  // 清理事件监听
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    handlers.clear()
  })

  return {
    registerShortcut,
    unregisterShortcut,
    registerAll,
    unregisterAll,
    updateHandler,
  }
}

/**
 * 创建快捷键配置帮助函数
 */
export function createShortcut(
  key: string,
  handler: () => void,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean; description?: string } = {}
): ShortcutConfig {
  return {
    key,
    handler,
    ctrl: options.ctrl ?? false,
    shift: options.shift ?? false,
    alt: options.alt ?? false,
    description: options.description,
  }
}
