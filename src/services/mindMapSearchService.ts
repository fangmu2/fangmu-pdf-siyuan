/**
 * 思维导图搜索服务
 * MarginNote 4 风格升级 - 第 7 期
 *
 * 功能：
 * - 全文搜索（标题、内容、备注、标签）
 * - 正则表达式支持
 * - 搜索结果高亮
 * - 搜索历史管理
 */

import type {
  MindMapSearchMatch,
  MindMapSearchResult,
  MindMapSearchOptions,
  MindMapFilter,
  MindMapFilterResult,
  MindMapNodeStats,
  SearchHistoryItem,
  SearchHighlight
} from '@/types/mindMapSearch'
import type { FreeMindMapNode } from '@/types/mindmapFree'

const STORAGE_KEY = 'mindmap-search-history'
const MAX_HISTORY_SIZE = 20

/**
 * 思维导图搜索服务类
 */
class MindMapSearchService {
  private searchHistory: SearchHistoryItem[] = []
  private highlights: Map<string, SearchHighlight> = new Map()

  constructor() {
    this.loadHistory()
  }

  // ==================== 搜索功能 ====================

  /**
   * 搜索思维导图节点
   */
  search(
    nodes: FreeMindMapNode[],
    query: string,
    options: MindMapSearchOptions = {}
  ): MindMapSearchResult {
    const startTime = performance.now()

    const {
      caseSensitive = false,
      wholeWord = false,
      useRegex = false,
      searchFields = ['title', 'content', 'note', 'tag'],
      maxResults = 100,
      minScore = 0.1
    } = options

    const matches: MindMapSearchMatch[] = []
    const matchedNodeIds = new Set<string>()

    // 创建正则表达式
    let searchPattern: RegExp | null = null
    try {
      if (useRegex) {
        searchPattern = new RegExp(query, caseSensitive ? 'g' : 'gi')
      } else {
        // 转义特殊字符
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        if (wholeWord) {
          searchPattern = new RegExp(`\\b${escapedQuery}\\b`, caseSensitive ? 'g' : 'gi')
        } else {
          searchPattern = new RegExp(escapedQuery, caseSensitive ? 'g' : 'gi')
        }
      }
    } catch (error) {
      console.error('[MindMapSearch] 正则表达式错误:', error)
      return this.createEmptyResult(query)
    }

    // 遍历所有节点
    for (const node of nodes) {
      if (matchedNodeIds.size >= maxResults) break

      // 搜索标题
      if (searchFields.includes('title') && node.data.title) {
        const match = this.findMatches(node.id, 'title', node.data.title, searchPattern)
        matches.push(...match)
        match.forEach(m => matchedNodeIds.add(m.nodeId))
      }

      // 搜索内容
      if (searchFields.includes('content') && node.data.content) {
        const match = this.findMatches(node.id, 'content', node.data.content, searchPattern)
        matches.push(...match)
        match.forEach(m => matchedNodeIds.add(m.nodeId))
      }

      // 搜索备注
      if (searchFields.includes('note') && node.data.note) {
        const match = this.findMatches(node.id, 'note', node.data.note, searchPattern)
        matches.push(...match)
        match.forEach(m => matchedNodeIds.add(m.nodeId))
      }

      // 搜索标签
      if (searchFields.includes('tag') && node.data.tags) {
        for (const tag of node.data.tags) {
          const match = this.findMatches(node.id, 'tag', tag, searchPattern)
          matches.push(...match)
          match.forEach(m => matchedNodeIds.add(m.nodeId))
        }
      }
    }

    // 过滤低分匹配
    const filteredMatches = matches.filter(m => m.score >= minScore)

    // 按得分排序
    filteredMatches.sort((a, b) => b.score - a.score)

    // 限制结果数量
    const finalMatches = filteredMatches.slice(0, maxResults * 3)

    const endTime = performance.now()

    const result: MindMapSearchResult = {
      query,
      matches: finalMatches,
      matchedNodeIds: Array.from(matchedNodeIds),
      totalMatches: finalMatches.length,
      searchTime: Math.round(endTime - startTime)
    }

    // 保存到搜索历史
    if (query.trim() && result.totalMatches > 0) {
      this.addToHistory(query, result.totalMatches, options)
    }

    return result
  }

  /**
   * 在文本中查找匹配
   */
  private findMatches(
    nodeId: string,
    field: 'title' | 'content' | 'note' | 'tag',
    text: string,
    pattern: RegExp | null
  ): MindMapSearchMatch[] {
    const matches: MindMapSearchMatch[] = []

    if (!pattern || !text) return matches

    // 重置正则 lastIndex
    pattern.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const score = this.calculateScore(field, match[0], text)
      matches.push({
        nodeId,
        field,
        matchedText: match[0],
        highlightStart: match.index,
        highlightLength: match[0].length,
        score
      })

      // 防止空匹配导致死循环
      if (match[0].length === 0) {
        pattern.lastIndex++
      }
    }

    return matches
  }

  /**
   * 计算匹配得分
   */
  private calculateScore(field: string, matchedText: string, fullText: string): number {
    let score = 1.0

    // 字段权重
    const fieldWeights: Record<string, number> = {
      title: 1.5,
      content: 1.0,
      note: 0.8,
      tag: 1.2
    }
    score *= fieldWeights[field] || 1.0

    // 完全匹配加分
    if (matchedText.toLowerCase() === fullText.toLowerCase()) {
      score *= 2.0
    }

    // 匹配位置（越靠前分数越高）
    const positionRatio = 1 - (fullText.indexOf(matchedText) / fullText.length)
    score *= 0.5 + positionRatio * 0.5

    // 匹配长度（越长分数越高）
    const lengthRatio = matchedText.length / fullText.length
    score *= 0.5 + lengthRatio * 0.5

    return Math.round(score * 100) / 100
  }

  /**
   * 创建空结果
   */
  private createEmptyResult(query: string): MindMapSearchResult {
    return {
      query,
      matches: [],
      matchedNodeIds: [],
      totalMatches: 0,
      searchTime: 0
    }
  }

  // ==================== 过滤功能 ====================

  /**
   * 应用过滤条件
   */
  filter(nodes: FreeMindMapNode[], filters: MindMapFilter[]): MindMapFilterResult {
    const totalNodes = nodes.length
    const filteredNodeIds = new Set<string>()

    // 没有过滤条件时返回所有节点
    if (filters.length === 0) {
      return {
        filters,
        filteredNodeIds: nodes.map(n => n.id),
        hiddenNodeIds: [],
        totalNodes,
        filteredNodes: totalNodes
      }
    }

    // 遍历节点应用过滤
    for (const node of nodes) {
      if (this.nodeMatchesFilters(node, filters)) {
        filteredNodeIds.add(node.id)
      }
    }

    const filteredIds = Array.from(filteredNodeIds)
    const hiddenIds = nodes.filter(n => !filteredNodeIds.has(n.id)).map(n => n.id)

    return {
      filters,
      filteredNodeIds: filteredIds,
      hiddenNodeIds: hiddenIds,
      totalNodes,
      filteredNodes: filteredIds.length
    }
  }

  /**
   * 检查节点是否匹配所有过滤条件
   */
  private nodeMatchesFilters(node: FreeMindMapNode, filters: MindMapFilter[]): boolean {
    return filters.every(filter => this.nodeMatchesFilter(node, filter))
  }

  /**
   * 检查节点是否匹配单个过滤条件
   */
  private nodeMatchesFilter(node: FreeMindMapNode, filter: MindMapFilter): boolean {
    const { field, value, operator } = filter

    let nodeValue: any
    switch (field) {
      case 'tag':
        nodeValue = node.data.tags || []
        break
      case 'page':
        nodeValue = node.data.page
        break
      case 'color':
        nodeValue = node.data.color
        break
      case 'annotation':
        nodeValue = !!node.data.annotationId
        break
      case 'status':
        nodeValue = node.data.status
        break
      case 'date':
        nodeValue = node.data.createdAt || node.data.updatedAt
        break
      default:
        return true
    }

    return this.compareValues(nodeValue, value, operator)
  }

  /**
   * 比较值
   */
  private compareValues(
    nodeValue: any,
    filterValue: any,
    operator: string
  ): boolean {
    switch (operator) {
      case 'equals':
        return nodeValue === filterValue
      case 'notEquals':
        return nodeValue !== filterValue
      case 'contains':
        return Array.isArray(nodeValue)
          ? nodeValue.includes(filterValue)
          : String(nodeValue).includes(String(filterValue))
      case 'notContains':
        return Array.isArray(nodeValue)
          ? !nodeValue.includes(filterValue)
          : !String(nodeValue).includes(String(filterValue))
      case 'greaterThan':
        return Number(nodeValue) > Number(filterValue)
      case 'lessThan':
        return Number(nodeValue) < Number(filterValue)
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(nodeValue)
      case 'notIn':
        return !Array.isArray(filterValue) || !filterValue.includes(nodeValue)
      default:
        return true
    }
  }

  // ==================== 统计功能 ====================

  /**
   * 获取节点统计信息
   */
  getStats(nodes: FreeMindMapNode[]): MindMapNodeStats {
    const stats: MindMapNodeStats = {
      totalNodes: nodes.length,
      textCards: 0,
      imageCards: 0,
      groups: 0,
      withAnnotations: 0,
      withTags: 0,
      pageDistribution: {},
      colorDistribution: {},
      statusDistribution: {},
      tagStats: []
    }

    const tagCount = new Map<string, number>()

    for (const node of nodes) {
      // 统计节点类型
      if (node.type === 'textCard') stats.textCards++
      else if (node.type === 'imageCard') stats.imageCards++
      else if (node.type === 'group') stats.groups++

      // 统计标注
      if (node.data.annotationId) stats.withAnnotations++

      // 统计标签
      if (node.data.tags && node.data.tags.length > 0) {
        stats.withTags++
        for (const tag of node.data.tags) {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
        }
      }

      // 统计页码分布
      if (node.data.page) {
        const page = node.data.page
        stats.pageDistribution[page] = (stats.pageDistribution[page] || 0) + 1
      }

      // 统计颜色分布
      if (node.data.color) {
        const color = node.data.color
        stats.colorDistribution[color] = (stats.colorDistribution[color] || 0) + 1
      }

      // 统计状态分布
      if (node.data.status) {
        const status = node.data.status
        stats.statusDistribution[status] = (stats.statusDistribution[status] || 0) + 1
      }
    }

    // 转换标签统计为数组并排序
    stats.tagStats = Array.from(tagCount.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)

    return stats
  }

  // ==================== 高亮功能 ====================

  /**
   * 添加高亮
   */
  addHighlight(nodeId: string, color: string, type: 'search' | 'filter' | 'manual' = 'manual'): void {
    this.highlights.set(nodeId, {
      nodeId,
      color,
      type,
      timestamp: Date.now()
    })
  }

  /**
   * 移除高亮
   */
  removeHighlight(nodeId: string): void {
    this.highlights.delete(nodeId)
  }

  /**
   * 清除所有高亮
   */
  clearHighlights(): void {
    this.highlights.clear()
  }

  /**
   * 获取所有高亮
   */
  getHighlights(): Map<string, SearchHighlight> {
    return new Map(this.highlights)
  }

  /**
   * 获取节点高亮
   */
  getNodeHighlight(nodeId: string): SearchHighlight | undefined {
    return this.highlights.get(nodeId)
  }

  // ==================== 搜索历史 ====================

  /**
   * 添加到搜索历史
   */
  private addToHistory(query: string, resultCount: number, options?: MindMapSearchOptions): void {
    // 移除相同的搜索
    this.searchHistory = this.searchHistory.filter(item => item.query !== query)

    // 添加到开头
    this.searchHistory.unshift({
      id: Date.now().toString(),
      query,
      timestamp: Date.now(),
      resultCount,
      options
    })

    // 限制历史记录大小
    if (this.searchHistory.length > MAX_HISTORY_SIZE) {
      this.searchHistory.pop()
    }

    // 保存到 localStorage
    this.saveHistory()
  }

  /**
   * 获取搜索历史
   */
  getHistory(): SearchHistoryItem[] {
    return [...this.searchHistory]
  }

  /**
   * 清除搜索历史
   */
  clearHistory(): void {
    this.searchHistory = []
    this.saveHistory()
  }

  /**
   * 删除历史项
   */
  deleteHistoryItem(id: string): void {
    this.searchHistory = this.searchHistory.filter(item => item.id !== id)
    this.saveHistory()
  }

  /**
   * 保存历史到 localStorage
   */
  private saveHistory(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.searchHistory))
    } catch (error) {
      console.error('[MindMapSearch] 保存历史失败:', error)
    }
  }

  /**
   * 从 localStorage 加载历史
   */
  private loadHistory(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        this.searchHistory = JSON.parse(saved)
      }
    } catch (error) {
      console.error('[MindMapSearch] 加载历史失败:', error)
    }
  }

  // ==================== 快速过滤预设 ====================

  /**
   * 获取内置快速过滤预设
   */
  getBuiltInPresets(): Array<QuickFilterPreset> {
    return [
      {
        id: 'all',
        name: '全部',
        icon: 'all',
        filters: [],
        builtIn: true
      },
      {
        id: 'with-annotation',
        name: '有标注',
        icon: 'annotation',
        filters: [{ field: 'annotation', value: true, operator: 'equals' }],
        builtIn: true
      },
      {
        id: 'with-tags',
        name: '有标签',
        icon: 'tag',
        filters: [{ field: 'tag', value: '', operator: 'notEquals' }],
        builtIn: true
      },
      {
        id: 'page-1',
        name: '第 1 页',
        icon: 'page',
        filters: [{ field: 'page', value: 1, operator: 'equals' }],
        builtIn: true
      }
    ]
  }
}

// 导出单例
export const mindMapSearchService = new MindMapSearchService()

// 导出默认
export default mindMapSearchService
