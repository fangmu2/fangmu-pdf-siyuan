/**
 * 多画布与图层系统类型定义
 * @fileoverview 定义画布、图层相关的数据结构和接口
 */

import type {
  FreeMindMapEdge,
  FreeMindMapLayout,
  FreeMindMapNode,
} from './mindmapFree'

/**
 * 图层类型
 */
export type LayerType = 'background' | 'nodes' | 'handwriting' | 'annotations' | 'custom'

/**
 * 图层配置
 */
export interface LayerConfig {
  /** 图层 ID */
  id: string
  /** 图层名称 */
  name: string
  /** 图层类型 */
  type: LayerType
  /** 是否可见 */
  visible: boolean
  /** 是否锁定 */
  locked: boolean
  /** 图层顺序（数字越小越靠下） */
  order: number
  /** 图层不透明度 */
  opacity: number
  /** 图层颜色标识 */
  color?: string
  /** 子图层列表 */
  children?: LayerConfig[]
}

/**
 * 画布配置
 */
export interface CanvasConfig {
  /** 画布 ID */
  id: string
  /** 画布名称 */
  name: string
  /** 所属学习集 ID */
  studySetId: string
  /** 关联的 PDF 文档 ID */
  pdfDocId?: string
  /** 布局模式 */
  layout: FreeMindMapLayout
  /** 节点列表 */
  nodes: FreeMindMapNode[]
  /** 连线列表 */
  edges: FreeMindMapEdge[]
  /** 图层配置列表 */
  layers: LayerConfig[]
  /** 视图状态 */
  viewport: {
    zoom: number
    x: number
    y: number
  }
  /** 是否显示网格 */
  showGrid: boolean
  /** 背景颜色 */
  backgroundColor?: string
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

/**
 * 画布引用
 */
export interface CanvasReference {
  /** 引用 ID */
  id: string
  /** 源画布 ID */
  sourceCanvasId: string
  /** 目标画布 ID */
  targetCanvasId: string
  /** 引用的节点 ID 列表 */
  nodeIds: string[]
  /** 引用类型 */
  referenceType: 'node' | 'layer' | 'all'
  /** 创建时间 */
  createdAt: number
}

/**
 * 跨画布节点关联
 */
export interface CrossCanvasNodeLink {
  /** 关联 ID */
  id: string
  /** 源节点信息 */
  source: {
    canvasId: string
    nodeId: string
  }
  /** 目标节点信息 */
  target: {
    canvasId: string
    nodeId: string
  }
  /** 关联类型 */
  linkType: 'reference' | 'relation' | 'seeAlso'
  /** 关联说明 */
  description?: string
  /** 创建时间 */
  createdAt: number
}

/**
 * 画布创建参数
 */
export interface CreateCanvasParams {
  /** 画布名称 */
  name: string
  /** 所属学习集 ID */
  studySetId: string
  /** 关联的 PDF 文档 ID */
  pdfDocId?: string
  /** 初始布局 */
  layout?: FreeMindMapLayout
  /** 背景颜色 */
  backgroundColor?: string
}

/**
 * 画布更新参数
 */
export interface UpdateCanvasParams {
  /** 画布 ID */
  id: string
  /** 新名称 */
  name?: string
  /** 新布局 */
  layout?: FreeMindMapLayout
  /** 节点列表 */
  nodes?: FreeMindMapNode[]
  /** 连线列表 */
  edges?: FreeMindMapEdge[]
  /** 视图状态 */
  viewport?: {
    zoom: number
    x: number
    y: number
  }
  /** 图层配置 */
  layers?: LayerConfig[]
}

/**
 * 图层更新参数
 */
export interface UpdateLayerParams {
  /** 图层 ID */
  id: string
  /** 新名称 */
  name?: string
  /** 是否可见 */
  visible?: boolean
  /** 是否锁定 */
  locked?: boolean
  /** 图层顺序 */
  order?: number
  /** 不透明度 */
  opacity?: number
}

/**
 * 画布统计信息
 */
export interface CanvasStats {
  /** 画布 ID */
  canvasId: string
  /** 节点数量 */
  nodeCount: number
  /** 连线数量 */
  edgeCount: number
  /** 图层数量 */
  layerCount: number
  /** 可见图层数量 */
  visibleLayerCount: number
  /** 锁定图层数量 */
  lockedLayerCount: number
  /** 最后更新时间 */
  lastUpdatedAt: number
}

/**
 * 画布列表项
 */
export interface CanvasListItem {
  /** 画布 ID */
  id: string
  /** 画布名称 */
  name: string
  /** 所属学习集 ID */
  studySetId: string
  /** 关联的 PDF 路径 */
  pdfPath?: string
  /** 节点数量 */
  nodeCount: number
  /** 最后更新时间 */
  lastUpdatedAt: number
  /** 是否当前激活画布 */
  isActive: boolean
}

/**
 * 画布切换事件
 */
export interface CanvasSwitchEvent {
  /** 原画布 ID */
  fromCanvasId: string
  /** 新画布 ID */
  toCanvasId: string
}

/**
 * 图层可见性变化事件
 */
export interface LayerVisibilityChangeEvent {
  /** 图层 ID */
  layerId: string
  /** 是否可见 */
  visible: boolean
}
