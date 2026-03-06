/**
 * 全局搜索服务
 * 支持跨学习集、全文搜索功能
 */

import { Card } from '../types/card'
import {
  GlobalSearchConfig,
  GlobalSearchResult,
  SearchOptions,
  SearchResultItem,
  SearchResultType,
} from '../types/search'
import { cardService } from './cardService'
import { studySetService } from './studySetService'

/**
 * 全局搜索服务类
 */
export class GlobalSearchService {
  private static instance: GlobalSearchService
  private defaultConfig: GlobalSearchConfig

  private constructor() {
    this.defaultConfig = {
      scope: 'all',
      studySetIds: [],
      typeFilter: [],
      tagFilter: [],
    }
  }

  static getInstance(): GlobalSearchService {
    if (!GlobalSearchService.instance) {
      GlobalSearchService.instance = new GlobalSearchService()
    }
    return GlobalSearchService.instance
  }

  /**
   * 执行全局搜索
   * @param query 搜索关键词
   * @param config 搜索配置
   * @param options 搜索选项
   */
  async search(
    query: string,
    config?: Partial<GlobalSearchConfig>,
    options?: Partial<SearchOptions>,
  ): Promise<GlobalSearchResult> {
    const startTime = performance.now()

    const searchConfig: GlobalSearchConfig = {
      ...this.defaultConfig,
      ...config,
    }

    const searchOptions: SearchOptions = {
      caseSensitive: options?.caseSensitive ?? false,
      wholeWord: options?.wholeWord ?? false,
      useRegex: options?.useRegex ?? false,
    }

    // 初始化结果
    const result: GlobalSearchResult = {
      query,
      totalResults: 0,
      resultsByType: {
        card: [],
        flashcard: [],
        excerpt: [],
        mindmap: [],
        annotation: [],
        document: [],
      },
      resultsByStudySet: {},
      searchDuration: 0,
      allResults: [],
    }

    if (!query.trim()) {
      return result
    }

    try {
      // 获取所有学习集
      let studySetIds = searchConfig.studySetIds
      if (!studySetIds || studySetIds.length === 0) {
        const studySets = await studySetService.getAllStudySets()
        studySetIds = studySets.map((set) => set.id)
      }

      // 并行搜索所有学习集
      const searchPromises = studySetIds.map(async (studySetId) => {
        try {
          const cards = await cardService.getCardsByStudySetId(studySetId)
          return {
            studySetId,
            cards,
          }
        } catch (error) {
          console.error(`[GlobalSearch] 获取学习集 ${studySetId} 卡片失败:`, error)
          return {
            studySetId,
            cards: [] as Card[],
          }
        }
      })

      const results = await Promise.all(searchPromises)

      // 构建正则表达式
      const pattern = this.buildRegex(query, searchOptions)

      // 搜索所有卡片
      for (const {
        studySetId,
        cards,
      } of results) {
        const studySet = await studySetService.getStudySetById(studySetId)

        for (const card of cards) {
          // 类型过滤
          if (searchConfig.typeFilter && searchConfig.typeFilter.length > 0) {
            if (!searchConfig.typeFilter.includes(card.type as SearchResultType)) {
              continue
            }
          }

          // 标签过滤
          if (searchConfig.tagFilter && searchConfig.tagFilter.length > 0) {
            const hasMatchingTag = card.tags.some((tag) =>
              searchConfig.tagFilter!.includes(tag.toLowerCase()),
            )
            if (!hasMatchingTag) {
              continue
            }
          }

          // 时间范围过滤
          if (searchConfig.dateRange) {
            const {
              from,
              to,
            } = searchConfig.dateRange
            if (card.createdAt < from || card.createdAt > to) {
              continue
            }
          }

          // 执行搜索匹配
          const match = this.matchContent(card.content, pattern, searchOptions)

          if (match) {
            const searchResult: SearchResultItem = {
              id: card.id,
              type: card.type as SearchResultType,
              title: this.extractTitle(card),
              content: this.extractSnippet(card.content, match.index, 150),
              matchIndex: match.index,
              matchLength: match.length,
              studySetId,
              studySetName: studySet?.name,
              source: {
                pdfPath: card.sourceLocation?.pdfPath,
                page: card.sourceLocation?.page,
                rect: card.sourceLocation?.rect,
                docId: card.sourceLocation?.docId,
                blockId: card.sourceLocation?.blockId,
              },
              meta: {
                createdAt: card.createdAt,
                updatedAt: card.updatedAt,
                tags: card.tags,
                status: card.status,
                difficulty: card.difficulty,
              },
            }

            // 按类型分组
            result.resultsByType[card.type as SearchResultType].push(searchResult)

            // 按学习集分组
            if (!result.resultsByStudySet[studySetId]) {
              result.resultsByStudySet[studySetId] = []
            }
            result.resultsByStudySet[studySetId].push(searchResult)

            // 所有结果
            result.allResults.push(searchResult)
          }
        }
      }

      // 计算总数
      result.totalResults = result.allResults.length

      // 计算搜索耗时
      result.searchDuration = performance.now() - startTime

      // 按相关度排序（匹配位置越靠前，相关度越高）
      result.allResults.sort((a, b) => a.matchIndex - b.matchIndex)

      // 同步排序各分组结果
      for (const type of Object.keys(result.resultsByType) as SearchResultType[]) {
        result.resultsByType[type].sort((a, b) => a.matchIndex - b.matchIndex)
      }
      for (const studySetId of Object.keys(result.resultsByStudySet)) {
        result.resultsByStudySet[studySetId].sort((a, b) => a.matchIndex - b.matchIndex)
      }

    } catch (error) {
      console.error('[GlobalSearch] 搜索失败:', error)
      throw error
    }

    return result
  }

  /**
   * 构建正则表达式
   */
  private buildRegex(query: string, options: SearchOptions): RegExp {
    try {
      const flags = options.caseSensitive ? 'g' : 'gi'

      if (options.useRegex) {
        return new RegExp(query, flags)
      }

      // 转义特殊字符
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      if (options.wholeWord) {
        return new RegExp(`\\b${escaped}\\b`, flags)
      }

      return new RegExp(escaped, flags)
    } catch (e) {
      // 正则表达式无效，使用普通搜索
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return new RegExp(escaped, options.caseSensitive ? 'g' : 'gi')
    }
  }

  /**
   * 匹配内容
   */
  private matchContent(
    content: string,
    pattern: RegExp,
    options: SearchOptions,
  ): { index: number, length: number } | null {
    if (!content) return null

    // 重置正则 lastIndex
    pattern.lastIndex = 0
    const match = pattern.exec(content)

    if (match) {
      return {
        index: match.index,
        length: match[0].length,
      }
    }

    return null
  }

  /**
   * 提取标题
   */
  private extractTitle(card: Card): string {
    // 闪卡使用正面作为标题
    if (card.type === 'flashcard') {
      const frontMatch = (card as any).front?.match(/^#{1,3}\s*(.+)$/m)
      if (frontMatch) {
        return frontMatch[1].trim()
      }
      return (card as any).front?.split('\n')[0] || '闪卡'
    }

    // 从内容提取标题
    const titleMatch = card.content.match(/^#{1,3}\s*(.+)$/m)
    if (titleMatch) {
      return titleMatch[1].trim()
    }

    // 取第一行
    const firstLine = card.content.split('\n')[0]
    if (firstLine.length > 50) {
      return `${firstLine.substring(0, 50)}...`
    }
    return firstLine || '卡片'
  }

  /**
   * 提取摘要片段
   */
  private extractSnippet(content: string, matchIndex: number, maxLength: number): string {
    if (!content) return ''

    const contextLength = Math.floor(maxLength / 2)
    let start = Math.max(0, matchIndex - contextLength)
    let end = Math.min(content.length, matchIndex + contextLength)

    // 调整边界到单词/句子边界
    if (start > 0) {
      const spaceIndex = content.lastIndexOf(' ', start)
      if (spaceIndex > start - 20) {
        start = spaceIndex + 1
      }
    }
    if (end < content.length) {
      const spaceIndex = content.indexOf(' ', end)
      if (spaceIndex > 0 && spaceIndex < end + 20) {
        end = spaceIndex
      }
    }

    let snippet = content.substring(start, end)

    // 添加省略号
    if (start > 0) snippet = `...${snippet}`
    if (end < content.length) snippet = `${snippet}...`

    return snippet
  }

  /**
   * 在单个学习集中搜索
   */
  async searchInStudySet(
    query: string,
    studySetId: string,
    options?: Partial<SearchOptions>,
  ): Promise<SearchResultItem[]> {
    const result = await this.search(query, {
      scope: 'current',
      studySetIds: [studySetId],
    }, options)

    return result.allResults
  }

  /**
   * 按类型过滤结果
   */
  filterByType(
    results: GlobalSearchResult,
    type: SearchResultType,
  ): SearchResultItem[] {
    return results.resultsByType[type] || []
  }

  /**
   * 按学习集过滤结果
   */
  filterByStudySet(
    results: GlobalSearchResult,
    studySetId: string,
  ): SearchResultItem[] {
    return results.resultsByStudySet[studySetId] || []
  }

  /**
   * 高亮匹配文本
   */
  highlightMatch(text: string, query: string, options?: Partial<SearchOptions>): string {
    if (!text || !query) return text

    const searchOptions: SearchOptions = {
      caseSensitive: options?.caseSensitive ?? false,
      wholeWord: options?.wholeWord ?? false,
      useRegex: options?.useRegex ?? false,
    }

    const pattern = this.buildRegex(query, searchOptions)
    return text.replace(pattern, '<mark>$&</mark>')
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(
    input: string,
    config?: Partial<GlobalSearchConfig>,
  ): Promise<string[]> {
    if (!input.trim()) return []

    // 这里可以扩展为从历史搜索、标签、标题等获取建议
    // 目前返回空数组，可以结合 searchHistoryService 实现
    return []
  }

  /**
   * 更新默认配置
   */
  updateConfig(config: Partial<GlobalSearchConfig>): void {
    this.defaultConfig = {
      ...this.defaultConfig,
      ...config,
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): GlobalSearchConfig {
    return { ...this.defaultConfig }
  }
}

// 导出单例
export const globalSearchService = GlobalSearchService.getInstance()

/**
 * 便捷函数：执行全局搜索
 */
export async function globalSearch(
  query: string,
  config?: Partial<GlobalSearchConfig>,
  options?: Partial<SearchOptions>,
): Promise<GlobalSearchResult> {
  return globalSearchService.search(query, config, options)
}

/**
 * 便捷函数：在学习集中搜索
 */
export async function searchInStudySet(
  query: string,
  studySetId: string,
  options?: Partial<SearchOptions>,
): Promise<SearchResultItem[]> {
  return globalSearchService.searchInStudySet(query, studySetId, options)
}
