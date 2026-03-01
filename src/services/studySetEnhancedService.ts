/**
 * 学习集增强服务（第十六阶段 - 学习集功能增强）
 * 提供学习集分组、颜色标签、排序、收藏、统计图表、时间线、对比等功能
 */

import { sql, getBlock } from '../api';

/**
 * 学习集分组接口
 */
export interface StudySetGroup {
  /** 分组 ID */
  id: string;
  /** 分组名称 */
  name: string;
  /** 分组描述 */
  description?: string;
  /** 分组颜色 */
  color?: string;
  /** 分组图标 */
  icon?: string;
  /** 学习集 ID 列表 */
  studySetIds: string[];
  /** 父分组 ID（支持嵌套分组） */
  parentId?: string;
  /** 排序索引 */
  orderIndex: number;
  /** 是否展开 */
  expanded: boolean;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 学习集颜色标签
 */
export interface StudySetColorTag {
  /** 标签 ID */
  id: string;
  /** 标签名称 */
  name: string;
  /** 标签颜色 */
  color: string;
  /** 标签图标 */
  icon?: string;
  /** 学习集 ID 列表 */
  studySetIds: string[];
  /** 创建时间 */
  createdAt: number;
}

/**
 * 学习集收藏接口
 */
export interface StudySetFavorite {
  /** 收藏 ID */
  id: string;
  /** 学习集 ID */
  studySetId: string;
  /** 收藏备注 */
  note?: string;
  /** 收藏时间 */
  favoritedAt: number;
  /** 最后访问时间 */
  lastAccessedAt: number;
  /** 访问次数 */
  accessCount: number;
}

/**
 * 学习集统计信息
 */
export interface StudySetStats {
  /** 学习集 ID */
  studySetId: string;
  /** 总卡片数 */
  totalCards: number;
  /** 新卡片数 */
  newCards: number;
  /** 学习中卡片数 */
  learningCards: number;
  /** 已掌握卡片数 */
  masteredCards: number;
  /** 总复习次数 */
  totalReviews: number;
  /** 今日复习数 */
  todayReviews: number;
  /** 平均难度 */
  averageDifficulty: number;
  /** 掌握率 */
  masteryRate: number;
  /** 学习时长（分钟） */
  studyTimeMinutes: number;
  /** 连续学习天数 */
  streakDays: number;
  /** 最后学习时间 */
  lastStudyAt: number | null;
  /** 创建时间 */
  createdAt: number;
}

/**
 * 学习集时间线条目
 */
export interface StudySetTimelineItem {
  /** 条目 ID */
  id: string;
  /** 时间戳 */
  timestamp: number;
  /** 事件类型 */
  eventType: 'card_created' | 'card_reviewed' | 'study_set_created' | 'milestone';
  /** 事件标题 */
  title: string;
  /** 事件描述 */
  description?: string;
  /** 关联卡片 ID */
  cardId?: string;
  /** 关联学习集 ID */
  studySetId: string;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 学习集对比结果
 */
export interface StudySetComparison {
  /** 学习集 ID 列表 */
  studySetIds: string[];
  /** 对比时间 */
  comparedAt: number;
  /** 各学习集统计 */
  stats: Record<string, StudySetStats>;
  /** 对比指标 */
  metrics: {
    /** 卡片总数排名 */
    totalCardsRank: { studySetId: string; value: number; rank: number }[];
    /** 掌握率排名 */
    masteryRateRank: { studySetId: string; value: number; rank: number }[];
    /** 复习次数排名 */
    totalReviewsRank: { studySetId: string; value: number; rank: number }[];
    /** 平均难度排名 */
    averageDifficultyRank: { studySetId: string; value: number; rank: number }[];
    /** 学习时长排名 */
    studyTimeRank: { studySetId: string; value: number; rank: number }[];
  };
}

/**
 * 学习集排序配置
 */
export interface StudySetSortConfig {
  /** 排序字段 */
  field: 'name' | 'createdAt' | 'updatedAt' | 'lastStudyAt' | 'totalCards' | 'masteryRate' | 'orderIndex';
  /** 排序方向 */
  direction: 'asc' | 'desc';
  /** 是否启用自定义排序 */
  useCustomOrder: boolean;
}

// ==================== 学习集分组服务 ====================

/**
 * 学习集分组服务
 */
export class StudySetGroupService {
  private static storageKey = 'studyset-groups';

  /**
   * 创建分组
   */
  static createGroup(
    name: string,
    parentId?: string,
    description?: string,
    color?: string,
    icon?: string
  ): StudySetGroup {
    const groups = this.getAllGroups();
    const maxOrder = Math.max(...groups.map(g => g.orderIndex), 0);

    const group: StudySetGroup = {
      id: `group_${Date.now()}`,
      name,
      description,
      color,
      icon,
      studySetIds: [],
      parentId,
      orderIndex: maxOrder + 1,
      expanded: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.saveGroup(group);
    return group;
  }

  /**
   * 更新分组
   */
  static updateGroup(groupId: string, updates: Partial<StudySetGroup>): boolean {
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
  static deleteGroup(groupId: string, moveOrphansToRoot: boolean = true): boolean {
    const groups = this.getAllGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return false;
    }

    // 处理子分组
    if (moveOrphansToRoot) {
      const childGroups = groups.filter(g => g.parentId === groupId);
      childGroups.forEach(child => {
        child.parentId = undefined;
      });
    }

    // 删除分组
    const filtered = groups.filter(g => g.id !== groupId && g.parentId !== groupId);
    this.saveAllGroups(filtered);
    return true;
  }

  /**
   * 添加学习集到分组
   */
  static addStudySetToGroup(groupId: string, studySetId: string): boolean {
    const group = this.getGroupById(groupId);
    if (!group) {
      return false;
    }

    if (!group.studySetIds.includes(studySetId)) {
      group.studySetIds.push(studySetId);
      group.updatedAt = Date.now();
      this.updateGroup(groupId, { studySetIds: group.studySetIds });
    }

    return true;
  }

  /**
   * 从分组移除学习集
   */
  static removeStudySetFromGroup(groupId: string, studySetId: string): boolean {
    const group = this.getGroupById(groupId);
    if (!group) {
      return false;
    }

    const index = group.studySetIds.indexOf(studySetId);
    if (index === -1) {
      return false;
    }

    group.studySetIds.splice(index, 1);
    group.updatedAt = Date.now();
    this.updateGroup(groupId, { studySetIds: group.studySetIds });
    return true;
  }

  /**
   * 获取分组
   */
  static getGroupById(groupId: string): StudySetGroup | null {
    return this.getAllGroups().find(g => g.id === groupId) || null;
  }

  /**
   * 获取所有分组（树形结构）
   */
  static getAllGroupsTree(): Array<StudySetGroup & { children: StudySetGroup[] }> {
    const groups = this.getAllGroups();
    const rootGroups = groups.filter(g => !g.parentId);

    return rootGroups.map(root => ({
      ...root,
      children: this.getChildrenGroups(root.id, groups)
    }));
  }

  /**
   * 获取所有分组（扁平列表）
   */
  static getAllGroups(): StudySetGroup[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load study set groups:', e);
      return [];
    }
  }

  /**
   * 获取分组的子分组
   */
  private static getChildrenGroups(parentId: string, allGroups: StudySetGroup[]): StudySetGroup[] {
    const children = allGroups.filter(g => g.parentId === parentId);
    return children.map(child => ({
      ...child,
      children: this.getChildrenGroups(child.id, allGroups)
    })) as any;
  }

  /**
   * 获取学习集所在的分组
   */
  static getGroupsByStudySet(studySetId: string): StudySetGroup[] {
    return this.getAllGroups().filter(g => g.studySetIds.includes(studySetId));
  }

  /**
   * 保存分组
   */
  private static saveGroup(group: StudySetGroup): void {
    const groups = this.getAllGroups();
    groups.push(group);
    this.saveAllGroups(groups);
  }

  /**
   * 保存所有分组
   */
  private static saveAllGroups(groups: StudySetGroup[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(groups));
  }
}

// ==================== 学习集颜色标签服务 ====================

/**
 * 学习集颜色标签服务
 */
export class StudySetColorTagService {
  private static storageKey = 'studyset-color-tags';

  /**
   * 预设颜色标签
   */
  private static readonly PRESET_TAGS: StudySetColorTag[] = [
    { id: 'tag_red', name: '重要', color: '#ef4444', icon: '🔴', studySetIds: [], createdAt: Date.now() },
    { id: 'tag_orange', name: '紧急', color: '#f97316', icon: '🟠', studySetIds: [], createdAt: Date.now() },
    { id: 'tag_yellow', name: '注意', color: '#eab308', icon: '🟡', studySetIds: [], createdAt: Date.now() },
    { id: 'tag_green', name: '完成', color: '#22c55e', icon: '🟢', studySetIds: [], createdAt: Date.now() },
    { id: 'tag_blue', name: '学习', color: '#3b82f6', icon: '🔵', studySetIds: [], createdAt: Date.now() },
    { id: 'tag_purple', name: '复习', color: '#a855f7', icon: '🟣', studySetIds: [], createdAt: Date.now() }
  ];

  /**
   * 创建颜色标签
   */
  static createTag(name: string, color: string, icon?: string): StudySetColorTag {
    const tags = this.getCustomTags();
    const tag: StudySetColorTag = {
      id: `colortag_${Date.now()}`,
      name,
      color,
      icon,
      studySetIds: [],
      createdAt: Date.now()
    };
    tags.push(tag);
    this.saveCustomTags(tags);
    return tag;
  }

  /**
   * 更新颜色标签
   */
  static updateTag(tagId: string, updates: Partial<StudySetColorTag>): boolean {
    const tags = this.getAllTags();
    const index = tags.findIndex(t => t.id === tagId);
    if (index === -1) {
      return false;
    }
    tags[index] = { ...tags[index], ...updates };
    this.saveAllTags(tags);
    return true;
  }

  /**
   * 删除颜色标签
   */
  static deleteTag(tagId: string): boolean {
    const tags = this.getAllTags();
    const filtered = tags.filter(t => t.id !== tagId);
    if (filtered.length === tags.length) {
      return false;
    }
    this.saveAllTags(filtered);
    return true;
  }

  /**
   * 为学习集添加标签
   */
  static addTagToStudySet(tagId: string, studySetId: string): boolean {
    const tags = this.getAllTags();
    const tag = tags.find(t => t.id === tagId);
    if (!tag) {
      return false;
    }

    if (!tag.studySetIds.includes(studySetId)) {
      tag.studySetIds.push(studySetId);
      this.saveAllTags(tags);
    }

    return true;
  }

  /**
   * 从学习集移除标签
   */
  static removeTagFromStudySet(tagId: string, studySetId: string): boolean {
    const tags = this.getAllTags();
    const tag = tags.find(t => t.id === tagId);
    if (!tag) {
      return false;
    }

    const index = tag.studySetIds.indexOf(studySetId);
    if (index === -1) {
      return false;
    }

    tag.studySetIds.splice(index, 1);
    this.saveAllTags(tags);
    return true;
  }

  /**
   * 获取学习集的所有标签
   */
  static getTagsByStudySet(studySetId: string): StudySetColorTag[] {
    return this.getAllTags().filter(t => t.studySetIds.includes(studySetId));
  }

  /**
   * 获取所有标签（预设 + 自定义）
   */
  static getAllTags(): StudySetColorTag[] {
    const customTags = this.getCustomTags();
    return [...this.PRESET_TAGS, ...customTags];
  }

  /**
   * 获取自定义标签
   */
  private static getCustomTags(): StudySetColorTag[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load custom color tags:', e);
      return [];
    }
  }

  /**
   * 保存自定义标签
   */
  private static saveCustomTags(tags: StudySetColorTag[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(tags));
  }

  /**
   * 保存所有标签
   */
  private static saveAllTags(tags: StudySetColorTag[]): void {
    // 只保存自定义标签
    const customTags = tags.filter(t => !this.PRESET_TAGS.find(p => p.id === t.id));
    this.saveCustomTags(customTags);
  }
}

// ==================== 学习集收藏服务 ====================

/**
 * 学习集收藏服务
 */
export class StudySetFavoriteService {
  private static storageKey = 'studyset-favorites';

  /**
   * 收藏学习集
   */
  static addFavorite(studySetId: string, note?: string): StudySetFavorite {
    const favorites = this.getAllFavorites();

    // 检查是否已收藏
    const existing = favorites.find(f => f.studySetId === studySetId);
    if (existing) {
      return existing;
    }

    const favorite: StudySetFavorite = {
      id: `fav_${Date.now()}`,
      studySetId,
      note,
      favoritedAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 1
    };

    favorites.push(favorite);
    this.saveAllFavorites(favorites);
    return favorite;
  }

  /**
   * 取消收藏
   */
  static removeFavorite(studySetId: string): boolean {
    const favorites = this.getAllFavorites();
    const filtered = favorites.filter(f => f.studySetId !== studySetId);
    if (filtered.length === favorites.length) {
      return false;
    }
    this.saveAllFavorites(filtered);
    return true;
  }

  /**
   * 检查是否已收藏
   */
  static isFavorite(studySetId: string): boolean {
    return this.getAllFavorites().some(f => f.studySetId === studySetId);
  }

  /**
   * 更新收藏备注
   */
  static updateNote(studySetId: string, note: string): boolean {
    const favorites = this.getAllFavorites();
    const favorite = favorites.find(f => f.studySetId === studySetId);
    if (!favorite) {
      return false;
    }
    favorite.note = note;
    this.saveAllFavorites(favorites);
    return true;
  }

  /**
   * 记录访问
   */
  static recordAccess(studySetId: string): void {
    const favorites = this.getAllFavorites();
    const favorite = favorites.find(f => f.studySetId === studySetId);
    if (favorite) {
      favorite.lastAccessedAt = Date.now();
      favorite.accessCount++;
      this.saveAllFavorites(favorites);
    }
  }

  /**
   * 获取所有收藏（按最后访问时间排序）
   */
  static getAllFavorites(): StudySetFavorite[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      const favorites = data ? JSON.parse(data) : [];
      return favorites.sort((a: StudySetFavorite, b: StudySetFavorite) =>
        b.lastAccessedAt - a.lastAccessedAt
      );
    } catch (e) {
      console.error('Failed to load favorites:', e);
      return [];
    }
  }

  /**
   * 获取收藏的学习集 ID 列表
   */
  static getFavoriteStudySetIds(): string[] {
    return this.getAllFavorites().map(f => f.studySetId);
  }

  /**
   * 保存所有收藏
   */
  private static saveAllFavorites(favorites: StudySetFavorite[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(favorites));
  }
}

// ==================== 学习集统计服务 ====================

/**
 * 学习集统计服务（增强版）
 */
export class StudySetStatsEnhancedService {
  /**
   * 获取学习集详细统计
   */
  static async getDetailedStats(studySetId: string): Promise<StudySetStats | null> {
    try {
      // 查询学习集下的所有卡片
      const stmt = `SELECT * FROM blocks WHERE custom-card-study-set-id = '${studySetId}'`;
      const result = await sql({ stmt });

      if (!result || result.length === 0) {
        return this.createEmptyStats(studySetId);
      }

      const cards = result;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime();

      // 统计各项数据
      let totalCards = cards.length;
      let newCards = 0;
      let learningCards = 0;
      let masteredCards = 0;
      let totalReviews = 0;
      let todayReviews = 0;
      let totalDifficulty = 0;
      let studyTimeMinutes = 0;

      cards.forEach((card: any) => {
        // 统计状态
        const status = card['custom-card-status'] as string || 'new';
        if (status === 'new') newCards++;
        else if (status === 'learning') learningCards++;
        else if (status === 'review' || status === 'mastered') masteredCards++;

        // 统计复习次数
        const reviewCount = parseInt(card['custom-card-review-count']) || 0;
        totalReviews += reviewCount;

        // 统计今日复习
        const lastReviewAt = parseInt(card['custom-card-last-review-at']) || 0;
        if (lastReviewAt >= todayStart) {
          todayReviews++;
        }

        // 统计难度
        const difficulty = parseInt(card['custom-card-difficulty']) || 1;
        totalDifficulty += difficulty;
      });

      const averageDifficulty = totalCards > 0 ? totalDifficulty / totalCards : 0;
      const masteryRate = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;

      // 获取学习集信息
      const studySetBlock = await getBlock(studySetId);
      const createdAt = studySetBlock ? parseInt(studySetBlock.created) : Date.now();

      // 计算连续学习天数
      const streakDays = this.calculateStreak(cards);

      // 获取最后学习时间
      const lastStudyAt = cards.reduce((max: number, card: any) => {
        const lastReviewAt = parseInt(card['custom-card-last-review-at']) || 0;
        return Math.max(max, lastReviewAt);
      }, 0);

      return {
        studySetId,
        totalCards,
        newCards,
        learningCards,
        masteredCards,
        totalReviews,
        todayReviews,
        averageDifficulty,
        masteryRate,
        studyTimeMinutes,
        streakDays,
        lastStudyAt: lastStudyAt || null,
        createdAt
      };
    } catch (error) {
      console.error('[StudySetStatsEnhancedService] 获取统计失败:', error);
      return this.createEmptyStats(studySetId);
    }
  }

  /**
   * 获取多个学习集的统计
   */
  static async getMultipleStats(studySetIds: string[]): Promise<Record<string, StudySetStats>> {
    const stats: Record<string, StudySetStats> = {};

    for (const studySetId of studySetIds) {
      stats[studySetId] = await this.getDetailedStats(studySetId) || this.createEmptyStats(studySetId);
    }

    return stats;
  }

  /**
   * 对比学习集
   */
  static async compareStudySets(studySetIds: string[]): Promise<StudySetComparison> {
    const stats = await this.getMultipleStats(studySetIds);

    // 生成排名
    const rankBy = (field: keyof StudySetStats) => {
      return studySetIds
        .map(id => ({ studySetId: id, value: stats[id][field] as number || 0 }))
        .sort((a, b) => b.value - a.value)
        .map((item, index) => ({ ...item, rank: index + 1 }));
    };

    return {
      studySetIds,
      comparedAt: Date.now(),
      stats,
      metrics: {
        totalCardsRank: rankBy('totalCards'),
        masteryRateRank: rankBy('masteryRate'),
        totalReviewsRank: rankBy('totalReviews'),
        averageDifficultyRank: rankBy('averageDifficulty'),
        studyTimeRank: rankBy('studyTimeMinutes')
      }
    };
  }

  /**
   * 创建空统计
   */
  private static createEmptyStats(studySetId: string): StudySetStats {
    return {
      studySetId,
      totalCards: 0,
      newCards: 0,
      learningCards: 0,
      masteredCards: 0,
      totalReviews: 0,
      todayReviews: 0,
      averageDifficulty: 0,
      masteryRate: 0,
      studyTimeMinutes: 0,
      streakDays: 0,
      lastStudyAt: null,
      createdAt: Date.now()
    };
  }

  /**
   * 计算连续学习天数
   */
  private static calculateStreak(cards: any[]): number {
    const studyDates = new Set<number>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    cards.forEach((card: any) => {
      const lastReviewAt = parseInt(card['custom-card-last-review-at']) || 0;
      if (lastReviewAt > 0) {
        const date = new Date(lastReviewAt);
        date.setHours(0, 0, 0, 0);
        studyDates.add(date.getTime());
      }
    });

    if (studyDates.size === 0) return 0;

    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateTimestamp = currentDate.getTime();
      if (studyDates.has(dateTimestamp)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (dateTimestamp === today.getTime()) {
        // 今天还没有学习记录，继续检查昨天
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }
}

// ==================== 学习集时间线服务 ====================

/**
 * 学习集时间线服务
 */
export class StudySetTimelineService {
  private static storageKeyPrefix = 'studyset-timeline-';

  /**
   * 添加时间线条目
   */
  static addTimelineItem(
    studySetId: string,
    eventType: StudySetTimelineItem['eventType'],
    title: string,
    description?: string,
    cardId?: string,
    metadata?: Record<string, any>
  ): StudySetTimelineItem {
    const items = this.getTimelineItems(studySetId);

    const item: StudySetTimelineItem = {
      id: `timeline_${Date.now()}`,
      timestamp: Date.now(),
      eventType,
      title,
      description,
      cardId,
      studySetId,
      metadata
    };

    items.push(item);
    this.saveTimelineItems(studySetId, items);
    return item;
  }

  /**
   * 获取时间线条目
   */
  static getTimelineItems(studySetId: string, limit: number = 100): StudySetTimelineItem[] {
    try {
      const data = window.siyuan.storage.get(`${this.storageKeyPrefix}${studySetId}`);
      const items = data ? JSON.parse(data) : [];
      return items.sort((a: StudySetTimelineItem, b: StudySetTimelineItem) =>
        b.timestamp - a.timestamp
      ).slice(0, limit);
    } catch (e) {
      console.error('Failed to load timeline items:', e);
      return [];
    }
  }

  /**
   * 删除时间线条目
   */
  static deleteTimelineItem(studySetId: string, itemId: string): boolean {
    const items = this.getTimelineItems(studySetId);
    const filtered = items.filter(i => i.id !== itemId);
    if (filtered.length === items.length) {
      return false;
    }
    this.saveTimelineItems(studySetId, filtered);
    return true;
  }

  /**
   * 清除时间线
   */
  static clearTimeline(studySetId: string): void {
    window.siyuan.storage.remove(`${this.storageKeyPrefix}${studySetId}`);
  }

  /**
   * 保存时间线条目
   */
  private static saveTimelineItems(studySetId: string, items: StudySetTimelineItem[]): void {
    window.siyuan.storage.set(`${this.storageKeyPrefix}${studySetId}`, JSON.stringify(items));
  }

  /**
   * 自动生成时间线条目（卡片创建）
   */
  static autoLogCardCreated(studySetId: string, cardId: string, cardContent: string): void {
    this.addTimelineItem(
      studySetId,
      'card_created',
      '创建新卡片',
      cardContent.substring(0, 100),
      cardId
    );
  }

  /**
   * 自动生成时间线条目（卡片复习）
   */
  static autoLogCardReview(studySetId: string, cardId: string, quality: number): void {
    this.addTimelineItem(
      studySetId,
      'card_reviewed',
      '复习卡片',
      `评分：${quality}`,
      cardId,
      { quality }
    );
  }
}

// ==================== 学习集排序服务 ====================

/**
 * 学习集排序服务
 */
export class StudySetSortService {
  private static storageKey = 'studyset-sort-config';

  /**
   * 获取排序配置
   */
  static getSortConfig(): StudySetSortConfig {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      return data ? JSON.parse(data) : {
        field: 'updatedAt',
        direction: 'desc',
        useCustomOrder: false
      };
    } catch (e) {
      console.error('Failed to load sort config:', e);
      return {
        field: 'updatedAt',
        direction: 'desc',
        useCustomOrder: false
      };
    }
  }

  /**
   * 保存排序配置
   */
  static saveSortConfig(config: StudySetSortConfig): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(config));
  }

  /**
   * 对学习集列表排序
   */
  static sortStudySets(
    studySets: any[],
    config: StudySetSortConfig,
    customOrder?: Record<string, number>
  ): any[] {
    if (config.useCustomOrder && customOrder) {
      return studySets.sort((a, b) => {
        const orderA = customOrder[a.id] ?? 999999;
        const orderB = customOrder[b.id] ?? 999999;
        return orderA - orderB;
      });
    }

    return studySets.sort((a, b) => {
      let valueA: any = a[config.field];
      let valueB: any = b[config.field];

      // 处理空值
      if (valueA === null || valueA === undefined) valueA = 0;
      if (valueB === null || valueB === undefined) valueB = 0;

      // 比较
      let comparison = 0;
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else {
        comparison = valueA - valueB;
      }

      return config.direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * 更新学习集自定义排序
   */
  static updateCustomOrder(studySetId: string, newIndex: number): void {
    const config = this.getSortConfig();
    config.useCustomOrder = true;
    this.saveSortConfig(config);

    // 这里需要保存到持久化存储
    const orderKey = 'studyset-custom-order';
    try {
      const data = window.siyuan.storage.get(orderKey);
      const order = data ? JSON.parse(data) : {};
      order[studySetId] = newIndex;
      window.siyuan.storage.set(orderKey, JSON.stringify(order));
    } catch (e) {
      console.error('Failed to update custom order:', e);
    }
  }
}

// ==================== 导出服务 ====================

export const studySetEnhancedService = {
  // 分组服务
  StudySetGroupService,

  // 颜色标签服务
  StudySetColorTagService,

  // 收藏服务
  StudySetFavoriteService,

  // 统计服务（增强版）
  StudySetStatsEnhancedService,

  // 时间线服务
  StudySetTimelineService,

  // 排序服务
  StudySetSortService
};

export default studySetEnhancedService;
