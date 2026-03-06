// src/services/pdfAnnotationTypeRenderer.ts
/**
 * PDF 标注类型渲染器
 * 负责在 PDF 上渲染不同类型的标注（高亮、下划线、删除线、波浪线）
 * 使用 SVG  overlay 方式渲染
 */

import type {
  AnnotationType,
  PDFAnnotation,
} from '../types/annotation'

/**
 * 标注类型配置
 */
export interface AnnotationTypeConfig {
  type: AnnotationType
  lineWidth: number // 线宽（px）
  color: string // 颜色
  opacity: number // 透明度
}

/**
 * 标注类型默认配置
 */
const ANNOTATION_TYPE_CONFIGS: Record<AnnotationType, AnnotationTypeConfig> = {
  highlight: {
    type: 'highlight',
    lineWidth: 0, // 高亮不使用线条
    color: '#fef08a',
    opacity: 0.5,
  },
  underline: {
    type: 'underline',
    lineWidth: 2,
    color: '#ef4444',
    opacity: 0.8,
  },
  strikethrough: {
    type: 'strikethrough',
    lineWidth: 2,
    color: '#ef4444',
    opacity: 0.8,
  },
  wavy: {
    type: 'wavy',
    lineWidth: 2,
    color: '#3b82f6',
    opacity: 0.8,
  },
  text: {
    type: 'text',
    lineWidth: 0,
    color: '#fbbf24',
    opacity: 0,
  },
  image: {
    type: 'image',
    lineWidth: 2,
    color: '#8b5cf6',
    opacity: 0.8,
  },
}

/**
 * 颜色配置（与高亮颜色选择器一致）
 */
const COLOR_CONFIGS: Record<string, { bg: string, border: string, line: string }> = {
  red: {
    bg: 'rgba(255, 107, 107, 0.35)',
    border: '#ff6b6b',
    line: '#ef4444',
  },
  yellow: {
    bg: 'rgba(255, 217, 61, 0.35)',
    border: '#ffd93d',
    line: '#eab308',
  },
  green: {
    bg: 'rgba(107, 203, 119, 0.35)',
    border: '#6bcb77',
    line: '#22c55e',
  },
  blue: {
    bg: 'rgba(77, 150, 255, 0.35)',
    border: '#4d96ff',
    line: '#3b82f6',
  },
  purple: {
    bg: 'rgba(155, 89, 182, 0.35)',
    border: '#9b59b6',
    line: '#a855f7',
  },
  orange: {
    bg: 'rgba(254, 202, 87, 0.35)',
    border: '#feca57',
    line: '#f97316',
  },
}

/**
 * 渲染标注到 SVG 层
 * @param annotation 标注数据
 * @param svgElement SVG 容器元素
 * @param scale PDF 缩放比例
 * @param cssPageHeight CSS 页面高度
 */
export function renderAnnotationToSvg(
  annotation: PDFAnnotation,
  svgElement: SVGSVGElement,
  scale: number,
  cssPageHeight: number,
): void {
  const colorConfig = COLOR_CONFIGS[annotation.color] || COLOR_CONFIGS.yellow

  // 清除旧的渲染内容
  svgElement.innerHTML = ''
  svgElement.style.position = 'absolute'
  svgElement.style.left = '0'
  svgElement.style.top = '0'
  svgElement.style.width = '100%'
  svgElement.style.height = '100%'
  svgElement.style.pointerEvents = 'none'
  svgElement.style.overflow = 'visible'

  const [pdfX1, pdfY1, pdfX2, pdfY2] = annotation.rect

  // PDF 坐标转 CSS 坐标
  const cssX = pdfX1 * scale
  const cssY = cssPageHeight - pdfY2 * scale
  const cssWidth = (pdfX2 - pdfX1) * scale
  const cssHeight = (pdfY2 - pdfY1) * scale

  // 根据标注类型选择渲染方式
  switch (annotation.type) {
    case 'highlight':
      renderHighlight(annotation, svgElement, cssX, cssY, cssWidth, cssHeight, colorConfig)
      break
    case 'underline':
      renderUnderline(annotation, svgElement, cssX, cssY, cssWidth, cssHeight, cssPageHeight, scale, colorConfig)
      break
    case 'strikethrough':
      renderStrikethrough(annotation, svgElement, cssX, cssY, cssWidth, cssHeight, cssPageHeight, scale, colorConfig)
      break
    case 'wavy':
      renderWavy(annotation, svgElement, cssX, cssY, cssWidth, cssHeight, cssPageHeight, scale, colorConfig)
      break
    case 'image':
      renderImageAnnotation(annotation, svgElement, cssX, cssY, cssWidth, cssHeight, colorConfig)
      break
    case 'text':
      // 文本批注不需要在 PDF 上渲染视觉元素
      break
  }
}

/**
 * 渲染高亮标注
 */
function renderHighlight(
  _annotation: PDFAnnotation,
  svgElement: SVGSVGElement,
  x: number,
  y: number,
  width: number,
  height: number,
  colorConfig: { bg: string, border: string, line: string },
): void {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', x.toString())
  rect.setAttribute('y', y.toString())
  rect.setAttribute('width', width.toString())
  rect.setAttribute('height', Math.max(height, 14).toString())
  rect.setAttribute('fill', colorConfig.bg)
  rect.setAttribute('stroke', colorConfig.border)
  rect.setAttribute('stroke-width', '2')
  rect.setAttribute('rx', '3')
  rect.style.pointerEvents = 'auto'

  svgElement.appendChild(rect)
}

/**
 * 渲染下划线标注
 */
function renderUnderline(
  _annotation: PDFAnnotation,
  svgElement: SVGSVGElement,
  x: number,
  _y: number,
  width: number,
  _height: number,
  cssPageHeight: number,
  scale: number,
  colorConfig: { bg: string, border: string, line: string },
): void {
  const config = ANNOTATION_TYPE_CONFIGS.underline

  // 下划线位置：文本底部
  const lineY = cssPageHeight - _annotation.rect[1] * scale
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  line.setAttribute('x1', x.toString())
  line.setAttribute('y1', lineY.toString())
  line.setAttribute('x2', (x + width).toString())
  line.setAttribute('y2', lineY.toString())
  line.setAttribute('stroke', colorConfig.line || config.color)
  line.setAttribute('stroke-width', config.lineWidth.toString())
  line.setAttribute('stroke-opacity', config.opacity.toString())
  line.setAttribute('stroke-linecap', 'round')
  line.style.pointerEvents = 'auto'

  svgElement.appendChild(line)
}

/**
 * 渲染删除线标注
 */
function renderStrikethrough(
  annotation: PDFAnnotation,
  svgElement: SVGSVGElement,
  x: number,
  _y: number,
  width: number,
  height: number,
  cssPageHeight: number,
  scale: number,
  colorConfig: { bg: string, border: string, line: string },
): void {
  const config = ANNOTATION_TYPE_CONFIGS.strikethrough

  // 删除线位置：文本中间
  const lineY = cssPageHeight - (annotation.rect[1] + height / 2 / scale) * scale
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  line.setAttribute('x1', x.toString())
  line.setAttribute('y1', lineY.toString())
  line.setAttribute('x2', (x + width).toString())
  line.setAttribute('y2', lineY.toString())
  line.setAttribute('stroke', colorConfig.line || config.color)
  line.setAttribute('stroke-width', config.lineWidth.toString())
  line.setAttribute('stroke-opacity', config.opacity.toString())
  line.setAttribute('stroke-linecap', 'round')
  line.style.pointerEvents = 'auto'

  svgElement.appendChild(line)
}

/**
 * 渲染波浪线标注
 */
function renderWavy(
  annotation: PDFAnnotation,
  svgElement: SVGSVGElement,
  x: number,
  _y: number,
  width: number,
  _height: number,
  cssPageHeight: number,
  scale: number,
  colorConfig: { bg: string, border: string, line: string },
): void {
  const config = ANNOTATION_TYPE_CONFIGS.wavy

  // 波浪线位置：文本底部
  const lineY = cssPageHeight - annotation.rect[1] * scale

  // 创建波浪线路径
  const waveAmplitude = 3 // 波浪幅度
  const waveFrequency = 0.2 // 波浪频率
  const segments = 20 // 分段数
  const segmentWidth = width / segments

  let pathData = `M ${x} ${lineY}`

  for (let i = 1; i <= segments; i++) {
    const waveX = x + i * segmentWidth
    const waveY = lineY + Math.sin(i * waveFrequency * Math.PI * 2) * waveAmplitude
    pathData += ` L ${waveX} ${waveY}`
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', pathData)
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', colorConfig.line || config.color)
  path.setAttribute('stroke-width', config.lineWidth.toString())
  path.setAttribute('stroke-opacity', config.opacity.toString())
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  path.style.pointerEvents = 'auto'

  svgElement.appendChild(path)
}

/**
 * 渲染图片标注框
 */
function renderImageAnnotation(
  _annotation: PDFAnnotation,
  svgElement: SVGSVGElement,
  x: number,
  y: number,
  width: number,
  height: number,
  _colorConfig: { bg: string, border: string, line: string },
): void {
  const config = ANNOTATION_TYPE_CONFIGS.image

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', x.toString())
  rect.setAttribute('y', y.toString())
  rect.setAttribute('width', width.toString())
  rect.setAttribute('height', Math.max(height, 14).toString())
  rect.setAttribute('fill', 'transparent')
  rect.setAttribute('stroke', config.color)
  rect.setAttribute('stroke-width', config.lineWidth.toString())
  rect.setAttribute('stroke-dasharray', '4,2') // 虚线边框
  rect.setAttribute('rx', '3')
  rect.style.pointerEvents = 'auto'

  svgElement.appendChild(rect)
}

/**
 * 批量渲染标注到 SVG 层
 */
export function renderAnnotationsToSvg(
  annotations: PDFAnnotation[],
  svgElement: SVGSVGElement,
  scale: number,
  cssPageHeight: number,
): void {
  // 清除所有内容
  svgElement.innerHTML = ''

  // 为每个标注创建独立的 SVG 子元素
  annotations.forEach((annotation) => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.dataset.annotationId = annotation.id
    group.style.pointerEvents = 'auto'

    // 临时创建 SVG 容器来渲染单个标注
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    renderAnnotationToSvg(annotation, tempSvg, scale, cssPageHeight)

    // 将渲染内容移动到 group 中
    while (tempSvg.firstChild) {
      group.appendChild(tempSvg.firstChild)
    }

    svgElement.appendChild(group)
  })
}

export default {
  renderAnnotationToSvg,
  renderAnnotationsToSvg,
  ANNOTATION_TYPE_CONFIGS,
  COLOR_CONFIGS,
}
