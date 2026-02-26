/**
 * 卡片系统类型定义
 * MarginNote 4 风格学习插件 - 卡片数据结构
 */

/** 卡片类型 */
export type CardType = 'card' | 'excerpt' | 'flashcard';

/** 卡片状态 */
export type CardStatus = 'new' | 'learning' | 'review' | 'suspended';

/** 卡片来源位置 */
export interface CardSourceLocation {
  /** 思源文档 ID */
  docId: string;
  /** 思源块 ID */
  blockId: string;
  /** PDF 路径（兼容现有 annotation.pdfPath） */
  pdfPath?: string;
  /** 页码（兼容现有 annotation.page） */
  page?: number;
  /** 区域坐标（兼容现有 annotation.rect） */
  rect?: [number, number, number, number];
}

/** 卡片 - 对应一个思源块 */
export interface Card {
  /** 块 ID（与现有 annotation.id 兼容） */
  id: string;
  /** 卡片类型 */
  type: CardType;
  /** 卡片内容（Markdown） */
  content: string;
  /** 来源信息（兼容现有标注） */
  sourceLocation: CardSourceLocation;
  /** 所属学习集 ID */
  studySetId: string;
  /** 标签列表 */
  tags: string[];
  /** 卡片状态 */
  status: CardStatus;
  /** 难度评分 1-5 */
  difficulty: number;
  /** 创建时间戳 */
  createdAt: number;
  /** 更新时间戳 */
  updatedAt: number;
}

/** 闪卡扩展 */
export interface FlashCard extends Card {
  type: 'flashcard';
  /** 正面内容 */
  front: string;
  /** 反面内容 */
  back: string;
  /** SRS 复习参数 */
  srs: SRSParams;
}

/** SRS 复习参数 */
export interface SRSParams {
  /** 难度因子 (初始 2.5) */
  easeFactor: number;
  /** 当前间隔天数 */
  interval: number;
  /** 连续正确次数 */
  repetitions: number;
  /** 下次复习日期戳 */
  nextReview: number;
}

/** 卡片块属性（思源块属性） */
export interface CardBlockAttributes {
  /** 类型标识 */
  type: 'card' | 'flashcard';
  /** 卡片来源 ID */
  'card_source_id': string;
  /** 所属学习集 ID */
  'card_study_set_id': string;
  /** 标签（逗号分隔） */
  'card_tags'?: string;
  /** 状态 */
  'card_status'?: string;
  /** 难度 */
  'card_difficulty'?: string;
  /** 创建时间 */
  'card_created'?: string;
  /** 更新时间 */
  'card_updated'?: string;
  // 闪卡特有属性
  /** 卡片类型 */
  'card_type'?: 'flashcard';
  /** 正面内容 */
  'card_front'?: string;
  /** 反面内容 */
  'card_back'?: string;
  /** SRS 难度因子 */
  'card_srs_ease'?: string;
  /** SRS 间隔 */
  'card_srs_interval'?: string;
  /** SRS 重复次数 */
  'card_srs_repetitions'?: string;
  /** SRS 下次复习 */
  'card_srs_next_review'?: string;
}

/** 卡片筛选条件 */
export interface CardFilter {
  /** 按标签筛选 */
  tags?: string[];
  /** 按来源文档 */
  sourceDocId?: string;
  /** 按来源 PDF */
  sourcePdfPath?: string;
  /** 按状态 */
  status?: string[];
  /** 按难度范围 */
  difficulty?: [number, number];
  /** 下次复习时间范围 */
  nextReviewFrom?: number;
  nextReviewTo?: number;
}

/** 卡片排序选项 */
export interface CardSortOptions {
  /** 排序字段 */
  sortBy: 'created' | 'updated' | 'nextReview' | 'difficulty' | 'status';
  /** 排序方向 */
  sortOrder: 'asc' | 'desc';
}

/** 卡片盒看板视图配置 */
export interface BoardView {
  /** 视图 ID */
  id: string;
  /** 所属学习集 ID */
  studySetId: string;
  /** 分组方式 */
  groupBy: 'tag' | 'status' | 'difficulty' | 'source';
  /** 排序方式 */
  sortBy: 'created' | 'updated' | 'nextReview' | 'difficulty';
  /** 排序方向 */
  sortOrder: 'asc' | 'desc';
  /** 筛选条件 */
  filters: {
    tags?: string[];
    status?: string[];
    difficulty?: number[];
  };
}

/** 智能学习集（保存的筛选条件） */
export interface SmartStudySet {
  /** 智能学习集 ID */
  id: string;
  /** 名称 */
  name: string;
  /** 筛选条件 */
  filters: CardFilter;
  /** 排序方式 */
  sortBy: string;
  /** 排序方向 */
  'asc' | 'desc';
}

/** 复习统计 */
export interface ReviewStats {
  /** 学习集 ID */
  studySetId: string;
  /** 总卡片数 */
  totalCards: number;
  /** 已学习卡片数 */
  learnedCards: number;
  /** 今日复习数 */
  reviewToday: number;
  /** 今日到期数 */
  dueToday: number;
  /** 今日新卡数 */
  newToday: number;
  /** 正确率 */
  accuracyRate: number;
  /** 连续学习天数 */
  streakDays: number;
  /** 复习历史 */
  reviewHistory: {
    date: string;
    reviewed: number;
    correct: number;
  }[];
}

/** SM-2 算法参数 */
export interface SM2Params {
  /** 用户评分 0-5 */
  quality: number;
  /** 当前难度因子 */
  easeFactor: number;
  /** 当前间隔 */
  interval: number;
  /** 连续正确次数 */
  repetitions: number;
}

/** SM-2 算法结果 */
export interface SM2Result {
  /** 新难度因子 */
  easeFactor: number;
  /** 新间隔 */
  interval: number;
  /** 新重复次数 */
  repetitions: number;
  /** 下次复习日期 */
  nextReview: number;
}
