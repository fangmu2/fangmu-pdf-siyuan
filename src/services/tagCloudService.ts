/**
 * 标签云服务
 * 负责标签云的生成、统计和管理
 */

import { Card } from '../types/card'
import {
  DEFAULT_TAG_CLOUD_CONFIG,
  TagCloudConfig,
  TagCloudItem,
  TagStatistics,
} from '../types/search'

/**
 * 标签云服务类
 */
export class TagCloudService {
  private static instance: TagCloudService
  private config: TagCloudConfig
  private colorPalette: string[] = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
  ]

  private constructor() {
    this.config = { ...DEFAULT_TAG_CLOUD_CONFIG }
  }

  static getInstance(): TagCloudService {
    if (!TagCloudService.instance) {
      TagCloudService.instance = new TagCloudService()
    }
    return TagCloudService.instance
  }

  /**
   * 从卡片列表中提取标签统计
   * @param cards 卡片数组
   * @param studySetId 可选的学习集 ID 过滤
   */
  extractTagStatistics(cards: Card[], studySetId?: string): TagStatistics {
    // 过滤学习集
    const filteredCards = studySetId
      ? cards.filter((card) => card.studySetId === studySetId)
      : cards

    // 统计标签使用次数
    const tagCountMap = new Map<string, number>()
    const tagLastUsedMap = new Map<string, number>()

    for (const card of filteredCards) {
      for (const tag of card.tags) {
        const normalizedTag = tag.toLowerCase().trim()
        if (!normalizedTag) continue

        const currentCount = tagCountMap.get(normalizedTag) || 0
        tagCountMap.set(normalizedTag, currentCount + 1)

        // 更新最后使用时间
        if (!tagLastUsedMap.has(normalizedTag) || card.updatedAt > tagLastUsedMap.get(normalizedTag)!) {
          tagLastUsedMap.set(normalizedTag, card.updatedAt)
        }
      }
    }

    // 构建标签云项目
    const tagCloudItems: TagCloudItem[] = []
    let totalUsage = 0

    for (const [tag, count] of tagCountMap.entries()) {
      totalUsage += count
      tagCloudItems.push({
        tag,
        count,
        weight: 0, // 稍后计算
        lastUsed: tagLastUsedMap.get(tag),
      })
    }

    // 按使用次数排序
    tagCloudItems.sort((a, b) => b.count - a.count)

    // 计算权重 (0-1 范围)
    const maxCount = tagCloudItems.length > 0 ? tagCloudItems[0].count : 1
    const minCount = tagCloudItems.length > 0 ? tagCloudItems[tagCloudItems.length - 1].count : 1

    for (const item of tagCloudItems) {
      if (maxCount === minCount) {
        item.weight = 1
      } else {
        item.weight = (item.count - minCount) / (maxCount - minCount)
      }
    }

    // 分配颜色
    this.assignColors(tagCloudItems)

    // 获取热门标签
    const topTags = tagCloudItems.slice(0, this.config.maxTags)

    // 获取最近使用标签
    const recentTags = [...tagCloudItems]
      .filter((item) => item.lastUsed)
      .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
      .slice(0, 10)

    // 按学习集分组
    const byStudySet: Record<string, TagCloudItem[]> = {}
    if (!studySetId) {
      // 如果没有指定学习集，按学习集分组
      const studySetCards = new Map<string, Card[]>()
      for (const card of filteredCards) {
        const existing = studySetCards.get(card.studySetId) || []
        existing.push(card)
        studySetCards.set(card.studySetId, existing)
      }

      for (const [setId, setCards] of studySetCards.entries()) {
        const setStats = this.extractTagStatistics(setCards, setId)
        byStudySet[setId] = setStats.topTags
      }
    }

    return {
      totalTags: tagCloudItems.length,
      totalUsage,
      topTags,
      recentTags,
      byStudySet,
    }
  }

  /**
   * 为标签分配颜色
   */
  private assignColors(items: TagCloudItem[]): void {
    if (this.config.colorScheme === 'custom' && this.config.customColors) {
      // 使用自定义颜色
      for (let i = 0; i < items.length; i++) {
        items[i].color = this.config.customColors![i % this.config.customColors.length]
      }
    } else if (this.config.colorScheme === 'random') {
      // 随机颜色
      for (const item of items) {
        item.color = this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)]
      }
    } else {
      // 渐变色方案（根据权重分配颜色）
      for (const item of items) {
        const colorIndex = Math.floor(item.weight * (this.colorPalette.length - 1))
        item.color = this.colorPalette[colorIndex]
      }
    }
  }

  /**
   * 计算字体大小
   * @param weight 权重 (0-1)
   */
  getFontSize(weight: number): number {
    const {
      minFontSize,
      maxFontSize,
    } = this.config
    return minFontSize + weight * (maxFontSize - minFontSize)
  }

  /**
   * 获取热门标签
   * @param cards 卡片数组
   * @param limit 最大数量
   * @param studySetId 可选的学习集 ID
   */
  getTopTags(cards: Card[], limit: number = 10, studySetId?: string): TagCloudItem[] {
    const stats = this.extractTagStatistics(cards, studySetId)
    return stats.topTags.slice(0, limit)
  }

  /**
   * 获取最近使用的标签
   * @param cards 卡片数组
   * @param limit 最大数量
   * @param studySetId 可选的学习集 ID
   */
  getRecentTags(cards: Card[], limit: number = 10, studySetId?: string): TagCloudItem[] {
    const stats = this.extractTagStatistics(cards, studySetId)
    return stats.recentTags.slice(0, limit)
  }

  /**
   * 获取所有唯一标签
   * @param cards 卡片数组
   * @param studySetId 可选的学习集 ID
   */
  getAllTags(cards: Card[], studySetId?: string): string[] {
    const filteredCards = studySetId
      ? cards.filter((card) => card.studySetId === studySetId)
      : cards

    const tagSet = new Set<string>()
    for (const card of filteredCards) {
      for (const tag of card.tags) {
        const normalizedTag = tag.toLowerCase().trim()
        if (normalizedTag) {
          tagSet.add(normalizedTag)
        }
      }
    }

    return Array.from(tagSet).sort()
  }

  /**
   * 搜索标签
   * @param cards 卡片数组
   * @param query 搜索关键词
   * @param studySetId 可选的学习集 ID
   */
  searchTags(cards: Card[], query: string, studySetId?: string): TagCloudItem[] {
    const stats = this.extractTagStatistics(cards, studySetId)
    const normalizedQuery = query.toLowerCase().trim()

    if (!normalizedQuery) {
      return stats.topTags
    }

    return stats.topTags.filter((item) =>
      item.tag.toLowerCase().includes(normalizedQuery),
    )
  }

  /**
   * 更新配置
   * @param config 新配置
   */
  updateConfig(config: Partial<TagCloudConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): TagCloudConfig {
    return { ...this.config }
  }

  /**
   * 设置颜色方案
   * @param colors 颜色数组
   */
  setColorPalette(colors: string[]): void {
    this.colorPalette = colors
  }

  /**
   * 获取颜色方案
   */
  getColorPalette(): string[] {
    return [...this.colorPalette]
  }

  /**
   * 从标签云项目生成选择器选项
   * @param items 标签云项目
   */
  toSelectorOptions(items: TagCloudItem[]): Array<{ label: string, value: string, count: number, color?: string }> {
    return items.map((item) => ({
      label: item.tag,
      value: item.tag,
      count: item.count,
      color: item.color,
    }))
  }
}

// 导出单例
export const tagCloudService = TagCloudService.getInstance()

/**
 * 便捷函数：获取热门标签
 */
export function getTopTags(
  cards: Card[],
  limit?: number,
  studySetId?: string,
): TagCloudItem[] {
  return tagCloudService.getTopTags(cards, limit, studySetId)
}

/**
 * 便捷函数：获取所有标签
 */
export function getAllTags(cards: Card[], studySetId?: string): string[] {
  return tagCloudService.getAllTags(cards, studySetId)
}

/**
 * 便捷函数：搜索标签
 */
export function searchTags(cards: Card[], query: string, studySetId?: string): TagCloudItem[] {
  return tagCloudService.searchTags(cards, query, studySetId)
}
