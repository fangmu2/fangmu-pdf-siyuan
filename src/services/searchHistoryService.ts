/**
 * 搜索历史服务
 * 负责管理搜索历史的存储、检索和管理
 */

import {
  SearchHistoryItem,
  SearchOptions,
  SearchScope,
  SearchHistoryConfig,
  DEFAULT_SEARCH_HISTORY_CONFIG
} from '../types/search';
import { generateUUID } from '../utils';

/** 本地存储键名 */
const STORAGE_KEY = 'siyuan-marginnote-search-history';

/**
 * 搜索历史服务类
 */
export class SearchHistoryService {
  private static instance: SearchHistoryService;
  private config: SearchHistoryConfig;
  private history: SearchHistoryItem[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.config = { ...DEFAULT_SEARCH_HISTORY_CONFIG };
    this.loadHistory();
  }

  static getInstance(): SearchHistoryService {
    if (!SearchHistoryService.instance) {
      SearchHistoryService.instance = new SearchHistoryService();
    }
    return SearchHistoryService.instance;
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return generateUUID();
  }

  /**
   * 获取思源配置（模拟 localStorage）
   * 注意：在思源插件中，应该使用思源的配置接口
   * 这里使用 localStorage 作为临时方案
   */
  private getStorage(): Storage {
    return localStorage;
  }

  /**
   * 加载历史记录
   */
  private loadHistory(): void {
    try {
      const storage = this.getStorage();
      const data = storage.getItem(STORAGE_KEY);
      if (data) {
        this.history = JSON.parse(data);
        // 清理过期记录
        this.cleanExpiredHistory();
      } else {
        this.history = [];
      }
    } catch (error) {
      console.error('[SearchHistoryService] 加载历史记录失败:', error);
      this.history = [];
    }
  }

  /**
   * 保存历史记录
   */
  private saveHistory(): void {
    try {
      const storage = this.getStorage();
      storage.setItem(STORAGE_KEY, JSON.stringify(this.history));
      // 通知监听者
      this.listeners.forEach(listener => listener());
    } catch (error) {
      console.error('[SearchHistoryService] 保存历史记录失败:', error);
    }
  }

  /**
   * 清理过期历史记录
   */
  private cleanExpiredHistory(): void {
    const now = Date.now();
    const maxAge = this.config.historyDays * 24 * 60 * 60 * 1000;

    this.history = this.history.filter(item => {
      return now - item.timestamp < maxAge;
    });

    // 限制数量
    if (this.history.length > this.config.maxHistory) {
      this.history = this.history.slice(0, this.config.maxHistory);
    }

    this.saveHistory();
  }

  /**
   * 添加搜索历史
   * @param query 搜索关键词
   * @param resultCount 结果数量
   * @param options 搜索选项
   * @param scope 搜索范围
   */
  addHistory(
    query: string,
    resultCount: number,
    options?: Partial<SearchOptions>,
    scope?: SearchScope
  ): SearchHistoryItem {
    if (!this.config.autoSave) {
      return {} as SearchHistoryItem;
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return {} as SearchHistoryItem;
    }

    // 检查是否已存在相同的搜索
    const existingIndex = this.history.findIndex(
      item => item.query === trimmedQuery &&
              item.scope === (scope || 'current')
    );

    const newItem: SearchHistoryItem = {
      id: this.generateId(),
      query: trimmedQuery,
      timestamp: Date.now(),
      resultCount,
      options: {
        caseSensitive: options?.caseSensitive ?? false,
        wholeWord: options?.wholeWord ?? false,
        useRegex: options?.useRegex ?? false,
      },
      scope: scope || 'current',
    };

    if (existingIndex !== -1) {
      // 更新现有记录的时间戳
      this.history.splice(existingIndex, 1);
    }

    // 添加到开头
    this.history.unshift(newItem);

    // 限制数量
    if (this.history.length > this.config.maxHistory) {
      this.history = this.history.slice(0, this.config.maxHistory);
    }

    this.saveHistory();
    return newItem;
  }

  /**
   * 获取所有历史记录
   */
  getHistory(): SearchHistoryItem[] {
    return [...this.history];
  }

  /**
   * 获取最近的搜索记录
   * @param limit 最大数量
   */
  getRecentHistory(limit: number = 10): SearchHistoryItem[] {
    return this.history.slice(0, limit);
  }

  /**
   * 删除单条历史记录
   * @param id 历史记录 ID
   */
  deleteHistory(id: string): void {
    const index = this.history.findIndex(item => item.id === id);
    if (index !== -1) {
      this.history.splice(index, 1);
      this.saveHistory();
    }
  }

  /**
   * 清空所有历史记录
   */
  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  /**
   * 删除指定关键词的历史记录
   * @param query 搜索关键词
   */
  deleteByQuery(query: string): void {
    const trimmedQuery = query.trim();
    this.history = this.history.filter(item => item.query !== trimmedQuery);
    this.saveHistory();
  }

  /**
   * 获取搜索建议
   * @param input 输入内容
   * @param limit 最大建议数
   */
  getSuggestions(input: string, limit: number = 5): SearchHistoryItem[] {
    const trimmedInput = input.trim().toLowerCase();
    if (!trimmedInput) {
      return this.getRecentHistory(limit);
    }

    return this.history
      .filter(item => item.query.toLowerCase().includes(trimmedInput))
      .slice(0, limit);
  }

  /**
   * 更新配置
   * @param config 新配置
   */
  updateConfig(config: Partial<SearchHistoryConfig>): void {
    this.config = { ...this.config, ...config };
    this.cleanExpiredHistory();
  }

  /**
   * 获取当前配置
   */
  getConfig(): SearchHistoryConfig {
    return { ...this.config };
  }

  /**
   * 添加变化监听器
   * @param listener 监听函数
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 导出历史记录
   */
  exportHistory(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * 导入历史记录
   * @param data JSON 数据
   * @param merge 是否合并（默认覆盖）
   */
  importHistory(data: string, merge: boolean = false): void {
    try {
      const imported = JSON.parse(data);
      if (!Array.isArray(imported)) {
        throw new Error('无效的历史记录格式');
      }

      if (merge) {
        // 合并时去重
        const existingQueries = new Set(this.history.map(item => item.query));
        for (const item of imported) {
          if (!existingQueries.has(item.query)) {
            this.history.push(item);
          }
        }
        this.cleanExpiredHistory();
      } else {
        this.history = imported;
        this.saveHistory();
      }
    } catch (error) {
      console.error('[SearchHistoryService] 导入历史记录失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const searchHistoryService = SearchHistoryService.getInstance();

/**
 * 便捷函数：添加搜索历史
 */
export function addSearchHistory(
  query: string,
  resultCount: number,
  options?: Partial<SearchOptions>,
  scope?: SearchScope
): SearchHistoryItem {
  return searchHistoryService.addHistory(query, resultCount, options, scope);
}

/**
 * 便捷函数：获取搜索历史
 */
export function getSearchHistory(limit?: number): SearchHistoryItem[] {
  if (limit) {
    return searchHistoryService.getRecentHistory(limit);
  }
  return searchHistoryService.getHistory();
}

/**
 * 便捷函数：获取搜索建议
 */
export function getSearchSuggestions(input: string, limit?: number): SearchHistoryItem[] {
  return searchHistoryService.getSuggestions(input, limit);
}
