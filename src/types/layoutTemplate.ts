/**
 * 布局模板类型定义
 * @fileoverview 定义布局模板的数据结构和预设模板
 */

/**
 * 布局类型
 */
export type LayoutType = 'free' | 'tree' | 'fishbone' | 'timeline' | 'concept'

/**
 * 树状布局配置
 */
export interface TreeConfig {
  /** 方向：LR(左到右), RL(右到左), TB(上到下), BT(下到上) */
  orientation: 'LR' | 'RL' | 'TB' | 'BT'
  /** 层级间距 */
  levelSpacing: number
}

/**
 * 鱼骨图配置
 */
export interface FishboneConfig {
  /** 主骨长度 */
  mainBoneLength: number
  /** 分支角度 */
  branchAngle: number
  /** 分支间距 */
  branchSpacing: number
}

/**
 * 时间轴配置
 */
export interface TimelineConfig {
  /** 方向 */
  orientation: 'horizontal' | 'vertical'
  /** 时间刻度 */
  timeScale: 'auto' | 'day' | 'week' | 'month' | 'year'
}

/**
 * 概念图配置
 */
export interface ConceptMapConfig {
  /** 排斥力 */
  repulsion: number
  /** 弹簧长度 */
  springLength: number
  /** 弹簧强度 */
  springStrength: number
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  /** 通用配置：节点间距 */
  nodeSpacing?: number
  /** 通用配置：方向 */
  direction?: 'horizontal' | 'vertical'

  /** 树状布局配置 */
  treeConfig?: TreeConfig

  /** 鱼骨图配置 */
  fishboneConfig?: FishboneConfig

  /** 时间轴配置 */
  timelineConfig?: TimelineConfig

  /** 概念图配置 */
  conceptMapConfig?: ConceptMapConfig
}

/**
 * 布局模板
 */
export interface LayoutTemplate {
  /** 模板 ID */
  id: string
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description: string
  /** 布局类型 */
  layoutType: LayoutType
  /** 图标 */
  icon: string
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
  /** 是否为预设模板 */
  isPreset: boolean
  /** 布局配置 */
  config: LayoutConfig
}

/**
 * 预设模板
 */
export const PRESET_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'preset-tree-lr',
    name: '树状布局（从左到右）',
    description: '适合层级结构展示',
    layoutType: 'tree',
    icon: 'icon-tree',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPreset: true,
    config: {
      nodeSpacing: 100,
      direction: 'horizontal',
      treeConfig: {
        orientation: 'LR',
        levelSpacing: 150,
      },
    },
  },
  {
    id: 'preset-fishbone-standard',
    name: '标准鱼骨图',
    description: '适合因果分析',
    layoutType: 'fishbone',
    icon: 'icon-fishbone',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPreset: true,
    config: {
      fishboneConfig: {
        mainBoneLength: 400,
        branchAngle: 45,
        branchSpacing: 60,
      },
    },
  },
  {
    id: 'preset-timeline-horizontal',
    name: '水平时间轴',
    description: '适合时间线展示',
    layoutType: 'timeline',
    icon: 'icon-timeline',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPreset: true,
    config: {
      timelineConfig: {
        orientation: 'horizontal',
        timeScale: 'auto',
      },
    },
  },
  {
    id: 'preset-conceptmap-default',
    name: '概念图（默认）',
    description: '适合关联分析',
    layoutType: 'concept',
    icon: 'icon-concept',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPreset: true,
    config: {
      conceptMapConfig: {
        repulsion: 500,
        springLength: 100,
        springStrength: 0.1,
      },
    },
  },
]

/**
 * 根据布局类型获取图标
 */
export function getLayoutIcon(layoutType: LayoutType): string {
  const iconMap: Record<LayoutType, string> = {
    free: 'icon-free',
    tree: 'icon-tree',
    fishbone: 'icon-fishbone',
    timeline: 'icon-timeline',
    concept: 'icon-concept',
  }
  return iconMap[layoutType]
}
