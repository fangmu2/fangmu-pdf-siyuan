/**
 * PDF 阅读器增强类型定义
 * MarginNote 4 风格学习插件 - PDF 阅读增强功能
 */

/**
 * PDF 阅读模式
 */
export enum PDFViewMode {
  SINGLE = 'single', // 单页模式
  DOUBLE = 'double', // 双页模式
  CONTINUOUS = 'continuous', // 连续滚动模式
}

/**
 * PDF 缩放模式
 */
export enum PDFZoomMode {
  FIT_PAGE = 'fit_page', // 适应页面
  FIT_WIDTH = 'fit_width', // 适应宽度
  FIT_HEIGHT = 'fit_height', // 适应高度
  ACTUAL_SIZE = 'actual', // 实际大小
  CUSTOM = 'custom', // 自定义
}

/**
 * PDF 旋转角度
 */
export enum PDFRotation {
  ROTATE_0 = 0,
  ROTATE_90 = 90,
  ROTATE_180 = 180,
  ROTATE_270 = 270,
}

/**
 * PDF 阅读设置
 */
export interface PDFViewerSettings {
  viewMode: PDFViewMode
  zoomMode: PDFZoomMode
  zoomLevel: number // 自定义缩放级别 (0.1 - 5.0)
  rotation: PDFRotation
  showThumbnails: boolean
  showOutline: boolean
  enableTextSelection: boolean
  enableHandTool: boolean
  scrollMode: 'vertical' | 'horizontal'
  spreadMode: 'none' | 'odd' | 'even'
  darkMode: boolean
  invertColors: boolean
}

/**
 * PDF 页面信息
 */
export interface PDFPageInfo {
  pageNumber: number
  width: number
  height: number
  rotation: number
  scale: number
  viewport: {
    width: number
    height: number
  }
}

/**
 * PDF 目录项
 */
export interface PDFOutlineItem {
  title: string
  pageNumber: number
  level: number
  children?: PDFOutlineItem[]
  expanded?: boolean
}

/**
 * PDF 阅读进度
 */
export interface PDFReadingProgress {
  currentPage: number
  totalPages: number
  scrollPosition: number // 滚动位置百分比
  lastViewedPage: number
  viewedPages: number[] // 已查看的页面
  progress: number // 阅读进度百分比
}

/**
 * PDF 搜索匹配
 */
export interface PDFSearchMatch {
  pageNumber: number
  matchIndex: number
  text: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  context: string // 匹配文本的上下文
}

/**
 * PDF 搜索结果
 */
export interface PDFSearchResult {
  query: string
  totalMatches: number
  matches: PDFSearchMatch[]
  currentPageIndex: number
}

/**
 * PDF 注释标记
 */
export interface PDFAnnotationMark {
  id: string
  type: 'highlight' | 'underline' | 'strike' | 'squiggly' | 'rect' | 'circle' | 'text' | 'ink'
  pageNumber: number
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  rects?: number[][] // 多边形区域（用于不规则形状）
  color: string
  opacity: number
  contents?: string // 注释内容
  author?: string
  createdAt: number
  updatedAt: number
}

/**
 * PDF 书签
 */
export interface PDFBookmark {
  id: string
  title: string
  pageNumber: number
  position?: {
    x: number
    y: number
  }
  color?: string
  createdAt: number
}

/**
 * PDF 阅读历史
 */
export interface PDFReadingHistory {
  timestamp: number
  pageNumber: number
  action: 'navigate' | 'search' | 'annotation' | 'bookmark'
  details?: any
}

/**
 * 默认 PDF 阅读设置
 */
export const DEFAULT_PDF_SETTINGS: PDFViewerSettings = {
  viewMode: PDFViewMode.SINGLE,
  zoomMode: PDFZoomMode.FIT_WIDTH,
  zoomLevel: 1.0,
  rotation: PDFRotation.ROTATE_0,
  showThumbnails: false,
  showOutline: true,
  enableTextSelection: true,
  enableHandTool: false,
  scrollMode: 'vertical',
  spreadMode: 'none',
  darkMode: false,
  invertColors: false,
}

/**
 * 预设缩放级别
 */
export const PRESET_ZOOM_LEVELS = [
  0.25,
  0.33,
  0.5,
  0.67,
  0.75,
  0.8,
  0.9,
  1.0,
  1.1,
  1.25,
  1.5,
  1.75,
  2.0,
  2.5,
  3.0,
  4.0,
  5.0,
]

/**
 * 获取下一级缩放级别
 */
export function getNextZoomLevel(current: number, direction: 'in' | 'out'): number {
  const index = PRESET_ZOOM_LEVELS.findIndex((level) => level >= current)
  if (index === -1) {
    return direction === 'in' ? 5.0 : PRESET_ZOOM_LEVELS[0]
  }

  if (direction === 'in') {
    return PRESET_ZOOM_LEVELS[Math.min(index + 1, PRESET_ZOOM_LEVELS.length - 1)]
  } else {
    return PRESET_ZOOM_LEVELS[Math.max(index - 1, 0)]
  }
}

/**
 * 计算双页模式的起始页
 */
export function getDoublePageStartPage(currentPage: number, spreadMode: 'none' | 'odd' | 'even'): number {
  if (spreadMode === 'none') {
    return currentPage
  }

  // 双页模式下，确保左侧是奇数页或偶数页
  if (spreadMode === 'odd') {
    return currentPage % 2 === 1 ? currentPage : currentPage - 1
  } else {
    return currentPage % 2 === 0 ? currentPage : currentPage - 1
  }
}

/**
 * 计算阅读进度百分比
 */
export function calculateReadingProgress(currentPage: number, totalPages: number, viewedPages: number[]): number {
  if (totalPages === 0) return 0

  // 基于已查看页面的进度
  const uniqueViewedPages = new Set(viewedPages)
  return (uniqueViewedPages.size / totalPages) * 100
}

/**
 * 格式化页码显示
 */
export function formatPageNumber(page: number, total: number): string {
  return `${page} / ${total}`
}

/**
 * 验证页码
 */
export function validatePageNumber(page: number | string, total: number): number {
  const num = typeof page === 'string' ? Number.parseInt(page, 10) : page
  if (isNaN(num)) return 1
  return Math.max(1, Math.min(total, num))
}

export default PDFViewMode
