/**
 * 思维导图搜索与过滤类型定义
 * MarginNote 4 风格升级 - 第 7 期
 */

/**
 * 搜索匹配结果
 */
export interface MindMapSearchMatch {
  /** 匹配的节点 ID */
  nodeId: string
  /** 匹配的字段 */
  field: 'title' | 'content' | 'note' | 'tag'
  /** 匹配的文本 */
  matchedText: string
  /** 高亮位置（起始索引） */
  highlightStart: number
  /** 高亮长度 */
  highlightLength: number
  /** 匹配得分（用于排序） */
  score: number
}

/**
 * 搜索结果
 */
export interface MindMapSearchResult {
  /** 搜索关键词 */
  query: string
  /** 匹配结果列表 */
  matches: MindMapSearchMatch[]
  /** 匹配的节点 ID 列表（去重） */
  matchedNodeIds: string[]
  /** 总匹配数 */
  totalMatches: number
  /** 搜索耗时（毫秒） */
  searchTime: number
}

/**
 * 搜索选项
 */
export interface MindMapSearchOptions {
  /** 是否区分大小写 */
  caseSensitive?: boolean
  /** 是否全字匹配 */
  wholeWord?: boolean
  /** 是否使用正则表达式 */
  useRegex?: boolean
  /** 搜索字段 */
  searchFields?: Array<'title' | 'content' | 'note' | 'tag'>
  /** 最大结果数 */
  maxResults?: number
  /** 最小匹配得分 */
  minScore?: number
}

/**
 * 过滤条件类型
 */
export type FilterFieldType = 'tag' | 'status' | 'page' | 'color' | 'date' | 'annotation'

/**
 * 过滤条件
 */
export interface MindMapFilter {
  /** 过滤字段 */
  field: FilterFieldType
  /** 过滤值 */
  value: string | number | boolean | string[]
  /** 比较操作符 */
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'in' | 'notIn'
}

/**
 * 过滤结果
 */
export interface MindMapFilterResult {
  /** 应用的过滤条件 */
  filters: MindMapFilter[]
  /** 过滤后的节点 ID 列表 */
  filteredNodeIds: string[]
  /** 被隐藏的节点 ID 列表 */
  hiddenNodeIds: string[]
  /** 总节点数 */
  totalNodes: number
  /** 过滤后节点数 */
  filteredNodes: number
}

/**
 * 节点统计信息
 */
export interface MindMapNodeStats {
  /** 总节点数 */
  totalNodes: number
  /** 文本卡片数 */
  textCards: number
  /** 图片卡片数 */
  imageCards: number
  /** 分组容器数 */
  groups: number
  /** 有标注的节点数 */
  withAnnotations: number
  /** 有标签的节点数 */
  withTags: number
  /** 不同页码分布 */
  pageDistribution: Record<number, number>
  /** 不同颜色分布 */
  colorDistribution: Record<string, number>
  /** 不同状态分布 */
  statusDistribution: Record<string, number>
  /** 标签使用统计 */
  tagStats: Array<{ tag: string; count: number }>
}

/**
 * 快速过滤预设
 */
export interface QuickFilterPreset {
  /** 预设 ID */
  id: string
  /** 预设名称 */
  name: string
  /** 预设图标 */
  icon: string
  /** 过滤条件 */
  filters: MindMapFilter[]
  /** 是否内置预设 */
  builtIn: boolean
}

/**
 * 搜索历史项
 */
export interface SearchHistoryItem {
  /** 搜索 ID */
  id: string
  /** 搜索关键词 */
  query: string
  /** 搜索时间 */
  timestamp: number
  /** 匹配结果数 */
  resultCount: number
  /** 使用的选项 */
  options?: MindMapSearchOptions
}

/**
 * 高亮标记
 */
export interface SearchHighlight {
  /** 节点 ID */
  nodeId: string
  /** 高亮颜色 */
  color: string
  /** 高亮类型 */
  type: 'search' | 'filter' | 'manual'
  /** 创建时间 */
  timestamp: number
  /** 过期时间（可选，用于临时高亮） */
  expiresAt?: number
}
