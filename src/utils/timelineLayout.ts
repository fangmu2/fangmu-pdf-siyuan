/**
 * 时间轴布局算法 - MarginNote4 风格
 * 支持节点按时间顺序水平/垂直排列，显示时间刻度
 */

import type {
  FreeMindMapEdge,
  FreeMindMapNode,
} from '@/types/mindmapFree'

/** 时间轴方向 */
export type TimelineOrientation = 'horizontal' | 'vertical'

/** 时间刻度类型 */
export type TimeScale = 'auto' | 'day' | 'week' | 'month' | 'year'

/** 时间轴布局配置 */
export interface TimelineLayoutConfig {
  /** 时间轴方向 */
  orientation: TimelineOrientation
  /** 节点间距（默认 150px） */
  nodeSpacing: number
  /** 显示时间标签 */
  showTimeLabels: boolean
  /** 时间刻度类型 */
  timeScale: TimeScale
  /** 画布宽度（水平布局用） */
  canvasWidth?: number
  /** 画布高度（垂直布局用） */
  canvasHeight?: number
  /** 中心位置（水平布局时为 Y 坐标，垂直布局时为 X 坐标） */
  centerPosition?: number
}

/** 默认配置 */
const DEFAULT_CONFIG: TimelineLayoutConfig = {
  orientation: 'horizontal',
  nodeSpacing: 150,
  showTimeLabels: true,
  timeScale: 'auto',
  canvasWidth: 3000,
  canvasHeight: 3000,
  centerPosition: 400,
}

/**
 * 应用时间轴布局
 * @param nodes 所有节点
 * @param edges 所有连线
 * @param config 布局配置
 * @returns 布局后的节点和连线
 */
export function applyTimelineLayout(
  nodes: FreeMindMapNode[],
  edges: FreeMindMapEdge[],
  config: Partial<TimelineLayoutConfig> = {},
): { nodes: FreeMindMapNode[], edges: FreeMindMapEdge[] } {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  if (nodes.length === 0) {
    return {
      nodes,
      edges,
    }
  }

  // 1. 分离有时间戳和无时间戳的节点
  const scheduledNodes = nodes.filter((n) => n.data.timestamp)
  const unscheduledNodes = nodes.filter((n) => !n.data.timestamp)

  // 2. 按时间戳排序节点
  scheduledNodes.sort((a, b) => (a.data.timestamp || 0) - (b.data.timestamp || 0))

  // 3. 计算时间范围
  const minTime = scheduledNodes.length > 0
    ? Math.min(...scheduledNodes.map((n) => n.data.timestamp || 0))
    : Date.now()
  const maxTime = scheduledNodes.length > 0
    ? Math.max(...scheduledNodes.map((n) => n.data.timestamp || 0))
    : Date.now()
  const timeRange = maxTime - minTime || 1 // 避免除零

  // 4. 应用布局
  if (finalConfig.orientation === 'horizontal') {
    const canvasWidth = finalConfig.canvasWidth || 3000
    const margin = 200

    // 水平布局：时间从左到右
    scheduledNodes.forEach((node) => {
      const timeProgress = timeRange > 0
        ? ((node.data.timestamp || 0) - minTime) / timeRange
        : 0
      node.position.x = margin + timeProgress * (canvasWidth - margin * 2)
      node.position.y = finalConfig.centerPosition || 400

      // 更新时间标签
      if (finalConfig.showTimeLabels) {
        node.data.dateLabel = formatDate(node.data.timestamp || 0, finalConfig.timeScale)
      }
    })

    // 无时间戳的节点放在右侧
    unscheduledNodes.forEach((node, index) => {
      node.position.x = canvasWidth + 100 + index * finalConfig.nodeSpacing
      node.position.y = finalConfig.centerPosition || 400
    })
  } else {
    // 垂直布局：时间从上到下
    const canvasHeight = finalConfig.canvasHeight || 3000
    const margin = 100

    scheduledNodes.forEach((node) => {
      const timeProgress = timeRange > 0
        ? ((node.data.timestamp || 0) - minTime) / timeRange
        : 0
      node.position.x = finalConfig.centerPosition || 400
      node.position.y = margin + timeProgress * (canvasHeight - margin * 2)

      // 更新时间标签
      if (finalConfig.showTimeLabels) {
        node.data.dateLabel = formatDate(node.data.timestamp || 0, finalConfig.timeScale)
      }
    })

    // 无时间戳的节点放在下方
    unscheduledNodes.forEach((node, index) => {
      node.position.x = finalConfig.centerPosition || 400
      node.position.y = canvasHeight + 100 + index * finalConfig.nodeSpacing
    })
  }

  // 5. 更新时间轴连线（可选）
  const timelineEdges = createTimeLineEdges(scheduledNodes, edges)

  return {
    nodes: [...scheduledNodes, ...unscheduledNodes],
    edges: timelineEdges,
  }
}

/**
 * 创建时间轴连线
 * 在相邻的时间节点之间添加连线
 */
function createTimeLineEdges(
  scheduledNodes: FreeMindMapNode[],
  existingEdges: FreeMindMapEdge[],
): FreeMindMapEdge[] {
  if (scheduledNodes.length < 2) {
    return existingEdges
  }

  // 创建时间节点之间的顺序连线
  const timelineEdges: FreeMindMapEdge[] = []

  for (let i = 0; i < scheduledNodes.length - 1; i++) {
    const source = scheduledNodes[i]
    const target = scheduledNodes[i + 1]

    // 检查是否已存在连线
    const exists = existingEdges.some(
      (e) => e.source === source.id && e.target === target.id,
    )

    if (!exists) {
      timelineEdges.push({
        id: `timeline-edge-${i}`,
        source: source.id,
        target: target.id,
        type: 'step',
        style: {
          stroke: '#999',
          strokeWidth: 1,
          strokeDasharray: '5,5',
        },
      })
    }
  }

  return [...existingEdges, ...timelineEdges]
}

/**
 * 格式化时间
 */
export function formatDate(timestamp: number, scale: TimeScale): string {
  const date = new Date(timestamp)

  switch (scale) {
    case 'day':
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    case 'week':
      return `第 ${getWeekNumber(date)} 周`
    case 'month':
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
      })
    case 'year':
      return date.getFullYear().toString()
    case 'auto':
    default:
      // 根据时间范围自动选择格式
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (days < 1) {
        return date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      } else if (days < 7) {
        return date.toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric',
        })
      } else if (days < 365) {
        return date.toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric',
        })
      } else {
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
        })
      }
  }
}

/**
 * 计算周数
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * 计算时间轴刻度间隔
 */
export function calculateTickInterval(
  timeRange: number,
  scale: TimeScale,
): number {
  if (scale !== 'auto') {
    switch (scale) {
      case 'day':
        return 24 * 60 * 60 * 1000 // 1 天
      case 'week':
        return 7 * 24 * 60 * 60 * 1000 // 1 周
      case 'month':
        return 30 * 24 * 60 * 60 * 1000 // 1 个月
      case 'year':
        return 365 * 24 * 60 * 60 * 1000 // 1 年
    }
  }

  // 自动计算
  const days = timeRange / (1000 * 60 * 60 * 24)

  if (days < 1) {
    return 60 * 60 * 1000 // 1 小时
  } else if (days < 7) {
    return 24 * 60 * 60 * 1000 // 1 天
  } else if (days < 30) {
    return 7 * 24 * 60 * 60 * 1000 // 1 周
  } else if (days < 365) {
    return 30 * 24 * 60 * 60 * 1000 // 1 个月
  } else {
    return 365 * 24 * 60 * 60 * 1000 // 1 年
  }
}

/**
 * 计算时间轴布局（返回位置映射）
 */
export function calculateTimelineLayout(
  nodes: FreeMindMapNode[],
  config: Partial<TimelineLayoutConfig> = {},
): Map<string, { x: number, y: number }> {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  }
  const positions = new Map<string, { x: number, y: number }>()

  if (nodes.length === 0) {
    return positions
  }

  // 分离有时间戳和无时间戳的节点
  const scheduledNodes = nodes.filter((n) => n.data.timestamp)
  const unscheduledNodes = nodes.filter((n) => !n.data.timestamp)

  // 按时间戳排序
  scheduledNodes.sort((a, b) => (a.data.timestamp || 0) - (b.data.timestamp || 0))

  // 计算时间范围
  const minTime = scheduledNodes.length > 0
    ? Math.min(...scheduledNodes.map((n) => n.data.timestamp || 0))
    : Date.now()
  const maxTime = scheduledNodes.length > 0
    ? Math.max(...scheduledNodes.map((n) => n.data.timestamp || 0))
    : Date.now()
  const timeRange = maxTime - minTime || 1

  // 水平布局
  if (finalConfig.orientation === 'horizontal') {
    const canvasWidth = finalConfig.canvasWidth || 3000
    const margin = 200

    scheduledNodes.forEach((node) => {
      const timeProgress = timeRange > 0
        ? ((node.data.timestamp || 0) - minTime) / timeRange
        : 0
      positions.set(node.id, {
        x: margin + timeProgress * (canvasWidth - margin * 2),
        y: finalConfig.centerPosition || 400,
      })
    })

    unscheduledNodes.forEach((node, index) => {
      positions.set(node.id, {
        x: canvasWidth + 100 + index * finalConfig.nodeSpacing,
        y: finalConfig.centerPosition || 400,
      })
    })
  }
  // 垂直布局
  else {
    const canvasHeight = finalConfig.canvasHeight || 3000
    const margin = 100

    scheduledNodes.forEach((node) => {
      const timeProgress = timeRange > 0
        ? ((node.data.timestamp || 0) - minTime) / timeRange
        : 0
      positions.set(node.id, {
        x: finalConfig.centerPosition || 400,
        y: margin + timeProgress * (canvasHeight - margin * 2),
      })
    })

    unscheduledNodes.forEach((node, index) => {
      positions.set(node.id, {
        x: finalConfig.centerPosition || 400,
        y: canvasHeight + 100 + index * finalConfig.nodeSpacing,
      })
    })
  }

  return positions
}

/**
 * 更新节点布局（供 store 调用）
 */
export function applyTimelineLayoutToNodes(
  nodes: FreeMindMapNode[],
  updateNodePosition: (nodeId: string, position: { x: number, y: number }) => void,
  config: Partial<TimelineLayoutConfig> = {},
): void {
  const positions = calculateTimelineLayout(nodes, config)

  positions.forEach((position, nodeId) => {
    updateNodePosition(nodeId, position)
  })
}
