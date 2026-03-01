/**
 * MarginNote 风格自由画布思维导图类型定义
 * @fileoverview 定义自由画布思维导图的数据结构和接口
 */

import type { Node as VueFlowNode, Edge as VueFlowEdge, Connection } from '@vue-flow/core'
import type { Styles } from '@vue-flow/core'

/**
 * 节点数据类型
 */
export interface FreeMindMapNodeData {
  /** 关联的标注 ID */
  annotationId?: string
  /** 关联的卡片 ID */
  cardId?: string
  /** 节点标题 */
  title: string
  /** 节点内容 */
  content?: string
  /** PDF 摘录图片 URL */
  imageUrl?: string
  /** PDF 页码 */
  page?: number
  /** 节点颜色（高亮颜色） */
  color?: string
  /** 节点层级（title/h1-h5/text） */
  level?: string
  /** 是否折叠（旧版，兼容用） */
  collapsed?: boolean
  /** 是否展开（新版，用于 MarginNote4 风格） */
  isExpanded?: boolean
  /** 排序序号 */
  sortOrder?: number
  /** 自定义样式 */
  customStyle?: {
    backgroundColor?: string
    borderColor?: string
    fontSize?: string
    fontWeight?: string
  }
  /** 节点尺寸（用于缩放功能） */
  size?: {
    width: number
    height: number
  }
  /** 最小尺寸 */
  minSize?: {
    width: number
    height: number
  }
  /** 最大尺寸 */
  maxSize?: {
    width: number
    height: number
  }
  /** Z 轴层级（用于叠加管理） */
  zIndex?: number
  /** 所属分组 ID */
  groupId?: string
  /** 跨分支关联列表 */
  relations?: NodeRelation[]
}

/**
 * 节点关联关系（跨分支关联）
 */
export interface NodeRelation {
  id: string
  targetNodeId: string
  type: 'dashed' | 'solid'  // 虚线/实线
  label?: string            // 关联标签
  color?: string            // 关联颜色
}

/**
 * 分组容器节点数据
 */
export interface FreeMindMapGroupData {
  /** 分组标题 */
  title?: string
  /** 背景颜色 */
  backgroundColor?: string
  /** 边框颜色 */
  borderColor?: string
  /** 标题栏颜色 */
  headerColor?: string
  /** 最小宽度 */
  minWidth?: number
  /** 最小高度 */
  minHeight?: number
  /** 子节点数量 */
  childCount?: number
  /** 子节点 ID 列表 */
  childNodeIds?: string[]
  /** 自定义样式 */
  customStyle?: {
    borderRadius?: string
    borderStyle?: 'dashed' | 'solid' | 'dotted'
    borderWidth?: string
  }
}

/**
 * 节点类型
 */
export type FreeMindMapNodeType = 'textCard' | 'imageCard' | 'group'

/**
 * 自由画布思维导图节点
 * 基于 Vue Flow Node 的扩展类型
 */
export interface FreeMindMapNode {
  /** 节点 ID */
  id: string
  /** 节点类型 */
  type: FreeMindMapNodeType
  /** 节点数据 */
  data: FreeMindMapNodeData
  /** 节点位置 */
  position: {
    x: number
    y: number
  }
  /** 节点样式 */
  style?: Styles
  /** 节点类名 */
  class?: string
  /** 是否选中 */
  selected?: boolean
  /** 是否拖拽中 */
  dragging?: boolean
  /** 是否选中中 */
  selecting?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否可拖拽 */
  draggable?: boolean
  /** 是否可选 */
  selectable?: boolean
  /** 是否可连接 */
  connectable?: boolean
  /** 父节点 ID（用于树状布局） */
  parentId?: string
  /** 子节点 ID 列表（新增，用于 MarginNote4 风格层级管理） */
  childrenIds?: string[]
  /** Z 轴层级（新增，用于叠加管理） */
  zIndex?: number
  /** 扩展数据 */
  [key: string]: unknown
}

/**
 * 连线类型
 */
export type FreeMindMapEdgeType = 'default' | 'smooth' | 'step' | 'straight'

/**
 * 自由画布思维导图连线
 * 基于 Vue Flow Edge 的扩展类型
 */
export interface FreeMindMapEdge {
  /** 连线 ID */
  id: string
  /** 源节点 ID */
  source: string
  /** 目标节点 ID */
  target: string
  /** 源节点手柄位置 */
  sourceHandle?: string | null
  /** 目标节点手柄位置 */
  targetHandle?: string | null
  /** 连线类型 */
  type: FreeMindMapEdgeType
  /** 是否动画（虚线效果） */
  animated?: boolean
  /** 连线样式 */
  style?: {
    stroke?: string
    strokeWidth?: number
    strokeDasharray?: string
  }
  /** 连线类名 */
  class?: string
  /** 是否选中 */
  selected?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否可选 */
  selectable?: boolean
  /** 是否可连接 */
  connectable?: boolean
  /** 扩展数据 */
  [key: string]: unknown
}

/**
 * 画布视图状态
 */
export interface MindMapViewport {
  /** 缩放比例 */
  zoom: number
  /** X 轴偏移 */
  x: number
  /** Y 轴偏移 */
  y: number
}

/**
 * 自由画布思维导图布局模式
 */
export type FreeMindMapLayout = 'free' | 'tree' | 'vertical' | 'horizontal'

/**
 * 自由画布思维导图配置
 */
export interface FreeMindMapOptions {
  /** 思维导图 ID */
  id: string
  /** 所属学习集 ID */
  studySetId: string
  /** 布局模式 */
  layout: FreeMindMapLayout
  /** 节点列表 */
  nodes: FreeMindMapNode[]
  /** 连线列表 */
  edges: FreeMindMapEdge[]
  /** 视图状态 */
  viewport: MindMapViewport
  /** 是否显示网格背景 */
  showGrid: boolean
  /** 是否显示迷你地图 */
  showMiniMap: boolean
  /** 是否显示控制工具栏 */
  showControls: boolean
  /** 是否只读模式 */
  readOnly: boolean
}

/**
 * 节点创建参数
 */
export interface CreateNodeParams {
  /** 节点类型 */
  type: FreeMindMapNodeType
  /** 节点标题 */
  title: string
  /** 节点内容 */
  content?: string
  /** 初始位置 */
  position: { x: number; y: number }
  /** 关联的标注 ID */
  annotationId?: string
  /** 关联的卡片 ID */
  cardId?: string
  /** 父节点 ID（用于树状布局） */
  parentId?: string
}

/**
 * 节点更新参数
 */
export interface UpdateNodeParams {
  /** 节点 ID */
  id: string
  /** 新标题 */
  title?: string
  /** 新内容 */
  content?: string
  /** 新位置 */
  position?: { x: number; y: number }
  /** 新样式 */
  style?: Record<string, unknown>
  /** 是否折叠 */
  collapsed?: boolean
}

/**
 * 连线创建参数
 */
export interface CreateEdgeParams {
  /** 源节点 ID */
  source: string
  /** 目标节点 ID */
  target: string
  /** 连线类型 */
  type?: FreeMindMapEdgeType
  /** 连线样式 */
  style?: Record<string, unknown>
}

/**
 * 自动布局选项
 */
export interface AutoLayoutOptions {
  /** 布局方向 */
  direction: 'horizontal' | 'vertical'
  /** 节点间距 */
  nodeSpacing: number
  /** 层级间距 */
  levelSpacing: number
  /** 是否居中 */
  center?: boolean
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format: 'png' | 'jpeg' | 'svg' | 'json'
  /** 导出质量（图片） */
  quality?: number
  /** 是否包含背景 */
  includeBackground?: boolean
  /** 导出区域 */
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * 导出结果
 */
export interface ExportResult {
  /** 是否成功 */
  success: boolean
  /** 导出的数据（base64 或文件路径） */
  data: string
  /** 错误信息 */
  error?: string
}

// ==================== 第 3 期：链接图谱增强类型 ====================

/**
 * 跨分支关联类型
 */
export type CrossLinkType = 'relation' | 'seeAlso' | 'contrast' | 'cause' | 'example'

/**
 * 跨分支关联（虚线连接）
 */
export interface CrossBranchLink {
  /** 关联 ID */
  id: string
  /** 源节点 ID */
  sourceNodeId: string
  /** 目标节点 ID */
  targetNodeId: string
  /** 关联类型 */
  linkType: CrossLinkType
  /** 关联说明/标签 */
  label?: string
  /** 连线样式 */
  style: {
    /** 虚线样式 */
    strokeDasharray: string
    /** 线条颜色 */
    stroke: string
    /** 线条宽度 */
    strokeWidth: number
    /** 是否显示箭头 */
    hasArrow: boolean
    /** 箭头颜色 */
    arrowColor?: string
  }
  /** 创建时间 */
  createdAt: number
  /** 创建者 */
  createdBy?: string
}

/**
 * 远程知识联系
 */
export interface RemoteKnowledgeLink {
  /** 联系 ID */
  id: string
  /** 源节点 ID */
  sourceNodeId: string
  /** 目标类型 */
  targetType: 'node' | 'annotation' | 'document' | 'external'
  /** 目标 ID */
  targetId: string
  /** 目标所在画布 ID（可选，跨画布关联） */
  targetCanvasId?: string
  /** 目标所在学习集 ID（可选，跨学习集关联） */
  targetStudySetId?: string
  /** 联系类型 */
  linkType: 'reference' | 'relation' | 'seeAlso' | 'quote'
  /** 联系说明 */
  description?: string
  /** 目标标题（缓存） */
  targetTitle?: string
  /** 目标内容预览（缓存） */
  targetPreview?: string
  /** 创建时间 */
  createdAt: number
}

/**
 * 节点链接关系（用于一键跳转）
 */
export interface NodeLinkRelation {
  /** 节点 ID */
  nodeId: string
  /** 直接关联的节点 ID 列表 */
  directLinks: string[]
  /** 跨分支关联的节点 ID 列表 */
  crossLinks: string[]
  /** 远程知识联系列表 */
  remoteLinks: RemoteKnowledgeLink[]
  /** 父节点 ID */
  parentId?: string
  /** 子节点 ID 列表 */
  childIds: string[]
}

/**
 * 视图定位配置
 */
export interface ViewportFocusConfig {
  /** 目标节点 ID */
  targetNodeId: string
  /** 缩放级别 */
  zoom: number
  /** 是否高亮显示 */
  highlight: boolean
  /** 高亮颜色 */
  highlightColor?: string
  /** 动画持续时间（毫秒） */
  duration?: number
}

/**
 * 智能布局建议
 */
export interface LayoutSuggestion {
  /** 建议 ID */
  id: string
  /** 建议类型 */
  type: 'cluster' | 'sequence' | 'hierarchy' | 'radial'
  /** 建议说明 */
  description: string
  /** 相关节点 ID 列表 */
  nodeIds: string[]
  /** 建议的布局配置 */
  layoutConfig: {
    /** 布局方向 */
    direction: 'horizontal' | 'vertical' | 'radial'
    /** 根节点 ID */
    rootId?: string
    /** 分组信息 */
    groups?: {
      groupId: string
      nodeIds: string[]
      title?: string
    }[]
  }
  /** 置信度（0-1） */
  confidence: number
}

/**
 * 标注颜色映射配置
 */
export interface AnnotationColorMapping {
  /** 映射 ID */
  id: string
  /** 标注 ID */
  annotationId: string
  /** 标注颜色 */
  annotationColor: string
  /** 映射的节点 ID */
  nodeId: string
  /** 节点边框颜色 */
  nodeBorderColor: string
  /** 节点背景颜色 */
  nodeBackgroundColor?: string
  /** 是否自动同步 */
  autoSync: boolean
}

/**
 * PDF 联动配置
 */
export interface PdfLinkageConfig {
  /** 是否启用实时高亮同步 */
  enableRealtimeHighlight: boolean
  /** 是否启用拖拽创建节点 */
  enableDragToCreate: boolean
  /** 是否启用智能布局建议 */
  enableSmartLayout: boolean
  /** 是否启用标注颜色映射 */
  enableColorMapping: boolean
  /** 是否启用自动同步增强 */
  enableAutoSyncEnhanced: boolean
  /** 自动同步延迟（毫秒） */
  autoSyncDelay: number
  /** 批量同步阈值 */
  batchSyncThreshold: number
}

/**
 * 高亮状态
 */
export interface HighlightState {
  /** 节点 ID */
  nodeId: string
  /** 是否高亮 */
  isHighlighted: boolean
  /** 高亮颜色 */
  color: string
  /** 高亮原因 */
  reason: 'pdf-selection' | 'pdf-annotation' | 'cross-link' | 'manual'
  /** 高亮开始时间 */
  startTime: number
}
