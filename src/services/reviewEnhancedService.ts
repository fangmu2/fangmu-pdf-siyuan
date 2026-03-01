/**
 * 复习增强服务（第十六阶段 - 复习功能增强）
 * 提供复习模式切换、分组、暂停/重置、导出、提醒、目标、成就等功能
 */

import { reviewService } from './reviewService';
import { studySetService } from './studySetService';
import { cardService } from './cardService';
import type { Card, FlashCard } from '../types/card';
import type { ReviewRecord } from '../types/review';
import { getBlock, updateBlockAttrs } from '../api';

// ==================== 类型定义 ====================

/**
 * 复习模式枚举
 */
export enum ReviewMode {
  /** 卡片模式 - 逐张显示卡片 */
  CARD = 'card',
  /** 列表模式 - 显示所有卡片列表 */
  LIST = 'list',
  /** 测试模式 - 隐藏答案直到提交 */
  TEST = 'test'
}

/**
 * 复习分组接口
 */
export interface ReviewGroup {
  /** 分组 ID */
  id: string;
  /** 分组名称 */
  name: string;
  /** 分组描述 */
  description?: string;
  /** 卡片 ID 列表 */
  cardIds: string[];
  /** 所属学习集 ID */
  studySetId: string;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 复习暂停状态接口
 */
export interface ReviewPauseState {
  /** 卡片 ID */
  cardId: string;
  /** 暂停原因 */
  reason: 'user_request' | 'too_difficult' | 'temporary' | 'other';
  /** 暂停时间 */
  pausedAt: number;
  /** 预计恢复时间 */
  resumeAt?: number;
  /** 暂停前的 SRS 状态 */
  previousSRS?: FlashCard['srs'];
}

/**
 * 复习目标接口
 */
export interface ReviewGoal {
  /** 目标 ID */
  id: string;
  /** 目标类型 */
  type: 'daily' | 'weekly' | 'monthly';
  /** 目标数量 */
  targetCount: number;
  /** 当前完成数量 */
  currentCount: number;
  /** 开始时间 */
  startDate: number;
  /** 结束时间 */
  endDate: number;
  /** 是否完成 */
  completed: boolean;
  /** 创建时间 */
  createdAt: number;
}

/**
 * 复习成就接口
 */
export interface ReviewAchievement {
  /** 成就 ID */
  id: string;
  /** 成就名称 */
  name: string;
  /** 成就描述 */
  description: string;
  /** 成就图标 */
  icon: string;
  /** 成就类型 */
  type: 'streak' | 'count' | 'accuracy' | 'time' | 'special';
  /** 达成条件 */
  condition: {
    /** 条件类型 */
    type: string;
    /** 目标值 */
    target: number;
  };
  /** 是否已达成 */
  unlocked: boolean;
  /** 达成时间 */
  unlockedAt?: number;
  /** 进度 */
  progress: number;
}

/**
 * 复习提醒配置接口
 */
export interface ReviewReminder {
  /** 提醒 ID */
  id: string;
  /** 是否启用 */
  enabled: boolean;
  /** 提醒时间（小时） */
  hour: number;
  /** 提醒时间（分钟） */
  minute: number;
  /** 提醒频率 */
  frequency: 'daily' | 'weekdays' | 'weekends';
  /** 最后提醒时间 */
  lastReminderAt?: number;
}

/**
 * 复习导出选项接口
 */
export interface ReviewExportOptions {
  /** 学习集 ID */
  studySetId?: string;
  /** 开始时间 */
  startDate?: number;
  /** 结束时间 */
  endDate?: number;
  /** 导出格式 */
  format: 'csv' | 'excel' | 'json' | 'markdown';
  /** 包含统计数据 */
  includeStats: boolean;
  /** 包含复习历史 */
  includeHistory: boolean;
}

/**
 * 复习会话配置接口
 */
export interface ReviewSessionConfig {
  /** 会话 ID */
  id: string;
  /** 会话模式 */
  mode: ReviewMode;
  /** 学习集 ID */
  studySetId?: string;
  /** 分组 ID */
  groupId?: string;
  /** 最大卡片数量 */
  maxCards: number;
  /** 是否显示答案 */
  showAnswer: boolean;
  /** 是否自动播放 */
  autoPlay: boolean;
  /** 自动播放间隔（秒） */
  autoPlayInterval: number;
}

// ==================== 复习模式服务 ====================

/**
 * 复习模式服务
 */
export class ReviewModeService {
  private static storageKey = 'review-mode-config';

  /**
   * 获取当前复习模式
   */
  static getCurrentMode(): ReviewMode {
    try {
      const config = window.siyuan.storage.get(this.storageKey);
      return config ? JSON.parse(config).mode : ReviewMode.CARD;
    } catch (e) {
      console.error('Failed to load review mode:', e);
      return ReviewMode.CARD;
    }
  }

  /**
   * 设置复习模式
   */
  static setMode(mode: ReviewMode): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify({ mode }));
  }

  /**
   * 获取模式配置
   */
  static getModeConfig(mode: ReviewMode): {
    name: string;
    description: string;
    icon: string;
  } {
    const configs: Record<ReviewMode, { name: string; description: string; icon: string }> = {
      [ReviewMode.CARD]: {
        name: '卡片模式',
        description: '逐张显示卡片，适合专注复习',
        icon: '📇'
      },
      [ReviewMode.LIST]: {
        name: '列表模式',
        description: '显示所有卡片列表，适合快速浏览',
        icon: '📋'
      },
      [ReviewMode.TEST]: {
        name: '测试模式',
        description: '隐藏答案直到提交，适合自测',
        icon: '📝'
      }
    };
    return configs[mode];
  }
}

// ==================== 复习分组服务 ====================

/**
 * 复习分组服务
 */
export class ReviewGroupService {
  private static storageKey = 'review-groups';

  /**
   * 创建复习分组
   */
  static createGroup(
    name: string,
    studySetId: string,
    cardIds: string[] = [],
    description?: string
  ): ReviewGroup {
    const group: ReviewGroup = {
      id: `review-group_${Date.now()}`,
      name,
      description,
      cardIds,
      studySetId,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.saveGroup(group);
    return group;
  }

  /**
   * 更新分组
   */
  static updateGroup(groupId: string, updates: Partial<ReviewGroup>): boolean {
    const groups = this.getAllGroups();
    const index = groups.findIndex(g => g.id === groupId);
    if (index === -1) {
      return false;
    }
    groups[index] = {
      ...groups[index],
      ...updates,
      updatedAt: Date.now()
    };
    this.saveAllGroups(groups);
    return true;
  }

  /**
   * 删除分组
   */
  static deleteGroup(groupId: string): boolean {
    const groups = this.getAllGroups();
    const filtered = groups.filter(g => g.id !== groupId);
    if (filtered.length === groups.length) {
      return false;
    }
    this.saveAllGroups(filtered);
    return true;
  }

  /**
   * 添加卡片到分组
   */
  static addCardToGroup(groupId: string, cardId: string): boolean {
    const group = this.getGroupById(groupId);
    if (!group) {
      return false;
    }
    if (!group.cardIds.includes(cardId)) {
      group.cardIds.push(cardId);
      group.updatedAt = Date.now();
      this.updateGroup(groupId, { cardIds: group.cardIds });
    }
    return true;
  }

  /**
   * 从分组移除卡片
   */
  static removeCardFromGroup(groupId: string, cardId: string): boolean {
    const group = this.getGroupById(groupId);
    if (!group) {
      return false;
    }
    const index = group.cardIds.indexOf(cardId);
    if (index === -1) {
      return false;
    }
    group.cardIds.splice(index, 1);
    group.updatedAt = Date.now();
    this.updateGroup(groupId, { cardIds: group.cardIds });
    return true;
  }

  /**
   * 获取分组
   */
  static getGroupById(groupId: string): ReviewGroup | null {
    return this.getAllGroups().find(g => g.id === groupId) || null;
  }

  /**
   * 获取所有分组
   */
  static getAllGroups(): ReviewGroup[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load review groups:', e);
      return [];
    }
  }

  /**
   * 获取学习集的所有分组
   */
  static getGroupsByStudySet(studySetId: string): ReviewGroup[] {
    return this.getAllGroups().filter(g => g.studySetId === studySetId);
  }

  /**
   * 获取启用的分组
   */
  static getEnabledGroups(): ReviewGroup[] {
    return this.getAllGroups().filter(g => g.enabled);
  }

  /**
   * 保存分组
   */
  private static saveGroup(group: ReviewGroup): void {
    const groups = this.getAllGroups();
    groups.push(group);
    this.saveAllGroups(groups);
  }

  /**
   * 保存所有分组
   */
  private static saveAllGroups(groups: ReviewGroup[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(groups));
  }

  /**
   * 获取分组内的复习队列
   */
  static async getGroupReviewQueue(groupId: string): Promise<FlashCard[]> {
    const group = this.getGroupById(groupId);
    if (!group || !group.enabled) {
      return [];
    }

    const allCards = await cardService.getCardsByStudySet(group.studySetId);
    const groupCards = allCards.filter(c => group.cardIds.includes(c.id)) as FlashCard[];

    return reviewService.getReviewQueue(groupCards);
  }
}

// ==================== 复习暂停服务 ====================

/**
 * 复习暂停服务
 */
export class ReviewPauseService {
  private static storageKey = 'review-pauses';

  /**
   * 暂停卡片复习
   */
  static pauseCard(
    cardId: string,
    reason: ReviewPauseState['reason'] = 'user_request',
    resumeAt?: number
  ): ReviewPauseState {
    const pauseState: ReviewPauseState = {
      cardId,
      reason,
      pausedAt: Date.now(),
      resumeAt
    };
    this.savePauseState(pauseState);
    return pauseState;
  }

  /**
   * 恢复卡片复习
   */
  static resumeCard(cardId: string): boolean {
    const pauses = this.getAllPauseStates();
    const filtered = pauses.filter(p => p.cardId !== cardId);
    if (filtered.length === pauses.length) {
      return false;
    }
    this.saveAllPauseStates(filtered);
    return true;
  }

  /**
   * 获取卡片的暂停状态
   */
  static getPauseState(cardId: string): ReviewPauseState | null {
    return this.getAllPauseStates().find(p => p.cardId === cardId) || null;
  }

  /**
   * 获取所有暂停的卡片
   */
  static getAllPausedCards(): ReviewPauseState[] {
    return this.getAllPauseStates();
  }

  /**
   * 获取需要恢复的卡片
   */
  static getCardsToResume(): ReviewPauseState[] {
    const now = Date.now();
    return this.getAllPauseStates().filter(
      p => p.resumeAt && p.resumeAt <= now
    );
  }

  /**
   * 获取暂停原因统计
   */
  static getPauseStats(): Record<ReviewPauseState['reason'], number> {
    const pauses = this.getAllPauseStates();
    return pauses.reduce((stats, pause) => {
      stats[pause.reason] = (stats[pause.reason] || 0) + 1;
      return stats;
    }, {} as Record<ReviewPauseState['reason'], number>);
  }

  /**
   * 保存暂停状态
   */
  private static savePauseState(state: ReviewPauseState): void {
    const pauses = this.getAllPauseStates();
    // 移除已存在的同一卡片的暂停状态
    const filtered = pauses.filter(p => p.cardId !== state.cardId);
    filtered.push(state);
    this.saveAllPauseStates(filtered);
  }

  /**
   * 保存所有暂停状态
   */
  private static saveAllPauseStates(states: ReviewPauseState[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(states));
  }

  /**
   * 获取所有暂停状态
   */
  private static getAllPauseStates(): ReviewPauseState[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load pause states:', e);
      return [];
    }
  }

  /**
   * 清除已过期且未设置恢复时间的暂停
   */
  static cleanupExpiredPauses(): void {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 86400000);
    const pauses = this.getAllPauseStates();

    const filtered = pauses.filter(p => {
      // 保留有恢复时间且未到期的，或者暂停时间较新的
      return (p.resumeAt && p.resumeAt > now) || p.pausedAt > thirtyDaysAgo;
    });

    this.saveAllPauseStates(filtered);
  }
}

// ==================== 复习目标服务 ====================

/**
 * 复习目标服务
 */
export class ReviewGoalService {
  private static storageKey = 'review-goals';

  /**
   * 创建复习目标
   */
  static createGoal(
    type: ReviewGoal['type'],
    targetCount: number,
    startDate?: number,
    endDate?: number
  ): ReviewGoal {
    const now = Date.now();

    // 如果没有指定时间，根据类型自动计算
    if (!startDate) {
      startDate = now;
    }
    if (!endDate) {
      switch (type) {
        case 'daily':
          endDate = startDate + 86400000;
          break;
        case 'weekly':
          endDate = startDate + (7 * 86400000);
          break;
        case 'monthly':
          endDate = startDate + (30 * 86400000);
          break;
      }
    }

    const goal: ReviewGoal = {
      id: `goal_${Date.now()}`,
      type,
      targetCount,
      currentCount: 0,
      startDate,
      endDate,
      completed: false,
      createdAt: now
    };

    this.saveGoal(goal);
    return goal;
  }

  /**
   * 更新目标进度
   */
  static updateProgress(goalId: string, increment: number = 1): boolean {
    const goal = this.getGoalById(goalId);
    if (!goal) {
      return false;
    }

    goal.currentCount += increment;
    goal.completed = goal.currentCount >= goal.targetCount;

    const goals = this.getAllGoals();
    const index = goals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      goals[index] = goal;
      this.saveAllGoals(goals);
    }

    return true;
  }

  /**
   * 获取目标
   */
  static getGoalById(goalId: string): ReviewGoal | null {
    return this.getAllGoals().find(g => g.id === goalId) || null;
  }

  /**
   * 获取所有目标
   */
  static getAllGoals(): ReviewGoal[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load review goals:', e);
      return [];
    }
  }

  /**
   * 获取当前活跃目标
   */
  static getActiveGoals(): ReviewGoal[] {
    const now = Date.now();
    return this.getAllGoals().filter(
      g => !g.completed && now >= g.startDate && now <= g.endDate
    );
  }

  /**
   * 获取今日目标
   */
  static getTodayGoal(): ReviewGoal | null {
    const now = Date.now();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = todayStart.getTime() + 86400000;

    return this.getAllGoals().find(
      g => g.type === 'daily' &&
           !g.completed &&
           g.startDate >= todayStart.getTime() &&
           g.endDate <= todayEnd
    ) || null;
  }

  /**
   * 获取目标完成率
   */
  static getGoalProgress(goal: ReviewGoal): number {
    return Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100));
  }

  /**
   * 删除目标
   */
  static deleteGoal(goalId: string): boolean {
    const goals = this.getAllGoals();
    const filtered = goals.filter(g => g.id !== goalId);
    if (filtered.length === goals.length) {
      return false;
    }
    this.saveAllGoals(filtered);
    return true;
  }

  /**
   * 保存目标
   */
  private static saveGoal(goal: ReviewGoal): void {
    const goals = this.getAllGoals();
    goals.push(goal);
    this.saveAllGoals(goals);
  }

  /**
   * 保存所有目标
   */
  private static saveAllGoals(goals: ReviewGoal[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(goals));
  }

  /**
   * 清理过期目标
   */
  static cleanupExpiredGoals(): void {
    const now = Date.now();
    const goals = this.getAllGoals();

    // 保留未完成或刚过期的目标（7 天内）
    const filtered = goals.filter(g => {
      return !g.completed || (g.endDate > now - (7 * 86400000));
    });

    this.saveAllGoals(filtered);
  }
}

// ==================== 复习成就服务 ====================

/**
 * 复习成就服务
 */
export class ReviewAchievementService {
  private static storageKey = 'review-achievements';

  /**
   * 系统预设成就
   */
  private static readonly SYSTEM_ACHIEVEMENTS: Omit<ReviewAchievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
    // 连续学习成就
    {
      id: 'streak_3',
      name: '初出茅庐',
      description: '连续学习 3 天',
      icon: '🔥',
      type: 'streak',
      condition: { type: 'streak_days', target: 3 }
    },
    {
      id: 'streak_7',
      name: '持之以恒',
      description: '连续学习 7 天',
      icon: '🔥🔥',
      type: 'streak',
      condition: { type: 'streak_days', target: 7 }
    },
    {
      id: 'streak_30',
      name: '坚持不懈',
      description: '连续学习 30 天',
      icon: '🔥🔥🔥',
      type: 'streak',
      condition: { type: 'streak_days', target: 30 }
    },
    {
      id: 'streak_100',
      name: '百日筑基',
      description: '连续学习 100 天',
      icon: '👑',
      type: 'streak',
      condition: { type: 'streak_days', target: 100 }
    },
    // 复习数量成就
    {
      id: 'count_100',
      name: '百卡精通',
      description: '累计复习 100 张卡片',
      icon: '📚',
      type: 'count',
      condition: { type: 'total_reviews', target: 100 }
    },
    {
      id: 'count_1000',
      name: '千卡大师',
      description: '累计复习 1000 张卡片',
      icon: '📚📚',
      type: 'count',
      condition: { type: 'total_reviews', target: 1000 }
    },
    {
      id: 'count_10000',
      name: '万卡宗师',
      description: '累计复习 10000 张卡片',
      icon: '🏆',
      type: 'count',
      condition: { type: 'total_reviews', target: 10000 }
    },
    // 正确率成就
    {
      id: 'accuracy_90',
      name: '精准记忆',
      description: '单次会话正确率达到 90%',
      icon: '🎯',
      type: 'accuracy',
      condition: { type: 'session_accuracy', target: 90 }
    },
    {
      id: 'accuracy_100',
      name: '完美无缺',
      description: '单次会话正确率达到 100%',
      icon: '💯',
      type: 'accuracy',
      condition: { type: 'session_accuracy', target: 100 }
    },
    // 时间成就
    {
      id: 'time_1hour',
      name: '专注时刻',
      description: '单次学习超过 1 小时',
      icon: '⏰',
      type: 'time',
      condition: { type: 'session_duration', target: 3600 }
    },
    {
      id: 'time_10hours',
      name: '勤学苦练',
      description: '累计学习超过 10 小时',
      icon: '⏰⏰',
      type: 'time',
      condition: { type: 'total_duration', target: 36000 }
    },
    // 特殊成就
    {
      id: 'special_first',
      name: '第一步',
      description: '完成第一次复习',
      icon: '🌟',
      type: 'special',
      condition: { type: 'first_review', target: 1 }
    },
    {
      id: 'special_midnight',
      name: '夜猫子',
      description: '在午夜 0-6 点学习',
      icon: '🦉',
      type: 'special',
      condition: { type: 'midnight_study', target: 1 }
    },
    {
      id: 'special_marathon',
      name: '马拉松',
      description: '一天内复习超过 50 张卡片',
      icon: '🏃',
      type: 'special',
      condition: { type: 'daily_marathon', target: 50 }
    }
  ];

  /**
   * 获取所有成就
   */
  static getAllAchievements(): ReviewAchievement[] {
    const userAchievements = this.getUserAchievements();

    return this.SYSTEM_ACHIEVEMENTS.map(achievement => {
      const userAchievement = userAchievements.find(u => u.id === achievement.id);
      return {
        ...achievement,
        unlocked: userAchievement?.unlocked || false,
        unlockedAt: userAchievement?.unlockedAt,
        progress: userAchievement?.progress || 0
      };
    });
  }

  /**
   * 获取已解锁的成就
   */
  static getUnlockedAchievements(): ReviewAchievement[] {
    return this.getAllAchievements().filter(a => a.unlocked);
  }

  /**
   * 获取成就统计
   */
  static getAchievementStats(): {
    total: number;
    unlocked: number;
    locked: number;
    completionRate: number;
  } {
    const all = this.getAllAchievements();
    const unlocked = all.filter(a => a.unlocked);

    return {
      total: all.length,
      unlocked: unlocked.length,
      locked: all.length - unlocked.length,
      completionRate: Math.round((unlocked.length / all.length) * 100)
    };
  }

  /**
   * 检查并解锁成就
   */
  static async checkAndUnlock(
    type: string,
    value: number,
    stats?: {
      totalReviews?: number;
      streak?: number;
      sessionAccuracy?: number;
      sessionDuration?: number;
      totalDuration?: number;
    }
  ): Promise<ReviewAchievement[]> {
    const unlockedAchievements: ReviewAchievement[] = [];
    const userAchievements = this.getUserAchievements();

    for (const achievement of this.SYSTEM_ACHIEVEMENTS) {
      // 跳过已解锁的
      if (userAchievements.find(u => u.id === achievement.id)?.unlocked) {
        continue;
      }

      let shouldUnlock = false;
      let progress = 0;

      // 根据条件类型检查
      switch (achievement.condition.type) {
        case 'streak_days':
          progress = stats?.streak || 0;
          shouldUnlock = progress >= achievement.condition.target;
          break;
        case 'total_reviews':
          progress = stats?.totalReviews || 0;
          shouldUnlock = progress >= achievement.condition.target;
          break;
        case 'session_accuracy':
          progress = stats?.sessionAccuracy || 0;
          shouldUnlock = progress >= achievement.condition.target;
          break;
        case 'session_duration':
          progress = stats?.sessionDuration || 0;
          shouldUnlock = progress >= achievement.condition.target;
          break;
        case 'total_duration':
          progress = stats?.totalDuration || 0;
          shouldUnlock = progress >= achievement.condition.target;
          break;
        case 'first_review':
          progress = value;
          shouldUnlock = value >= 1;
          break;
        case 'midnight_study':
          const hour = new Date().getHours();
          progress = (hour >= 0 && hour < 6) ? 1 : 0;
          shouldUnlock = progress >= 1;
          break;
        case 'daily_marathon':
          progress = value;
          shouldUnlock = progress >= achievement.condition.target;
          break;
      }

      if (shouldUnlock) {
        const unlockedAchievement: ReviewAchievement = {
          ...achievement,
          unlocked: true,
          unlockedAt: Date.now(),
          progress
        };
        unlockedAchievements.push(unlockedAchievement);

        // 更新用户成就
        const existingIndex = userAchievements.findIndex(u => u.id === achievement.id);
        if (existingIndex !== -1) {
          userAchievements[existingIndex] = unlockedAchievement;
        } else {
          userAchievements.push(unlockedAchievement);
        }
      } else {
        // 更新进度
        const existingIndex = userAchievements.findIndex(u => u.id === achievement.id);
        if (existingIndex !== -1) {
          userAchievements[existingIndex].progress = progress;
        } else {
          userAchievements.push({
            ...achievement,
            unlocked: false,
            progress
          });
        }
      }
    }

    this.saveUserAchievements(userAchievements);
    return unlockedAchievements;
  }

  /**
   * 获取用户成就
   */
  private static getUserAchievements(): Partial<ReviewAchievement>[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load user achievements:', e);
      return [];
    }
  }

  /**
   * 保存用户成就
   */
  private static saveUserAchievements(achievements: Partial<ReviewAchievement>[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(achievements));
  }
}

// ==================== 复习提醒服务 ====================

/**
 * 复习提醒服务
 */
export class ReviewReminderService {
  private static storageKey = 'review-reminders';
  private static notificationPermissionRequested = false;

  /**
   * 获取提醒配置
   */
  static getReminders(): ReviewReminder[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load reminders:', e);
      return [];
    }
  }

  /**
   * 创建提醒
   */
  static createReminder(
    hour: number,
    minute: number,
    frequency: ReviewReminder['frequency'] = 'daily'
  ): ReviewReminder {
    const reminder: ReviewReminder = {
      id: `reminder_${Date.now()}`,
      enabled: true,
      hour,
      minute,
      frequency
    };
    this.saveReminder(reminder);
    return reminder;
  }

  /**
   * 更新提醒
   */
  static updateReminder(reminderId: string, updates: Partial<ReviewReminder>): boolean {
    const reminders = this.getReminders();
    const index = reminders.findIndex(r => r.id === reminderId);
    if (index === -1) {
      return false;
    }
    reminders[index] = { ...reminders[index], ...updates };
    this.saveReminders(reminders);
    return true;
  }

  /**
   * 删除提醒
   */
  static deleteReminder(reminderId: string): boolean {
    const reminders = this.getReminders();
    const filtered = reminders.filter(r => r.id !== reminderId);
    if (filtered.length === reminders.length) {
      return false;
    }
    this.saveReminders(filtered);
    return true;
  }

  /**
   * 启用/禁用提醒
   */
  static toggleReminder(reminderId: string, enabled: boolean): boolean {
    return this.updateReminder(reminderId, { enabled });
  }

  /**
   * 请求通知权限
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('浏览器不支持通知');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (e) {
        console.error('请求通知权限失败:', e);
        return false;
      }
    }

    return false;
  }

  /**
   * 发送复习提醒
   */
  static async sendReminder(dueCount: number): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    const title = `复习提醒`;
    const body = `你有 ${dueCount} 张卡片需要复习`;

    try {
      await new Notification(title, {
        body,
        icon: '/icon.png',
        tag: 'review-reminder',
        requireInteraction: false
      });
    } catch (e) {
      console.error('发送通知失败:', e);
    }
  }

  /**
   * 检查并发送提醒
   */
  static async checkAndSendReminders(dueCount: number): Promise<void> {
    if (dueCount === 0) {
      return;
    }

    const reminders = this.getReminders().filter(r => r.enabled);
    if (reminders.length === 0) {
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    for (const reminder of reminders) {
      // 检查是否应该发送提醒
      const shouldSend =
        reminder.hour === currentHour &&
        reminder.minute === currentMinute &&
        this.shouldSendToday(reminder.frequency, currentDay);

      if (shouldSend) {
        // 检查是否已经发送过（避免重复）
        const lastReminder = reminder.lastReminderAt || 0;
        const oneHourAgo = Date.now() - 3600000;

        if (lastReminder < oneHourAgo) {
          await this.sendReminder(dueCount);
          this.updateReminder(reminder.id, { lastReminderAt: Date.now() });
        }
      }
    }
  }

  /**
   * 判断是否应该在今天发送
   */
  private static shouldSendToday(frequency: ReviewReminder['frequency'], day: number): boolean {
    switch (frequency) {
      case 'daily':
        return true;
      case 'weekdays':
        return day >= 1 && day <= 5;
      case 'weekends':
        return day === 0 || day === 6;
      default:
        return true;
    }
  }

  /**
   * 保存提醒
   */
  private static saveReminder(reminder: ReviewReminder): void {
    const reminders = this.getReminders();
    reminders.push(reminder);
    this.saveReminders(reminders);
  }

  /**
   * 保存所有提醒
   */
  private static saveReminders(reminders: ReviewReminder[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(reminders));
  }
}

// ==================== 复习导出服务 ====================

/**
 * 复习导出服务
 */
export class ReviewExportService {
  /**
   * 导出复习数据
   */
  static async exportReviewData(options: ReviewExportOptions): Promise<{
    success: boolean;
    content?: string;
    filename: string;
    mimeType: string;
  }> {
    try {
      const { studySetId, startDate, endDate, format, includeStats, includeHistory } = options;

      // 获取复习记录
      let records: ReviewRecord[] = [];
      if (startDate && endDate) {
        const { getReviewRecordsByDateRange } = await import('./dataPersistenceService');
        records = await getReviewRecordsByDateRange(startDate, endDate);
      } else {
        // 获取所有记录
        const { getReviewRecordsByDateRange } = await import('./dataPersistenceService');
        records = await getReviewRecordsByDateRange(0, Date.now());
      }

      // 按学习集筛选
      if (studySetId) {
        records = records.filter(r => r.studySetId === studySetId);
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'csv':
          content = this.exportToCSV(records, includeStats);
          filename = `复习记录_${this.formatDate(new Date())}.csv`;
          mimeType = 'text/csv';
          break;
        case 'excel':
          // Excel 需要特殊库，这里导出为 CSV 但使用 Excel 兼容格式
          content = this.exportToExcelCSV(records, includeStats);
          filename = `复习记录_${this.formatDate(new Date())}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          content = this.exportToJSON(records, includeStats, includeHistory);
          filename = `复习记录_${this.formatDate(new Date())}.json`;
          mimeType = 'application/json';
          break;
        case 'markdown':
          content = this.exportToMarkdown(records, includeStats);
          filename = `复习记录_${this.formatDate(new Date())}.md`;
          mimeType = 'text/markdown';
          break;
        default:
          content = this.exportToCSV(records, includeStats);
          filename = `复习记录_${this.formatDate(new Date())}.csv`;
          mimeType = 'text/csv';
      }

      return {
        success: true,
        content,
        filename,
        mimeType
      };
    } catch (error) {
      console.error('导出复习数据失败:', error);
      return {
        success: false,
        filename: '',
        mimeType: 'text/plain',
        content: `导出失败：${error}`
      };
    }
  }

  /**
   * 导出为 CSV
   */
  private static exportToCSV(records: ReviewRecord[], includeStats: boolean): string {
    const headers = ['ID', '卡片 ID', '学习集 ID', '质量', '时间', '是否正确', '复习时间'];
    const rows = records.map(r => [
      r.id,
      r.cardId,
      r.studySetId,
      r.quality,
      r.timeSpent,
      r.correct ? '是' : '否',
      this.formatDate(new Date(r.reviewedAt))
    ]);

    if (includeStats) {
      const stats = this.calculateStats(records);
      rows.push([]);
      rows.push(['统计']);
      rows.push(['总复习数', stats.totalReviews.toString()]);
      rows.push(['正确数', stats.correctCount.toString()]);
      rows.push(['错误数', stats.incorrectCount.toString()]);
      rows.push(['正确率', `${stats.accuracyRate}%`]);
      rows.push(['总时间 (秒)', stats.totalTimeSpent.toString()]);
    }

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * 导出为 Excel 兼容 CSV（使用制表符分隔）
   */
  private static exportToExcelCSV(records: ReviewRecord[], includeStats: boolean): string {
    const headers = ['ID\t卡片 ID\t学习集 ID\t质量\t时间 (秒)\t是否正确\t复习时间'];
    const rows = records.map(r => [
      r.id,
      r.cardId,
      r.studySetId,
      r.quality,
      r.timeSpent,
      r.correct ? '是' : '否',
      this.formatDate(new Date(r.reviewedAt))
    ].join('\t'));

    if (includeStats) {
      const stats = this.calculateStats(records);
      rows.push('');
      rows.push('统计');
      rows.push(`总复习数\t${stats.totalReviews}`);
      rows.push(`正确数\t${stats.correctCount}`);
      rows.push(`错误数\t${stats.incorrectCount}`);
      rows.push(`正确率\t${stats.accuracyRate}%`);
      rows.push(`总时间 (秒)\t${stats.totalTimeSpent}`);
    }

    return [...headers, ...rows].join('\n');
  }

  /**
   * 导出为 JSON
   */
  private static exportToJSON(
    records: ReviewRecord[],
    includeStats: boolean,
    includeHistory: boolean
  ): string {
    const data: any = {
      exportDate: new Date().toISOString(),
      recordCount: records.length,
      records
    };

    if (includeStats) {
      data.stats = this.calculateStats(records);
    }

    if (includeHistory) {
      // 按卡片分组的历史
      data.historyByCard = records.reduce((acc, record) => {
        if (!acc[record.cardId]) {
          acc[record.cardId] = [];
        }
        acc[record.cardId].push(record);
        return acc;
      }, {} as Record<string, ReviewRecord[]>);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * 导出为 Markdown
   */
  private static exportToMarkdown(records: ReviewRecord[], includeStats: boolean): string {
    let md = `# 复习记录\n\n`;
    md += `导出时间：${this.formatDate(new Date())}\n\n`;
    md += `记录数量：${records.length}\n\n`;

    if (includeStats) {
      const stats = this.calculateStats(records);
      md += `## 统计\n\n`;
      md += `- 总复习数：${stats.totalReviews}\n`;
      md += `- 正确数：${stats.correctCount}\n`;
      md += `- 错误数：${stats.incorrectCount}\n`;
      md += `- 正确率：${stats.accuracyRate}%\n`;
      md += `- 总时间：${this.formatDuration(stats.totalTimeSpent)}\n\n`;
    }

    md += `## 复习记录\n\n`;
    md += `| 时间 | 卡片 ID | 学习集 | 质量 | 时间 | 结果 |\n`;
    md += `|------|--------|--------|------|------|------|\n`;

    for (const record of records) {
      md += `| ${this.formatDate(new Date(record.reviewedAt))} | ${record.cardId} | ${record.studySetId} | ${record.quality} | ${record.timeSpent}s | ${record.correct ? '✅' : '❌'} |\n`;
    }

    return md;
  }

  /**
   * 计算统计数据
   */
  private static calculateStats(records: ReviewRecord[]): {
    totalReviews: number;
    correctCount: number;
    incorrectCount: number;
    accuracyRate: number;
    totalTimeSpent: number;
    averageQuality: number;
  } {
    const totalReviews = records.length;
    const correctCount = records.filter(r => r.correct).length;
    const incorrectCount = totalReviews - correctCount;
    const accuracyRate = totalReviews > 0 ? Math.round((correctCount / totalReviews) * 100) : 0;
    const totalTimeSpent = records.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
    const averageQuality = totalReviews > 0
      ? Math.round((records.reduce((sum, r) => sum + r.quality, 0) / totalReviews) * 100) / 100
      : 0;

    return {
      totalReviews,
      correctCount,
      incorrectCount,
      accuracyRate,
      totalTimeSpent,
      averageQuality
    };
  }

  /**
   * 格式化日期
   */
  private static formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * 格式化时长
   */
  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  }

  /**
   * 下载文件
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// ==================== 复习会话服务 ====================

/**
 * 复习会话服务
 */
export class ReviewSessionService {
  private static currentSession: ReviewSessionConfig | null = null;

  /**
   * 创建复习会话
   */
  static createSession(config: Partial<ReviewSessionConfig>): ReviewSessionConfig {
    const session: ReviewSessionConfig = {
      id: `session_${Date.now()}`,
      mode: config.mode || ReviewMode.CARD,
      studySetId: config.studySetId,
      groupId: config.groupId,
      maxCards: config.maxCards || 20,
      showAnswer: config.showAnswer !== false,
      autoPlay: config.autoPlay || false,
      autoPlayInterval: config.autoPlayInterval || 5
    };

    this.currentSession = session;
    return session;
  }

  /**
   * 获取当前会话
   */
  static getCurrentSession(): ReviewSessionConfig | null {
    return this.currentSession;
  }

  /**
   * 结束当前会话
   */
  static endSession(): void {
    this.currentSession = null;
  }

  /**
   * 获取会话配置
   */
  static getSessionConfig(mode: ReviewMode): Partial<ReviewSessionConfig> {
    const configs: Record<ReviewMode, Partial<ReviewSessionConfig>> = {
      [ReviewMode.CARD]: {
        maxCards: 20,
        showAnswer: true,
        autoPlay: false
      },
      [ReviewMode.LIST]: {
        maxCards: 100,
        showAnswer: true,
        autoPlay: false
      },
      [ReviewMode.TEST]: {
        maxCards: 10,
        showAnswer: false,
        autoPlay: false
      }
    };
    return configs[mode];
  }
}

// ==================== 导出服务 ====================

export const reviewEnhancedService = {
  // 模式服务
  ReviewModeService,

  // 分组服务
  ReviewGroupService,

  // 暂停服务
  ReviewPauseService,

  // 目标服务
  ReviewGoalService,

  // 成就服务
  ReviewAchievementService,

  // 提醒服务
  ReviewReminderService,

  // 导出服务
  ReviewExportService,

  // 会话服务
  ReviewSessionService
};

// 类型导出
export {
  ReviewMode,
  ReviewGroup,
  ReviewPauseState,
  ReviewGoal,
  ReviewAchievement,
  ReviewReminder,
  ReviewExportOptions,
  ReviewSessionConfig
};

export default reviewEnhancedService;
