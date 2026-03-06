/**
 * 思维导图搜索与过滤组合式函数
 * MarginNote 4 风格升级 - 第 7 期
 */

import type { Ref } from 'vue'
import type { FreeMindMapNode } from '@/types/mindmapFree'
import type {
  MindMapFilter,
  MindMapFilterResult,
  MindMapSearchOptions,
  MindMapSearchResult,
  QuickFilterPreset,
} from '@/types/mindMapSearch'
import {
  computed,
  ref,
  watch,
} from 'vue'
import { mindMapSearchService } from '@/services/mindMapSearchService'

interface UseMindMapSearchOptions {
  /** 初始搜索关键词 */
  initialQuery?: string
  /** 初始过滤条件 */
  initialFilters?: MindMapFilter[]
  /** 自动搜索（输入时实时搜索） */
  autoSearch?: boolean
  /** 搜索防抖延迟（毫秒） */
  searchDebounce?: number
}

/**
 * 思维导图搜索与过滤组合式函数
 */
export function useMindMapSearch(
  nodes: Ref<FreeMindMapNode[]>,
  options: UseMindMapSearchOptions = {},
) {
  const {
    initialQuery = '',
    initialFilters = [],
    autoSearch = true,
    searchDebounce = 300,
  } = options

  // ==================== 状态 ====================

  // 搜索相关
  const searchQuery = ref(initialQuery)
  const searchOptions = ref<MindMapSearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    searchFields: ['title', 'content', 'note', 'tag'],
    maxResults: 100,
  })
  const searchResult = ref<MindMapSearchResult | null>(null)
  const isSearching = ref(false)

  // 过滤相关
  const filters = ref<MindMapFilter[]>(initialFilters)
  const filterResult = ref<MindMapFilterResult | null>(null)

  // 高亮相关
  const highlightedNodes = ref<Set<string>>(new Set())
  const highlightColor = ref('#FFD700') // 金色

  // UI 相关
  const showSearchPanel = ref(false)
  const showFilterPanel = ref(false)
  const currentMatchIndex = ref(-1)

  // 防抖定时器
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  // ==================== 计算属性 ====================

  /**
   * 是否有活动的搜索
   */
  const hasActiveSearch = computed(() => {
    return searchQuery.value.trim() !== '' && searchResult.value !== null
  })

  /**
   * 是否有活动的过滤
   */
  const hasActiveFilter = computed(() => {
    return filters.value.length > 0
  })

  /**
   * 过滤后的节点
   */
  const filteredNodes = computed(() => {
    if (!filterResult.value) return nodes.value
    return nodes.value.filter((node) =>
      filterResult.value!.filteredNodeIds.includes(node.id),
    )
  })

  /**
   * 搜索匹配的节点
   */
  const matchedNodes = computed(() => {
    if (!searchResult.value) return []
    return nodes.value.filter((node) =>
      searchResult.value!.matchedNodeIds.includes(node.id),
    )
  })

  /**
   * 当前匹配的节点
   */
  const currentMatchNode = computed(() => {
    if (currentMatchIndex.value < 0 || !searchResult.value) return null
    const nodeId = searchResult.value.matchedNodeIds[currentMatchIndex.value]
    return nodes.value.find((n) => n.id === nodeId) || null
  })

  /**
   * 搜索统计
   */
  const searchStats = computed(() => {
    if (!searchResult.value) return null
    return {
      totalMatches: searchResult.value.totalMatches,
      uniqueNodes: searchResult.value.matchedNodeIds.length,
      searchTime: searchResult.value.searchTime,
    }
  })

  /**
   * 过滤统计
   */
  const filterStats = computed(() => {
    if (!filterResult.value) return null
    return {
      filteredNodes: filterResult.value.filteredNodes,
      hiddenNodes: filterResult.value.hiddenNodeIds.length,
      totalNodes: filterResult.value.totalNodes,
    }
  })

  /**
   * 搜索历史
   */
  const searchHistory = computed(() => {
    return mindMapSearchService.getHistory()
  })

  /**
   * 快速过滤预设
   */
  const quickPresets = computed(() => {
    return mindMapSearchService.getBuiltInPresets()
  })

  // ==================== 方法 ====================

  /**
   * 执行搜索
   */
  function executeSearch(query: string = searchQuery.value) {
    if (!query.trim()) {
      clearSearch()
      return
    }

    isSearching.value = true

    try {
      const result = mindMapSearchService.search(
        nodes.value,
        query,
        searchOptions.value,
      )
      searchResult.value = result
      highlightedNodes.value = new Set(result.matchedNodeIds)
      currentMatchIndex.value = result.matchedNodeIds.length > 0 ? 0 : -1
    } catch (error) {
      console.error('[useMindMapSearch] 搜索失败:', error)
      searchResult.value = null
    } finally {
      isSearching.value = false
    }
  }

  /**
   * 防抖搜索
   */
  function debounceSearch(query: string) {
    if (searchTimer) {
      clearTimeout(searchTimer)
    }

    searchTimer = setTimeout(() => {
      executeSearch(query)
      searchTimer = null
    }, searchDebounce)
  }

  /**
   * 更新搜索关键词
   */
  function updateSearchQuery(query: string) {
    searchQuery.value = query

    if (autoSearch) {
      if (query.trim()) {
        debounceSearch(query)
      } else {
        clearSearch()
      }
    }
  }

  /**
   * 清除搜索
   */
  function clearSearch() {
    searchQuery.value = ''
    searchResult.value = null
    highlightedNodes.value.clear()
    currentMatchIndex.value = -1
    mindMapSearchService.clearHighlights()
  }

  /**
   * 应用过滤
   */
  function applyFilter(newFilters: MindMapFilter[]) {
    filters.value = newFilters
    const result = mindMapSearchService.filter(nodes.value, newFilters)
    filterResult.value = result
  }

  /**
   * 添加过滤条件
   */
  function addFilter(filter: MindMapFilter) {
    filters.value.push(filter)
    applyFilter(filters.value)
  }

  /**
   * 移除过滤条件
   */
  function removeFilter(index: number) {
    filters.value.splice(index, 1)
    applyFilter(filters.value)
  }

  /**
   * 清除过滤
   */
  function clearFilter() {
    filters.value = []
    filterResult.value = null
  }

  /**
   * 应用快速预设
   */
  function applyQuickPreset(preset: QuickFilterPreset) {
    applyFilter(preset.filters)
  }

  /**
   * 跳转到上一个匹配
   */
  function goToPreviousMatch() {
    if (!searchResult.value || searchResult.value.matchedNodeIds.length === 0) return

    currentMatchIndex.value = (currentMatchIndex.value - 1 + searchResult.value.matchedNodeIds.length) % searchResult.value.matchedNodeIds.length
    highlightCurrentMatch()
  }

  /**
   * 跳转到下一个匹配
   */
  function goToNextMatch() {
    if (!searchResult.value || searchResult.value.matchedNodeIds.length === 0) return

    currentMatchIndex.value = (currentMatchIndex.value + 1) % searchResult.value.matchedNodeIds.length
    highlightCurrentMatch()
  }

  /**
   * 高亮当前匹配
   */
  function highlightCurrentMatch() {
    if (!searchResult.value || currentMatchIndex.value < 0) return

    const nodeId = searchResult.value.matchedNodeIds[currentMatchIndex.value]
    if (nodeId) {
      // 发送事件让画布定位到该节点
      window.postMessage({
        type: 'mindmap-focus-node',
        nodeId,
        highlight: true,
        color: highlightColor.value,
      }, '*')
    }
  }

  /**
   * 手动高亮节点
   */
  function highlightNode(nodeId: string, color: string = '#FFD700') {
    mindMapSearchService.addHighlight(nodeId, color, 'manual')
    highlightedNodes.value.add(nodeId)

    window.postMessage({
      type: 'mindmap-highlight-node',
      nodeId,
      color,
      highlight: true,
    }, '*')
  }

  /**
   * 清除高亮
   */
  function clearHighlights() {
    mindMapSearchService.clearHighlights()
    highlightedNodes.value.clear()

    window.postMessage({
      type: 'mindmap-clear-highlights',
    }, '*')
  }

  /**
   * 删除搜索历史项
   */
  function deleteHistoryItem(id: string) {
    mindMapSearchService.deleteHistoryItem(id)
  }

  /**
   * 清除搜索历史
   */
  function clearHistory() {
    mindMapSearchService.clearHistory()
  }

  /**
   * 获取节点统计
   */
  function getNodeStats() {
    return mindMapSearchService.getStats(nodes.value)
  }

  /**
   * 切换搜索面板
   */
  function toggleSearchPanel() {
    showSearchPanel.value = !showSearchPanel.value
    if (showSearchPanel.value) {
      showFilterPanel.value = false
    }
  }

  /**
   * 切换过滤面板
   */
  function toggleFilterPanel() {
    showFilterPanel.value = !showFilterPanel.value
    if (showFilterPanel.value) {
      showSearchPanel.value = false
    }
  }

  // ==================== 监听 ====================

  // 监听节点变化，重新应用过滤
  watch(nodes, () => {
    if (filters.value.length > 0) {
      applyFilter(filters.value)
    }
  }, { deep: true })

  // 监听搜索选项变化，重新搜索
  watch(searchOptions, () => {
    if (searchQuery.value.trim()) {
      executeSearch()
    }
  }, { deep: true })

  // ==================== 生命周期 ====================

  /**
   * 清理
   */
  function dispose() {
    if (searchTimer) {
      clearTimeout(searchTimer)
    }
    clearHighlights()
  }

  return {
    // 状态
    searchQuery,
    searchOptions,
    searchResult,
    isSearching,
    filters,
    filterResult,
    highlightedNodes,
    highlightColor,
    showSearchPanel,
    showFilterPanel,
    currentMatchIndex,

    // 计算属性
    hasActiveSearch,
    hasActiveFilter,
    filteredNodes,
    matchedNodes,
    currentMatchNode,
    searchStats,
    filterStats,
    searchHistory,
    quickPresets,

    // 搜索方法
    executeSearch,
    updateSearchQuery,
    clearSearch,
    goToPreviousMatch,
    goToNextMatch,
    highlightCurrentMatch,

    // 过滤方法
    applyFilter,
    addFilter,
    removeFilter,
    clearFilter,
    applyQuickPreset,

    // 高亮方法
    highlightNode,
    clearHighlights,

    // 历史方法
    deleteHistoryItem,
    clearHistory,

    // 统计方法
    getNodeStats,

    // UI 方法
    toggleSearchPanel,
    toggleFilterPanel,

    // 生命周期
    dispose,
  }
}

export default useMindMapSearch
