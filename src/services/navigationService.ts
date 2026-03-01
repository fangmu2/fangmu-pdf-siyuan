/**
 * 导航服务
 * 提供快速导航和历史记录功能
 */

import { sql } from '../api';

/**
 * 导航历史记录项
 */
export interface NavigationHistoryItem {
  /** 唯一 ID */
  id: string;
  /** 类型：card / mindmap / document / annotation */
  type: 'card' | 'mindmap' | 'document' | 'annotation';
  /** 标题 */
  title: string;
  /** 内容预览 */
  preview?: string;
  /** 块 ID */
  blockId?: string;
  /** 文档 ID */
  docId?: string;
  /** 学习集 ID */
  studySetId?: string;
  /** 访问时间 */
  timestamp: number;
  /** 额外数据 */
  extra?: Record<string, any>;
}

/**
 * 书签项
 */
export interface BookmarkItem {
  /** 唯一 ID */
  id: string;
  /** 类型 */
  type: 'card' | 'mindmap' | 'document' | 'annotation';
  /** 标题 */
  title: string;
  /** 块 ID */
  blockId?: string;
  /** 文档 ID */
  docId?: string;
  /** 学习集 ID */
  studySetId?: string;
  /** 创建时间 */
  createdAt: number;
  /** 备注 */
  note?: string;
  /** 标签 */
  tags?: string[];
}

/**
 * 快速导航选项
 */
export interface QuickNavigateOption {
  /** 显示文本 */
  label: string;
  /** 描述 */
  description?: string;
  /** 类型 */
  type: 'card' | 'mindmap' | 'document' | 'annotation' | 'studySet';
  /** 目标 ID */
  targetId: string;
  /** 匹配分数 */
  score: number;
}

/**
 * 导航历史记录管理器
 */
class NavigationHistoryManager {
  private history: NavigationHistoryItem[] = [];
  private maxHistoryLength = 100;
  private storageKey = 'marginnote-navigation-history';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 添加历史记录
   */
  add(item: Omit<NavigationHistoryItem, 'id' | 'timestamp'>): NavigationHistoryItem {
    const historyItem: NavigationHistoryItem = {
      ...item,
      id: this.generateId(),
      timestamp: Date.now()
    };

    // 检查是否已存在相同项
    const existingIndex = this.history.findIndex(
      h => h.blockId === item.blockId && h.type === item.type
    );

    if (existingIndex > -1) {
      // 移到最前面
      this.history.splice(existingIndex, 1);
    }

    // 添加到开头
    this.history.unshift(historyItem);

    // 限制长度
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(0, this.maxHistoryLength);
    }

    this.saveToStorage();
    return historyItem;
  }

  /**
   * 获取历史记录
   */
  getHistory(limit: number = 20): NavigationHistoryItem[] {
    return this.history.slice(0, limit);
  }

  /**
   * 按类型获取历史记录
   */
  getHistoryByType(type: NavigationHistoryItem['type'], limit: number = 20): NavigationHistoryItem[] {
    return this.history.filter(h => h.type === type).slice(0, limit);
  }

  /**
   * 按学习集获取历史记录
   */
  getHistoryByStudySet(studySetId: string, limit: number = 20): NavigationHistoryItem[] {
    return this.history
      .filter(h => h.studySetId === studySetId)
      .slice(0, limit);
  }

  /**
   * 删除历史记录
   */
  remove(id: string): boolean {
    const index = this.history.findIndex(h => h.id === id);
    if (index > -1) {
      this.history.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * 清除历史记录
   */
  clear(): void {
    this.history = [];
    this.saveToStorage();
  }

  /**
   * 清除指定类型历史记录
   */
  clearByType(type: NavigationHistoryItem['type']): void {
    this.history = this.history.filter(h => h.type !== type);
    this.saveToStorage();
  }

  /**
   * 搜索历史记录
   */
  search(query: string): NavigationHistoryItem[] {
    const lowerQuery = query.toLowerCase();
    return this.history.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      (item.preview && item.preview.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (e) {
      console.error('[NavigationHistory] 保存历史记录失败:', e);
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (e) {
      console.error('[NavigationHistory] 加载历史记录失败:', e);
      this.history = [];
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 书签管理器
 */
class BookmarkManager {
  private bookmarks: BookmarkItem[] = [];
  private storageKey = 'marginnote-bookmarks';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 添加书签
   */
  add(item: Omit<BookmarkItem, 'id' | 'createdAt'>): BookmarkItem {
    // 检查是否已存在
    const existing = this.bookmarks.find(
      b => b.blockId === item.blockId && b.type === item.type
    );

    if (existing) {
      return existing;
    }

    const bookmark: BookmarkItem = {
      ...item,
      id: this.generateId(),
      createdAt: Date.now()
    };

    this.bookmarks.push(bookmark);
    this.saveToStorage();
    return bookmark;
  }

  /**
   * 获取所有书签
   */
  getAll(): BookmarkItem[] {
    return [...this.bookmarks];
  }

  /**
   * 按类型获取书签
   */
  getByType(type: BookmarkItem['type']): BookmarkItem[] {
    return this.bookmarks.filter(b => b.type === type);
  }

  /**
   * 按学习集获取书签
   */
  getByStudySet(studySetId: string): BookmarkItem[] {
    return this.bookmarks.filter(b => b.studySetId === studySetId);
  }

  /**
   * 删除书签
   */
  remove(id: string): boolean {
    const index = this.bookmarks.findIndex(b => b.id === id);
    if (index > -1) {
      this.bookmarks.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * 更新书签备注
   */
  updateNote(id: string, note: string): boolean {
    const bookmark = this.bookmarks.find(b => b.id === id);
    if (bookmark) {
      bookmark.note = note;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * 更新书签标签
   */
  updateTags(id: string, tags: string[]): boolean {
    const bookmark = this.bookmarks.find(b => b.id === id);
    if (bookmark) {
      bookmark.tags = tags;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * 搜索书签
   */
  search(query: string): BookmarkItem[] {
    const lowerQuery = query.toLowerCase();
    return this.bookmarks.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      (item.note && item.note.toLowerCase().includes(lowerQuery)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.bookmarks));
    } catch (e) {
      console.error('[Bookmark] 保存书签失败:', e);
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.bookmarks = JSON.parse(stored);
      }
    } catch (e) {
      console.error('[Bookmark] 加载书签失败:', e);
      this.bookmarks = [];
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `bm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 快速搜索服务
 */
class QuickSearchService {
  /**
   * 快速搜索
   */
  async search(
    query: string,
    options: {
      studySetId?: string;
      types?: Array<'card' | 'mindmap' | 'document' | 'annotation'>;
      limit?: number;
    } = {}
  ): Promise<QuickNavigateOption[]> {
    const { studySetId, types = ['card', 'mindmap', 'document', 'annotation'], limit = 20 } = options;
    const results: QuickNavigateOption[] = [];

    try {
      // 搜索卡片
      if (types.includes('card')) {
        const cards = await this.searchCards(query, studySetId, limit);
        results.push(...cards);
      }

      // 搜索思维导图
      if (types.includes('mindmap')) {
        const mindmaps = await this.searchMindMaps(query, studySetId, limit);
        results.push(...mindmaps);
      }

      // 搜索文档
      if (types.includes('document')) {
        const docs = await this.searchDocuments(query, limit);
        results.push(...docs);
      }

      // 搜索标注
      if (types.includes('annotation')) {
        const annotations = await this.searchAnnotations(query, studySetId, limit);
        results.push(...annotations);
      }

      // 按分数排序
      results.sort((a, b) => b.score - a.score);

      return results.slice(0, limit);
    } catch (error) {
      console.error('[QuickSearch] 搜索失败:', error);
      return [];
    }
  }

  /**
   * 搜索卡片
   */
  private async searchCards(
    query: string,
    studySetId?: string,
    limit?: number
  ): Promise<QuickNavigateOption[]> {
    try {
      let stmt = `
        SELECT * FROM blocks
        WHERE type = 'p'
        AND (
          content LIKE '%${query}%'
          OR attrs->>'$.custom-title' LIKE '%${query}%'
        )
      `;

      if (studySetId) {
        stmt += ` AND attrs->>'$.custom-study-set' = '${studySetId}'`;
      }

      stmt += ` LIMIT ${limit || 10}`;

      const result = await sql({
        url: '/api/sql',
        data: { stmt }
      });

      return (result || []).map((block: any) => ({
        label: block.attrs?.['custom-title'] || block.content?.slice(0, 50) || '无标题',
        description: block.content?.slice(0, 100),
        type: 'card' as const,
        targetId: block.id,
        score: this.calculateScore(query, block.content || '')
      }));
    } catch {
      return [];
    }
  }

  /**
   * 搜索思维导图
   */
  private async searchMindMaps(
    query: string,
    studySetId?: string,
    limit?: number
  ): Promise<QuickNavigateOption[]> {
    try {
      let stmt = `
        SELECT * FROM blocks
        WHERE type = 'p'
        AND attrs->>'$.custom-type' = 'mindmap'
        AND (
          content LIKE '%${query}%'
          OR attrs->>'$.custom-title' LIKE '%${query}%'
        )
      `;

      if (studySetId) {
        stmt += ` AND attrs->>'$.custom-study-set' = '${studySetId}'`;
      }

      stmt += ` LIMIT ${limit || 10}`;

      const result = await sql({
        url: '/api/sql',
        data: { stmt }
      });

      return (result || []).map((block: any) => ({
        label: block.attrs?.['custom-title'] || '思维导图',
        description: '思维导图',
        type: 'mindmap' as const,
        targetId: block.id,
        score: this.calculateScore(query, block.content || '')
      }));
    } catch {
      return [];
    }
  }

  /**
   * 搜索文档
   */
  private async searchDocuments(
    query: string,
    limit?: number
  ): Promise<QuickNavigateOption[]> {
    try {
      const stmt = `
        SELECT * FROM blocks
        WHERE type = 'd'
        AND content LIKE '%${query}%'
        LIMIT ${limit || 10}
      `;

      const result = await sql({
        url: '/api/sql',
        data: { stmt }
      });

      return (result || []).map((block: any) => ({
        label: block.content || '无标题文档',
        description: '文档',
        type: 'document' as const,
        targetId: block.id,
        score: this.calculateScore(query, block.content || '')
      }));
    } catch {
      return [];
    }
  }

  /**
   * 搜索标注
   */
  private async searchAnnotations(
    query: string,
    studySetId?: string,
    limit?: number
  ): Promise<QuickNavigateOption[]> {
    try {
      let stmt = `
        SELECT * FROM blocks
        WHERE type = 'p'
        AND attrs->>'$.custom-type' = 'annotation'
        AND content LIKE '%${query}%'
      `;

      if (studySetId) {
        stmt += ` AND attrs->>'$.custom-study-set' = '${studySetId}'`;
      }

      stmt += ` LIMIT ${limit || 10}`;

      const result = await sql({
        url: '/api/sql',
        data: { stmt }
      });

      return (result || []).map((block: any) => ({
        label: block.content?.slice(0, 50) || '标注',
        description: 'PDF 标注',
        type: 'annotation' as const,
        targetId: block.id,
        score: this.calculateScore(query, block.content || '')
      }));
    } catch {
      return [];
    }
  }

  /**
   * 计算匹配分数
   */
  private calculateScore(query: string, content: string): number {
    const lowerQuery = query.toLowerCase();
    const lowerContent = content.toLowerCase();

    // 完全匹配得分最高
    if (lowerContent === lowerQuery) return 100;

    // 开头匹配
    if (lowerContent.startsWith(lowerQuery)) return 90;

    // 包含匹配
    const index = lowerContent.indexOf(lowerQuery);
    if (index === 0) return 85;
    if (index > -1) return 80;

    // 部分匹配
    const words = lowerQuery.split(/\s+/);
    const matchCount = words.filter(word => lowerContent.includes(word)).length;
    return (matchCount / words.length) * 70;
  }
}

// 导出单例
export const navigationHistory = new NavigationHistoryManager();
export const bookmarkManager = new BookmarkManager();
export const quickSearch = new QuickSearchService();

/**
 * 导航服务对象
 */
export const navigationService = {
  // 历史记录
  navigationHistory,
  addHistory: (item: Omit<NavigationHistoryItem, 'id' | 'timestamp'>) =>
    navigationHistory.add(item),
  getHistory: (limit?: number) => navigationHistory.getHistory(limit),
  removeHistory: (id: string) => navigationHistory.remove(id),
  clearHistory: () => navigationHistory.clear(),
  searchHistory: (query: string) => navigationHistory.search(query),

  // 书签
  bookmarkManager,
  addBookmark: (item: Omit<BookmarkItem, 'id' | 'createdAt'>) =>
    bookmarkManager.add(item),
  getBookmarks: () => bookmarkManager.getAll(),
  removeBookmark: (id: string) => bookmarkManager.remove(id),
  updateBookmarkNote: (id: string, note: string) =>
    bookmarkManager.updateNote(id, note),
  updateBookmarkTags: (id: string, tags: string[]) =>
    bookmarkManager.updateTags(id, tags),
  searchBookmarks: (query: string) => bookmarkManager.search(query),

  // 快速搜索
  quickSearch,
  search: (query: string, options?: any) => quickSearch.search(query, options)
};
