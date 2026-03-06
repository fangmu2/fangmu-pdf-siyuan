/**
 * 脑图性能优化服务
 * MarginNote 4 风格学习插件 - 支持 500+ 节点的大型脑图
 */

import type { MindMapNode } from '../types/mindmap'
import {
  useDebounceFn,
  useThrottleFn,
} from '@vueuse/core'

/** 视口配置 */
export interface ViewportConfig {
  /** 容器宽度 */
  width: number
  /** 容器高度 */
  height: number
  /** 缩放级别 */
  scale: number
  /** 偏移 X */
  offsetX: number
  /** 偏移 Y */
  offsetY: number
  /** 边距 */
  padding: number
}

/** 可见节点结果 */
export interface VisibleNodesResult {
  /** 可见节点 ID 列表 */
  visibleNodeIds: Set<string>
  /** 部分可见的折叠节点 */
  partiallyVisible: Set<string>
  /** 总节点数 */
  totalNodes: number
  /** 可见节点数 */
  visibleCount: number
  /** 渲染比例 */
  renderRatio: number
}

/** 虚拟渲染配置 */
export interface VirtualRenderConfig {
  /** 节点高度 */
  nodeHeight: number
  /** 节点宽度 */
  nodeWidth: number
  /** 水平间距 */
  spacingX: number
  /** 垂直间距 */
  spacingY: number
  /** 缓冲区比例（视口外额外渲染的比例） */
  bufferRatio: number
  /** 最小渲染节点数 */
  minRenderCount: number
  /** 最大渲染节点数 */
  maxRenderCount: number
}

/** 性能统计 */
export interface PerformanceStats {
  /** 总节点数 */
  totalNodes: number
  /** 渲染节点数 */
  renderedNodes: number
  /** 渲染时间（ms） */
  renderTime: number
  /** 帧率 */
  fps: number
  /** 内存使用（估算） */
  memoryUsage: number
  /** 是否使用虚拟渲染 */
  isVirtualRender: boolean
}

/** 节点位置缓存 */
interface NodePositionCache {
  id: string
  x: number
  y: number
  width: number
  height: number
  level: number
  visible: boolean
}

/** 默认配置 */
const DEFAULT_VIRTUAL_CONFIG: VirtualRenderConfig = {
  nodeHeight: 32,
  nodeWidth: 200,
  spacingX: 120,
  spacingY: 12,
  bufferRatio: 0.3,
  minRenderCount: 50,
  maxRenderCount: 300,
}

/** 性能阈值 */
const PERFORMANCE_THRESHOLDS = {
  /** 启用虚拟渲染的节点数阈值 */
  virtualRenderThreshold: 100,
  /** 启用懒加载的节点数阈值 */
  lazyLoadThreshold: 200,
  /** 启用节点简化的节点数阈值 */
  simplifyThreshold: 300,
  /** 最大可视节点数 */
  maxVisibleNodes: 150,
}

/**
 * 脑图性能优化服务
 */
export class MindMapPerformanceService {
  private static instance: MindMapPerformanceService | null = null

  /** 节点位置缓存 */
  private positionCache: Map<string, NodePositionCache> = new Map()

  /** 渲染队列 */
  private renderQueue: Set<string> = new Set()

  /** 是否正在渲染 */
  private isRendering = false

  /** 上次渲染时间 */
  private lastRenderTime = 0

  /** 帧率计算 */
  private frameCount = 0
  private lastFpsTime = 0
  private currentFps = 60

  /** 性能监控回调 */
  private onStatsUpdate: ((stats: PerformanceStats) => void) | null = null

  private constructor() {}

  static getInstance(): MindMapPerformanceService {
    if (!MindMapPerformanceService.instance) {
      MindMapPerformanceService.instance = new MindMapPerformanceService()
    }
    return MindMapPerformanceService.instance
  }

  /**
   * 计算可见节点
   */
  calculateVisibleNodes(
    rootNode: MindMapNode,
    viewport: ViewportConfig,
    config: VirtualRenderConfig = DEFAULT_VIRTUAL_CONFIG,
  ): VisibleNodesResult {
    // 先更新位置缓存
    this.updatePositionCache(rootNode, config)

    const visibleNodeIds = new Set<string>()
    const partiallyVisible = new Set<string>()

    // 计算视口范围（包含缓冲区）
    const bufferWidth = viewport.width * config.bufferRatio
    const bufferHeight = viewport.height * config.bufferRatio

    const viewLeft = viewport.offsetX - bufferWidth
    const viewRight = viewport.offsetX + viewport.width + bufferWidth
    const viewTop = viewport.offsetY - bufferHeight
    const viewBottom = viewport.offsetY + viewport.height + bufferHeight

    // 遍历缓存，找出可见节点
    for (const [id, cache] of this.positionCache) {
      const nodeRight = cache.x + cache.width
      const nodeBottom = cache.y + cache.height

      // 判断是否在视口内
      const isInViewport =
        cache.x < viewRight
        && nodeRight > viewLeft
        && cache.y < viewBottom
        && nodeBottom > viewTop

      if (isInViewport) {
        visibleNodeIds.add(id)

        // 检查是否部分可见
        const isPartiallyVisible =
          cache.x < viewLeft
          || nodeRight > viewRight
          || cache.y < viewTop
          || nodeBottom > viewBottom

        if (isPartiallyVisible) {
          partiallyVisible.add(id)
        }
      }
    }

    const totalNodes = this.positionCache.size
    const visibleCount = visibleNodeIds.size

    return {
      visibleNodeIds,
      partiallyVisible,
      totalNodes,
      visibleCount,
      renderRatio: totalNodes > 0 ? visibleCount / totalNodes : 0,
    }
  }

  /**
   * 更新节点位置缓存
   */
  private updatePositionCache(
    node: MindMapNode,
    config: VirtualRenderConfig,
    level: number = 0,
    x: number = 0,
    y: number = 0,
  ): void {
    const cache: NodePositionCache = {
      id: node.id,
      x,
      y,
      width: config.nodeWidth,
      height: config.nodeHeight,
      level,
      visible: true,
    }

    this.positionCache.set(node.id, cache)

    // 递归处理子节点
    let childY = y
    for (const child of node.children) {
      const childX = x + config.nodeWidth + config.spacingX
      this.updatePositionCache(child, config, level + 1, childX, childY)
      childY += config.nodeHeight + config.spacingY
    }
  }

  /**
   * 判断是否需要虚拟渲染
   */
  needsVirtualRender(nodeCount: number): boolean {
    return nodeCount >= PERFORMANCE_THRESHOLDS.virtualRenderThreshold
  }

  /**
   * 判断是否需要懒加载
   */
  needsLazyLoad(nodeCount: number): boolean {
    return nodeCount >= PERFORMANCE_THRESHOLDS.lazyLoadThreshold
  }

  /**
   * 判断是否需要简化渲染
   */
  needsSimplify(nodeCount: number): boolean {
    return nodeCount >= PERFORMANCE_THRESHOLDS.simplifyThreshold
  }

  /**
   * 获取最大可视节点数
   */
  getMaxVisibleNodes(): number {
    return PERFORMANCE_THRESHOLDS.maxVisibleNodes
  }

  /**
   * 统计节点数量
   */
  countNodes(node: MindMapNode): number {
    let count = 1
    for (const child of node.children) {
      count += this.countNodes(child)
    }
    return count
  }

  /**
   * 获取展开的节点数
   */
  countExpandedNodes(node: MindMapNode): number {
    if (node.collapsed || !node.expanded) {
      return 1
    }

    let count = 1
    for (const child of node.children) {
      count += this.countExpandedNodes(child)
    }
    return count
  }

  /**
   * 扁平化节点树（用于虚拟列表）
   */
  flattenNodes(
    node: MindMapNode,
    result: Array<{
      node: MindMapNode
      level: number
      parent: MindMapNode | null
    }> = [],
    level: number = 0,
    parent: MindMapNode | null = null,
  ): Array<{ node: MindMapNode, level: number, parent: MindMapNode | null }> {
    result.push({
      node,
      level,
      parent,
    })

    if (!node.collapsed && node.expanded !== false) {
      for (const child of node.children) {
        this.flattenNodes(child, result, level + 1, node)
      }
    }

    return result
  }

  /**
   * 分批渲染
   */
  async batchRender(
    nodes: MindMapNode[],
    renderFn: (node: MindMapNode) => Promise<void>,
    batchSize: number = 20,
  ): Promise<void> {
    if (this.isRendering) return
    this.isRendering = true

    for (let i = 0; i < nodes.length; i += batchSize) {
      const batch = nodes.slice(i, i + batchSize)
      await Promise.all(batch.map(renderFn))

      // 让出主线程
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }

    this.isRendering = false
  }

  /**
   * 添加到渲染队列
   */
  addToRenderQueue(nodeId: string): void {
    this.renderQueue.add(nodeId)
  }

  /**
   * 处理渲染队列
   */
  processRenderQueue(renderFn: (nodeIds: string[]) => void): void {
    if (this.renderQueue.size === 0) return

    const nodeIds = Array.from(this.renderQueue)
    this.renderQueue.clear()
    renderFn(nodeIds)
  }

  /**
   * 创建防抖渲染函数
   */
  createDebouncedRender<T extends (...args: unknown[]) => void>(
    renderFn: T,
    delay: number = 100,
  ): ReturnType<typeof useDebounceFn<T>> {
    return useDebounceFn(renderFn, delay)
  }

  /**
   * 创建节流渲染函数
   */
  createThrottledRender<T extends (...args: unknown[]) => void>(
    renderFn: T,
    interval: number = 16,
  ): ReturnType<typeof useThrottleFn<T>> {
    return useThrottleFn(renderFn, interval)
  }

  /**
   * 开始性能监控
   */
  startPerformanceMonitor(callback: (stats: PerformanceStats) => void): void {
    this.onStatsUpdate = callback
    this.lastFpsTime = performance.now()
    this.frameCount = 0
  }

  /**
   * 停止性能监控
   */
  stopPerformanceMonitor(): void {
    this.onStatsUpdate = null
  }

  /**
   * 更新性能统计
   */
  updateStats(
    totalNodes: number,
    renderedNodes: number,
    isVirtualRender: boolean,
  ): PerformanceStats {
    const now = performance.now()

    // 计算帧率
    this.frameCount++
    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount
      this.frameCount = 0
      this.lastFpsTime = now
    }

    // 计算渲染时间
    const renderTime = now - this.lastRenderTime
    this.lastRenderTime = now

    // 估算内存使用（每个节点约 500 字节）
    const memoryUsage = totalNodes * 500

    const stats: PerformanceStats = {
      totalNodes,
      renderedNodes,
      renderTime,
      fps: this.currentFps,
      memoryUsage,
      isVirtualRender,
    }

    if (this.onStatsUpdate) {
      this.onStatsUpdate(stats)
    }

    return stats
  }

  /**
   * 简化大型脑图
   */
  simplifyLargeMindMap(
    node: MindMapNode,
    threshold: number = PERFORMANCE_THRESHOLDS.simplifyThreshold,
  ): MindMapNode {
    const nodeCount = this.countNodes(node)

    if (nodeCount <= threshold) {
      return node
    }

    // 折叠深层节点
    const simplifyNode = (n: MindMapNode, depth: number): MindMapNode => {
      const simplified: MindMapNode = {
        ...n,
        children: [],
        collapsed: depth >= 3,
      }

      if (depth < 3) {
        simplified.children = n.children.map((child) =>
          simplifyNode(child, depth + 1),
        )
      }

      return simplified
    }

    return simplifyNode(node, 0)
  }

  /**
   * 智能折叠
   */
  smartCollapse(node: MindMapNode, maxVisible: number = PERFORMANCE_THRESHOLDS.maxVisibleNodes): MindMapNode {
    const nodeCount = this.countNodes(node)

    if (nodeCount <= maxVisible) {
      return node
    }

    // 计算需要折叠的层级
    const collapseNode = (n: MindMapNode, depth: number): MindMapNode => {
      const newNode: MindMapNode = {
        ...n,
        children: [],
        collapsed: depth >= 2,
      }

      for (const child of n.children) {
        newNode.children.push(collapseNode(child, depth + 1))
      }

      return newNode
    }

    return collapseNode(node, 0)
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.positionCache.clear()
    this.renderQueue.clear()
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.positionCache.size
  }

  /**
   * 预加载节点
   */
  preloadNodes(
    rootNode: MindMapNode,
    preloadFn: (node: MindMapNode) => void,
    priority: 'depth-first' | 'breadth-first' = 'breadth-first',
  ): void {
    if (priority === 'depth-first') {
      const traverse = (node: MindMapNode) => {
        preloadFn(node)
        for (const child of node.children) {
          traverse(child)
        }
      }
      traverse(rootNode)
    } else {
      const queue: MindMapNode[] = [rootNode]
      while (queue.length > 0) {
        const node = queue.shift()!
        preloadFn(node)
        queue.push(...node.children)
      }
    }
  }

  /**
   * 延迟加载子节点
   */
  createLazyChildrenLoader(
    loadChildrenFn: (nodeId: string) => Promise<MindMapNode[]>,
  ): (node: MindMapNode) => Promise<MindMapNode[]> {
    const loadedNodes = new Set<string>()

    return async (node: MindMapNode): Promise<MindMapNode[]> => {
      if (loadedNodes.has(node.id)) {
        return node.children
      }

      const children = await loadChildrenFn(node.id)
      loadedNodes.add(node.id)
      return children
    }
  }

  /**
   * 获取性能建议
   */
  getPerformanceRecommendations(nodeCount: number): string[] {
    const recommendations: string[] = []

    if (nodeCount > PERFORMANCE_THRESHOLDS.virtualRenderThreshold) {
      recommendations.push('建议启用虚拟渲染以提升性能')
    }

    if (nodeCount > PERFORMANCE_THRESHOLDS.lazyLoadThreshold) {
      recommendations.push('建议启用懒加载，仅在展开时加载子节点')
    }

    if (nodeCount > PERFORMANCE_THRESHOLDS.simplifyThreshold) {
      recommendations.push('建议启用智能折叠，自动折叠深层节点')
    }

    if (nodeCount > 500) {
      recommendations.push('当前脑图规模较大，考虑拆分为多个子脑图')
    }

    return recommendations
  }
}

export const mindmapPerformanceService = MindMapPerformanceService.getInstance()
