/**
 * 脑图类型定义
 * MarginNote 4 风格学习插件 - 思维导图数据结构
 */

/** 脑图布局类型 */
export type MindMapLayout = 'mindmap' | 'tree' | 'fishbone' | 'timeline' | 'vertical' | 'org'

/** 脑图主题 */
export type MindMapTheme = 'default' | 'dark' | 'light' | 'colorful' | 'simple'

/** 脑图节点 */
export interface MindMapNode {
  /** 节点 ID */
  id: string
  /** 关联的卡片块 ID */
  cardId?: string
  /** 节点标题/文本 */
  title?: string
  /** 节点文本（兼容 markmap） */
  text?: string
  /** 节点位置 */
  position?: {
    x: number
    y: number
  }
  /** 布局位置（markmap 使用） */
  layout_x?: number
  layout_y?: number
  /** 是否折叠 */
  collapsed?: boolean
  /** 是否展开（兼容 markmap） */
  expanded?: boolean
  /** 父节点 ID */
  parentId?: string
  /** 子节点列表 */
  children: MindMapNode[]
  /** 样式 */
  style?: {
    color?: string
    icon?: string
    backgroundColor?: string
    fontSize?: number
  }
  /** 备注 */
  note?: string
  /** 节点数据 */
  data?: Record<string, any>
  /** 布局方向 */
  layout?: MindMapLayout | 'right' | 'left' | 'up' | 'down'
}

/** 脑图容器 */
export interface MindMap {
  /** 脑图块 ID */
  id: string
  /** 所属学习集 ID */
  studySetId?: string
  /** 脑图标题 */
  title?: string
  /** 根节点 */
  root: MindMapNode
  /** 布局类型 */
  layout: MindMapLayout | 'right' | 'left' | 'up' | 'down'
  /** 主题 */
  theme?: MindMapTheme
  /** 视口状态 */
  viewport?: {
    scale: number
    offsetX: number
    offsetY: number
  }
  /** 创建时间 */
  createdAt?: number
  /** 更新时间 */
  updatedAt?: number
}

/** 脑图块属性（思源块属性） */
export interface MindMapBlockAttributes {
  /** 类型标识 */
  type: 'mindmap'
  /** 所属学习集 ID */
  mindmap_study_set_id: string
  /** 布局类型 */
  mindmap_layout: string
  /** 节点数据（JSON 字符串） */
  mindmap_data: string
  /** 创建时间 */
  mindmap_created?: string
  /** 更新时间 */
  mindmap_updated?: string
}

/** 脑图创建选项 */
export interface CreateMindMapOptions {
  /** 所属学习集 ID */
  studySetId?: string
  /** 脑图标题 */
  title?: string
  /** 布局类型 */
  layout?: MindMapLayout | 'right' | 'left' | 'up' | 'down'
  /** 主题 */
  theme?: MindMapTheme
  /** 根节点标题 */
  rootTitle?: string
  /** 根节点文本（兼容） */
  rootText?: string
}

/** 脑图节点操作 */
export interface MindMapNodeOperation {
  /** 操作类型 */
  type: 'add' | 'remove' | 'update' | 'move'
  /** 节点 ID */
  nodeId: string
  /** 父节点 ID（添加/移动时使用） */
  parentId?: string
  /** 新位置索引（移动时使用） */
  newIndex?: number
  /** 更新的数据（update 时使用） */
  data?: Partial<MindMapNode>
}

/** 脑图统计 */
export interface MindMapStats {
  /** 总节点数 */
  totalNodes: number
  /** 最大深度 */
  maxDepth: number
  /** 折叠节点数 */
  collapsedNodes: number
  /** 关联卡片数 */
  linkedCards: number
}

/** 脑图节点类型（用于区分普通节点和自由节点） */
export enum MindMapNodeType {
  /** 树形节点 */
  TREE = 'tree',
  /** 自由节点 */
  FREE = 'free',
}

/** 脑图连线 */
export interface MindMapLink {
  /** 连线 ID */
  id: string
  /** 源节点 ID */
  sourceId: string
  /** 目标节点 ID */
  targetId: string
  /** 关系标签 */
  label?: string
  /** 样式 */
  style?: {
    color?: string
    width?: number
    type?: 'solid' | 'dashed' | 'dotted'
  }
}
