/**
 * 无限网格渲染工具
 * 提供动态网格渲染功能，仅渲染可见区域的网格
 * @fileoverview 优化大画布网格渲染性能
 */

/**
 * 视口接口
 */
export interface Viewport {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 网格线接口
 */
export interface GridLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * 网格配置
 */
export interface GridConfig {
  /** 网格大小（像素） */
  gridSize: number
  /** 网格线颜色 */
  color: string
  /** 网格线宽度 */
  lineWidth: number
  /** 网格线透明度 */
  opacity: number
  /** 是否绘制主网格（每 N 个小网格的主线） */
  majorGridInterval: number
  /** 主网格线颜色 */
  majorGridColor: string
  /** 主网格线宽度 */
  majorGridLineWidth: number
}

/**
 * 网格渲染结果
 */
export interface GridRenderResult {
  /** 垂直线列表 */
  verticalLines: GridLine[]
  /** 水平线列表 */
  horizontalLines: GridLine[]
  /** 总线条数 */
  totalLines: number
}

/**
 * 默认网格配置
 */
const DEFAULT_GRID_CONFIG: GridConfig = {
  gridSize: 20,
  color: '#d0d0d0',
  lineWidth: 0.5,
  opacity: 0.3,
  majorGridInterval: 5,
  majorGridColor: '#a0a0a0',
  majorGridLineWidth: 0.8
}

/**
 * 计算可见区域的网格范围
 * @param viewport 视口
 * @param gridSize 网格大小
 * @returns 网格范围
 */
export function calculateGridRange(
  viewport: Viewport,
  gridSize: number
): {
  startCol: number
  endCol: number
  startRow: number
  endRow: number
} {
  const startCol = Math.floor(viewport.x / gridSize) - 1
  const endCol = Math.ceil((viewport.x + viewport.width) / gridSize) + 1
  const startRow = Math.floor(viewport.y / gridSize) - 1
  const endRow = Math.ceil((viewport.y + viewport.height) / gridSize) + 1

  return {
    startCol,
    endCol,
    startRow,
    endRow
  }
}

/**
 * 渲染无限网格
 * @param viewport 视口
 * @param config 网格配置
 * @returns 网格渲染结果
 */
export function renderInfiniteGrid(
  viewport: Viewport,
  config: Partial<GridConfig> = {}
): GridRenderResult {
  const mergedConfig: GridConfig = {
    ...DEFAULT_GRID_CONFIG,
    ...config
  }

  const { gridSize } = mergedConfig
  const { startCol, endCol, startRow, endRow } = calculateGridRange(viewport, gridSize)

  const verticalLines: GridLine[] = []
  const horizontalLines: GridLine[] = []

  // 生成垂直线
  for (let col = startCol; col <= endCol; col++) {
    const x = col * gridSize
    verticalLines.push({
      x1: x,
      y1: viewport.y,
      x2: x,
      y2: viewport.y + viewport.height
    })
  }

  // 生成水平线
  for (let row = startRow; row <= endRow; row++) {
    const y = row * gridSize
    horizontalLines.push({
      x1: viewport.x,
      y1: y,
      x2: viewport.x + viewport.width,
      y2: y
    })
  }

  return {
    verticalLines,
    horizontalLines,
    totalLines: verticalLines.length + horizontalLines.length
  }
}

/**
 * 在 Canvas 上绘制网格
 * @param ctx Canvas 上下文
 * @param viewport 视口
 * @param config 网格配置
 */
export function drawGridOnCanvas(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  config: Partial<GridConfig> = {}
): void {
  const mergedConfig: GridConfig = {
    ...DEFAULT_GRID_CONFIG,
    ...config
  }

  const { gridSize } = mergedConfig
  const { startCol, endCol, startRow, endRow } = calculateGridRange(viewport, gridSize)

  // 绘制垂直线
  for (let col = startCol; col <= endCol; col++) {
    const x = col * gridSize
    const isMajor = col % mergedConfig.majorGridInterval === 0

    ctx.beginPath()
    ctx.moveTo(x, viewport.y)
    ctx.lineTo(x, viewport.y + viewport.height)

    ctx.strokeStyle = isMajor ? mergedConfig.majorGridColor : mergedConfig.color
    ctx.lineWidth = isMajor ? mergedConfig.majorGridLineWidth : mergedConfig.lineWidth
    ctx.globalAlpha = isMajor ? mergedConfig.opacity * 1.5 : mergedConfig.opacity

    ctx.stroke()
  }

  // 绘制水平线
  for (let row = startRow; row <= endRow; row++) {
    const y = row * gridSize
    const isMajor = row % mergedConfig.majorGridInterval === 0

    ctx.beginPath()
    ctx.moveTo(viewport.x, y)
    ctx.lineTo(viewport.x + viewport.width, y)

    ctx.strokeStyle = isMajor ? mergedConfig.majorGridColor : mergedConfig.color
    ctx.lineWidth = isMajor ? mergedConfig.majorGridLineWidth : mergedConfig.lineWidth
    ctx.globalAlpha = isMajor ? mergedConfig.opacity * 1.5 : mergedConfig.opacity

    ctx.stroke()
  }

  // 重置透明度
  ctx.globalAlpha = 1.0
}

/**
 * 生成 SVG 网格图案
 * @param config 网格配置
 * @returns SVG pattern 字符串
 */
export function generateGridPatternSVG(
  config: Partial<GridConfig> = {}
): string {
  const mergedConfig: GridConfig = {
    ...DEFAULT_GRID_CONFIG,
    ...config
  }

  const { gridSize, color, lineWidth, opacity } = mergedConfig

  return `
    <svg width="${gridSize}" height="${gridSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="grid"
          width="${gridSize}"
          height="${gridSize}"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M ${gridSize} 0 L 0 0 0 ${gridSize}"
            fill="none"
            stroke="${color}"
            stroke-width="${lineWidth}"
            stroke-opacity="${opacity}"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  `.trim()
}

/**
 * 生成 CSS 网格背景
 * @param config 网格配置
 * @returns CSS background 字符串
 */
export function generateGridCSS(
  config: Partial<GridConfig> = {}
): string {
  const mergedConfig: GridConfig = {
    ...DEFAULT_GRID_CONFIG,
    ...config
  }

  const { color, lineWidth, opacity } = mergedConfig

  // 使用线性渐变创建网格
  const colorWithAlpha = hexToRgba(color, opacity)

  return `
    linear-gradient(90deg, ${colorWithAlpha} ${lineWidth}px, transparent ${lineWidth}px),
    linear-gradient(0deg, ${colorWithAlpha} ${lineWidth}px, transparent ${lineWidth}px)
  `.trim()
}

/**
 * 计算网格统计信息
 * @param viewport 视口
 * @param gridSize 网格大小
 * @returns 统计信息
 */
export function getGridStats(
  viewport: Viewport,
  gridSize: number
): {
  visibleCols: number
  visibleRows: number
  totalLines: number
} {
  const { startCol, endCol, startRow, endRow } = calculateGridRange(viewport, gridSize)

  const visibleCols = endCol - startCol + 1
  const visibleRows = endRow - startRow + 1
  const totalLines = visibleCols + visibleRows

  return {
    visibleCols,
    visibleRows,
    totalLines
  }
}

/**
 * 辅助函数：HEX 转 RGBA
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
