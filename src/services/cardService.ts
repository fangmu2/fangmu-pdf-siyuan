/**
 * 卡片管理服务
 * MarginNote 4 风格学习插件 - 卡片 CRUD 操作
 */

import type {
  Card,
  FlashCard,
  CardType,
  CardStatus,
  CardFilter,
  CardSortOptions,
} from '../types/card';
import type { PDFAnnotation } from '../types/annotaion';
import { sm2Algorithm, createNewSRSParams } from '../review/sm2';
import {
  createCardBlock,
  updateCardBlock,
  deleteCardBlock,
  getCardBlock,
  getAllCardBlocks,
  searchCards as searchCardsFromDB,
} from './dataPersistenceService';

// 内存缓存
let cardsCache: Card[] = [];
let cacheLoaded = false;

/**
 * 加载卡片缓存
 */
async function loadCardsCache(): Promise<void> {
  if (cacheLoaded) return;

  try {
    cardsCache = await getAllCardBlocks();
    cacheLoaded = true;
  } catch (error) {
    console.error('加载卡片缓存失败:', error);
    cardsCache = [];
  }
}

/**
 * 卡片管理服务类
 */
class CardService {
  /**
   * 从思源块属性解析卡片
   *
   * @param blockId - 块 ID
   * @param attributes - 块属性
   * @returns 卡片对象
   */
  parseFromBlockAttributes(blockId: string, attributes: Record<string, string>): Card | FlashCard {
    const type = attributes.type as CardType || 'card';

    const card: Card = {
      id: blockId,
      type: type,
      content: '', // 需要从块内容获取
      sourceLocation: {
        docId: '',
        blockId: blockId,
      },
      studySetId: attributes['card_study_set_id'] || '',
      tags: attributes['card_tags']
        ? attributes['card_tags'].split(',').map(t => t.trim())
        : [],
      status: (attributes['card_status'] as CardStatus) || 'new',
      difficulty: parseInt(attributes['card_difficulty'] || '3'),
      createdAt: parseInt(attributes['card_created'] || Date.now().toString()),
      updatedAt: parseInt(attributes['card_updated'] || Date.now().toString()),
    };

    // 如果是闪卡，解析闪卡特有属性
    if (type === 'flashcard') {
      const flashCard = card as FlashCard;
      flashCard.front = attributes['card_front'] || '';
      flashCard.back = attributes['card_back'] || '';
      flashCard.srs = {
        easeFactor: parseFloat(attributes['card_srs_ease'] || '2.5'),
        interval: parseInt(attributes['card_srs_interval'] || '0'),
        repetitions: parseInt(attributes['card_srs_repetitions'] || '0'),
        nextReview: parseInt(attributes['card_srs_next_review'] || '0'),
      };
      return flashCard;
    }

    return card;
  }

  /**
   * 将卡片转换为思源块属性
   *
   * @param card - 卡片对象
   * @returns 块属性对象
   */
  toBlockAttributes(card: Card | FlashCard): Record<string, string> {
    const attrs: Record<string, string> = {
      type: card.type as string,
      'card_source_id': card.sourceLocation.blockId,
      'card_study_set_id': card.studySetId,
      'card_tags': card.tags.join(','),
      'card_status': card.status,
      'card_difficulty': card.difficulty.toString(),
      'card_created': card.createdAt.toString(),
      'card_updated': card.updatedAt.toString(),
    };

    // 如果是闪卡，添加闪卡特有属性
    if (card.type === 'flashcard') {
      const flashCard = card as FlashCard;
      attrs['card_type'] = 'flashcard';
      attrs['card_front'] = flashCard.front;
      attrs['card_back'] = flashCard.back;
      attrs['card_srs_ease'] = flashCard.srs.easeFactor.toString();
      attrs['card_srs_interval'] = flashCard.srs.interval.toString();
      attrs['card_srs_repetitions'] = flashCard.srs.repetitions.toString();
      attrs['card_srs_next_review'] = flashCard.srs.nextReview.toString();
    }

    return attrs;
  }

  /**
   * 从现有标注创建卡片
   *
   * @param annotation - 现有标注对象
   * @param studySetId - 学习集 ID
   * @returns 卡片对象
   */
  async createFromAnnotation(annotation: PDFAnnotation, studySetId: string): Promise<Card> {
    const card: Card = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: annotation.isImage ? 'excerpt' : 'card',
      content: annotation.text || annotation.imagePath || '',
      sourceLocation: {
        docId: '',
        blockId: annotation.blockId,
        pdfPath: annotation.pdfPath,
        page: annotation.page,
        rect: annotation.rect,
      },
      studySetId,
      tags: [],
      status: 'new',
      difficulty: 3,
      createdAt: annotation.created,
      updatedAt: annotation.updated,
    };

    // 保存到思源
    await this.saveCard(card);

    return card;
  }

  /**
   * 创建新卡片
   *
   * @param content - 卡片内容
   * @param studySetId - 学习集 ID
   * @param sourceLocation - 来源位置
   * @param type - 卡片类型
   * @returns 卡片对象
   */
  async createCard(
    content: string,
    studySetId: string,
    sourceLocation: { docId: string; blockId: string; pdfPath?: string; page?: number },
    type: CardType = 'card'
  ): Promise<Card> {
    const now = Date.now();

    const card: Card = {
      id: `card_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      sourceLocation,
      studySetId,
      tags: [],
      status: 'new',
      difficulty: 3,
      createdAt: now,
      updatedAt: now,
    };

    // 保存到思源
    await this.saveCard(card);

    return card;
  }

  /**
   * 创建闪卡
   *
   * @param front - 正面内容
   * @param back - 反面内容
   * @param studySetId - 学习集 ID
   * @param content - 卡片内容（来源）
   * @param sourceLocation - 来源位置
   * @returns 闪卡对象
   */
  async createFlashCard(
    front: string,
    back: string,
    studySetId: string,
    content: string = '',
    sourceLocation: { docId: string; blockId: string; pdfPath?: string; page?: number }
  ): Promise<FlashCard> {
    const now = Date.now();

    const card: FlashCard = {
      id: `card_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'flashcard',
      content,
      sourceLocation,
      studySetId,
      tags: [],
      status: 'new',
      difficulty: 3,
      createdAt: now,
      updatedAt: now,
      front,
      back,
      srs: createNewSRSParams(),
    };

    // 保存到思源
    await this.saveCard(card);

    return card;
  }

  /**
   * 保存卡片到思源
   */
  async saveCard(card: Card): Promise<void> {
    try {
      const block = await getCardBlock(card.id);

      if (block) {
        await updateCardBlock(card);
      } else {
        await createCardBlock(card);
      }

      // 更新缓存
      const index = cardsCache.findIndex(c => c.id === card.id);
      if (index >= 0) {
        cardsCache[index] = card;
      } else {
        cardsCache.push(card);
      }
    } catch (error) {
      console.error('保存卡片失败:', error);
      throw error;
    }
  }

  /**
   * 更新卡片内容
   *
   * @param card - 卡片对象
   * @param content - 新内容
   * @returns 更新后的卡片
   */
  async updateContent(card: Card, content: string): Promise<Card> {
    const updatedCard = {
      ...card,
      content,
      updatedAt: Date.now(),
    };

    await this.saveCard(updatedCard);
    return updatedCard;
  }

  /**
   * 更新卡片标签
   *
   * @param card - 卡片对象
   * @param tags - 新标签列表
   * @returns 更新后的卡片
   */
  async updateTags(card: Card, tags: string[]): Promise<Card> {
    const updatedCard = {
      ...card,
      tags,
      updatedAt: Date.now(),
    };

    await this.saveCard(updatedCard);
    return updatedCard;
  }

  /**
   * 更新卡片状态
   *
   * @param card - 卡片对象
   * @param status - 新状态
   * @returns 更新后的卡片
   */
  async updateStatus(card: Card, status: CardStatus): Promise<Card> {
    const updatedCard = {
      ...card,
      status,
      updatedAt: Date.now(),
    };

    await this.saveCard(updatedCard);
    return updatedCard;
  }

  /**
   * 更新卡片难度
   *
   * @param card - 卡片对象
   * @param difficulty - 新难度 (1-5)
   * @returns 更新后的卡片
   */
  async updateDifficulty(card: Card, difficulty: number): Promise<Card> {
    const updatedCard = {
      ...card,
      difficulty: Math.max(1, Math.min(5, difficulty)),
      updatedAt: Date.now(),
    };

    await this.saveCard(updatedCard);
    return updatedCard;
  }

  /**
   * 将普通卡片升级为闪卡
   *
   * @param card - 普通卡片
   * @param front - 正面内容
   * @param back - 反面内容
   * @returns 闪卡对象
   */
  async upgradeToFlashCard(card: Card, front: string, back: string): Promise<FlashCard> {
    const flashCard: FlashCard = {
      ...card,
      type: 'flashcard',
      front,
      back,
      srs: createNewSRSParams(),
    } as FlashCard;

    await this.saveCard(flashCard);
    return flashCard;
  }

  /**
   * 处理卡片复习
   *
   * @param card - 闪卡对象
   * @param quality - 复习质量评分 (0-5)
   * @returns 更新后的闪卡和复习结果
   */
  async processReview(card: FlashCard, quality: number): Promise<{ card: FlashCard; result: ReturnType<typeof sm2Algorithm> }> {
    const result = sm2Algorithm({
      quality,
      easeFactor: card.srs.easeFactor,
      interval: card.srs.interval,
      repetitions: card.srs.repetitions,
    });

    const updatedCard: FlashCard = {
      ...card,
      srs: result,
      updatedAt: Date.now(),
    };

    // 根据复习结果更新状态
    if (quality < 3) {
      updatedCard.status = 'learning';
    } else if (result.interval >= 21) {
      updatedCard.status = 'review';
    }

    await this.saveCard(updatedCard);
    return { card: updatedCard, result };
  }

  /**
   * 删除卡片
   *
   * @param cardId - 卡片 ID
   */
  async deleteCard(cardId: string): Promise<void> {
    try {
      await deleteCardBlock(cardId);
      cardsCache = cardsCache.filter(c => c.id !== cardId);
    } catch (error) {
      console.error('删除卡片失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有卡片
   */
  async getAllCards(): Promise<Card[]> {
    await loadCardsCache();
    return cardsCache;
  }

  /**
   * 获取指定学习集的卡片
   */
  async getCardsByStudySetId(studySetId: string): Promise<Card[]> {
    await loadCardsCache();
    return cardsCache.filter(c => c.studySetId === studySetId);
  }

  /**
   * 获取卡片
   */
  async getCard(cardId: string): Promise<Card | null> {
    await loadCardsCache();
    return cardsCache.find(c => c.id === cardId) || null;
  }

  /**
   * 搜索卡片
   */
  async searchCards(query: string): Promise<Card[]> {
    return searchCardsFromDB(query);
  }

  /**
   * 过滤卡片列表
   *
   * @param cards - 卡片列表
   * @param filter - 筛选条件
   * @returns 筛选后的卡片列表
   */
  filterCards(cards: Card[], filter: CardFilter): Card[] {
    return cards.filter(card => {
      if (filter.tags && filter.tags.length > 0) {
        if (!filter.tags.some(tag => card.tags.includes(tag))) {
          return false;
        }
      }

      if (filter.status && filter.status.length > 0) {
        if (!filter.status.includes(card.status)) {
          return false;
        }
      }

      if (filter.difficulty) {
        const [min, max] = filter.difficulty;
        if (card.difficulty < min || card.difficulty > max) {
          return false;
        }
      }

      if (filter.sourcePdfPath && card.sourceLocation.pdfPath !== filter.sourcePdfPath) {
        return false;
      }

      if (filter.nextReviewFrom || filter.nextReviewTo) {
        const flashCard = card as FlashCard;
        if (!flashCard.srs) return false;

        if (filter.nextReviewFrom && flashCard.srs.nextReview < filter.nextReviewFrom) {
          return false;
        }
        if (filter.nextReviewTo && flashCard.srs.nextReview > filter.nextReviewTo) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 排序卡片列表
   *
   * @param cards - 卡片列表
   * @param options - 排序选项
   * @returns 排序后的卡片列表
   */
  sortCards(cards: Card[], options: CardSortOptions): Card[] {
    const { sortBy, sortOrder } = options;
    const direction = sortOrder === 'asc' ? 1 : -1;

    return [...cards].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'created':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'updated':
          comparison = a.updatedAt - b.updatedAt;
          break;
        case 'difficulty':
          comparison = a.difficulty - b.difficulty;
          break;
        case 'status':
          const statusOrder = { new: 0, learning: 1, review: 2, suspended: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'nextReview':
          const aFlash = a as FlashCard;
          const bFlash = b as FlashCard;
          comparison = (aFlash.srs?.nextReview || 0) - (bFlash.srs?.nextReview || 0);
          break;
      }

      return comparison * direction;
    });
  }

  /**
   * 获取到期复习的闪卡
   *
   * @param cards - 卡片列表
   * @param studySetId - 学习集 ID（可选）
   * @returns 到期复习的闪卡列表
   */
  getDueCards(cards: Card[], studySetId?: string): FlashCard[] {
    const now = Date.now();

    return cards
      .filter(card => {
        if (card.type !== 'flashcard') return false;
        if (studySetId && card.studySetId !== studySetId) return false;

        const flashCard = card as FlashCard;
        return flashCard.srs.nextReview <= now;
      })
      .map(card => card as FlashCard);
  }

  /**
   * 获取新卡片
   *
   * @param cards - 卡片列表
   * @param studySetId - 学习集 ID（可选）
   * @param limit - 数量限制
   * @returns 新卡片列表
   */
  getNewCards(cards: Card[], studySetId?: string, limit: number = 20): Card[] {
    let newCards = cards.filter(card => card.status === 'new');

    if (studySetId) {
      newCards = newCards.filter(card => card.studySetId === studySetId);
    }

    return newCards.slice(0, limit);
  }

  /**
   * 统计卡片
   *
   * @param cards - 卡片列表
   * @returns 统计结果
   */
  countCards(cards: Card[]): {
    total: number;
    new: number;
    learning: number;
    review: number;
    suspended: number;
    flashcards: number;
    dueToday: number;
  } {
    const now = Date.now();

    return {
      total: cards.length,
      new: cards.filter(c => c.status === 'new').length,
      learning: cards.filter(c => c.status === 'learning').length,
      review: cards.filter(c => c.status === 'review').length,
      suspended: cards.filter(c => c.status === 'suspended').length,
      flashcards: cards.filter(c => c.type === 'flashcard').length,
      dueToday: cards.filter(c => {
        if (c.type !== 'flashcard') return false;
        const flashCard = c as FlashCard;
        return flashCard.srs.nextReview <= now;
      }).length,
    };
  }
}

// 导出单例
export const cardService = new CardService();
export default cardService;
