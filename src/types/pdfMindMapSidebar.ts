/**
 * PDF 嵌入式思维导图侧边栏类型定义
 * @description 定义 PDF 阅读器中思维导图侧边栏的数据结构和配置选项
 * @version 1.2.31
 */

import type { PDFAnnotation } from './annotation'
import type {
  MindMapEdge,
  MindMapNode,
} from './mindmapFree'

// ==================== 实时同步相关类型 ====================

/**
 * 实时同步配置
 */
export interface RealtimeSyncConfig {
  /** 启用实时同步 */
  enableRealtimeSync: boolean
  /** 同步延迟（毫秒） */
  syncDelay: number
  /** 自动创建节点 */
  autoCreateNode: boolean
  /** 选中时高亮 */
  highlightOnSelect: boolean
  /** 同步颜色映射 */
  syncColorMapping: boolean
  /** 批量处理大小 */
  batchSize: number
  /** 布局策略 */
  layoutStrategy: 'auto' | 'pageGroup' | 'timeline'
}

/**
 * 标注与节点映射关系
 */
export interface AnnotationNodeMapping {
  /** 标注 ID */
  annotationId: string
  /** 节点 ID */
  nodeId: string
  /** PDF 页码 */
  pdfPage: number
  /** PDF 坐标矩形 [x1, y1, x2, y2] */
  pdfRect: [number, number, number, number]
  /** 画布位置 */
  canvasPosition: { x: number, y: number }
  /** 创建时间戳 */
  createdAt: number
  /** 更新时间戳 */
  updatedAt: number
}

/**
 * 同步队列项
 */
export interface SyncQueueItem {
  /** 同步类型 */
  type: 'create' | 'update' | 'delete' | 'highlight'
  /** 标注 ID */
  annotationId: string
  /** 同步数据 */
  data: PDFAnnotation | null
  /** 时间戳（可选，内部自动添加） */
  timestamp?: number
}

/**
 * 坐标转换结果
 */
export interface CoordinateTransformResult {
  /** X 坐标 */
  x: number
  /** Y 坐标 */
  y: number
  /** 节点宽度 */
  width: number
  /** 节点高度 */
  height: number
}

/**
 * 使用实时同步的选项
 */
export interface UseRealtimeSyncOptions {
  /** PDF 文档 ID */
  pdfDocId?: string
  /** 自动初始化 */
  autoInit?: boolean
  /** 用户配置 */
  config?: Partial<RealtimeSyncConfig>
}

/**
 * 使用实时同步的返回值
 * @description 使用 ReturnType<typeof useRealtimeSync> 获取实际类型
 */
export interface UseRealtimeSyncReturn {
  // Vue 响应式类型 - 在实际使用时通过 ReturnType 推断
  // 这里使用 any 作为占位符，避免循环依赖
  /** 是否已初始化 */
  isInitialized: { value: boolean }
  /** 是否正在同步 */
  isSyncing: { value: boolean }
  /** 是否启用 */
  isEnabled: { value: boolean }
  /** 上次同步时间 */
  lastSyncTime: { value: number | null }
  /** 待处理数量 */
  pendingCount: { value: number }
  /** 错误信息 */
  error: { value: string | null }
  /** 映射数量 */
  mappingCount: { value: number }
  /** 队列长度 */
  queueLength: { value: number }

  /** 初始化 */
  init: (config?: Partial<RealtimeSyncConfig>) => void
  /** 处理标注创建 */
  handleAnnotationCreated: (annotation: PDFAnnotation) => void
  /** 处理标注更新 */
  handleAnnotationUpdated: (annotation: PDFAnnotation) => void
  /** 处理标注删除 */
  handleAnnotationDeleted: (annotationId: string) => void
  /** 处理标注选中 */
  handleAnnotationSelected: (annotation: PDFAnnotation) => void
  /** 同步所有标注 */
  syncAllAnnotations: (annotations: PDFAnnotation[]) => void
  /** 根据节点获取标注 ID */
  getAnnotationIdByNode: (nodeId: string) => string | null
  /** 根据标注获取节点 ID */
  getNodeIdByAnnotation: (annotationId: string) => string | null
  /** 切换同步开关 */
  toggleSync: (enabled?: boolean) => void
  /** 更新配置 */
  updateConfig: (config: Partial<RealtimeSyncConfig>) => void
  /** 获取配置 */
  getConfig: () => RealtimeSyncConfig
  /** 清空数据 */
  clear: () => void
  /** 导出映射 */
  exportMappings: () => AnnotationNodeMapping[]
  /** 导入映射 */
  importMappings: (mappings: AnnotationNodeMapping[]) => void
}

// ==================== 侧边栏配置类型 ====================

/**
 * 侧边栏配置选项
 */
export interface PdfMindMapSidebarOptions {
  /** 默认宽度（像素） */
  defaultWidth?: number
  /** 最小宽度（像素） */
  minWidth?: number
  /** 最大宽度（相对于视口宽度的比例） */
  maxWidthRatio?: number
  /** 默认是否可见 */
  defaultVisible?: boolean
  /** 默认自动同步状态 */
  defaultAutoSync?: boolean
  /** 默认自动添加摘录到导图 */
  defaultAutoAddExcerpt?: boolean
}

/**
 * 侧边栏状态
 */
export interface PdfMindMapSidebarState {
  /** 是否可见 */
  visible: boolean
  /** 当前宽度 */
  width: number
  /** 自动同步是否启用 */
  autoSyncEnabled: boolean
  /** 自动添加摘录到导图 */
  autoAddExcerpt: boolean
  /** 是否正在调整大小 */
  isResizing: boolean
  /** 上次同步时间戳 */
  lastSyncTime: number | null
  /** 画布是否已就绪 */
  canvasReady: boolean
}

/**
 * 从 PDF 摘录创建的节点数据
 */
export interface ExcerptNodeData {
  /** 摘录 ID */
  id: string
  /** 摘录文本内容 */
  text: string
  /** 所在页码 */
  page: number
  /** 摘录颜色 */
  color?: string
  /** 图片 URL（如果是图片摘录） */
  imageUrl?: string
  /** PDF 坐标矩形 [x1, y1, x2, y2] */
  rect?: [number, number, number, number]
  /** 创建时间戳 */
  createdAt?: number
}

/**
 * 节点点击事件数据
 */
export interface NodeClickEvent {
  /** 节点 ID */
  nodeId: string
  /** 关联的摘录 ID */
  annotationId?: string
  /** 页码 */
  page?: number
  /** 坐标矩形 */
  rect?: [number, number, number, number]
}

/**
 * 同步请求类型
 */
export type SyncRequestType = 'all' | 'current-page' | 'selected'

/**
 * 同步请求事件
 */
export interface SyncRequestEvent {
  /** 请求类型 */
  type: SyncRequestType
  /** 目标页码（如果适用） */
  page?: number
  /** 选中的标注 ID 列表 */
  annotationIds?: string[]
}

/**
 * 本地存储键名
 */
export const SIDEBAR_STORAGE_KEYS = {
  WIDTH: 'pdfMindMapSidebarWidth',
  VISIBLE: 'pdfMindMapSidebarVisible',
  AUTO_SYNC: 'pdfMindMapAutoSync',
  AUTO_ADD_EXCERPT: 'pdfMindMapAutoAddExcerpt',
} as const

/**
 * 侧边栏主题类型
 */
export type SidebarTheme = 'light' | 'dark'

/**
 * 紧凑模式下的节点样式覆盖
 */
export interface CompactNodeStyle {
  width?: number
  minWidth?: string
  maxWidth?: string
  fontSize?: string
  padding?: string
}

/**
 * 侧边栏事件类型映射
 */
export interface PdfMindMapSidebarEvents {
  /** 可见性变化 */
  'update:visible': boolean
  /** 宽度变化 */
  'update:width': number
  /** 节点点击 */
  'node-click': NodeClickEvent
  /** 同步请求 */
  'sync-request': SyncRequestEvent
  /** 节点创建 */
  'node-created': MindMapNode
  /** 节点更新 */
  'node-updated': MindMapNode
  /** 节点删除 */
  'node-deleted': string
}

/**
 * 侧边栏 Props 接口
 */
export interface PdfMindMapSidebarProps {
  /** PDF 文档 ID/路径 */
  pdfDocId: string
  /** 是否可见（支持 v-model） */
  visible?: boolean
  /** 宽度（支持 v-model） */
  width?: number
  /** 初始节点列表 */
  initialNodes?: MindMapNode[]
  /** 初始边列表 */
  initialEdges?: MindMapEdge[]
}

/**
 * 侧边栏暴露的方法接口
 */
export interface PdfMindMapSidebarExpose {
  /** 刷新画布 */
  refresh: () => void
  /** 适应视图 */
  fitView: () => void
  /** 从摘录添加节点 */
  addNodeFromAnnotation: (annotation: ExcerptNodeData) => void
  /** 高亮显示节点 */
  highlightNode: (nodeId: string) => void
  /** 清除所有节点 */
  clearAllNodes: () => void
  /** 导出导图数据 */
  exportData: () => { nodes: MindMapNode[], edges: MindMapEdge[] }
  /** 导入导图数据 */
  importData: (data: { nodes: MindMapNode[], edges: MindMapEdge[] }) => void
}
