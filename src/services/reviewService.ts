/**
 * 复习队列管理服务
 * MarginNote 4 风格学习插件 - 复习队列管理
 */

import type { Card, FlashCard } from '../types/card';
import type { ReviewRecord } from '../types/review';
import { sm2Algorithm, createNewSRSParams } from '../review/sm2';
import {
  createReviewRecord,
  getReviewRecordsByCardId,
  getReviewRecordsByDate,
  getReviewStats as getReviewStatsFromDB,
} from './dataPersistenceService';

// 内存缓存
let recordsCache: ReviewRecord[] = [];
let cacheLoaded = false;

/**
 * 加载复习记录缓存
 */
async function loadRecordsCache(): Promise<void> {
  if (cacheLoaded) return;

  try {
    // 加载最近 30 天的记录
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 86400000);

    // 使用数据持久化服务获取记录
    const { getReviewRecordsByDateRange } = await import('./dataPersistenceService');
    recordsCache = await getReviewRecordsByDateRange(thirtyDaysAgo, now);
    cacheLoaded = true;
  } catch (error) {
    console.error('加载复习记录缓存失败:', error);
    recordsCache = [];
  }
}

/**
 * 复习队列管理服务类
 */
class ReviewService {
  /**
   * 创建复习记录
   */
  async createReviewRecord(record: Omit<ReviewRecord, 'id'>): Promise<ReviewRecord> {
    const newRecord: ReviewRecord = {
      ...record,
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    try {
      await createReviewRecord(newRecord);
      recordsCache.push(newRecord);
    } catch (error) {
      console.error('创建复习记录失败:', error);
      throw error;
    }

    return newRecord;
  }

  /**
   * 获取卡片的复习历史
   */
  async getCardReviewHistory(cardId: string): Promise<ReviewRecord[]> {
    await loadRecordsCache();
    // 从缓存中获取
    return recordsCache.filter(r => r.cardId === cardId);
  }

  /**
   * 获取指定日期的复习记录
   */
  async getRecordsByDate(date: string): Promise<ReviewRecord[]> {
    const { getReviewRecordsByDate } = await import('./dataPersistenceService');
    return getReviewRecordsByDate(date);
  }

  /**
   * 获取复习统计数据
   */
  async getReviewStats(startDate?: number, endDate?: number): Promise<{
    totalReviewed: number;
    correctCount: number;
    incorrectCount: number;
    totalTimeSpent: number;
    byQuality: Record<number, number>;
    byStudySet: Record<string, number>;
  }> {
    return getReviewStatsFromDB(startDate, endDate);
  }

  /**
   * 获取今日复习统计
   */
  async getTodayStats(): Promise<{
    totalReviewed: number;
    correctCount: number;
    incorrectCount: number;
    totalTimeSpent: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = today.getTime();
    const endDate = startDate + 86400000;

    const stats = await this.getReviewStats(startDate, endDate);
    return {
      totalReviewed: stats.totalReviewed,
      correctCount: stats.correctCount,
      incorrectCount: stats.incorrectCount,
      totalTimeSpent: stats.totalTimeSpent,
    };
  }

  /**
   * 获取复习队列
   * 返回需要复习的卡片列表
   */
  getReviewQueue(cards: Card[], studySetId?: string): FlashCard[] {
    const now = Date.now();

    return cards
      .filter(card => {
        if (card.type !== 'flashcard') return false;
        if (studySetId && card.studySetId !== studySetId) return false;

        const flashCard = card as FlashCard;
        return flashCard.srs && flashCard.srs.nextReview <= now;
      })
      .map(card => card as FlashCard)
      .sort((a, b) => {
        // 按到期时间排序，最早到期的在前
        return (a.srs?.nextReview || 0) - (b.srs?.nextReview || 0);
      });
  }

  /**
   * 获取今日待复习卡片数量
   */
  getDueCount(cards: Card[], studySetId?: string): number {
    return this.getReviewQueue(cards, studySetId).length;
  }

  /**
   * 处理卡片复习
   * 更新卡片 SRS 状态并创建复习记录
   */
  async processCardReview(
    card: FlashCard,
    quality: number,
    timeSpent: number = 0
  ): Promise<{ card: FlashCard; record: ReviewRecord }> {
    const now = Date.now();

    // 使用 SM-2 算法更新卡片状态
    const result = sm2Algorithm({
      quality,
      easeFactor: card.srs.easeFactor,
      interval: card.srs.interval,
      repetitions: card.srs.repetitions,
    });

    // 更新卡片
    const updatedCard: FlashCard = {
      ...card,
      srs: result,
      updatedAt: now,
    };

    // 根据复习结果更新状态
    if (quality < 3) {
      updatedCard.status = 'learning';
    } else if (result.interval >= 21) {
      updatedCard.status = 'review';
    } else if (result.repetitions > 0) {
      updatedCard.status = 'learning';
    }

    // 创建复习记录
    const record: Omit<ReviewRecord, 'id'> = {
      cardId: card.id,
      studySetId: card.studySetId,
      quality,
      reviewedAt: now,
      timeSpent,
      correct: quality >= 3,
    };

    const reviewRecord = await this.createReviewRecord(record);

    return { card: updatedCard, record: reviewRecord };
  }

  /**
   * 批量处理复习
   */
  async batchProcessReview(
    reviews: Array<{
      card: FlashCard;
      quality: number;
      timeSpent?: number;
    }>
  ): Promise<Array<{ card: FlashCard; record: ReviewRecord }>> {
    const results: Array<{ card: FlashCard; record: ReviewRecord }> = [];

    for (const review of reviews) {
      const result = await this.processCardReview(
        review.card,
        review.quality,
        review.timeSpent || 0
      );
      results.push(result);
    }

    return results;
  }

  /**
   * 获取连续学习天数
   */
  async getStreak(cards?: Card[]): Promise<number> {
    await loadRecordsCache();

    const now = Date.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = today.getTime();

    // 检查今天是否已经复习过
    const todayRecords = recordsCache.filter(
      r => r.reviewedAt >= currentDate && r.reviewedAt < currentDate + 86400000
    );

    if (todayRecords.length === 0) {
      // 如果今天还没复习，检查昨天
      currentDate -= 86400000;
    }

    // 计算连续天数
    while (true) {
      const dayStart = currentDate;
      const dayEnd = dayStart + 86400000;

      const dayRecords = recordsCache.filter(
        r => r.reviewedAt >= dayStart && r.reviewedAt < dayEnd
      );

      if (dayRecords.length > 0) {
        streak++;
        currentDate -= 86400000;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 获取复习日历数据（每月每天的复习数量）
   */
  async getCalendarData(year: number, month: number): Promise<Record<number, number>> {
    const { getReviewCalendarData } = await import('./dataPersistenceService');
    return getReviewCalendarData(year, month);
  }

  /**
   * 获取学习进度
   */
  getLearningProgress(cards: Card[]): {
    totalCards: number;
    learnedCards: number;
    masteryRate: number;
    averageEaseFactor: number;
  } {
    const flashCards = cards.filter(c => c.type === 'flashcard') as FlashCard[];
    const learnedCards = flashCards.filter(c => c.status === 'review' || c.status === 'learning');

    const totalEaseFactor = flashCards.reduce(
      (sum, card) => sum + (card.srs?.easeFactor || 0),
      0
    );

    return {
      totalCards: cards.length,
      learnedCards: learnedCards.length,
      masteryRate: flashCards.length > 0
        ? Math.round((learnedCards.length / flashCards.length) * 100)
        : 0,
      averageEaseFactor: flashCards.length > 0
        ? Math.round((totalEaseFactor / flashCards.length) * 100) / 100
        : 2.5,
    };
  }

  /**
   * 预测未来 N 天需要复习的卡片数量
   */
  predictReviewLoad(cards: Card[], days: number = 7): number[] {
    const now = Date.now();
    const load: number[] = [];

    for (let i = 0; i < days; i++) {
      const dayStart = now + (i * 86400000);
      const dayEnd = dayStart + 86400000;

      const count = cards.filter(card => {
        if (card.type !== 'flashcard') return false;
        const flashCard = card as FlashCard;
        const nextReview = flashCard.srs?.nextReview || 0;
        return nextReview >= dayStart && nextReview < dayEnd;
      }).length;

      load.push(count);
    }

    return load;
  }
}

// 导出单例
export const reviewService = new ReviewService();
export default reviewService;
