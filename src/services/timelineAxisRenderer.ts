/**
 * 时间轴刻度渲染器
 * 负责渲染时间轴的刻度线和标签
 */

import type {
  TimelineOrientation,
  TimeScale,
} from '@/utils/timelineLayout'

/** 时间轴刻度线 */
export interface TimelineTick {
  /** 刻度线 ID */
  id: string
  /** 刻度线起点 X 坐标 */
  x1: number
  /** 刻度线起点 Y 坐标 */
  y1: number
  /** 刻度线终点 X 坐标 */
  x2: number
  /** 刻度线终点 Y 坐标 */
  y2: number
  /** 刻度线样式 */
  style?: {
    stroke?: string
    strokeWidth?: number
    strokeDasharray?: string
  }
}

/** 时间轴标签 */
export interface TimelineLabel {
  /** 标签 ID */
  id: string
  /** 标签 X 坐标 */
  x: number
  /** 标签 Y 坐标 */
  y: number
  /** 标签文本 */
  text: string
  /** 标签样式 */
  style?: {
    fill?: string
    fontSize?: number
    fontWeight?: string
    textAlign?: 'left' | 'center' | 'right'
  }
}

/** 时间轴渲染结果 */
export interface TimelineAxisRenderResult {
  /** 刻度线列表 */
  ticks: TimelineTick[]
  /** 时间标签列表 */
  labels: TimelineLabel[]
  /** 时间轴线 */
  axisLine?: {
    x1: number
    y1: number
    x2: number
    y2: number
    style?: {
      stroke?: string
      strokeWidth?: number
    }
  }
}

/** 时间轴渲染配置 */
export interface TimelineAxisConfig {
  /** 时间轴方向 */
  orientation: TimelineOrientation
  /** 时间刻度类型 */
  timeScale: TimeScale
  /** 显示时间标签 */
  showTimeLabels: boolean
  /** 最小时间 */
  minTime: number
  /** 最大时间 */
  timeRange: number
  /** 画布宽度（水平布局用） */
  canvasWidth: number
  /** 画布高度（垂直布局用） */
  canvasHeight: number
  /** 中心位置（水平布局时为 Y 坐标，垂直布局时为 X 坐标） */
  centerPosition: number
}

/** 默认配置 */
const DEFAULT_AXIS_CONFIG: Partial<TimelineAxisConfig> = {
  canvasWidth: 3000,
  canvasHeight: 3000,
  centerPosition: 400,
}

/**
 * 计算刻度间隔
 */
function calculateTickInterval(timeRange: number, scale: TimeScale): number {
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
 * 格式化时间
 */
function formatTimeLabel(timestamp: number, scale: TimeScale): string {
  const date = new Date(timestamp)

  switch (scale) {
    case 'day':
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      })
    case 'week':
      return `第 ${getWeekNumber(date)} 周`
    case 'month':
      return date.toLocaleDateString('zh-CN', {
        month: 'long',
      })
    case 'year':
      return `${date.getFullYear()}年`
    case 'auto':
    default:
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
          month: 'short',
          day: 'numeric',
        })
      } else if (days < 30) {
        return `${Math.floor(days / 7) + 1}周`
      } else if (days < 365) {
        return date.toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric',
        })
      } else {
        return `${date.getFullYear()}年${date.getMonth() + 1}月`
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
 * 渲染时间轴
 * @param config 时间轴配置
 * @returns 渲染结果（刻度线和标签）
 */
export function renderTimelineAxis(
  config: Partial<TimelineAxisConfig>,
): TimelineAxisRenderResult {
  const finalConfig = {
    ...DEFAULT_AXIS_CONFIG,
    ...config,
  }
  const {
    orientation,
    timeScale = 'auto',
    showTimeLabels = true,
    minTime,
    timeRange,
    canvasWidth,
    canvasHeight,
    centerPosition,
  } = finalConfig

  const ticks: TimelineTick[] = []
  const labels: TimelineLabel[] = []

  // 计算刻度间隔
  const tickInterval = calculateTickInterval(timeRange, timeScale)

  // 生成刻度
  for (let t = minTime; t <= minTime + timeRange; t += tickInterval) {

    if (orientation === 'horizontal') {
      // 水平时间轴
      const x = calculateXPosition(t, minTime, timeRange, canvasWidth)

      // 刻度线（垂直短线）
      ticks.push({
        id: `tick-${t}`,
        x1: x,
        y1: centerPosition - 10,
        x2: x,
        y2: centerPosition + 10,
        style: {
          stroke: '#ccc',
          strokeWidth: 1,
          strokeDasharray: '2,2',
        },
      })

      // 时间标签（在刻度线下方）
      if (showTimeLabels) {
        labels.push({
          id: `label-${t}`,
          x,
          y: centerPosition + 25,
          text: formatTimeLabel(t, timeScale),
          style: {
            fill: '#666',
            fontSize: 12,
            textAlign: 'center',
          },
        })
      }
    } else {
      // 垂直时间轴
      const y = calculateYPosition(t, minTime, timeRange, canvasHeight)

      // 刻度线（水平短线）
      ticks.push({
        id: `tick-${t}`,
        x1: centerPosition - 10,
        y1: y,
        x2: centerPosition + 10,
        y2: y,
        style: {
          stroke: '#ccc',
          strokeWidth: 1,
          strokeDasharray: '2,2',
        },
      })

      // 时间标签（在刻度线左侧）
      if (showTimeLabels) {
        labels.push({
          id: `label-${t}`,
          x: centerPosition - 15,
          y: y + 4,
          text: formatTimeLabel(t, timeScale),
          style: {
            fill: '#666',
            fontSize: 12,
            textAlign: 'right',
          },
        })
      }
    }
  }

  // 时间轴线
  const axisLine = orientation === 'horizontal'
    ? {
        x1: 50,
        y1: centerPosition,
        x2: canvasWidth - 50,
        y2: centerPosition,
        style: {
          stroke: '#999',
          strokeWidth: 2,
        },
      }
    : {
        x1: centerPosition,
        y1: 50,
        x2: centerPosition,
        y2: canvasHeight - 50,
        style: {
          stroke: '#999',
          strokeWidth: 2,
        },
      }

  return {
    ticks,
    labels,
    axisLine,
  }
}

/**
 * 计算水平位置
 */
function calculateXPosition(
  timestamp: number,
  minTime: number,
  timeRange: number,
  canvasWidth: number,
): number {
  const margin = 200
  const progress = (timestamp - minTime) / timeRange
  return margin + progress * (canvasWidth - margin * 2)
}

/**
 * 计算垂直位置
 */
function calculateYPosition(
  timestamp: number,
  minTime: number,
  timeRange: number,
  canvasHeight: number,
): number {
  const margin = 100
  const progress = (timestamp - minTime) / timeRange
  return margin + progress * (canvasHeight - margin * 2)
}

/**
 * 优化刻度密度（避免标签重叠）
 */
export function optimizeTickDensity(
  ticks: TimelineTick[],
  labels: TimelineLabel[],
  maxTicks: number = 20,
): { ticks: TimelineTick[], labels: TimelineLabel[] } {
  if (ticks.length <= maxTicks) {
    return {
      ticks,
      labels,
    }
  }

  // 计算采样间隔
  const sampleInterval = Math.ceil(ticks.length / maxTicks)

  // 采样刻度
  const sampledTicks = ticks.filter((_, index) => index % sampleInterval === 0)
  const sampledLabels = labels.filter((_, index) => index % sampleInterval === 0)

  return {
    ticks: sampledTicks,
    labels: sampledLabels,
  }
}
