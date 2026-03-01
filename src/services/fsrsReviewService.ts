/**
 * FSRS 复习服务
 * 基于 FSRS 算法的复习队列管理服务
 */

import { sql } from '../api';
import { fsrsService, type CardState, type Rating, type ReviewLog } from '../review/fsrs';
import type { ReviewRecord } from '../types/review';

/**
 * FSRS 复习卡片
 */
export interface FSRSReviewCard {
  /** 卡片 ID */
  id: string;
  /** 卡片内容 */
  content: string;
  /** 正面内容 */
  front?: string;
  /** 反面内容 */
  back?: string;
  /** FSRS 状态 */
  fsrsState: CardState;
  /** 下次复习时间 */
  nextReview: number;
  /** 学习集 ID */
  studySetId: string;
  /** 标签 */
  tags?: string[];
}

/**
 * 复习队列
 */
export interface ReviewQueue {
  /** 待复习卡片 */
  dueCards: FSRSReviewCard[];
  /** 新卡片 */
  newCards: FSRSReviewCard[];
  /** 学习中的卡片 */
  learningCards: FSRSReviewCard[];
  /** 总卡片数 */
  totalCards: number;
}

/**
 * 复习会话
 */
export interface ReviewSession {
  /** 会话 ID */
  sessionId: string;
  /** 学习集 ID */
  studySetId: string;
  /** 队列 */
  queue: ReviewQueue;
  /** 当前卡片索引 */
  currentIndex: number;
  /** 已复习卡片 */
  reviewedCards: Array<{
    cardId: string;
    rating: Rating;
    timestamp: number;
  }>;
  /** 会话开始时间 */
  startTime: number;
  /** 会话结束时间 */
  endTime?: number;
}

/**
 * 复习统计
 */
export interface FSRSReviewStats {
  /** 总复习次数 */
  totalReviews: number;
  /** 平均评分 */
  averageRating: number;
  /** 记忆保持率 */
  retentionRate: number;
  /** 学习曲线数据 */
  learningCurve: Array<{ day: number; retrievability: number }>;
  /** 难度分布 */
  difficultyDistribution: Record<number, number>;
  /** 间隔分布 */
  intervalDistribution: Record<number, number>;
}

/**
 * 获取 FSRS 状态从块属性
 */
function getFSRSStateFromBlock(block: any): CardState {
  const attrs = block.attrs || {};

  // 尝试从属性中读取 FSRS 状态
  const fsrsData = attrs['custom-fsrs-state'];
  if (fsrsData) {
    try {
      return JSON.parse(fsrsData);
    } catch (e) {
      console.error('[getFSRSStateFromBlock] 解析 FSRS 状态失败:', e);
    }
  }

  // 回退到 SM-2 格式
  const easeFactor = parseFloat(attrs['custom-ease-factor'] || '2.5');
  const interval = parseInt(attrs['custom-interval'] || '0');
  const repetitions = parseInt(attrs['custom-repetitions'] || '0');
  const nextReview = parseInt(attrs['custom-next-review'] || '0');

  return fsrsService.fromSM2State({
    easeFactor: isNaN(easeFactor) ? 2.5 : easeFactor,
    interval: isNaN(interval) ? 0 : interval,
    repetitions: isNaN(repetitions) ? 0 : repetitions,
    nextReview: isNaN(nextReview) ? 0 : nextReview
  });
}

/**
 * 保存 FSRS 状态到块属性
 */
async function saveFSRSStateToBlock(blockId: string, state: CardState): Promise<void> {
  try {
    await sql({
      url: '/api/setBlockAttrs',
      data: {
        id: blockId,
        attrs: {
          'custom-fsrs-state': JSON.stringify(state)
        }
      }
    });
  } catch (error) {
    console.error('[saveFSRSStateToBlock] 保存 FSRS 状态失败:', error);
  }
}

/**
 * 获取学习集的 FSRS 复习队列
 */
export async function getFSRSReviewQueue(
  studySetId: string,
  limit: number = 20
): Promise<ReviewQueue> {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  try {
    // 查询待复习卡片（下次复习时间 <= 现在）
    const dueResult = await sql({
      url: '/api/sql',
      data: {
        stmt: `
          SELECT * FROM blocks
          WHERE type = 'p'
          AND name = 'custom-type'
          AND (
            (attrs->>'$.custom-type' = 'flashcard' OR attrs->>'$.custom-type' = 'card')
            AND attrs->>'$.custom-study-set' = '${studySetId}'
            AND (attrs->>'$.custom-next-review' IS NOT NULL AND attrs->>'$.custom-next-review' != '')
            AND CAST(attrs->>'$.custom-next-review' AS INTEGER) <= ${now}
          )
          LIMIT ${limit}
        `
      }
    });

    // 查询新卡片（没有复习记录）
    const newResult = await sql({
      url: '/api/sql',
      data: {
        stmt: `
          SELECT * FROM blocks
          WHERE type = 'p'
          AND name = 'custom-type'
          AND (
            (attrs->>'$.custom-type' = 'flashcard' OR attrs->>'$.custom-type' = 'card')
            AND attrs->>'$.custom-study-set' = '${studySetId}'
            AND (attrs->>'$.custom-next-review' IS NULL OR attrs->>'$.custom-next-review' = '' OR attrs->>'$.custom-next-review' = '0')
          )
          LIMIT ${limit}
        `
      }
    });

    // 查询学习中的卡片
    const learningResult = await sql({
      url: '/api/sql',
      data: {
        stmt: `
          SELECT * FROM blocks
          WHERE type = 'p'
          AND name = 'custom-type'
          AND (
            (attrs->>'$.custom-type' = 'flashcard' OR attrs->>'$.custom-type' = 'card')
            AND attrs->>'$.custom-study-set' = '${studySetId}'
            AND (attrs->>'$.custom-next-review' IS NOT NULL AND attrs->>'$.custom-next-review' != '')
            AND CAST(attrs->>'$.custom-next-review' AS INTEGER) > ${now}
            AND CAST(attrs->>'$.custom-next-review' AS INTEGER) < ${todayStart + 86400000}
          )
          LIMIT ${limit}
        `
      }
    });

    const parseCard = (block: any): FSRSReviewCard => {
      const attrs = block.attrs || {};
      return {
        id: block.id,
        content: block.content || '',
        front: attrs['custom-front'] || block.content?.split('\n')[0] || '',
        back: attrs['custom-back'] || '',
        fsrsState: getFSRSStateFromBlock(block),
        nextReview: parseInt(attrs['custom-next-review'] || '0'),
        studySetId: attrs['custom-study-set'] || studySetId,
        tags: attrs['custom-tags'] ? attrs['custom-tags'].split(',') : []
      };
    };

    const dueCards = (dueResult || []).map(parseCard);
    const newCards = (newResult || []).map(parseCard);
    const learningCards = (learningResult || []).map(parseCard);

    return {
      dueCards,
      newCards,
      learningCards,
      totalCards: dueCards.length + newCards.length + learningCards.length
    };
  } catch (error) {
    console.error('[getFSRSReviewQueue] 获取复习队列失败:', error);
    return {
      dueCards: [],
      newCards: [],
      learningCards: [],
      totalCards: 0
    };
  }
}

/**
 * 创建复习会话
 */
export async function createReviewSession(
  studySetId: string,
  dueLimit: number = 20,
  newLimit: number = 10
): Promise<ReviewSession> {
  const queue = await getFSRSReviewQueue(studySetId, dueLimit);

  // 限制新卡片数量
  queue.newCards = queue.newCards.slice(0, newLimit);

  return {
    sessionId: `session-${Date.now()}`,
    studySetId,
    queue,
    currentIndex: 0,
    reviewedCards: [],
    startTime: Date.now()
  };
}

/**
 * 处理卡片复习
 */
export async function processCardReview(
  cardId: string,
  rating: Rating,
  currentState: CardState
): Promise<{ newState: CardState; log: ReviewLog }> {
  // 使用 FSRS 算法处理复习
  const result = fsrsService.processReview(currentState, rating);

  // 保存新状态到数据库
  await saveFSRSStateToBlock(cardId, result.state);

  // 更新下次复习时间
  const nextReview = Date.now() + result.state.interval * 86400000;
  await sql({
    url: '/api/setBlockAttrs',
    data: {
      id: cardId,
      attrs: {
        'custom-next-review': nextReview.toString()
      }
    }
  });

  return result;
}

/**
 * 获取 FSRS 复习统计
 */
export async function getFSRSReviewStats(
  studySetId: string,
  days: number = 30
): Promise<FSRSReviewStats> {
  const now = Date.now();
  const startTime = now - (days * 86400000);

  try {
    // 查询复习记录
    const result = await sql({
      url: '/api/sql',
      data: {
        stmt: `
          SELECT * FROM blocks
          WHERE type = 'p'
          AND (attrs->>'$.custom-type' = 'flashcard' OR attrs->>'$.custom-type' = 'card')
          AND attrs->>'$.custom-study-set' = '${studySetId}'
        `
      }
    });

    const cards = result || [];
    const totalReviews = cards.length;

    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        retentionRate: 0,
        learningCurve: [],
        difficultyDistribution: {},
        intervalDistribution: {}
      };
    }

    // 计算平均难度
    let totalDifficulty = 0;
    const difficultyDist: Record<number, number> = {};
    const intervalDist: Record<number, number> = {};
    let totalRetrievability = 0;

    cards.forEach((block: any) => {
      const state = getFSRSStateFromBlock(block);
      totalDifficulty += state.difficulty;
      totalRetrievability += state.retrievability;

      // 难度分布
      difficultyDist[state.difficulty] = (difficultyDist[state.difficulty] || 0) + 1;

      // 间隔分布
      const intervalBucket = Math.floor(state.interval / 7) * 7; // 按周分组
      intervalDist[intervalBucket] = (intervalDist[intervalBucket] || 0) + 1;
    });

    // 计算平均学习曲线
    const avgStability = cards.reduce((sum: number, block: any) => {
      return sum + getFSRSStateFromBlock(block).stability;
    }, 0) / totalReviews;

    const learningCurve = fsrsService.calculateLearningCurve(avgStability, days);

    return {
      totalReviews,
      averageRating: 2, // 默认良好
      retentionRate: totalRetrievability / totalReviews,
      learningCurve,
      difficultyDistribution: difficultyDist,
      intervalDistribution: intervalDist
    };
  } catch (error) {
    console.error('[getFSRSReviewStats] 获取复习统计失败:', error);
    return {
      totalReviews: 0,
      averageRating: 0,
      retentionRate: 0,
      learningCurve: [],
      difficultyDistribution: {},
      intervalDistribution: {}
    };
  }
}

/**
 * 批量迁移卡片到 FSRS
 */
export async function migrateToFSRS(
  studySetId: string
): Promise<{ migrated: number; failed: number }> {
  try {
    const result = await sql({
      url: '/api/sql',
      data: {
        stmt: `
          SELECT * FROM blocks
          WHERE type = 'p'
          AND (attrs->>'$.custom-type' = 'flashcard' OR attrs->>'$.custom-type' = 'card')
          AND attrs->>'$.custom-study-set' = '${studySetId}'
        `
      }
    });

    const cards = result || [];
    let migrated = 0;
    let failed = 0;

    for (const block of cards) {
      try {
        const attrs = block.attrs || {};
        const easeFactor = parseFloat(attrs['custom-ease-factor'] || '2.5');
        const interval = parseInt(attrs['custom-interval'] || '0');
        const repetitions = parseInt(attrs['custom-repetitions'] || '0');
        const nextReview = parseInt(attrs['custom-next-review'] || '0');

        const fsrsState = fsrsService.fromSM2State({
          easeFactor,
          interval,
          repetitions,
          nextReview
        });

        await saveFSRSStateToBlock(block.id, fsrsState);
        migrated++;
      } catch (e) {
        console.error('[migrateToFSRS] 迁移卡片失败:', e);
        failed++;
      }
    }

    return { migrated, failed };
  } catch (error) {
    console.error('[migrateToFSRS] 批量迁移失败:', error);
    return { migrated: 0, failed: 0 };
  }
}

/**
 * 获取记忆预测
 */
export function getMemoryPrediction(
  stability: number,
  daysFromNow: number
): number {
  return fsrsService.predictRetrievability(stability, daysFromNow);
}

/**
 * 计算最佳复习时间
 */
export function getOptimalReviewTime(stability: number): number {
  return fsrsService.calculateOptimalReviewTime(stability);
}

/**
 * FSRS 复习服务对象
 */
export const fsrsReviewService = {
  // 队列管理
  getFSRSReviewQueue,
  createReviewSession,

  // 复习处理
  processCardReview,

  // 统计
  getFSRSReviewStats,

  // 迁移
  migrateToFSRS,

  // 预测
  getMemoryPrediction,
  getOptimalReviewTime,

  // 工具函数
  getFSRSStateFromBlock,
  saveFSRSStateToBlock
};
