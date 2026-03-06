// src/types/pdfAnnotation.ts
/**
 * PDF 标注批注类型定义
 * 支持为 PDF 标注添加文字批注
 */

/** 批注类型 */
export type AnnotationCommentType = 'text' | 'voice' | 'image'

/** 批注优先级 */
export type AnnotationPriority = 'low' | 'normal' | 'high' | 'urgent'

/** 批注状态 */
export type CommentStatus = 'active' | 'resolved' | 'archived'

/** 文本批注内容 */
export interface TextCommentContent {
  /** 批注文本 */
  text: string
  /** 富文本标记（可选，支持 Markdown） */
  format?: 'plain' | 'markdown' | 'html'
}

/** 语音批注内容 */
export interface VoiceCommentContent {
  /** 音频数据 URL 或文件路径 */
  audioUrl: string
  /** 音频时长（秒） */
  duration: number
  /** 语音转文字（可选） */
  transcript?: string
}

/** 图片批注内容 */
export interface ImageCommentContent {
  /** 图片 URL */
  imageUrl: string
  /** 图片宽度 */
  width: number
  /** 图片高度 */
  height: number
  /** 图片说明（可选） */
  caption?: string
}

/** 批注基础接口 */
export interface AnnotationCommentBase {
  /** 批注 ID */
  id: string
  /** 关联的标注 ID */
  annotationId: string
  /** 批注类型 */
  type: AnnotationCommentType
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
  /** 创建者（用户 ID 或名称） */
  author?: string
  /** 优先级 */
  priority: AnnotationPriority
  /** 状态 */
  status: CommentStatus
  /** 标签 */
  tags?: string[]
}

/** 文本批注 */
export interface TextAnnotationComment extends AnnotationCommentBase {
  type: 'text'
  content: TextCommentContent
}

/** 语音批注 */
export interface VoiceAnnotationComment extends AnnotationCommentBase {
  type: 'voice'
  content: VoiceCommentContent
}

/** 图片批注 */
export interface ImageAnnotationComment extends AnnotationCommentBase {
  type: 'image'
  content: ImageCommentContent
}

/** 批注联合类型 */
export type AnnotationComment =
  | TextAnnotationComment
  | VoiceAnnotationComment
  | ImageAnnotationComment

/** 创建批注参数 */
export interface CreateCommentParams {
  /** 关联的标注 ID */
  annotationId: string
  /** 批注类型 */
  type: AnnotationCommentType
  /** 批注内容 */
  content: TextCommentContent | VoiceCommentContent | ImageCommentContent
  /** 优先级 */
  priority?: AnnotationPriority
  /** 作者 */
  author?: string
  /** 标签 */
  tags?: string[]
}

/** 更新批注参数 */
export interface UpdateCommentParams {
  /** 批注内容 */
  content?: TextCommentContent | VoiceCommentContent | ImageCommentContent
  /** 优先级 */
  priority?: AnnotationPriority
  /** 状态 */
  status?: CommentStatus
  /** 标签 */
  tags?: string[]
}

/** 批注筛选条件 */
export interface CommentFilter {
  /** 按标注 ID 筛选 */
  annotationId?: string
  /** 按类型筛选 */
  type?: AnnotationCommentType
  /** 按状态筛选 */
  status?: CommentStatus
  /** 按优先级筛选 */
  priority?: AnnotationPriority
  /** 按标签筛选 */
  tags?: string[]
  /** 搜索关键词 */
  keyword?: string
}

/** 批注统计 */
export interface CommentStats {
  /** 总批注数 */
  total: number
  /** 各类型数量 */
  byType: Record<AnnotationCommentType, number>
  /** 各状态数量 */
  byStatus: Record<CommentStatus, number>
  /** 各优先级数量 */
  byPriority: Record<AnnotationPriority, number>
}

/** 批注线程（支持回复） */
export interface CommentThread {
  /** 主批注 */
  mainComment: AnnotationComment
  /** 回复列表 */
  replies: AnnotationComment[]
  /** 总回复数 */
  replyCount: number
}

/** 回复批注参数 */
export interface ReplyToCommentParams {
  /** 被回复的批注 ID */
  parentCommentId: string
  /** 回复内容 */
  content: TextCommentContent
  /** 作者 */
  author?: string
}

/** 批注导出选项 */
export interface CommentExportOptions {
  /** 导出格式 */
  format: 'json' | 'markdown' | 'csv'
  /** 是否包含回复 */
  includeReplies: boolean
  /** 是否包含元数据 */
  includeMetadata: boolean
  /** 筛选条件 */
  filter?: CommentFilter
}

/** 默认优先级 */
export const DEFAULT_PRIORITY: AnnotationPriority = 'normal'

/** 默认状态 */
export const DEFAULT_STATUS: CommentStatus = 'active'

/** 优先级标签映射 */
export const PRIORITY_LABELS: Record<AnnotationPriority, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急',
}

/** 状态标签映射 */
export const STATUS_LABELS: Record<CommentStatus, string> = {
  active: '活跃',
  resolved: '已解决',
  archived: '已归档',
}

/** 优先级颜色映射 */
export const PRIORITY_COLORS: Record<AnnotationPriority, string> = {
  low: '#909399',
  normal: '#409EFF',
  high: '#E6A23C',
  urgent: '#F56C6C',
}

/** 状态颜色映射 */
export const STATUS_COLORS: Record<CommentStatus, string> = {
  active: '#67C23A',
  resolved: '#909399',
  archived: '#C0C4CC',
}
