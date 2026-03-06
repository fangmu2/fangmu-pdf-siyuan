/**
 * PDF 摘录数据结构
 * 用于存储 PDF 摘录的精确位置和坐标信息
 */

/** PDF 坐标矩形 */
export interface PdfRect {
  /** 左上角 X 坐标（PDF 单位） */
  x1: number
  /** 左上角 Y 坐标（PDF 单位） */
  y1: number
  /** 右下角 X 坐标（PDF 单位） */
  x2: number
  /** 右下角 Y 坐标（PDF 单位） */
  y2: number
}

/** PDF 摘录坐标信息 */
export interface PdfExcerptCoordinates {
  /** 页码（从 1 开始） */
  page: number
  /** 区域坐标（PDF 单位） */
  rect: PdfRect
  /** 文本选择起始偏移 */
  textOffset?: {
    start: number
    end: number
  }
  /** 缩放级别（用于精确还原视图） */
  scale?: number
  /** 旋转角度 */
  rotation?: number
}

/** PDF 摘录上下文信息 */
export interface PdfExcerptContext {
  /** 摘录类型 */
  type: 'text' | 'image' | 'handwriting'
  /** 坐标信息 */
  coordinates: PdfExcerptCoordinates
  /** 摘录文本内容 */
  text?: string
  /** 图片数据（base64） */
  imageData?: string
  /** 上下文文本（前后各 100 字，用于模糊定位） */
  contextText?: {
    before: string
    after: string
  }
}

/** PDF 文档信息 */
export interface PdfDocumentInfo {
  /** PDF 文件路径 */
  pdfPath: string
  /** PDF 文件名 */
  fileName: string
  /** 总页数 */
  totalPages: number
  /** 文件大小（字节） */
  fileSize?: number
  /** 最后修改时间 */
  lastModified?: number
  /** PDF 标题（元数据） */
  title?: string
  /** PDF 作者（元数据） */
  author?: string
}

/** PDF 阅读进度 */
export interface PdfReadingProgress {
  /** PDF 路径 */
  pdfPath: string
  /** 当前页码 */
  currentPage: number
  /** 最后阅读时间 */
  lastReadAt: number
  /** 阅读时长（秒） */
  readDuration: number
  /** 已标注数量 */
  annotationCount: number
}

/** PDF 标注高亮颜色 */
export type PdfHighlightColor = 'yellow' | 'green' | 'blue' | 'red' | 'purple' | 'orange'

/** PDF 标注级别 */
export type PdfAnnotationLevel = 'title' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'text'

/** PDF 标注数据 */
export interface PdfAnnotation {
  /** 标注 ID */
  id: string
  /** PDF 路径 */
  pdfPath: string
  /** 页码 */
  page: number
  /** 区域坐标 */
  rect: [number, number, number, number]
  /** 标注类型 */
  type: 'highlight' | 'underline' | 'strike' | 'image' | 'handwriting'
  /** 高亮颜色 */
  color: PdfHighlightColor
  /** 标注级别 */
  level?: PdfAnnotationLevel
  /** 关联的卡片 ID */
  cardId?: string
  /** 批注内容 */
  note?: string
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
  /** 是否是图片摘录 */
  isImage?: boolean
}

/** PDF 跳转目标 */
export interface PdfNavigationTarget {
  /** PDF 路径 */
  pdfPath: string
  /** 目标页码 */
  page: number
  /** 目标坐标（可选，用于精确定位） */
  rect?: PdfRect
  /** 缩放级别（可选） */
  scale?: number
  /** 高亮显示（可选） */
  highlight?: boolean
  /** 高亮颜色（可选） */
  highlightColor?: PdfHighlightColor
}

/** PDF 书签数据 */
export interface PdfBookmark {
  /** 书签 ID */
  id: string
  /** PDF 路径 */
  pdfPath: string
  /** 页码 */
  pageNumber: number
  /** 书签标题 */
  title: string
  /** 创建时间 */
  createdAt: number
  /** 父级书签 ID（用于层级结构） */
  parentId?: string
}

/** PDF 目录项 */
export interface PdfOutlineItem {
  /** 标题 */
  title: string
  /** 目标页码 */
  page?: number
  /** 目标引用（PDF 内部引用） */
  dest?: any
  /** 子项目 */
  items?: PdfOutlineItem[]
  /** 层级 */
  level: number
}

/** PDF 视图状态 */
export interface PdfViewState {
  /** PDF 路径 */
  pdfPath: string
  /** 当前页码 */
  page: number
  /** 缩放级别 */
  scale: number
  /** 旋转角度 */
  rotation: number
  /** 阅读模式 */
  viewMode: 'single' | 'double' | 'continuous'
  /** 深色模式 */
  darkMode: boolean
  /** 侧边栏状态 */
  sidebarOpen: boolean
  /** 侧边栏类型 */
  sidebarType: 'outline' | 'thumbnails' | 'bookmarks' | null
}

/** PDF 摘录服务接口 */
export interface PdfExcerptService {
  /** 保存摘录坐标 */
  saveCoordinates: (cardId: string, coordinates: PdfExcerptCoordinates) => Promise<void>
  /** 获取摘录坐标 */
  getCoordinates: (cardId: string) => Promise<PdfExcerptCoordinates | null>
  /** 删除摘录坐标 */
  deleteCoordinates: (cardId: string) => Promise<void>
  /** 跳转到 PDF 位置 */
  navigateToPdf: (cardId: string) => Promise<void>
  /** 高亮显示 PDF 区域 */
  highlightPdfRect: (cardId: string, duration?: number) => Promise<void>
}
