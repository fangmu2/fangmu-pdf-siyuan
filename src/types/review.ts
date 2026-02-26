/**
 * 复习类型定义
 * MarginNote 4 风格学习插件 - 闪卡复习数据结构
 */

/** 复习质量评分 */
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

/** 复习质量标签 */
export type ReviewQualityLabel = 'again' | 'hard' | 'good' | 'easy';

/** 复习记录 */
export interface ReviewRecord {
  /** 记录 ID */
  id: string;
  /** 卡片 ID */
  cardId: string;
  /** 学习集 ID */
  studySetId: string;
  /** 复习时间戳 */
  reviewedAt: number;
  /** 复习质量评分 (0-5) */
  quality: ReviewQuality;
  /** 复习前间隔 */
  previousInterval: number;
  /** 复习后间隔 */
  newInterval: number;
  /** 复习前难度因子 */
  previousEaseFactor: number;
  /** 复习后难度因子 */
  newEaseFactor: number;
  /** 复习前重复次数 */
  previousRepetitions: number;
  /** 复习后重复次数 */
  newRepetitions: number;
}

/** 复习队列项 */
export interface ReviewQueueItem {
  /** 卡片 ID */
  cardId: string;
  /** 卡片内容 */
  content: string;
  /** 闪卡正面 */
  front?: string;
  /** 闪卡反面 */
  back?: string;
  /** 当前间隔 */
  interval: number;
  /** 当前重复次数 */
  repetitions: number;
  /** 当前难度因子 */
  easeFactor: number;
  /** 到期时间 */
  dueAt: number;
  /** 是否新卡 */
  isNew: boolean;
  /** 来源信息 */
  sourceLocation?: {
    pdfPath?: string;
    page?: number;
  };
}

/** 复习会话 */
export interface ReviewSession {
  /** 会话 ID */
  id: string;
  /** 学习集 ID */
  studySetId: string;
  /** 开始时间戳 */
  startedAt: number;
  /** 结束时间戳 */
  endedAt?: number;
  /** 复习队列 */
  queue: ReviewQueueItem[];
  /** 已复习的卡片 ID 列表 */
  reviewedCardIds: string[];
  /** 复习记录列表 */
  records: ReviewRecord[];
  /** 会话统计 */
  stats: ReviewSessionStats;
}

/** 复习会话统计 */
export interface ReviewSessionStats {
  /** 总会话卡片数 */
  totalCards: number;
  /** 已复习卡片数 */
  reviewedCards: number;
  /** 正确次数（评分>=3） */
  correctCount: number;
  /** 错误次数（评分<3） */
  incorrectCount: number;
  /** 平均评分 */
  averageQuality: number;
  /** 会话时长（秒） */
  durationSeconds: number;
}

/** 每日复习统计 */
export interface DailyReviewStats {
  /** 日期 */
  date: string;
  /** 复习总数 */
  reviewed: number;
  /** 正确数 */
  correct: number;
  /** 新卡学习数 */
  newCardsLearned: number;
  /** 复习时长（分钟） */
  reviewMinutes: number;
}

/** 复习日历项 */
export interface ReviewCalendarItem {
  /** 日期 */
  date: string;
  /** 复习数 */
  reviewed: number;
  /** 目标复习数 */
  target: number;
  /** 完成率 */
  completionRate: number;
}

/** 学习进度统计 */
export interface LearningProgress {
  /** 学习集 ID */
  studySetId: string;
  /** 总卡片数 */
  totalCards: number;
  /** 新卡数 */
  newCards: number;
  /** 学习中卡片 */
  learningCards: number;
  /** 已掌握卡片（间隔>=21 天） */
  masteredCards: number;
  /** 掌握率 */
  masteryRate: number;
  /** 预计完成天数 */
  estimatedDaysToComplete: number;
}

/** 复习设置 */
export interface ReviewPreferences {
  /** 每日新卡数量 */
  dailyNewCards: number;
  /** 每日最大复习数 */
  dailyReviewLimit: number;
  /** 复习算法 */
  algorithm: 'SM2' | 'FSRS';
  /** 新卡优先于复习 */
  newCardsBeforeReview: boolean;
  /** 显示卡片来源 */
  showSource: boolean;
  /** 自动播放 */
  autoPlay: boolean;
  /** 卡片翻转延迟（毫秒） */
  flipDelay: number;
}

/** 遗忘曲线数据点 */
export interface ForgettingCurvePoint {
  /** 天数 */
  day: number;
  /** 保留率 (0-1) */
  retention: number;
  /** 样本数 */
  sampleSize: number;
}
