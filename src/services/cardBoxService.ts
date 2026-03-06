/**
 * 卡片盒看板服务
 * 提供看板视图、时间线视图、高级筛选、排序等功能
 */

import type { Card } from '../types/card'

/**
 * 卡片状态类型
 */
export type CardStatus = 'new' | 'learning' | 'review' | 'suspended'

/**
 * 看板列类型
 */
export type BoardColumnType = 'status' | 'tag' | 'difficulty' | 'custom'

/**
 * 看板列定义
 */
export interface BoardColumn {
  /** 列 ID */
  id: string
  /** 列标题 */
  title: string
  /** 列类型 */
  type: BoardColumnType
  /** 过滤值（用于 tag/custom 类型） */
  filterValue?: string
  /** 卡片列表 */
  cards: Card[]
  /** 列颜色 */
  color?: string
  /** 是否折叠 */
  collapsed?: boolean
}

/**
 * 看板数据
 */
export interface CardBoard {
  /** 学习集 ID */
  studySetId: string
  /** 列类型 */
  columnType: BoardColumnType
  /** 列列表 */
  columns: BoardColumn[]
  /** 总卡片数 */
  totalCards: number
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

/**
 * 时间线视图数据
 */
export interface TimelineCard {
  /** 卡片数据 */
  card: Card
  /** 时间戳 */
  timestamp: number
  /** 时间类型 */
  timeType: 'created' | 'updated' | 'reviewed'
  /** 格式化日期 */
  formattedDate: string
}

/**
 * 时间线分组
 */
export interface TimelineGroup {
  /** 日期 */
  date: string
  /** 格式化显示 */
  formattedDate: string
  /** 时间戳 */
  timestamp: number
  /** 卡片列表 */
  cards: TimelineCard[]
  /** 分组类型 */
  groupType: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'older'
}

/**
 * 筛选条件
 */
export interface FilterOptions {
  /** 按状态筛选 */
  statuses?: CardStatus[]
  /** 按标签筛选 */
  tags?: string[]
  /** 按难度筛选 */
  difficulties?: number[]
  /** 按来源文档筛选 */
  sourceDocIds?: string[]
  /** 按学习集筛选 */
  studySetIds?: string[]
  /** 按创建时间范围筛选 */
  createdAfter?: number
  createdBefore?: number
  /** 按更新时间范围筛选 */
  updatedAfter?: number
  updatedBefore?: number
  /** 按下次复习时间筛选 */
  nextReviewAfter?: number
  nextReviewBefore?: number
  /** 搜索关键词 */
  searchQuery?: string
  /** 排除的卡片 ID */
  excludeCardIds?: string[]
}

/**
 * 排序选项
 */
export interface SortOptions {
  /** 排序字段 */
  field: 'created' | 'updated' | 'difficulty' | 'status' | 'nextReview' | 'title'
  /** 排序方向 */
  order: 'asc' | 'desc'
}

/**
 * 保存的筛选预设
 */
export interface FilterPreset {
  /** 预设 ID */
  id: string
  /** 预设名称 */
  name: string
  /** 筛选条件 */
  filters: FilterOptions
  /** 排序选项 */
  sort?: SortOptions
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

/**
 * 按状态生成看板列
 */
export function generateStatusColumns(cards: Card[]): BoardColumn[] {
  const statusConfig: Record<CardStatus, { title: string, color: string }> = {
    new: {
      title: '新学',
      color: '#4CAF50',
    },
    learning: {
      title: '学习中',
      color: '#2196F3',
    },
    review: {
      title: '待复习',
      color: '#FF9800',
    },
    suspended: {
      title: '已暂停',
      color: '#9E9E9E',
    },
  }

  const columns: BoardColumn[] = []

  for (const [status, config] of Object.entries(statusConfig)) {
    const statusCards = cards.filter((card) => card.status === status)
    columns.push({
      id: `status-${status}`,
      title: config.title,
      type: 'status',
      filterValue: status,
      cards: statusCards,
      color: config.color,
      collapsed: false,
    })
  }

  return columns
}

/**
 * 按标签生成看板列
 */
export function generateTagColumns(cards: Card[], maxColumns = 10): BoardColumn[] {
  // 统计所有标签的使用次数
  const tagCount: Record<string, number> = {}

  cards.forEach((card) => {
    card.tags?.forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })

  // 按使用次数排序，取前 N 个
  const sortedTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColumns)
    .map(([tag]) => tag)

  const columns: BoardColumn[] = []

  // 为每个标签创建一列
  sortedTags.forEach((tag) => {
    const tagCards = cards.filter((card) =>
      card.tags?.includes(tag),
    )

    columns.push({
      id: `tag-${tag}`,
      title: tag,
      type: 'tag',
      filterValue: tag,
      cards: tagCards,
      color: getRandomColor(tag),
      collapsed: false,
    })
  })

  // 添加一个"无标签"列
  const untaggedCards = cards.filter((card) => !card.tags || card.tags.length === 0)
  if (untaggedCards.length > 0) {
    columns.push({
      id: 'tag-untagged',
      title: '无标签',
      type: 'tag',
      cards: untaggedCards,
      color: '#9E9E9E',
      collapsed: false,
    })
  }

  return columns
}

/**
 * 按难度生成看板列
 */
export function generateDifficultyColumns(cards: Card[]): BoardColumn[] {
  const difficultyConfig: Record<number, { title: string, color: string }> = {
    1: {
      title: '非常简单',
      color: '#4CAF50',
    },
    2: {
      title: '简单',
      color: '#8BC34A',
    },
    3: {
      title: '中等',
      color: '#FFC107',
    },
    4: {
      title: '困难',
      color: '#FF9800',
    },
    5: {
      title: '非常困难',
      color: '#F44336',
    },
  }

  const columns: BoardColumn[] = []

  for (const [difficulty, config] of Object.entries(difficultyConfig)) {
    const diffCards = cards.filter((card) => card.difficulty === Number.parseInt(difficulty))
    columns.push({
      id: `difficulty-${difficulty}`,
      title: config.title,
      type: 'difficulty',
      filterValue: difficulty,
      cards: diffCards,
      color: config.color,
      collapsed: false,
    })
  }

  return columns
}

/**
 * 生成时间线视图
 */
export function generateTimeline(cards: Card[], timeType: 'created' | 'updated' | 'reviewed' = 'created'): TimelineGroup[] {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const groups: Map<string, TimelineGroup> = new Map()

  cards.forEach((card) => {
    let timestamp: number

    switch (timeType) {
      case 'updated':
        timestamp = card.updatedAt || card.createdAt
        break
      case 'reviewed':
        // 如果有复习记录，使用下次复习时间
        timestamp = (card as any).nextReview || card.updatedAt || card.createdAt
        break
      default:
        timestamp = card.createdAt
    }

    const date = new Date(timestamp)
    const dateKey = date.toISOString().split('T')[0]

    // 确定分组类型
    let groupType: TimelineGroup['groupType']
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() - 7)

    const thisMonth = new Date(today)
    thisMonth.setDate(thisMonth.getDate() - 30)

    if (timestamp >= today.getTime()) {
      groupType = 'today'
    } else if (timestamp >= yesterday.getTime()) {
      groupType = 'yesterday'
    } else if (timestamp >= thisWeek.getTime()) {
      groupType = 'thisWeek'
    } else if (timestamp >= thisMonth.getTime()) {
      groupType = 'thisMonth'
    } else {
      groupType = 'older'
    }

    // 获取或创建分组
    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        date: dateKey,
        formattedDate: formatDateGroup(dateKey, groupType),
        timestamp,
        cards: [],
        groupType,
      })
    }

    groups.get(dateKey)!.cards.push({
      card,
      timestamp,
      timeType,
      formattedDate: formatTime(timestamp),
    })
  })

  // 按时间倒序排序
  return Array.from(groups.values())
    .sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * 应用筛选条件
 */
export function applyFilters(cards: Card[], filters: FilterOptions): Card[] {
  return cards.filter((card) => {
    // 状态筛选
    if (filters.statuses && filters.statuses.length > 0) {
      if (!filters.statuses.includes(card.status)) {
        return false
      }
    }

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      if (!card.tags || !filters.tags.some((tag) => card.tags?.includes(tag))) {
        return false
      }
    }

    // 难度筛选
    if (filters.difficulties && filters.difficulties.length > 0) {
      if (!filters.difficulties.includes(card.difficulty)) {
        return false
      }
    }

    // 来源文档筛选
    if (filters.sourceDocIds && filters.sourceDocIds.length > 0) {
      const sourceId = card.sourceLocation?.docId || card.sourceLocation?.blockId
      if (!sourceId || !filters.sourceDocIds.includes(sourceId)) {
        return false
      }
    }

    // 学习集筛选
    if (filters.studySetIds && filters.studySetIds.length > 0) {
      if (!filters.studySetIds.includes(card.studySetId)) {
        return false
      }
    }

    // 创建时间筛选
    if (filters.createdAfter && card.createdAt < filters.createdAfter) {
      return false
    }
    if (filters.createdBefore && card.createdAt > filters.createdBefore) {
      return false
    }

    // 更新时间筛选
    if (filters.updatedAfter && card.updatedAt < filters.updatedAfter) {
      return false
    }
    if (filters.updatedBefore && card.updatedAt > filters.updatedBefore) {
      return false
    }

    // 下次复习时间筛选
    if (filters.nextReviewAfter) {
      const nextReview = (card as any).nextReview
      if (!nextReview || nextReview < filters.nextReviewAfter) {
        return false
      }
    }
    if (filters.nextReviewBefore) {
      const nextReview = (card as any).nextReview
      if (!nextReview || nextReview > filters.nextReviewBefore) {
        return false
      }
    }

    // 搜索关键词
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      const content = card.content?.toLowerCase() || ''
      const tags = card.tags?.join(' ').toLowerCase() || ''
      if (!content.includes(query) && !tags.includes(query)) {
        return false
      }
    }

    // 排除的卡片
    if (filters.excludeCardIds && filters.excludeCardIds.includes(card.id)) {
      return false
    }

    return true
  })
}

/**
 * 应用排序
 */
export function applySort(cards: Card[], sort: SortOptions): Card[] {
  return [...cards].sort((a, b) => {
    let comparison = 0

    switch (sort.field) {
      case 'created':
        comparison = (a.createdAt || 0) - (b.createdAt || 0)
        break
      case 'updated':
        comparison = (a.updatedAt || 0) - (b.updatedAt || 0)
        break
      case 'difficulty':
        comparison = a.difficulty - b.difficulty
        break
      case 'status':
        const statusOrder: Record<CardStatus, number> = {
          new: 0,
          learning: 1,
          review: 2,
          suspended: 3,
        }
        comparison = statusOrder[a.status] - statusOrder[b.status]
        break
      case 'nextReview':
        const aNext = (a as any).nextReview || 0
        const bNext = (b as any).nextReview || 0
        comparison = aNext - bNext
        break
      case 'title':
        comparison = (a.content || '').localeCompare(b.content || '')
        break
    }

    return sort.order === 'asc' ? comparison : -comparison
  })
}

/**
 * 获取所有标签
 */
export function getAllTags(cards: Card[]): { tag: string, count: number }[] {
  const tagCount: Record<string, number> = {}

  cards.forEach((card) => {
    card.tags?.forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })

  return Object.entries(tagCount)
    .map(([tag, count]) => ({
      tag,
      count,
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * 获取所有来源文档
 */
export function getAllSourceDocs(cards: Card[]): { id: string, name: string, count: number }[] {
  const docCount: Record<string, number> = {}

  cards.forEach((card) => {
    const docId = card.sourceLocation?.docId || card.sourceLocation?.blockId
    if (docId) {
      docCount[docId] = (docCount[docId] || 0) + 1
    }
  })

  // 这里可以进一步查询文档名称
  return Object.entries(docCount)
    .map(([id, count]) => ({
      id,
      name: id.slice(0, 8),
      count,
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * 保存筛选预设
 */
export async function saveFilterPreset(preset: FilterPreset): Promise<boolean> {
  try {
    // 使用思源 API 保存为块或文档
    // 这里简化处理，实际应该使用思源 API
    const presets = await loadFilterPresets()
    const existingIndex = presets.findIndex((p) => p.id === preset.id)

    if (existingIndex >= 0) {
      presets[existingIndex] = preset
    } else {
      presets.push(preset)
    }

    localStorage.setItem('cardbox-filter-presets', JSON.stringify(presets))
    return true
  } catch (error) {
    console.error('[saveFilterPreset] 保存筛选预设失败:', error)
    return false
  }
}

/**
 * 加载筛选预设
 */
export async function loadFilterPresets(): Promise<FilterPreset[]> {
  try {
    const data = localStorage.getItem('cardbox-filter-presets')
    if (data) {
      return JSON.parse(data)
    }
    return []
  } catch (error) {
    console.error('[loadFilterPresets] 加载筛选预设失败:', error)
    return []
  }
}

/**
 * 删除筛选预设
 */
export async function deleteFilterPreset(presetId: string): Promise<boolean> {
  try {
    const presets = await loadFilterPresets()
    const filtered = presets.filter((p) => p.id !== presetId)
    localStorage.setItem('cardbox-filter-presets', JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('[deleteFilterPreset] 删除筛选预设失败:', error)
    return false
  }
}

/**
 * 生成看板
 */
export async function generateBoard(
  cards: Card[],
  columnType: BoardColumnType = 'status',
): Promise<CardBoard> {
  let columns: BoardColumn[]

  switch (columnType) {
    case 'tag':
      columns = generateTagColumns(cards)
      break
    case 'difficulty':
      columns = generateDifficultyColumns(cards)
      break
    case 'status':
    default:
      columns = generateStatusColumns(cards)
      break
  }

  return {
    studySetId: cards[0]?.studySetId || '',
    columnType,
    columns,
    totalCards: cards.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * 辅助函数：生成随机颜色
 */
function getRandomColor(seed: string): string {
  const colors = ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#009688', '#FF5722', '#795548']
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * 辅助函数：格式化日期分组
 */
function formatDateGroup(dateKey: string, groupType: TimelineGroup['groupType']): string {
  switch (groupType) {
    case 'today':
      return '今天'
    case 'yesterday':
      return '昨天'
    case 'thisWeek':
      return '本周'
    case 'thisMonth':
      return '本月'
    default:
      const date = new Date(dateKey)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
  }
}

/**
 * 辅助函数：格式化时间
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 导出服务对象
 */
export const cardBoxService = {
  // 看板生成
  generateBoard,
  generateStatusColumns,
  generateTagColumns,
  generateDifficultyColumns,

  // 时间线
  generateTimeline,

  // 筛选和排序
  applyFilters,
  applySort,

  // 数据统计
  getAllTags,
  getAllSourceDocs,

  // 筛选预设
  saveFilterPreset,
  loadFilterPresets,
  deleteFilterPreset,
}
