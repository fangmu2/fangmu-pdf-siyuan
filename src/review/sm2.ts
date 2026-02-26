/**
 * SM-2 间隔重复算法实现
 * 基于 SuperMemo 2 算法
 *
 * 参考资料:
 * - https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 * - https://github.com/open-spaced-repetition/fsrs4anki
 */

import type { SM2Params, SM2Result, ReviewQuality } from '../types/review';

/**
 * SM-2 算法默认参数
 */
export const SM2_DEFAULTS = {
  /** 初始难度因子 */
  INITIAL_EASE_FACTOR: 2.5,
  /** 最小难度因子 */
  MIN_EASE_FACTOR: 1.3,
  /** 第一次复习间隔（天） */
  FIRST_INTERVAL: 1,
  /** 第二次复习间隔（天） */
  SECOND_INTERVAL: 6,
  /** 掌握阈值（间隔>=此值认为已掌握） */
  MASTERY_THRESHOLD: 21,
} as const;

/**
 * SM-2 算法实现
 *
 * @param params - SM-2 算法参数
 * @returns 更新后的 SRS 参数
 */
export function sm2Algorithm(params: SM2Params): SM2Result {
  const { quality, easeFactor, interval, repetitions } = params;

  // 更新难度因子
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // 确保难度因子不小于最小值
  if (newEaseFactor < SM2_DEFAULTS.MIN_EASE_FACTOR) {
    newEaseFactor = SM2_DEFAULTS.MIN_EASE_FACTOR;
  }

  // 更新重复次数和间隔
  let newRepetitions = repetitions;
  let newInterval: number;

  if (quality < 3) {
    // 回答错误（质量评分<3），重置重复次数和间隔
    newRepetitions = 0;
    newInterval = SM2_DEFAULTS.FIRST_INTERVAL;
  } else {
    // 回答正确（质量评分>=3）
    newRepetitions++;

    if (newRepetitions === 1) {
      // 第一次复习
      newInterval = SM2_DEFAULTS.FIRST_INTERVAL;
    } else if (newRepetitions === 2) {
      // 第二次复习
      newInterval = SM2_DEFAULTS.SECOND_INTERVAL;
    } else {
      // 后续复习：间隔 = 前一次间隔 * 难度因子
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  // 计算下次复习日期
  const nextReview = Date.now() + newInterval * 24 * 60 * 60 * 1000;

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
  };
}

/**
 * 将用户评分转换为 SM-2 质量评分
 *
 * @param label - 用户友好的评分标签
 * @returns SM-2 质量评分 (0-5)
 */
export function qualityLabelToScore(label: ReviewQualityLabel): number {
  switch (label) {
    case 'again':
      // 完全忘记，需要重新学习
      return 0;
    case 'hard':
      // 困难，但能回忆起来
      return 2;
    case 'good':
      // 良好，正确回忆
      return 4;
    case 'easy':
      // 简单，轻松回忆
      return 5;
    default:
      return 3;
  }
}

/**
 * 将 SM-2 质量评分转换为用户友好的标签
 *
 * @param score - SM-2 质量评分 (0-5)
 * @returns 评分标签
 */
export function scoreToQualityLabel(score: number): ReviewQualityLabel {
  if (score <= 1) return 'again';
  if (score === 2) return 'hard';
  if (score <= 4) return 'good';
  return 'easy';
}

/**
 * 创建新的 SRS 参数（用于新卡片）
 *
 * @returns 初始 SRS 参数
 */
export function createNewSRSParams() {
  return {
    easeFactor: SM2_DEFAULTS.INITIAL_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReview: 0, // 新卡片立即可复习
  };
}

/**
 * 计算预计掌握日期
 *
 * @param currentInterval - 当前间隔（天）
 * @param easeFactor - 当前难度因子
 * @param targetInterval - 目标间隔（默认 21 天，认为已掌握）
 * @returns 预计达到掌握所需的天数
 */
export function estimateDaysToMastery(
  currentInterval: number,
  easeFactor: number,
  targetInterval: number = SM2_DEFAULTS.MASTERY_THRESHOLD
): number {
  if (currentInterval >= targetInterval) {
    return 0;
  }

  let days = 0;
  let interval = currentInterval;

  while (interval < targetInterval) {
    days += interval;
    interval = Math.round(interval * easeFactor);
    if (interval <= currentInterval) {
      // 防止死循环
      interval++;
    }
  }

  return days;
}

/**
 * 计算遗忘曲线（Ebbinghaus Forgetting Curve）
 *
 * @param days - 天数
 * @param easeFactor - 难度因子（影响遗忘速度）
 * @returns 保留率 (0-1)
 */
export function calculateRetention(days: number, easeFactor: number = 2.5): number {
  // 简化遗忘曲线公式：R = e^(-t/S)
  // S 为稳定性系数，与难度因子正相关
  const stability = easeFactor * 3;
  return Math.exp(-days / stability);
}

/**
 * 根据遗忘曲线计算最佳复习时间
 *
 * @param targetRetention - 目标保留率（默认 0.9，即 90%）
 * @param easeFactor - 难度因子
 * @returns 最佳复习间隔（天）
 */
export function calculateOptimalInterval(
  targetRetention: number = 0.9,
  easeFactor: number = 2.5
): number {
  const stability = easeFactor * 3;
  // R = e^(-t/S) => t = -S * ln(R)
  const days = -stability * Math.log(targetRetention);
  return Math.round(days);
}

/**
 * 验证 SM-2 参数是否有效
 *
 * @param params - SRS 参数
 * @returns 是否有效
 */
export function isValidSRSParams(params: Partial<SRSParams>): boolean {
  if (params.easeFactor !== undefined) {
    if (params.easeFactor < SM2_DEFAULTS.MIN_EASE_FACTOR) return false;
  }
  if (params.interval !== undefined) {
    if (params.interval < 0) return false;
  }
  if (params.repetitions !== undefined) {
    if (params.repetitions < 0) return false;
  }
  return true;
}

/**
 * 格式化间隔显示
 *
 * @param interval - 间隔天数
 * @returns 格式化后的字符串
 */
export function formatInterval(interval: number): string {
  if (interval === 0) return '今天';
  if (interval === 1) return '明天';
  if (interval < 30) return `${interval}天后`;
  if (interval < 365) return `${Math.round(interval / 30)}个月后`;
  return `${Math.round(interval / 365)}年后`;
}

/**
 * 格式化下次复习时间显示
 *
 * @param nextReview - 下次复习时间戳
 * @returns 格式化后的字符串
 */
export function formatNextReview(nextReview: number): string {
  const now = Date.now();
  const diff = nextReview - now;

  if (diff <= 0) return '到期';
  if (diff < 24 * 60 * 60 * 1000) return '今天';
  if (diff < 2 * 24 * 60 * 60 * 1000) return '明天';

  const days = Math.round(diff / (24 * 60 * 60 * 1000));
  if (days < 30) return `${days}天后`;
  if (days < 365) return `${Math.round(days / 30)}个月后`;
  return `${Math.round(days / 365)}年后`;
}

export default {
  sm2Algorithm,
  qualityLabelToScore,
  scoreToQualityLabel,
  createNewSRSParams,
  estimateDaysToMastery,
  calculateRetention,
  calculateOptimalInterval,
  isValidSRSParams,
  formatInterval,
  formatNextReview,
  DEFAULTS: SM2_DEFAULTS,
};
