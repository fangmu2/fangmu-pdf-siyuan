// src/types/annotation.ts

/**
 * 标注类型（MarginNote 4 风格）
 */
export type AnnotationType =
  | 'highlight' // 高亮
  | 'underline' // 下划线
  | 'strikethrough' // 删除线
  | 'wavy' // 波浪线
  | 'text' // 文本批注
  | 'image' // 图片摘录
  | 'rectangle' // 矩形标注
  | 'circle' // 圆形标注
  | 'arrow' // 箭头标注

/**
 * 摘录模式类型
 */
export type ExtractMode = 'text' | 'image'

/**
 * 标注颜色类型
 * 思源 PDF 标注支持的颜色
 */
export type AnnotationColor =
  | 'red' // 红色 - 关键内容
  | 'yellow' // 黄色 - 普通高亮
  | 'green' // 绿色 - 重要概念
  | 'blue' // 蓝色 - 方法/数据
  | 'purple' // 紫色 - 评论/思考

/**
 * 标注级别类型
 * 用于生成不同层级的 Markdown 格式
 */
export type AnnotationLevel =
  | 'title' // 文档标题
  | 'h1' // 一级标题
  | 'h2' // 二级标题
  | 'h3' // 三级标题
  | 'h4' // 四级标题
  | 'h5' // 五级标题
  | 'text' // 正文/普通标注

/**
 * 标注级别配置
 */
export const ANNOTATION_LEVELS: { value: AnnotationLevel, label: string, prefix: string }[] = [
  {
    value: 'title',
    label: '文档标题',
    prefix: '',
  },
  {
    value: 'h1',
    label: '一级标题',
    prefix: '# ',
  },
  {
    value: 'h2',
    label: '二级标题',
    prefix: '## ',
  },
  {
    value: 'h3',
    label: '三级标题',
    prefix: '### ',
  },
  {
    value: 'h4',
    label: '四级标题',
    prefix: '#### ',
  },
  {
    value: 'h5',
    label: '五级标题',
    prefix: '##### ',
  },
  {
    value: 'text',
    label: '正文标注',
    prefix: '',
  },
]

/**
 * 解析后的标注数据
 * 这是我们内部使用的统一格式
 */
export interface PDFAnnotation {
  id: string // 标注块的 ID
  blockId: string // 关联的思源块 ID

  // PDF 定位信息
  pdfPath: string // PDF 文件路径（完整路径）
  pdfName: string // PDF 文件名
  page: number // 页码
  rect: [number, number, number, number] // 坐标矩形

  // 标注内容
  text: string // 高亮的文本内容
  note: string // 用户添加的笔记（可选）
  color: AnnotationColor // 颜色
  level: AnnotationLevel // 标注级别
  type: AnnotationType // 标注类型（新增）

  // 图片摘录相关
  isImage?: boolean // 是否为图片摘录
  imagePath?: string // 图片路径（思源 assets 路径）

  // 拖拽合并相关
  parentId?: string | null // 父标注 ID（用于嵌套合并）
  sortOrder?: number // 在父级下的排序顺序
  children?: PDFAnnotation[] // 子标注列表（运行时计算）
  isExpanded?: boolean // 是否展开（运行时状态）

  // 元数据
  created: number // 创建时间戳
  updated: number // 更新时间戳

  // 思源相关
  boxId?: string // 所在笔记本 ID
  rootId?: string // 所在文档 ID
  parentHPath?: string // 父级路径
}

/**
 * 标注分组
 * 用于按颜色或页码组织标注
 */
export interface AnnotationGroup {
  title: string
  color?: AnnotationColor
  page?: number
  annotations: PDFAnnotation[]
}

/**
 * 批注类型
 */
export type CommentType = 'text' | 'voice' | 'image'

/**
 * 批注优先级
 */
export type CommentPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * 批注状态
 */
export type CommentStatus = 'active' | 'resolved' | 'archived'

/**
 * 批注数据
 * 支持为标注添加多条批注
 */
export interface AnnotationComment {
  /** 批注 ID */
  id: string
  /** 批注类型 */
  type: CommentType
  /** 批注文本内容 */
  text: string
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
  /** 作者 */
  author?: string
  /** 优先级 */
  priority: CommentPriority
  /** 状态 */
  status: CommentStatus
  /** 标签 */
  tags?: string[]
  /** 语音数据（type=voice 时） */
  voiceData?: {
    url: string
    duration: number
    transcript?: string
  }
  /** 图片数据（type=image 时） */
  imageData?: {
    url: string
    caption?: string
  }
}

/**
 * 标注统计数据
 */
export interface AnnotationStats {
  total: number
  byColor: Record<AnnotationColor, number>
  byPage: Record<number, number>
}

/**
 * 批注优先级配置
 */
export const COMMENT_PRIORITIES: { value: CommentPriority, label: string, color: string }[] = [
  {
    value: 'low',
    label: '低',
    color: '#909399',
  },
  {
    value: 'normal',
    label: '普通',
    color: '#409EFF',
  },
  {
    value: 'high',
    label: '高',
    color: '#E6A23C',
  },
  {
    value: 'urgent',
    label: '紧急',
    color: '#F56C6C',
  },
]

/**
 * 批注状态配置
 */
export const COMMENT_STATUSES: { value: CommentStatus, label: string, color: string }[] = [
  {
    value: 'active',
    label: '活跃',
    color: '#67C23A',
  },
  {
    value: 'resolved',
    label: '已解决',
    color: '#909399',
  },
  {
    value: 'archived',
    label: '已归档',
    color: '#C0C4CC',
  },
]

/**
 * 形状标注数据
 * 用于矩形、圆形、箭头等几何形状标注
 */
export interface ShapeAnnotation {
  id: string // 标注 ID
  shapeType: 'rectangle' | 'circle' | 'arrow' // 形状类型
  color: string // 线条颜色
  lineWidth: number // 线条宽度（px）
  opacity: number // 透明度（0-1）

  // 矩形和圆形使用
  x?: number // 左上角 X 坐标（PDF 单位）
  y?: number // 左上角 Y 坐标（PDF 单位）
  width?: number // 宽度（PDF 单位）
  height?: number // 高度（PDF 单位）

  // 箭头使用
  startX?: number // 起点 X 坐标（PDF 单位）
  startY?: number // 起点 Y 坐标（PDF 单位）
  endX?: number // 终点 X 坐标（PDF 单位）
  endY?: number // 终点 Y 坐标（PDF 单位）

  // 元数据
  page: number // 页码
  pdfPath: string // PDF 文件路径
  created: number // 创建时间戳
  updated: number // 更新时间戳

  // 运行时状态
  isSelected?: boolean // 是否选中
}

/**
 * 形状控制点位置
 */
export type ResizeHandle =
  | 'nw' // 左上
  | 'n' // 上中
  | 'ne' // 右上
  | 'e' // 右中
  | 'se' // 右下
  | 's' // 下中
  | 'sw' // 左下
  | 'w' // 左中
