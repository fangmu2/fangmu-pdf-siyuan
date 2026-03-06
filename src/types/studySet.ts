/**
 * 学习集类型定义
 * MarginNote 4 风格学习插件 - 学习集数据结构
 */

/** 复习算法类型 */
export type ReviewAlgorithm = 'SM2' | 'FSRS'

/** 学习集 - 对应一个思源文档 */
export interface StudySet {
  /** 思源文档 ID */
  id: string
  /** 学习集名称 */
  name: string
  /** 学习集描述 */
  description: string
  /** 封面图路径 */
  coverImage?: string
  /** 所属笔记本 ID */
  notebookId: string
  /** 关联的 PDF 路径列表 */
  pdfPaths: string[]
  /** 关联的卡片块 ID 列表 */
  cardIds: string[]
  /** 关联的脑图块 ID */
  mindmapId?: string
  /** 复习设置 */
  reviewSettings: ReviewSettings
  /** 创建时间戳 */
  createdAt: number
  /** 更新时间戳 */
  updatedAt: number
}

/** 复习设置 */
export interface ReviewSettings {
  /** 每日新卡数量 */
  dailyNewCards: number
  /** 复习算法 */
  algorithm: ReviewAlgorithm
  /** 每日最大复习数 */
  dailyReviewLimit?: number
  /** 新卡优先于复习 */
  newCardsBeforeReview?: boolean
}

/** 学习集块属性（思源块属性） */
export interface StudySetBlockAttributes {
  /** 类型标识 */
  type: 'study_set'
  /** 学习集名称 */
  study_set_name: string
  /** 学习集描述 */
  study_set_description?: string
  /** PDF 数量 */
  study_set_pdf_count?: string
  /** 卡片数量 */
  study_set_card_count?: string
  /** 创建时间 */
  study_set_created?: string
  /** 更新时间 */
  study_set_updated?: string
  /** 所属笔记本 ID */
  study_set_notebook_id?: string
  /** 复习算法 */
  study_set_algorithm?: string
  /** 每日新卡数 */
  study_set_daily_new_cards?: string
}

/** 学习集概览统计 */
export interface StudySetStats {
  /** 学习集 ID */
  studySetId: string
  /** PDF 数量 */
  pdfCount: number
  /** 卡片总数 */
  totalCards: number
  /** 新卡数量 */
  newCards: number
  /** 学习中卡片 */
  learningCards: number
  /** 复习中卡片 */
  reviewCards: number
  /** 今日到期复习 */
  dueToday: number
  /** 已掌握卡片 */
  masteredCards: number
  /** 脑图节点数 */
  mindmapNodes: number
}

/** 学习集列表项 */
export interface StudySetListItem {
  /** 学习集 ID */
  id: string
  /** 学习集名称 */
  name: string
  /** 描述 */
  description: string
  /** 封面图 */
  coverImage?: string
  /** 卡片数量 */
  cardCount: number
  /** PDF 数量 */
  pdfCount: number
  /** 更新时间 */
  updatedAt: number
  /** 今日到期数 */
  dueToday: number
}

/** 学习集创建选项 */
export interface CreateStudySetOptions {
  /** 学习集名称 */
  name: string
  /** 学习集描述 */
  description?: string
  /** 所属笔记本 ID */
  notebookId: string
  /** 封面图路径 */
  coverImage?: string
  /** 复习设置 */
  reviewSettings?: Partial<ReviewSettings>
}

/** 学习集更新选项 */
export interface UpdateStudySetOptions {
  /** 学习集名称 */
  name?: string
  /** 学习集描述 */
  description?: string
  /** 封面图路径 */
  coverImage?: string
  /** 复习设置 */
  reviewSettings?: Partial<ReviewSettings>
}
