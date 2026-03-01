/**
 * 卡片增强服务（第十六阶段 - 卡片功能增强）
 * 提供卡片模板、合并、拆分、链接、版本、评论、分享、收集等功能
 */

import { updateBlockAttrs, getBlock } from '../api';
import type { Card } from '../types/card';

/**
 * 卡片模板接口
 */
export interface CardTemplate {
  /** 模板 ID */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板描述 */
  description?: string;
  /** 模板图标 */
  icon?: string;
  /** 模板类型 */
  category: 'default' | 'exam' | 'language' | 'concept' | 'formula' | 'quote';
  /** 正面模板内容 */
  frontTemplate: string;
  /** 反面模板内容 */
  backTemplate?: string;
  /** 预设标签 */
  defaultTags?: string[];
  /** 预设难度 */
  defaultDifficulty?: number;
  /** 是否系统模板 */
  isSystem?: boolean;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 卡片链接接口
 */
export interface CardLink {
  /** 链接 ID */
  id: string;
  /** 源卡片 ID */
  fromCardId: string;
  /** 目标卡片 ID */
  toCardId: string;
  /** 链接类型 */
  linkType: 'reference' | 'related' | 'prerequisite' | 'example' | 'counterexample';
  /** 链接说明 */
  label?: string;
  /** 创建时间 */
  createdAt: number;
  /** 创建者 */
  createdBy?: string;
}

/**
 * 卡片评论接口
 */
export interface CardComment {
  /** 评论 ID */
  id: string;
  /** 卡片 ID */
  cardId: string;
  /** 评论内容 */
  content: string;
  /** 评论者 */
  author?: string;
  /** 父评论 ID（用于回复） */
  parentId?: string;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 卡片版本接口
 */
export interface CardVersion {
  /** 版本 ID */
  id: string;
  /** 卡片 ID */
  cardId: string;
  /** 版本内容 */
  content: string;
  /** 闪卡正面 */
  front?: string;
  /** 闪卡反面 */
  back?: string;
  /** 版本说明 */
  note?: string;
  /** 保存时间 */
  savedAt: number;
  /** 保存者 */
  savedBy?: string;
}

/**
 * 卡片收集组接口
 */
export interface CardCollection {
  /** 收集组 ID */
  id: string;
  /** 收集组名称 */
  name: string;
  /** 收集组描述 */
  description?: string;
  /** 卡片 ID 列表 */
  cardIds: string[];
  /** 所属学习集 ID */
  studySetId?: string;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 卡片合并选项
 */
export interface CardMergeOptions {
  /** 合并后的卡片 ID（使用其中一张卡片的 ID） */
  targetCardId: string;
  /** 要合并的卡片 ID 列表 */
  sourceCardIds: string[];
  /** 合并方式 */
  mergeMode: 'append' | 'prepend' | 'custom';
  /** 自定义合并内容 */
  customContent?: string;
  /** 是否保留源卡片 */
  keepSourceCards: boolean;
}

/**
 * 卡片拆分选项
 */
export interface CardSplitOptions {
  /** 要拆分的卡片 ID */
  cardId: string;
  /** 拆分方式 */
  splitMode: 'byParagraph' | 'bySentence' | 'bySeparator' | 'manual';
  /** 分隔符（bySeparator 时使用） */
  separator?: string;
  /** 手动指定的拆分点（manual 时使用） */
  splitPoints?: number[];
  /** 目标学习集 ID */
  targetStudySetId: string;
}

/**
 * 卡片分享选项
 */
export interface CardShareOptions {
  /** 卡片 ID */
  cardId: string;
  /** 分享格式 */
  format: 'markdown' | 'html' | 'image' | 'json' | 'anki';
  /** 包含答案 */
  includeAnswer: boolean;
  /** 包含元数据 */
  includeMetadata: boolean;
  /** 分享标题 */
  title?: string;
}

// ==================== 卡片模板服务 ====================

/**
 * 系统预设模板
 */
const SYSTEM_TEMPLATES: CardTemplate[] = [
  {
    id: 'template_default',
    name: '默认卡片',
    description: '标准的问答式卡片',
    icon: '📝',
    category: 'default',
    frontTemplate: '{{content}}',
    backTemplate: '{{answer}}',
    defaultTags: [],
    defaultDifficulty: 2,
    isSystem: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template_exam',
    name: '考试题',
    description: '适合考试复习的题目卡片',
    icon: '📋',
    category: 'exam',
    frontTemplate: '## 题目\n\n{{content}}\n\n## 要求\n\n{{requirement}}',
    backTemplate: '## 答案\n\n{{answer}}\n\n## 解析\n\n{{explanation}}',
    defaultTags: ['考试题'],
    defaultDifficulty: 3,
    isSystem: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template_language',
    name: '语言学习',
    description: '单词/短语学习卡片',
    icon: '🔤',
    category: 'language',
    frontTemplate: '{{word}}\n\n{{partOfSpeech}}',
    backTemplate: '## 释义\n\n{{meaning}}\n\n## 例句\n\n{{example}}\n\n## 发音\n\n{{pronunciation}}',
    defaultTags: ['语言学习'],
    defaultDifficulty: 2,
    isSystem: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template_concept',
    name: '概念卡片',
    description: '知识点/概念解释卡片',
    icon: '💡',
    category: 'concept',
    frontTemplate: '## {{conceptName}}\n\n请解释这个概念',
    backTemplate: '## 定义\n\n{{definition}}\n\n## 特点\n\n{{features}}\n\n## 应用\n\n{{applications}}',
    defaultTags: ['概念'],
    defaultDifficulty: 3,
    isSystem: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template_formula',
    name: '公式卡片',
    description: '数学/物理公式卡片',
    icon: '📐',
    category: 'formula',
    frontTemplate: '## {{formulaName}}\n\n请写出这个公式',
    backTemplate: '## 公式\n\n$$\n{{formula}}\n$$\n\n## 说明\n\n{{explanation}}\n\n## 应用\n\n{{applications}}',
    defaultTags: ['公式'],
    defaultDifficulty: 4,
    isSystem: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template_quote',
    name: '引用卡片',
    description: '名言/文献引用卡片',
    icon: '📖',
    category: 'quote',
    frontTemplate: '"{{quote}}"',
    backTemplate: '## 出处\n\n{{source}}\n\n## 作者\n\n{{author}}\n\n## 解读\n\n{{interpretation}}',
    defaultTags: ['引用'],
    defaultDifficulty: 2,
    isSystem: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

/**
 * 卡片模板服务
 */
export class CardTemplateService {
  private static storageKey = 'card-templates';

  /**
   * 获取所有模板
   */
  static getAllTemplates(): CardTemplate[] {
    const customTemplates = this.getCustomTemplates();
    return [...SYSTEM_TEMPLATES, ...customTemplates];
  }

  /**
   * 获取系统模板
   */
  static getSystemTemplates(): CardTemplate[] {
    return SYSTEM_TEMPLATES;
  }

  /**
   * 获取自定义模板
   */
  static getCustomTemplates(): CardTemplate[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load custom card templates:', e);
      return [];
    }
  }

  /**
   * 根据 ID 获取模板
   */
  static getTemplateById(templateId: string): CardTemplate | null {
    const allTemplates = this.getAllTemplates();
    return allTemplates.find(t => t.id === templateId) || null;
  }

  /**
   * 根据分类获取模板
   */
  static getTemplatesByCategory(category: CardTemplate['category']): CardTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * 保存自定义模板
   */
  static saveTemplate(template: Omit<CardTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>): CardTemplate {
    const customTemplates = this.getCustomTemplates();
    const newTemplate: CardTemplate = {
      ...template,
      id: `custom_${Date.now()}`,
      isSystem: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    customTemplates.push(newTemplate);
    this.saveCustomTemplates(customTemplates);
    return newTemplate;
  }

  /**
   * 更新自定义模板
   */
  static updateTemplate(templateId: string, updates: Partial<CardTemplate>): boolean {
    const customTemplates = this.getCustomTemplates();
    const index = customTemplates.findIndex(t => t.id === templateId);
    if (index === -1) {
      return false;
    }
    customTemplates[index] = {
      ...customTemplates[index],
      ...updates,
      updatedAt: Date.now()
    };
    this.saveCustomTemplates(customTemplates);
    return true;
  }

  /**
   * 删除自定义模板
   */
  static deleteTemplate(templateId: string): boolean {
    const customTemplates = this.getCustomTemplates();
    const filtered = customTemplates.filter(t => t.id !== templateId);
    if (filtered.length === customTemplates.length) {
      return false;
    }
    this.saveCustomTemplates(filtered);
    return true;
  }

  /**
   * 保存自定义模板列表
   */
  private static saveCustomTemplates(templates: CardTemplate[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(templates));
  }

  /**
   * 从模板创建卡片
   */
  static createCardFromTemplate(
    template: CardTemplate,
    values: Record<string, string>,
    studySetId: string
  ): Partial<Card> {
    // 替换模板变量
    let frontContent = template.frontTemplate;
    let backContent = template.backTemplate || '';

    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      frontContent = frontContent.replace(regex, value);
      backContent = backContent.replace(regex, value);
    });

    return {
      content: frontContent,
      studySetId,
      tags: template.defaultTags || [],
      difficulty: template.defaultDifficulty || 2,
      type: 'flashcard' as const
    };
  }
}

// ==================== 卡片链接服务 ====================

/**
 * 卡片链接服务
 */
export class CardLinkService {
  private static storageKey = 'card-links';

  /**
   * 创建卡片链接
   */
  static createLink(
    fromCardId: string,
    toCardId: string,
    linkType: CardLink['linkType'],
    label?: string
  ): CardLink {
    const link: CardLink = {
      id: `link_${Date.now()}`,
      fromCardId,
      toCardId,
      linkType,
      label,
      createdAt: Date.now(),
      createdBy: window.siyuan?.user?.name
    };
    this.saveLink(link);
    return link;
  }

  /**
   * 删除卡片链接
   */
  static deleteLink(linkId: string): boolean {
    const links = this.getAllLinks();
    const filtered = links.filter(l => l.id !== linkId);
    if (filtered.length === links.length) {
      return false;
    }
    this.saveAllLinks(filtered);
    return true;
  }

  /**
   * 获取卡片的所有链接
   */
  static getCardLinks(cardId: string): { incoming: CardLink[]; outgoing: CardLink[] } {
    const allLinks = this.getAllLinks();
    return {
      incoming: allLinks.filter(l => l.toCardId === cardId),
      outgoing: allLinks.filter(l => l.fromCardId === cardId)
    };
  }

  /**
   * 获取卡片的反向链接（指向该卡片的链接）
   */
  static getBacklinks(cardId: string): CardLink[] {
    return this.getAllLinks().filter(l => l.toCardId === cardId);
  }

  /**
   * 获取卡片的出链（从该卡片出发的链接）
   */
  static getOutgoingLinks(cardId: string): CardLink[] {
    return this.getAllLinks().filter(l => l.fromCardId === cardId);
  }

  /**
   * 获取所有链接
   */
  static getAllLinks(): CardLink[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load card links:', e);
      return [];
    }
  }

  /**
   * 保存单个链接
   */
  private static saveLink(link: CardLink): void {
    const links = this.getAllLinks();
    links.push(link);
    this.saveAllLinks(links);
  }

  /**
   * 保存所有链接
   */
  private static saveAllLinks(links: CardLink[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(links));
  }

  /**
   * 清除卡片的所有链接
   */
  static clearCardLinks(cardId: string): void {
    const links = this.getAllLinks().filter(
      l => l.fromCardId !== cardId && l.toCardId !== cardId
    );
    this.saveAllLinks(links);
  }
}

// ==================== 卡片评论服务 ====================

/**
 * 卡片评论服务
 */
export class CardCommentService {
  private static storageKeyPrefix = 'card-comments-';

  /**
   * 添加评论
   */
  static addComment(
    cardId: string,
    content: string,
    author?: string,
    parentId?: string
  ): CardComment {
    const comment: CardComment = {
      id: `comment_${Date.now()}`,
      cardId,
      content,
      author: author || window.siyuan?.user?.name,
      parentId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.saveComment(cardId, comment);
    return comment;
  }

  /**
   * 删除评论
   */
  static deleteComment(cardId: string, commentId: string): boolean {
    const comments = this.getComments(cardId);
    const filtered = comments.filter(c => c.id !== commentId);
    if (filtered.length === comments.length) {
      return false;
    }
    this.saveAllComments(cardId, filtered);
    return true;
  }

  /**
   * 更新评论
   */
  static updateComment(cardId: string, commentId: string, content: string): boolean {
    const comments = this.getComments(cardId);
    const comment = comments.find(c => c.id === commentId);
    if (!comment) {
      return false;
    }
    comment.content = content;
    comment.updatedAt = Date.now();
    this.saveAllComments(cardId, comments);
    return true;
  }

  /**
   * 获取卡片的所有评论
   */
  static getComments(cardId: string): CardComment[] {
    try {
      const data = window.siyuan.storage.get(`${this.storageKeyPrefix}${cardId}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load card comments:', e);
      return [];
    }
  }

  /**
   * 获取评论树（带回复）
   */
  static getCommentTree(cardId: string): Array<CardComment & { replies: CardComment[] }> {
    const comments = this.getComments(cardId);
    const rootComments = comments.filter(c => !c.parentId);

    return rootComments.map(root => ({
      ...root,
      replies: comments.filter(c => c.parentId === root.id)
    }));
  }

  /**
   * 保存评论
   */
  private static saveComment(cardId: string, comment: CardComment): void {
    const comments = this.getComments(cardId);
    comments.push(comment);
    this.saveAllComments(cardId, comments);
  }

  /**
   * 保存所有评论
   */
  private static saveAllComments(cardId: string, comments: CardComment[]): void {
    window.siyuan.storage.set(`${this.storageKeyPrefix}${cardId}`, JSON.stringify(comments));
  }

  /**
   * 清除卡片的所有评论
   */
  static clearComments(cardId: string): void {
    window.siyuan.storage.remove(`${this.storageKeyPrefix}${cardId}`);
  }
}

// ==================== 卡片版本服务 ====================

/**
 * 卡片版本服务
 */
export class CardVersionService {
  private static storageKeyPrefix = 'card-versions-';

  /**
   * 保存当前版本
   */
  static saveVersion(
    card: Card,
    note?: string
  ): CardVersion {
    const version: CardVersion = {
      id: `version_${Date.now()}`,
      cardId: card.id,
      content: card.content,
      front: (card as any).front,
      back: (card as any).back,
      note,
      savedAt: Date.now(),
      savedBy: window.siyuan?.user?.name
    };
    this.saveVersionToStorage(card.id, version);
    return version;
  }

  /**
   * 获取卡片的所有版本
   */
  static getVersions(cardId: string): CardVersion[] {
    try {
      const data = window.siyuan.storage.get(`${this.storageKeyPrefix}${cardId}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load card versions:', e);
      return [];
    }
  }

  /**
   * 恢复指定版本
   */
  static restoreVersion(cardId: string, versionId: string): Card | null {
    const versions = this.getVersions(cardId);
    const version = versions.find(v => v.id === versionId);

    if (!version) {
      return null;
    }

    return {
      id: cardId,
      content: version.content,
      type: 'flashcard',
      studySetId: '',
      tags: [],
      status: 'new',
      difficulty: 1,
      createdAt: version.savedAt,
      updatedAt: Date.now()
    } as Card;
  }

  /**
   * 删除版本
   */
  static deleteVersion(cardId: string, versionId: string): boolean {
    const versions = this.getVersions(cardId);
    const filtered = versions.filter(v => v.id !== versionId);
    if (filtered.length === versions.length) {
      return false;
    }
    this.saveAllVersions(cardId, filtered);
    return true;
  }

  /**
   * 保存版本到存储
   */
  private static saveVersionToStorage(cardId: string, version: CardVersion): void {
    const versions = this.getVersions(cardId);
    versions.push(version);
    this.saveAllVersions(cardId, versions);
  }

  /**
   * 保存所有版本
   */
  private static saveAllVersions(cardId: string, versions: CardVersion[]): void {
    window.siyuan.storage.set(`${this.storageKeyPrefix}${cardId}`, JSON.stringify(versions));
  }

  /**
   * 清除卡片的所有版本
   */
  static clearVersions(cardId: string): void {
    window.siyuan.storage.remove(`${this.storageKeyPrefix}${cardId}`);
  }

  /**
   * 获取版本数量
   */
  static getVersionCount(cardId: string): number {
    return this.getVersions(cardId).length;
  }

  /**
   * 获取最新版本
   */
  static getLatestVersion(cardId: string): CardVersion | null {
    const versions = this.getVersions(cardId);
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }
}

// ==================== 卡片收集服务 ====================

/**
 * 卡片收集服务
 */
export class CardCollectionService {
  private static storageKey = 'card-collections';

  /**
   * 创建收集组
   */
  static createCollection(
    name: string,
    cardIds: string[] = [],
    studySetId?: string,
    description?: string
  ): CardCollection {
    const collection: CardCollection = {
      id: `collection_${Date.now()}`,
      name,
      description,
      cardIds,
      studySetId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.saveCollection(collection);
    return collection;
  }

  /**
   * 更新收集组
   */
  static updateCollection(
    collectionId: string,
    updates: Partial<CardCollection>
  ): boolean {
    const collections = this.getAllCollections();
    const index = collections.findIndex(c => c.id === collectionId);
    if (index === -1) {
      return false;
    }
    collections[index] = {
      ...collections[index],
      ...updates,
      updatedAt: Date.now()
    };
    this.saveAllCollections(collections);
    return true;
  }

  /**
   * 删除收集组
   */
  static deleteCollection(collectionId: string): boolean {
    const collections = this.getAllCollections();
    const filtered = collections.filter(c => c.id !== collectionId);
    if (filtered.length === collections.length) {
      return false;
    }
    this.saveAllCollections(filtered);
    return true;
  }

  /**
   * 添加卡片到收集组
   */
  static addCardToCollection(collectionId: string, cardId: string): boolean {
    const collection = this.getCollectionById(collectionId);
    if (!collection) {
      return false;
    }
    if (!collection.cardIds.includes(cardId)) {
      collection.cardIds.push(cardId);
      collection.updatedAt = Date.now();
      this.updateCollection(collectionId, { cardIds: collection.cardIds });
    }
    return true;
  }

  /**
   * 从收集组移除卡片
   */
  static removeCardFromCollection(collectionId: string, cardId: string): boolean {
    const collection = this.getCollectionById(collectionId);
    if (!collection) {
      return false;
    }
    const index = collection.cardIds.indexOf(cardId);
    if (index === -1) {
      return false;
    }
    collection.cardIds.splice(index, 1);
    collection.updatedAt = Date.now();
    this.updateCollection(collectionId, { cardIds: collection.cardIds });
    return true;
  }

  /**
   * 获取收集组
   */
  static getCollectionById(collectionId: string): CardCollection | null {
    return this.getAllCollections().find(c => c.id === collectionId) || null;
  }

  /**
   * 获取所有收集组
   */
  static getAllCollections(): CardCollection[] {
    try {
      const data = window.siyuan.storage.get(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load card collections:', e);
      return [];
    }
  }

  /**
   * 保存收集组
   */
  private static saveCollection(collection: CardCollection): void {
    const collections = this.getAllCollections();
    collections.push(collection);
    this.saveAllCollections(collections);
  }

  /**
   * 保存所有收集组
   */
  private static saveAllCollections(collections: CardCollection[]): void {
    window.siyuan.storage.set(this.storageKey, JSON.stringify(collections));
  }
}

// ==================== 卡片合并服务 ====================

/**
 * 卡片合并服务
 */
export class CardMergeService {
  /**
   * 合并多张卡片
   */
  static async mergeCards(options: CardMergeOptions): Promise<{
    success: boolean;
    mergedCardId?: string;
    message: string;
  }> {
    try {
      const { targetCardId, sourceCardIds, mergeMode, customContent, keepSourceCards } = options;

      // 获取目标卡片
      const targetBlock = await getBlock(targetCardId);
      if (!targetBlock) {
        return { success: false, message: '目标卡片不存在' };
      }

      // 获取所有源卡片内容
      const sourceContents: string[] = [];
      for (const cardId of sourceCardIds) {
        const block = await getBlock(cardId);
        if (block) {
          sourceContents.push(block.content as string || '');
        }
      }

      // 根据合并方式生成新内容
      let newContent: string;
      switch (mergeMode) {
        case 'append':
          newContent = `${targetBlock.content}\n\n---\n\n${sourceContents.join('\n\n---\n\n')}`;
          break;
        case 'prepend':
          newContent = `${sourceContents.reverse().join('\n\n---\n\n')}\n\n---\n\n${targetBlock.content}`;
          break;
        case 'custom':
          newContent = customContent || targetBlock.content;
          break;
        default:
          newContent = targetBlock.content;
      }

      // 更新目标卡片
      await updateBlockAttrs({
        id: targetCardId,
        attrs: {
          content: newContent
        }
      });

      // 如果不保留源卡片，删除它们
      if (!keepSourceCards) {
        for (const cardId of sourceCardIds) {
          // 这里需要调用思源的删除块 API
          // await deleteBlock({ id: cardId });
          console.log('[CardMergeService] 源卡片待删除:', cardId);
        }
      }

      return {
        success: true,
        mergedCardId: targetCardId,
        message: `成功合并 ${sourceCardIds.length} 张卡片`
      };
    } catch (error) {
      console.error('[CardMergeService] 合并卡片失败:', error);
      return {
        success: false,
        message: `合并失败：${error}`
      };
    }
  }
}

// ==================== 卡片拆分服务 ====================

/**
 * 卡片拆分服务
 */
export class CardSplitService {
  /**
   * 拆分卡片
   */
  static async splitCard(options: CardSplitOptions): Promise<{
    success: boolean;
    newCardIds?: string[];
    message: string;
  }> {
    try {
      const { cardId, splitMode, separator } = options;

      // 获取原卡片
      const block = await getBlock(cardId);
      if (!block) {
        return { success: false, message: '原卡片不存在' };
      }

      const content = block.content as string || '';
      const segments: string[] = [];

      // 根据拆分方式分割内容
      switch (splitMode) {
        case 'byParagraph':
          // 按段落拆分
          segments.push(...content.split(/\n\n+/).filter(s => s.trim()));
          break;
        case 'bySentence':
          // 按句子拆分
          segments.push(...content.split(/(?<=[。！？.!?])\s*/).filter(s => s.trim()));
          break;
        case 'bySeparator':
          // 按指定分隔符拆分
          segments.push(...content.split(separator || '\n').filter(s => s.trim()));
          break;
        case 'manual':
          // 手动指定拆分点
          const splitPoints = options.splitPoints || [];
          if (splitPoints.length === 0) {
            return { success: false, message: '未指定拆分点' };
          }
          let lastPos = 0;
          for (const point of splitPoints) {
            segments.push(content.substring(lastPos, point));
            lastPos = point;
          }
          segments.push(content.substring(lastPos));
          break;
      }

      if (segments.length < 2) {
        return { success: false, message: '无法拆分，内容不足以分成多张卡片' };
      }

      // 创建新卡片（这里需要调用思源的创建块 API）
      const newCardIds: string[] = [];
      for (const segment of segments) {
        // 模拟创建新卡片
        // const newCard = await createBlock({ ... });
        // newCardIds.push(newCard.id);
        console.log('[CardSplitService] 待创建卡片内容:', segment);
      }

      return {
        success: true,
        newCardIds,
        message: `成功拆分为 ${segments.length} 张卡片`
      };
    } catch (error) {
      console.error('[CardSplitService] 拆分卡片失败:', error);
      return {
        success: false,
        message: `拆分失败：${error}`
      };
    }
  }
}

// ==================== 卡片分享服务 ====================

/**
 * 卡片分享服务
 */
export class CardShareService {
  /**
   * 分享卡片
   */
  static async shareCard(options: CardShareOptions): Promise<{
    success: boolean;
    content?: string;
    format: string;
  }> {
    try {
      const { cardId, format, includeAnswer, includeMetadata, title } = options;

      const block = await getBlock(cardId);
      if (!block) {
        return { success: false, format, content: '卡片不存在' };
      }

      let content: string;

      switch (format) {
        case 'markdown':
          content = this.exportToMarkdown(block, includeAnswer, includeMetadata, title);
          break;
        case 'html':
          content = this.exportToHTML(block, includeAnswer, includeMetadata, title);
          break;
        case 'json':
          content = this.exportToJSON(block, includeAnswer, includeMetadata);
          break;
        case 'anki':
          content = this.exportToAnki(block, includeAnswer);
          break;
        case 'image':
          // 图片导出需要 canvas 渲染，返回提示信息
          content = '图片导出功能需要在浏览器环境中使用 canvas 渲染';
          break;
        default:
          content = this.exportToMarkdown(block, includeAnswer, includeMetadata, title);
      }

      return {
        success: true,
        content,
        format
      };
    } catch (error) {
      console.error('[CardShareService] 分享卡片失败:', error);
      return {
        success: false,
        format: options.format,
        content: `分享失败：${error}`
      };
    }
  }

  /**
   * 导出为 Markdown
   */
  private static exportToMarkdown(
    block: any,
    includeAnswer: boolean,
    includeMetadata: boolean,
    title?: string
  ): string {
    let md = title ? `# ${title}\n\n` : '';
    md += `## 卡片内容\n\n${block.content}\n\n`;

    if (includeAnswer && block['custom-card-answer']) {
      md += `## 答案\n\n${block['custom-card-answer']}\n\n`;
    }

    if (includeMetadata) {
      md += `---\n\n`;
      md += `**创建时间**: ${new Date(block.created).toLocaleString()}\n`;
      md += `**更新时间**: ${new Date(block.updated).toLocaleString()}\n`;
      if (block['custom-card-tags']) {
        md += `**标签**: ${block['custom-card-tags']}\n`;
      }
      if (block['custom-card-difficulty']) {
        md += `**难度**: ${block['custom-card-difficulty']}\n`;
      }
    }

    return md;
  }

  /**
   * 导出为 HTML
   */
  private static exportToHTML(
    block: any,
    includeAnswer: boolean,
    includeMetadata: boolean,
    title?: string
  ): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title || '卡片分享'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .card-content { font-size: 16px; line-height: 1.6; }
    .card-answer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #2e7d32; }
    .card-meta { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>${title || '卡片分享'}</h1>
  <div class="card">
    <div class="card-content">${block.content}</div>
    ${includeAnswer && block['custom-card-answer'] ? `<div class="card-answer"><strong>答案：</strong>${block['custom-card-answer']}</div>` : ''}
    ${includeMetadata ? `
    <div class="card-meta">
      <div>创建时间：${new Date(block.created).toLocaleString()}</div>
      <div>更新时间：${new Date(block.updated).toLocaleString()}</div>
      ${block['custom-card-tags'] ? `<div>标签：${block['custom-card-tags']}</div>` : ''}
      ${block['custom-card-difficulty'] ? `<div>难度：${block['custom-card-difficulty']}</div>` : ''}
    </div>
    ` : ''}
  </div>
</body>
</html>`;
  }

  /**
   * 导出为 JSON
   */
  private static exportToJSON(
    block: any,
    includeAnswer: boolean,
    includeMetadata: boolean
  ): string {
    const data: any = {
      id: block.id,
      content: block.content
    };

    if (includeAnswer) {
      data.answer = block['custom-card-answer'];
    }

    if (includeMetadata) {
      data.metadata = {
        createdAt: block.created,
        updatedAt: block.updated,
        tags: block['custom-card-tags'],
        difficulty: block['custom-card-difficulty'],
        studySetId: block['custom-card-study-set-id']
      };
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * 导出为 Anki 格式
   */
  private static exportToAnki(block: any, includeAnswer: boolean): string {
    const front = block.content || '';
    const back = block['custom-card-answer'] || '';

    if (!includeAnswer || !back) {
      return front;
    }

    // Anki 导入格式：正面;背面
    return `${front}\t${back}`;
  }

  /**
   * 下载为文件
   */
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
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

// ==================== 导出服务 ====================

export const cardEnhancedService = {
  // 模板服务
  CardTemplateService,

  // 链接服务
  CardLinkService,

  // 评论服务
  CardCommentService,

  // 版本服务
  CardVersionService,

  // 收集服务
  CardCollectionService,

  // 合并服务
  CardMergeService,

  // 拆分服务
  CardSplitService,

  // 分享服务
  CardShareService
};

export default cardEnhancedService;
