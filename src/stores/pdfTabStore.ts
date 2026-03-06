// src/stores/pdfTabStore.ts
/**
 * PDF 标签页状态管理
 * 支持同时打开多个 PDF 文件并切换
 */

import { defineStore } from 'pinia'
import {
  computed,
  ref,
} from 'vue'

/** PDF 标签页信息 */
export interface PdfTab {
  /** 标签页 ID */
  id: string
  /** PDF 文件路径 */
  path: string
  /** PDF 文件名 */
  name: string
  /** 当前页码 */
  page: number
  /** 总页数 */
  totalPages: number
  /** 缩放比例 */
  scale: number
  /** 打开时间 */
  openedAt: number
  /** 最后活动时间 */
  lastActiveAt: number
  /** 是否已加载完成 */
  loaded: boolean
  /** 阅读进度 (0-100) */
  progress: number
  /** 是否有修改 */
  hasChanges: boolean
}

/** 标签页状态 */
export type TabStatus = 'loading' | 'ready' | 'error'

/** PDF 标签页 Store */
export const usePdfTabStore = defineStore('pdfTab', () => {
  // 状态
  const tabs = ref<PdfTab[]>([])
  const activeTabId = ref<string | null>(null)
  const maxTabs = 10 // 最大标签页数量

  // 计算属性
  const activeTab = computed(() => {
    return tabs.value.find((tab) => tab.id === activeTabId.value) || null
  })

  const tabCount = computed(() => tabs.value.length)

  const hasTabs = computed(() => tabs.value.length > 0)

  const tabsByRecency = computed(() => {
    return [...tabs.value].sort((a, b) => b.lastActiveAt - a.lastActiveAt)
  })

  /**
   * 生成唯一 ID
   */
  const generateId = (): string => {
    return `pdf-tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  /**
   * 从路径提取文件名
   */
  const extractFileName = (path: string): string => {
    const parts = path.split('/')
    return parts[parts.length - 1] || path
  }

  /**
   * 打开新标签页
   */
  const openTab = (path: string, options?: { page?: number, scale?: number }): string => {
    // 检查是否已打开
    const existingTab = tabs.value.find((tab) => tab.path === path)
    if (existingTab) {
      // 激活已存在的标签页
      activateTab(existingTab.id)
      return existingTab.id
    }

    // 检查标签页数量限制
    if (tabs.value.length >= maxTabs) {
      // 关闭最早打开的标签页
      const oldestTab = tabs.value.reduce((prev, curr) =>
        prev.openedAt < curr.openedAt ? prev : curr,
      )
      closeTab(oldestTab.id)
    }

    // 创建新标签页
    const newTab: PdfTab = {
      id: generateId(),
      path,
      name: extractFileName(path),
      page: options?.page ?? 1,
      totalPages: 0,
      scale: options?.scale ?? 1,
      openedAt: Date.now(),
      lastActiveAt: Date.now(),
      loaded: false,
      progress: 0,
      hasChanges: false,
    }

    tabs.value.push(newTab)
    activeTabId.value = newTab.id

    return newTab.id
  }

  /**
   * 关闭标签页
   */
  const closeTab = (tabId: string): boolean => {
    const index = tabs.value.findIndex((tab) => tab.id === tabId)
    if (index === -1) return false

    tabs.value.splice(index, 1)

    // 如果关闭的是当前激活的标签页，激活相邻标签页
    if (activeTabId.value === tabId) {
      if (tabs.value.length > 0) {
        // 优先激活右侧标签页，否则激活左侧
        const newIndex = Math.min(index, tabs.value.length - 1)
        activeTabId.value = tabs.value[newIndex].id
      } else {
        activeTabId.value = null
      }
    }

    return true
  }

  /**
   * 关闭其他标签页
   */
  const closeOtherTabs = (tabId: string): void => {
    tabs.value = tabs.value.filter((tab) => tab.id === tabId)
    activeTabId.value = tabId
  }

  /**
   * 关闭所有标签页
   */
  const closeAllTabs = (): void => {
    tabs.value = []
    activeTabId.value = null
  }

  /**
   * 关闭右侧所有标签页
   */
  const closeTabsToRight = (tabId: string): void => {
    const index = tabs.value.findIndex((tab) => tab.id === tabId)
    if (index === -1) return

    tabs.value = tabs.value.slice(0, index + 1)

    // 如果当前激活的标签页被关闭了，激活指定标签页
    if (!tabs.value.find((tab) => tab.id === activeTabId.value)) {
      activeTabId.value = tabId
    }
  }

  /**
   * 激活标签页
   */
  const activateTab = (tabId: string): boolean => {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return false

    activeTabId.value = tabId
    tab.lastActiveAt = Date.now()
    return true
  }

  /**
   * 更新标签页信息
   */
  const updateTab = (tabId: string, updates: Partial<PdfTab>): boolean => {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return false

    Object.assign(tab, updates)
    return true
  }

  /**
   * 更新当前页码
   */
  const updatePage = (tabId: string, page: number): void => {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    tab.page = page
    tab.lastActiveAt = Date.now()

    // 计算进度
    if (tab.totalPages > 0) {
      tab.progress = Math.round((page / tab.totalPages) * 100)
    }
  }

  /**
   * 更新总页数
   */
  const updateTotalPages = (tabId: string, totalPages: number): void => {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    tab.totalPages = totalPages
    tab.loaded = true

    // 重新计算进度
    if (tab.page > 0) {
      tab.progress = Math.round((tab.page / totalPages) * 100)
    }
  }

  /**
   * 更新缩放比例
   */
  const updateScale = (tabId: string, scale: number): void => {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    tab.scale = scale
  }

  /**
   * 标记有修改
   */
  const markAsChanged = (tabId: string): void => {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    tab.hasChanges = true
  }

  /**
   * 清除修改标记
   */
  const clearChanges = (tabId: string): void => {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    tab.hasChanges = false
  }

  /**
   * 切换到下一个标签页
   */
  const nextTab = (): void => {
    if (tabs.value.length <= 1) return

    const currentIndex = tabs.value.findIndex((tab) => tab.id === activeTabId.value)
    const nextIndex = (currentIndex + 1) % tabs.value.length
    activateTab(tabs.value[nextIndex].id)
  }

  /**
   * 切换到上一个标签页
   */
  const prevTab = (): void => {
    if (tabs.value.length <= 1) return

    const currentIndex = tabs.value.findIndex((tab) => tab.id === activeTabId.value)
    const prevIndex = (currentIndex - 1 + tabs.value.length) % tabs.value.length
    activateTab(tabs.value[prevIndex].id)
  }

  /**
   * 获取标签页索引
   */
  const getTabIndex = (tabId: string): number => {
    return tabs.value.findIndex((tab) => tab.id === tabId)
  }

  /**
   * 移动标签页位置
   */
  const moveTab = (fromIndex: number, toIndex: number): void => {
    if (fromIndex < 0 || fromIndex >= tabs.value.length) return
    if (toIndex < 0 || toIndex >= tabs.value.length) return

    const [tab] = tabs.value.splice(fromIndex, 1)
    tabs.value.splice(toIndex, 0, tab)
  }

  /**
   * 获取最近打开的 PDF 路径列表
   */
  const getRecentPaths = (limit: number = 5): string[] => {
    return tabsByRecency.value.slice(0, limit).map((tab) => tab.path)
  }

  /**
   * 检查路径是否已打开
   */
  const isPathOpen = (path: string): boolean => {
    return tabs.value.some((tab) => tab.path === path)
  }

  return {
    // 状态
    tabs,
    activeTabId,
    maxTabs,

    // 计算属性
    activeTab,
    tabCount,
    hasTabs,
    tabsByRecency,

    // 方法
    openTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    closeTabsToRight,
    activateTab,
    updateTab,
    updatePage,
    updateTotalPages,
    updateScale,
    markAsChanged,
    clearChanges,
    nextTab,
    prevTab,
    getTabIndex,
    moveTab,
    getRecentPaths,
    isPathOpen,
  }
})
