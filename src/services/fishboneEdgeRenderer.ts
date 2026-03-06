/**
 * 鱼骨图连线渲染器
 * 支持鱼骨风格的折线连线（带角度）
 */

import type {
  FreeMindMapEdge,
  FreeMindMapNode,
} from '@/types/mindmapFree'

/** 鱼骨图连线配置 */
export interface FishboneEdgeConfig {
  /** 线条颜色 */
  stroke: string
  /** 线条宽度 */
  strokeWidth: number
  /** 是否显示箭头 */
  hasArrow: boolean
  /** 箭头颜色 */
  arrowColor: string
  /** 主骨线条颜色 */
  mainBoneStroke: string
  /** 主骨线条宽度 */
  mainBoneStrokeWidth: number
}

/** 默认配置 */
const DEFAULT_CONFIG: FishboneEdgeConfig = {
  stroke: '#999',
  strokeWidth: 2,
  hasArrow: true,
  arrowColor: '#999',
  mainBoneStroke: '#666',
  mainBoneStrokeWidth: 3,
}

/**
 * 生成 SVG 路径数据（鱼骨风格折线）
 * @param sourceNode 源节点
 * @param targetNode 目标节点
 * @param config 配置选项
 * @returns SVG path 数据
 */
export function generateFishboneEdgePath(
  sourceNode: FreeMindMapNode,
  targetNode: FreeMindMapNode,
  _config: Partial<FishboneEdgeConfig> = {},
): string {

  const source = sourceNode.position
  const target = targetNode.position

  // 计算源节点中心
  const sourceWidth = Number.parseInt(sourceNode.style?.width as string) || 120
  const sourceHeight = Number.parseInt(sourceNode.style?.height as string) || 40
  const sourceCenterX = source.x + sourceWidth / 2
  const sourceCenterY = source.y + sourceHeight / 2

  // 计算目标节点中心
  const targetWidth = Number.parseInt(targetNode.style?.width as string) || 120
  const targetHeight = Number.parseInt(targetNode.style?.height as string) || 40
  const targetCenterX = target.x + targetWidth / 2
  const targetCenterY = target.y + targetHeight / 2

  // 鱼骨风格：先水平再斜向
  const midX = (sourceCenterX + targetCenterX) / 2

  // 创建折线路径
  const path = `M ${sourceCenterX} ${sourceCenterY} L ${midX} ${sourceCenterY} L ${targetCenterX} ${targetCenterY}`

  return path
}

/**
 * 生成 SVG path 元素
 * @param _edge 连线对象
 * @param nodes 所有节点（用于查找节点位置）
 * @param config 配置选项
 * @returns SVG path 元素字符串
 */
export function renderFishboneEdge(
  edge: FreeMindMapEdge,
  nodes: FreeMindMapNode[],
  config: Partial<FishboneEdgeConfig> = {},
): string {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  const sourceNode = nodes.find((n) => n.id === edge.source)
  const targetNode = nodes.find((n) => n.id === edge.target)

  if (!sourceNode || !targetNode) {
    return ''
  }

  const pathData = generateFishboneEdgePath(sourceNode, targetNode, finalConfig)

  // 确定线条样式
  const isMainBone = sourceNode.data.level === 'title' && targetNode.data.level === 'h1'
  const stroke = isMainBone ? finalConfig.mainBoneStroke : finalConfig.stroke
  const strokeWidth = isMainBone ? finalConfig.mainBoneStrokeWidth : finalConfig.strokeWidth

  // 生成 marker-end 引用
  const markerEnd = finalConfig.hasArrow ? `marker-end="url(#arrowhead-${stroke})"` : ''

  return `
    <path 
      d="${pathData}" 
      stroke="${stroke}" 
      stroke-width="${strokeWidth}" 
      fill="none" 
      ${markerEnd}
      class="fishbone-edge"
    />
  `
}

/**
 * 生成 SVG 箭头标记定义
 * @param color 箭头颜色
 * @param id 标记 ID
 * @returns SVG marker 定义
 */
export function generateArrowMarker(color: string, id: string = 'arrowhead'): string {
  return `
    <marker 
      id="${id}-${color.replace('#', '')}" 
      markerWidth="10" 
      markerHeight="10" 
      refX="9" 
      refY="3" 
      orient="auto" 
      markerUnits="strokeWidth"
    >
      <path 
        d="M0,0 L0,6 L9,3 z" 
        fill="${color}" 
      />
    </marker>
  `
}

/**
 * 获取鱼骨图边缘样式
 * @param isMainBone 是否为主骨
 * @returns 连线样式对象
 */
export function getFishboneEdgeStyle(
  isMainBone: boolean = false,
): Record<string, string | number> {
  const config = { ...DEFAULT_CONFIG }

  return {
    stroke: isMainBone ? config.mainBoneStroke : config.stroke,
    strokeWidth: isMainBone ? config.mainBoneStrokeWidth : config.strokeWidth,
    fill: 'none',
    markerEnd: config.hasArrow ? `url(#arrowhead-${isMainBone ? config.mainBoneStroke : config.stroke})` : 'none',
  }
}

/**
 * 计算鱼骨图控制点（用于贝塞尔曲线）
 * @param sourceNode 源节点
 * @param targetNode 目标节点
 * @param branchAngle 分支角度
 * @returns 控制点坐标
 */
export function calculateFishboneControlPoints(
  sourceNode: FreeMindMapNode,
  targetNode: FreeMindMapNode,
  branchAngle: number = 45,
): { cp1: { x: number, y: number }, cp2: { x: number, y: number } } {
  const source = sourceNode.position
  const target = targetNode.position

  const sourceWidth = Number.parseInt(sourceNode.style?.width as string) || 120
  const sourceHeight = Number.parseInt(sourceNode.style?.height as string) || 40
  const sourceCenterX = source.x + sourceWidth / 2
  const sourceCenterY = source.y + sourceHeight / 2

  const targetWidth = Number.parseInt(targetNode.style?.width as string) || 120
  const targetHeight = Number.parseInt(targetNode.style?.height as string) || 40
  const targetCenterX = target.x + targetWidth / 2
  const targetCenterY = target.y + targetHeight / 2

  // 计算角度（弧度）
  const angleRad = branchAngle * Math.PI / 180

  // 控制点 1：从源节点水平延伸
  const cp1Distance = Math.abs(targetCenterX - sourceCenterX) * 0.5
  const cp1 = {
    x: sourceCenterX + cp1Distance,
    y: sourceCenterY,
  }

  // 控制点 2：从目标节点沿分支角度反向延伸
  const cp2Distance = Math.abs(targetCenterX - sourceCenterX) * 0.5
  const cp2 = {
    x: targetCenterX - cp2Distance * Math.cos(angleRad),
    y: targetCenterY - cp2Distance * Math.sin(angleRad),
  }

  return {
    cp1,
    cp2,
  }
}

/**
 * 生成平滑的鱼骨曲线
 * @param sourceNode 源节点
 * @param targetNode 目标节点
 * @param branchAngle 分支角度
 * @returns SVG 路径数据
 */
export function generateFishboneCurve(
  sourceNode: FreeMindMapNode,
  targetNode: FreeMindMapNode,
  branchAngle: number = 45,
): string {
  const sourceWidth = Number.parseInt(sourceNode.style?.width as string) || 120
  const sourceHeight = Number.parseInt(sourceNode.style?.height as string) || 40
  const sourceCenterX = sourceNode.position.x + sourceWidth / 2
  const sourceCenterY = sourceNode.position.y + sourceHeight / 2

  const targetWidth = Number.parseInt(targetNode.style?.width as string) || 120
  const targetHeight = Number.parseInt(targetNode.style?.height as string) || 40
  const targetCenterX = targetNode.position.x + targetWidth / 2
  const targetCenterY = targetNode.position.y + targetHeight / 2

  const {
    cp1,
    cp2,
  } = calculateFishboneControlPoints(sourceNode, targetNode, branchAngle)

  // 使用三次贝塞尔曲线
  return `M ${sourceCenterX} ${sourceCenterY} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${targetCenterX} ${targetCenterY}`
}

/**
 * 为自由画布组件提供鱼骨图边缘渲染配置
 * @param config 配置选项
 * @returns Vue Flow edge 配置
 */
export function getFishboneEdgeOptions(
  config: Partial<FishboneEdgeConfig> = {},
): Record<string, unknown> {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  return {
    type: 'fishbone',
    style: {
      stroke: finalConfig.stroke,
      strokeWidth: finalConfig.strokeWidth,
      strokeDasharray: '5,5',
    },
    data: {
      hasArrow: finalConfig.hasArrow,
      arrowColor: finalConfig.arrowColor,
    },
  }
}
