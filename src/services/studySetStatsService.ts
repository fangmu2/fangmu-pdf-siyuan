/**
 * 学习集统计服务
 * 提供学习集相关的统计数据和可视化数据
 */

import { getBlock, sql } from '../api';

export interface StudySetStats {
  // 基本统计
  totalCards: number;           // 总卡片数
  newCards: number;             // 新学卡片数
  learningCards: number;        // 学习中卡片数
  reviewCards: number;          // 待复习卡片数
  completedCards: number;       // 已完成卡片数

  // 复习统计
  todayDueCards: number;        // 今日待复习
  todayCompleted: number;       // 今日已完成
  overdueCards: number;         // 过期未复习

  // 时间统计
  totalStudyTime: number;       // 总学习时长（分钟）
  todayStudyTime: number;       // 今日学习时长（分钟）
  lastStudyTime: number;        // 最后学习时间戳

  // 资料统计
  totalDocuments: number;       // 关联资料数
  totalAnnotations: number;     // 总标注数

  // 进度统计
  progress: number;             // 整体进度 0-100
  masteryLevel: number;         // 掌握程度 0-100
}

export interface StudyTimeData {
  date: string;
  count: number;
  duration: number;
}

export interface CardStatusDistribution {
  new: number;
  learning: number;
  review: number;
  completed: number;
  suspended: number;
}

/**
 * 获取学习集统计信息
 */
export async function getStudySetStats(studySetId: string): Promise<StudySetStats> {
  const defaultStats: StudySetStats = {
    totalCards: 0,
    newCards: 0,
    learningCards: 0,
    reviewCards: 0,
    completedCards: 0,
    todayDueCards: 0,
    todayCompleted: 0,
    overdueCards: 0,
    totalStudyTime: 0,
    todayStudyTime: 0,
    lastStudyTime: 0,
    totalDocuments: 0,
    totalAnnotations: 0,
    progress: 0,
    masteryLevel: 0
  };

  try {
    // 获取学习集块
    const studySetBlock = await getBlock(studySetId);
    if (!studySetBlock) {
      return defaultStats;
    }

    // 获取学习集文档下的所有块
    const cards = await sql(`SELECT * FROM blocks WHERE box = (SELECT box FROM blocks WHERE id = '${studySetId}') AND parent_id = '${studySetId}'`) || [];

    // 按状态分类统计
    const statusStats: CardStatusDistribution = {
      new: 0,
      learning: 0,
      review: 0,
      completed: 0,
      suspended: 0
    };

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTime = todayStart.getTime();

    let totalStudyTime = 0;
    let todayStudyTime = 0;
    let lastStudyTime = 0;
    let todayCompleted = 0;
    let overdueCards = 0;
    let todayDueCards = 0;

    cards.forEach((card: any) => {
      // 从块属性中获取状态
      const status = card.meta?.status || 'new';
      const nextReview = card.meta?.nextReview || 0;
      const studyTime = card.meta?.studyTime || 0;
      const lastStudy = card.meta?.lastStudy || 0;

      // 状态统计
      if (statusStats[status as keyof CardStatusDistribution] !== undefined) {
        statusStats[status as keyof CardStatusDistribution]++;
      }

      // 学习时间统计
      totalStudyTime += studyTime;
      if (lastStudy >= todayStartTime) {
        todayStudyTime += studyTime;
        todayCompleted++;
      }
      if (lastStudy > lastStudyTime) {
        lastStudyTime = lastStudy;
      }

      // 复习到期统计
      if (nextReview > 0) {
        if (nextReview < now) {
          if (nextReview < todayStartTime) {
            overdueCards++;
          } else {
            todayDueCards++;
          }
        }
      }
    });

    // 计算进度和掌握程度
    const totalCards = cards.length;
    const progress = totalCards > 0
      ? Math.round(((statusStats.learning + statusStats.completed) / totalCards) * 100)
      : 0;

    const masteryLevel = totalCards > 0
      ? Math.round((statusStats.completed / totalCards) * 100)
      : 0;

    return {
      totalCards,
      newCards: statusStats.new,
      learningCards: statusStats.learning,
      reviewCards: statusStats.review + statusStats.suspended,
      completedCards: statusStats.completed,
      todayDueCards,
      todayCompleted,
      overdueCards,
      totalStudyTime: Math.round(totalStudyTime / 60), // 转换为分钟
      todayStudyTime: Math.round(todayStudyTime / 60),
      lastStudyTime,
      totalDocuments: 1, // 学习集本身
      totalAnnotations: 0, // 需要额外查询
      progress,
      masteryLevel
    };
  } catch (error) {
    console.error('[getStudySetStats] 获取统计失败:', error);
    return defaultStats;
  }
}

/**
 * 获取学习集卡片状态分布
 */
export async function getCardStatusDistribution(studySetId: string): Promise<CardStatusDistribution> {
  try {
    const cards = await sql(`SELECT * FROM blocks WHERE box = (SELECT box FROM blocks WHERE id = '${studySetId}') AND parent_id = '${studySetId}'`) || [];

    const distribution: CardStatusDistribution = {
      new: 0,
      learning: 0,
      review: 0,
      completed: 0,
      suspended: 0
    };

    cards.forEach((card: any) => {
      const status = card.meta?.status || 'new';
      if (distribution[status as keyof CardStatusDistribution] !== undefined) {
        distribution[status as keyof CardStatusDistribution]++;
      }
    });

    return distribution;
  } catch (error) {
    console.error('[getCardStatusDistribution] 获取分布失败:', error);
    return { new: 0, learning: 0, review: 0, completed: 0, suspended: 0 };
  }
}

/**
 * 获取学习时间数据（用于图表）
 */
export async function getStudyTimeData(studySetId: string, days: number = 7): Promise<StudyTimeData[]> {
  const data: StudyTimeData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayStart = date.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    try {
      // 查询当天的学习记录
      const cards = await sql(`SELECT * FROM blocks WHERE box = (SELECT box FROM blocks WHERE id = '${studySetId}') AND parent_id = '${studySetId}'`) || [];

      let dayCount = 0;
      let dayDuration = 0;

      cards.forEach((card: any) => {
        const lastStudy = card.meta?.lastStudy || 0;
        const studyTime = card.meta?.studyTime || 0;

        if (lastStudy >= dayStart && lastStudy < dayEnd) {
          dayCount++;
          dayDuration += studyTime;
        }
      });

      data.push({
        date: date.toISOString().split('T')[0],
        count: dayCount,
        duration: Math.round(dayDuration / 60) // 转换为分钟
      });
    } catch (error) {
      console.error('[getStudyTimeData] 获取数据失败:', error);
      data.push({
        date: date.toISOString().split('T')[0],
        count: 0,
        duration: 0
      });
    }
  }

  return data;
}

/**
 * 获取今日复习概览
 */
export async function getTodayReviewOverview(studySetId: string): Promise<{
  due: number;
  completed: number;
  overdue: number;
  nextDue: string | null;
}> {
  try {
    const cards = await sql(`SELECT * FROM blocks WHERE box = (SELECT box FROM blocks WHERE id = '${studySetId}') AND parent_id = '${studySetId}'`) || [];

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTime = todayStart.getTime();
    const todayEnd = todayStartTime + 24 * 60 * 60 * 1000;

    let due = 0;
    let completed = 0;
    let overdue = 0;
    let nextDue: string | null = null;
    let nextDueTime = Infinity;

    cards.forEach((card: any) => {
      const nextReview = card.meta?.nextReview || 0;
      const lastStudy = card.meta?.lastStudy || 0;

      // 今日已完成
      if (lastStudy >= todayStartTime) {
        completed++;
      }

      // 到期统计
      if (nextReview > 0) {
        if (nextReview < now) {
          // 已过期
          if (nextReview < todayStartTime) {
            overdue++;
          } else {
            due++;
          }
        } else if (nextReview < todayEnd) {
          // 今日到期但未完成
          if (lastStudy < todayStartTime) {
            due++;
          }
        }

        // 下次到期时间
        if (nextReview > now && nextReview < nextDueTime) {
          nextDueTime = nextReview;
          nextDue = new Date(nextReview).toLocaleDateString();
        }
      }
    });

    return { due, completed, overdue, nextDue };
  } catch (error) {
    console.error('[getTodayReviewOverview] 获取概览失败:', error);
    return { due: 0, completed: 0, overdue: 0, nextDue: null };
  }
}
