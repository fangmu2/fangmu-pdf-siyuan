/**
 * FSRS (Free Spaced Repetition Scheduler) 算法实现
 * 基于 FSRS-4.5 算法规范
 *
 * FSRS 是一种改进的间隔重复算法，相比 SM-2 算法：
 * - 更准确地预测记忆保持率
 * - 动态调整难度和稳定性
 * - 考虑更多因素（如复习次数、间隔等）
 */

/**
 * 卡片难度等级
 */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/**
 * 复习评分
 * - 0: Again (完全忘记)
 * - 1: Hard (困难)
 * - 2: Good (良好)
 * - 3: Easy (简单)
 */
export type Rating = 0 | 1 | 2 | 3;

/**
 * FSRS 卡片状态
 */
export interface CardState {
  /** 难度 (1-5) */
  difficulty: Difficulty;
  /** 稳定性 (天数) */
  stability: number;
  /** 可提取强度 (0-1) */
  retrievability: number;
  /** 下次复习间隔 (天数) */
  interval: number;
  /** 延迟天数 */
  delay: number;
  /** 距离上次复习的天数 */
  elapsedDays: number;
}

/**
 * FSRS 复习记录
 */
export interface ReviewLog {
  /** 复习时间戳 */
  reviewTime: number;
  /** 复习评分 */
  rating: Rating;
  /** 复习前的状态 */
  state: CardState;
  /** 复习后的状态 */
  newState: CardState;
}

/**
 * FSRS 参数配置
 */
export interface FSRSParameters {
  /** 请求保留率 (默认 0.9) */
  requestRetention: number;
  /** 最大间隔 (默认 365 天) */
  maximumInterval: number;
  /** 最小间隔 (默认 1 天) */
  minimumInterval: number;
  /** 学习步长 (默认 [1, 2, 3, 4] 天) */
  learningSteps: number[];
  /** 遗忘学习步长 (默认 [1, 2, 3] 天) */
  forgetSteps: number[];
  /** 难度衰减 (默认 0.5) */
  decay: number;
  /** 难度因子 (默认 1.5) */
  factor: number;
  /** 初始难度 (默认 5) */
  initialDifficulty: Difficulty;
  /** 初始稳定性 (默认 0.4) */
  initialStability: number;
  /** 难度范围 (默认 [1, 10]) */
  difficultyRange: [number, number];
}

/**
 * 默认 FSRS 参数
 */
export const DEFAULT_PARAMS: FSRSParameters = {
  requestRetention: 0.9,
  maximumInterval: 365,
  minimumInterval: 1,
  learningSteps: [1, 2, 3, 4],
  forgetSteps: [1, 2, 3],
  decay: 0.5,
  factor: 1.5,
  initialDifficulty: 5,
  initialStability: 0.4,
  difficultyRange: [1, 10]
};

/**
 * 计算记忆保持率
 * 使用指数衰减模型：R = (1 + decay * days / stability) ^ (-factor)
 */
export function calculateRetrievability(stability: number, elapsedDays: number): number {
  const { decay, factor } = DEFAULT_PARAMS;
  return Math.pow(1 + (decay * elapsedDays) / stability, -factor);
}

/**
 * 计算下次复习间隔
 */
export function calculateInterval(
  stability: number,
  requestRetention: number = DEFAULT_PARAMS.requestRetention
): number {
  const { decay, factor, maximumInterval, minimumInterval } = DEFAULT_PARAMS;

  // 根据保留率反推间隔
  // R = (1 + decay * days / stability) ^ (-factor)
  // days = stability * ((R ^ (-1/factor)) - 1) / decay
  const interval = stability * (Math.pow(requestRetention, -1 / factor) - 1) / decay;

  return Math.max(minimumInterval, Math.min(maximumInterval, Math.round(interval)));
}

/**
 * 计算复习后的难度
 */
export function calculateNextDifficulty(
  currentDifficulty: Difficulty,
  rating: Rating
): Difficulty {
  const { factor, difficultyRange } = DEFAULT_PARAMS;

  // 难度变化公式
  let difficultyChange = 0;

  switch (rating) {
    case 0: // Again
      difficultyChange = -2;
      break;
    case 1: // Hard
      difficultyChange = -1;
      break;
    case 2: // Good
      difficultyChange = 0;
      break;
    case 3: // Easy
      difficultyChange = 1;
      break;
  }

  // 应用难度因子调整
  const newDifficulty = currentDifficulty + difficultyChange * (factor / 2);

  // 限制在有效范围内
  const [minDiff, maxDiff] = difficultyRange;
  return Math.max(minDiff, Math.min(maxDiff, Math.round(newDifficulty))) as Difficulty;
}

/**
 * 计算复习后的稳定性
 */
export function calculateNextStability(
  currentStability: number,
  currentDifficulty: Difficulty,
  rating: Rating,
  elapsedDays: number
): number {
  const { decay, factor } = DEFAULT_PARAMS;

  // 基础稳定性变化
  let stabilityMultiplier = 1;

  // 根据评分调整
  switch (rating) {
    case 0: // Again - 重置稳定性
      return currentStability * 0.5;
    case 1: // Hard - 小幅增加
      stabilityMultiplier = 1.2;
      break;
    case 2: // Good - 正常增加
      stabilityMultiplier = 1.5;
      break;
    case 3: // Easy - 大幅增加
      stabilityMultiplier = 2.0;
      break;
  }

  // 考虑难度影响（难度越高，稳定性增长越慢）
  const difficultyFactor = 1 + (currentDifficulty - 5) * 0.1;

  // 考虑延迟影响（延迟越长，稳定性增长越快）
  const delayFactor = elapsedDays > 0 ? 1 + Math.min(elapsedDays / 30, 0.5) : 1;

  // 计算新稳定性
  const newStability = currentStability * stabilityMultiplier * difficultyFactor * delayFactor;

  return Math.max(0.1, newStability);
}

/**
 * 处理复习
 * @param state 当前卡片状态
 * @param rating 复习评分
 * @param reviewTime 复习时间
 * @returns 新的卡片状态和复习记录
 */
export function processReview(
  state: CardState,
  rating: Rating,
  reviewTime: number = Date.now()
): { state: CardState; log: ReviewLog } {
  const oldState = { ...state };

  // 计算延迟天数
  const delay = Math.max(0, state.delay + (reviewTime - state.elapsedDays * 86400000) / 86400000);

  // 计算新的难度
  const newDifficulty = calculateNextDifficulty(state.difficulty, rating);

  // 计算新的稳定性
  const newStability = calculateNextStability(
    state.stability,
    state.difficulty,
    rating,
    state.elapsedDays
  );

  // 计算新的间隔
  const newInterval = calculateInterval(newStability);

  // 计算新的可提取强度
  const newRetrievability = rating === 0 ? 0 : calculateRetrievability(newStability, 0);

  const newState: CardState = {
    difficulty: newDifficulty,
    stability: newStability,
    retrievability: newRetrievability,
    interval: newInterval,
    delay,
    elapsedDays: newInterval
  };

  const log: ReviewLog = {
    reviewTime,
    rating,
    state: oldState,
    newState
  };

  return { state: newState, log };
}

/**
 * 初始化新卡片状态
 */
export function initializeCardState(): CardState {
  const { initialDifficulty, initialStability } = DEFAULT_PARAMS;

  return {
    difficulty: initialDifficulty,
    stability: initialStability,
    retrievability: 1,
    interval: 0,
    delay: 0,
    elapsedDays: 0
  };
}

/**
 * 从 SM-2 状态转换为 FSRS 状态
 */
export function fromSM2State(sm2State: {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
}): CardState {
  const { easeFactor, interval, repetitions } = sm2State;

  // 将 SM-2 的 EF 因子映射到 FSRS 难度
  const difficulty = Math.max(1, Math.min(5, Math.round((5.5 - easeFactor) * 2))) as Difficulty;

  // 估算稳定性（基于间隔）
  const stability = Math.max(0.1, interval * 0.8);

  return {
    difficulty,
    stability,
    retrievability: calculateRetrievability(stability, interval),
    interval,
    delay: 0,
    elapsedDays: interval
  };
}

/**
 * 转换为 SM-2 状态
 */
export function toSM2State(state: CardState, nextReview: number): {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
} {
  // 将 FSRS 难度映射回 SM-2 的 EF 因子
  const easeFactor = 5.5 - (state.difficulty / 2);

  // 估算重复次数（基于稳定性）
  const repetitions = Math.max(0, Math.round(state.stability / 2));

  return {
    easeFactor,
    interval: state.interval,
    repetitions,
    nextReview
  };
}

/**
 * 预测未来某天的记忆保持率
 */
export function predictRetrievability(
  stability: number,
  daysFromNow: number
): number {
  return calculateRetrievability(stability, daysFromNow);
}

/**
 * 计算最佳复习时间
 * 当记忆保持率降到请求保留率时，即为最佳复习时间
 */
export function calculateOptimalReviewTime(stability: number): number {
  return calculateInterval(stability);
}

/**
 * 批量处理复习记录
 */
export function batchProcessReviews(
  initialState: CardState,
  reviews: Array<{ rating: Rating; timestamp: number }>
): { finalState: CardState; logs: ReviewLog[] } {
  let currentState = { ...initialState };
  const logs: ReviewLog[] = [];

  for (const review of reviews) {
    const result = processReview(currentState, review.rating, review.timestamp);
    currentState = result.state;
    logs.push(result.log);
  }

  return { finalState: currentState, logs };
}

/**
 * 计算学习曲线
 * 返回在不同天数后的记忆保持率
 */
export function calculateLearningCurve(
  stability: number,
  maxDays: number = 30
): Array<{ day: number; retrievability: number }> {
  const curve: Array<{ day: number; retrievability: number }> = [];

  for (let day = 0; day <= maxDays; day++) {
    curve.push({
      day,
      retrievability: calculateRetrievability(stability, day)
    });
  }

  return curve;
}

/**
 * FSRS 算法服务对象
 */
export const fsrsService = {
  // 核心计算
  calculateRetrievability,
  calculateInterval,
  calculateNextDifficulty,
  calculateNextStability,
  processReview,

  // 状态管理
  initializeCardState,
  fromSM2State,
  toSM2State,

  // 预测
  predictRetrievability,
  calculateOptimalReviewTime,
  calculateLearningCurve,

  // 批量处理
  batchProcessReviews,

  // 常量
  DEFAULT_PARAMS
};
