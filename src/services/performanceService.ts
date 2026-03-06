/**
 * 性能优化服务
 * 提供数据缓存、虚拟滚动支持、脑图性能优化等功能
 */

import { sql } from '../api'

/**
 * 缓存配置
 */
interface CacheConfig {
  /** 缓存过期时间（毫秒） */
  ttl: number
  /** 最大缓存条目数 */
  maxSize: number
}

/**
 * 缓存条目
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * 复习队列缓存数据
 */
export interface ReviewQueueCache {
  queue: Array<{
    cardId: string
    cardContent: string
    interval: number
    difficulty: number
    nextReview: number
    dueDate: string
  }>
  lastUpdated: number
  studySetId: string
}

/**
 * 脑图节点缓存数据
 */
export interface MindMapNodeCache {
  nodes: Array<{
    id: string
    title: string
    x: number
    y: number
    collapsed: boolean
    children?: string[]
  }>
  viewport: {
    scale: number
    offsetX: number
    offsetY: number
  }
  lastUpdated: number
}

/**
 * 通用缓存类
 */
class DataCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private config: CacheConfig

  constructor(config: CacheConfig = {
    ttl: 5 * 60 * 1000,
    maxSize: 100,
  }) {
    this.config = config
  }

  /**
   * 获取缓存
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    const now = Date.now()
    let count = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }
}

// 创建全局缓存实例
const reviewQueueCache = new DataCache<ReviewQueueCache>({
  ttl: 2 * 60 * 1000, // 2 分钟
  maxSize: 50,
})

const mindMapNodeCache = new DataCache<MindMapNodeCache>({
  ttl: 5 * 60 * 1000, // 5 分钟
  maxSize: 100,
})

const cardDataCache = new DataCache<any[]>({
  ttl: 1 * 60 * 1000, // 1 分钟
  maxSize: 200,
})

/**
 * 复习队列缓存服务
 */
export const reviewQueueCacheService = {
  /**
   * 获取缓存的复习队列
   */
  get(studySetId: string): ReviewQueueCache | null {
    return reviewQueueCache.get(`review:${studySetId}`)
  },

  /**
   * 设置复习队列缓存
   */
  set(studySetId: string, data: ReviewQueueCache): void {
    reviewQueueCache.set(`review:${studySetId}`, data)
  },

  /**
   * 删除复习队列缓存
   */
  delete(studySetId: string): boolean {
    return reviewQueueCache.delete(`review:${studySetId}`)
  },

  /**
   * 检查缓存是否有效
   */
  isValid(studySetId: string): boolean {
    const cache = this.get(studySetId)
    if (!cache) return false

    // 检查是否是今天的数据
    const today = new Date().toDateString()
    const cacheDate = new Date(cache.lastUpdated).toDateString()
    return today === cacheDate
  },
}

/**
 * 脑图节点缓存服务
 */
export const mindMapCacheService = {
  /**
   * 获取缓存的脑图节点
   */
  get(mindMapId: string): MindMapNodeCache | null {
    return mindMapNodeCache.get(`mindmap:${mindMapId}`)
  },

  /**
   * 设置脑图节点缓存
   */
  set(mindMapId: string, data: MindMapNodeCache): void {
    mindMapNodeCache.set(`mindmap:${mindMapId}`, data)
  },

  /**
   * 删除脑图缓存
   */
  delete(mindMapId: string): boolean {
    return mindMapNodeCache.delete(`mindmap:${mindMapId}`)
  },
}

/**
 * 卡片数据缓存服务
 */
export const cardDataCacheService = {
  /**
   * 获取缓存的卡片数据
   */
  get(studySetId: string): any[] | null {
    return cardDataCache.get(`cards:${studySetId}`)
  },

  /**
   * 设置卡片数据缓存
   */
  set(studySetId: string, data: any[]): void {
    cardDataCache.set(`cards:${studySetId}`, data)
  },

  /**
   * 删除卡片缓存
   */
  delete(studySetId: string): boolean {
    return cardDataCache.delete(`cards:${studySetId}`)
  },
}

/**
 * 批量查询优化
 * 将多个查询合并为一个 SQL 查询
 */
export async function batchQuery<T>(
  queries: Array<{
    stmt: string
    db?: string
  }>,
): Promise<T[]> {
  if (queries.length === 0) return []

  // 如果只有一个查询，直接执行
  if (queries.length === 1) {
    const result = await sql(queries[0])
    return result as T[]
  }

  // 合并查询（使用 UNION ALL）
  const combinedStmt = queries.map((q) => `(${q.stmt})`).join(' UNION ALL ')
  const result = await sql({
    stmt: combinedStmt,
    db: queries[0].db,
  })

  return result as T[]
}

/**
 * 分页查询
 */
export async function paginatedQuery<T>(options: {
  stmt: string
  page: number
  pageSize: number
  db?: string
}): Promise<{
  data: T[]
  total: number
  hasMore: boolean
}> {
  const {
    stmt,
    page,
    pageSize,
    db,
  } = options
  const offset = (page - 1) * pageSize

  // 查询总数
  const countStmt = `SELECT COUNT(*) as count FROM (${stmt})`
  const countResult = await sql({
    stmt: countStmt,
    db,
  })
  const total = countResult?.[0]?.count || 0

  // 查询数据
  const dataStmt = `${stmt} LIMIT ${pageSize} OFFSET ${offset}`
  const data = await sql({
    stmt: dataStmt,
    db,
  }) as T[]

  return {
    data,
    total,
    hasMore: offset + data.length < total,
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 大数据量分批处理
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  batchSize: number = 100,
  delayMs: number = 0,
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((item, idx) => processor(item, i + idx)),
    )
    results.push(...batchResults)

    if (delayMs > 0 && i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * 懒加载数据
 */
export class LazyLoader<T> {
  private items: T[] = []
  private loadedCount = 0
  private pageSize: number
  private loader: (offset: number, limit: number) => Promise<T[]>

  constructor(
    loader: (offset: number, limit: number) => Promise<T[]>,
    pageSize: number = 50,
  ) {
    this.loader = loader
    this.pageSize = pageSize
  }

  /**
   * 加载下一页
   */
  async loadNextPage(): Promise<T[]> {
    const newItems = await this.loader(this.loadedCount, this.pageSize)
    this.items.push(...newItems)
    this.loadedCount += newItems.length
    return newItems
  }

  /**
   * 获取已加载的数据
   */
  getItems(start: number, end: number): T[] {
    return this.items.slice(start, end)
  }

  /**
   * 是否还有更多数据
   */
  hasMore(): boolean {
    return this.items.length === this.loadedCount
  }

  /**
   * 重置加载器
   */
  reset(): void {
    this.items = []
    this.loadedCount = 0
  }
}

/**
 * 性能监控
 */
export const performanceMonitor = {
  /**
   * 记录开始时间
   */
  start(label: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`)
    }
  },

  /**
   * 记录结束时间并输出性能数据
   */
  end(label: string): number {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-end`)
      performance.measure(label, `${label}-start`, `${label}-end`)
      const measures = performance.getEntriesByName(label)
      const duration = measures[0]?.duration || 0
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
      return duration
    }
    return 0
  },

  /**
   * 清理性能标记
   */
  clear(): void {
    if (typeof performance !== 'undefined') {
      performance.clearMarks()
      performance.clearMeasures()
    }
  },
}

/**
 * 导出所有服务
 */
export const performanceService = {
  // 缓存服务
  reviewQueueCache: reviewQueueCacheService,
  mindMapCache: mindMapCacheService,
  cardDataCache: cardDataCacheService,

  // 查询优化
  batchQuery,
  paginatedQuery,

  // 函数工具
  debounce,
  throttle,

  // 数据处理
  processInBatches,
  LazyLoader,

  // 性能监控
  performanceMonitor,
}
