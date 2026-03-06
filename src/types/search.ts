/**
 * 搜索与导航类型定义
 * MarginNote 4 风格学习插件 - 搜索系统
 */

/** 搜索历史项 */
export interface SearchHistoryItem {
  /** 搜索 ID */
  id: string
  /** 搜索关键词 */
  query: string
  /** 搜索时间戳 */
  timestamp: number
  /** 搜索结果数量 */
  resultCount: number
  /** 搜索选项 */
  options: SearchOptions
  /** 搜索范围 */
  scope: SearchScope
}

/** 搜索选项 */
export interface SearchOptions {
  /** 区分大小写 */
  caseSensitive: boolean
  /** 全字匹配 */
  wholeWord: boolean
  /** 正则表达式 */
  useRegex: boolean
}

/** 搜索范围 */
export type SearchScope = 'current' | 'all' | 'pdf' | 'mindmap' | 'cards'

/** 搜索结果项 */
export interface SearchResultItem {
  /** 结果 ID */
  id: string
  /** 结果类型 */
  type: SearchResultType
  /** 标题 */
  title: string
  /** 内容摘要 */
  content: string
  /** 匹配位置 */
  matchIndex: number
  /** 匹配长度 */
  matchLength: number
  /** 所属学习集 ID */
  studySetId?: string
  /** 所属学习集名称 */
  studySetName?: string
  /** 来源信息 */
  source?: SearchResultSource
  /** 元数据 */
  meta?: SearchResultMeta
}

/** 搜索结果类型 */
export type SearchResultType = 'card' | 'flashcard' | 'excerpt' | 'mindmap' | 'annotation' | 'document'

/** 搜索结果来源 */
export interface SearchResultSource {
  /** PDF 路径 */
  pdfPath?: string
  /** 页码 */
  page?: number
  /** 坐标区域 */
  rect?: [number, number, number, number]
  /** 文档 ID */
  docId?: string
  /** 块 ID */
  blockId?: string
  /** 脑图节点 ID */
  mindmapNodeId?: string
}

/** 搜索结果元数据 */
export interface SearchResultMeta {
  /** 创建时间 */
  createdAt?: number
  /** 更新时间 */
  updatedAt?: number
  /** 标签 */
  tags?: string[]
  /** 状态 */
  status?: string
  /** 难度 */
  difficulty?: number
}

/** 标签云数据项 */
export interface TagCloudItem {
  /** 标签名称 */
  tag: string
  /** 使用次数 */
  count: number
  /** 权重 (用于字体大小计算) */
  weight: number
  /** 颜色 */
  color?: string
  /** 最近使用时间 */
  lastUsed?: number
}

/** 标签统计 */
export interface TagStatistics {
  /** 总标签数 */
  totalTags: number
  /** 总使用次数 */
  totalUsage: number
  /** 热门标签列表 */
  topTags: TagCloudItem[]
  /** 最近使用标签 */
  recentTags: TagCloudItem[]
  /** 按学习集分组的标签统计 */
  byStudySet: Record<string, TagCloudItem[]>
}

/** 面包屑导航项 */
export interface BreadcrumbItem {
  /** 显示文本 */
  label: string
  /** 点击跳转路径/ID */
  path?: string
  /** 数据类型 */
  type?: BreadcrumbType
  /** 额外数据 */
  meta?: Record<string, any>
}

/** 面包屑数据类型 */
export type BreadcrumbType =
  | 'home'
  | 'studySet'
  | 'card'
  | 'mindmap'
  | 'pdf'
  | 'review'
  | 'search'
  | 'settings'

/** 面包屑导航状态 */
export interface BreadcrumbState {
  /** 导航项列表 */
  items: BreadcrumbItem[]
  /** 当前路径 */
  currentPath?: string
}

/** 全局搜索配置 */
export interface GlobalSearchConfig {
  /** 搜索范围 */
  scope: SearchScope
  /** 包含的学习集 ID 列表 */
  studySetIds?: string[]
  /** 搜索类型过滤 */
  typeFilter?: SearchResultType[]
  /** 标签过滤 */
  tagFilter?: string[]
  /** 时间范围过滤 */
  dateRange?: {
    from: number
    to: number
  }
}

/** 全局搜索结果 */
export interface GlobalSearchResult {
  /** 搜索关键词 */
  query: string
  /** 总结果数 */
  totalResults: number
  /** 按类型分组的结果 */
  resultsByType: Record<SearchResultType, SearchResultItem[]>
  /** 按学习集分组的结果 */
  resultsByStudySet: Record<string, SearchResultItem[]>
  /** 搜索耗时 (毫秒) */
  searchDuration: number
  /** 所有结果 */
  allResults: SearchResultItem[]
}

/** 搜索历史存储配置 */
export interface SearchHistoryConfig {
  /** 最大历史记录数 */
  maxHistory: number
  /** 历史记录保存天数 */
  historyDays: number
  /** 是否启用自动保存 */
  autoSave: boolean
}

/** 默认搜索历史配置 */
export const DEFAULT_SEARCH_HISTORY_CONFIG: SearchHistoryConfig = {
  maxHistory: 50,
  historyDays: 30,
  autoSave: true,
}

/** 标签云配置 */
export interface TagCloudConfig {
  /** 最小字体大小 */
  minFontSize: number
  /** 最大字体大小 */
  maxFontSize: number
  /** 显示的最大标签数 */
  maxTags: number
  /** 颜色方案 */
  colorScheme: 'gradient' | 'random' | 'custom'
  /** 自定义颜色列表 */
  customColors?: string[]
}

/** 默认标签云配置 */
export const DEFAULT_TAG_CLOUD_CONFIG: TagCloudConfig = {
  minFontSize: 12,
  maxFontSize: 24,
  maxTags: 50,
  colorScheme: 'gradient',
}
