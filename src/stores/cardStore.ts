/**
 * 卡片状态管理 Store
 * 遵循 .clinerules.md 规范
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Card, FlashCard, CardType, CardStatus, CardFilter, CardSortOptions } from '../types/card';
import { cardService } from '../services/cardService';
import { cardEnhanceService } from '../services/cardEnhanceService';

/**
 * 卡片筛选和排序状态
 */
export interface CardFilterState {
  filter: CardFilter;
  sortOptions: CardSortOptions;
}

/**
 * 卡片 Store
 */
export const useCardStore = defineStore('card', () => {
  // 状态
  const cards = ref<Card[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // 筛选和排序
  const filter = ref<CardFilter>({});
  const sortOptions = ref<CardSortOptions>({ sortBy: 'created', sortOrder: 'desc' });

  // Getters
  const filteredCards = computed<Card[]>(() => {
    let result = [...cards.value];

    // 应用筛选
    if (Object.keys(filter.value).length > 0) {
      result = cardService.filterCards(result, filter.value);
    }

    // 应用排序
    result = cardService.sortCards(result, sortOptions.value);

    return result;
  });

  const cardCount = computed<number>(() => cards.value.length);

  const stats = computed(() => {
    return cardService.countCards(cards.value);
  });

  const cardsByStatus = computed<Record<CardStatus, Card[]>>(() => {
    return {
      'new': cards.value.filter(c => c.status === 'new'),
      'learning': cards.value.filter(c => c.status === 'learning'),
      'review': cards.value.filter(c => c.status === 'review'),
      'suspended': cards.value.filter(c => c.status === 'suspended')
    };
  });

  const cardsByDifficulty = computed<Record<number, Card[]>>(() => {
    const result: Record<number, Card[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const card of cards.value) {
      const diff = card.difficulty || 1;
      if (!result[diff]) result[diff] = [];
      result[diff].push(card);
    }
    return result;
  });

  // Actions
  /**
   * 加载卡片
   */
  async function fetchCards(studySetId?: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      let loadedCards: Card[];
      if (studySetId) {
        loadedCards = await cardService.getCardsByStudySetId(studySetId);
      } else {
        loadedCards = await cardService.getAllCards();
      }
      cards.value = loadedCards;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载卡片失败';
      console.error('[CardStore] 加载卡片失败:', e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建卡片
   */
  async function createCard(
    content: string,
    studySetId: string,
    sourceLocation: { docId: string; blockId: string; pdfPath?: string; page?: number },
    type: CardType = 'card'
  ): Promise<Card | null> {
    loading.value = true;
    error.value = null;

    try {
      const card = await cardService.createCard(content, studySetId, sourceLocation, type);
      cards.value.push(card);
      return card;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建卡片失败';
      console.error('[CardStore] 创建卡片失败:', e);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建闪卡
   */
  async function createFlashCard(
    front: string,
    back: string,
    studySetId: string,
    content: string,
    sourceLocation: { docId: string; blockId: string; pdfPath?: string; page?: number }
  ): Promise<FlashCard | null> {
    loading.value = true;
    error.value = null;

    try {
      const card = await cardService.createFlashCard(front, back, studySetId, content, sourceLocation);
      cards.value.push(card);
      return card;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建闪卡失败';
      console.error('[CardStore] 创建闪卡失败:', e);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新卡片
   */
  async function updateCard(card: Card): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await cardService.saveCard(card);
      const index = cards.value.findIndex(c => c.id === card.id);
      if (index !== -1) {
        cards.value[index] = { ...card };
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新卡片失败';
      console.error('[CardStore] 更新卡片失败:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 删除卡片
   */
  async function deleteCard(cardId: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await cardService.deleteCard(cardId);
      cards.value = cards.value.filter(c => c.id !== cardId);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除卡片失败';
      console.error('[CardStore] 删除卡片失败:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 从标注创建卡片
   */
  async function createFromAnnotation(
    annotation: any,
    studySetId: string
  ): Promise<Card | null> {
    loading.value = true;
    error.value = null;

    try {
      const card = await cardService.createFromAnnotation(annotation, studySetId);
      cards.value.push(card);
      return card;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '从标注创建卡片失败';
      console.error('[CardStore] 从标注创建卡片失败:', e);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 转换卡片状态
   */
  async function transitionCardStatus(cardId: string, toStatus: CardStatus): Promise<boolean> {
    try {
      const success = await cardEnhanceService.transitionCardStatus(cardId, toStatus);
      if (success) {
        const card = cards.value.find(c => c.id === cardId);
        if (card) {
          card.status = toStatus;
        }
      }
      return success;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '状态转换失败';
      console.error('[CardStore] 状态转换失败:', e);
      return false;
    }
  }

  /**
   * 更新卡片难度
   */
  async function updateCardDifficulty(cardId: string, difficulty: number): Promise<boolean> {
    try {
      const success = await cardEnhanceService.setCardDifficulty(cardId, difficulty);
      if (success) {
        const card = cards.value.find(c => c.id === cardId);
        if (card) {
          card.difficulty = difficulty;
        }
      }
      return success;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新难度失败';
      console.error('[CardStore] 更新难度失败:', e);
      return false;
    }
  }

  /**
   * 添加卡片标签
   */
  async function addCardTags(cardId: string, tags: string[]): Promise<boolean> {
    try {
      const success = await cardEnhanceService.addCardTags(cardId, tags);
      if (success) {
        const card = cards.value.find(c => c.id === cardId);
        if (card) {
          card.tags = [...new Set([...card.tags, ...tags])];
        }
      }
      return success;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加标签失败';
      console.error('[CardStore] 添加标签失败:', e);
      return false;
    }
  }

  /**
   * 移除卡片标签
   */
  async function removeCardTags(cardId: string, tags: string[]): Promise<boolean> {
    try {
      const success = await cardEnhanceService.removeCardTags(cardId, tags);
      if (success) {
        const card = cards.value.find(c => c.id === cardId);
        if (card) {
          card.tags = card.tags.filter(t => !tags.includes(t));
        }
      }
      return success;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '移除标签失败';
      console.error('[CardStore] 移除标签失败:', e);
      return false;
    }
  }

  /**
   * 批量删除卡片
   */
  async function batchDeleteCards(cardIds: string[]): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await cardEnhanceService.batchDeleteCards(cardIds);
      cards.value = cards.value.filter(c => !cardIds.includes(c.id));
    } catch (e) {
      error.value = e instanceof Error ? e.message : '批量删除失败';
      console.error('[CardStore] 批量删除失败:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 批量移动卡片
   */
  async function batchMoveCards(cardIds: string[], targetStudySetId: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await cardEnhanceService.batchMoveCards(cardIds, targetStudySetId);
      cards.value = cards.value.filter(c => !cardIds.includes(c.id));
    } catch (e) {
      error.value = e instanceof Error ? e.message : '批量移动失败';
      console.error('[CardStore] 批量移动失败:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 设置筛选条件
   */
  function setFilter(newFilter: CardFilter): void {
    filter.value = { ...newFilter };
  }

  /**
   * 设置排序选项
   */
  function setSortOptions(options: CardSortOptions): void {
    sortOptions.value = { ...options };
  }

  /**
   * 清空筛选
   */
  function clearFilter(): void {
    filter.value = {};
  }

  /**
   * 刷新卡片列表
   */
  async function refresh(studySetId?: string): Promise<void> {
    await fetchCards(studySetId);
  }

  /**
   * 清空错误
   */
  function clearError(): void {
    error.value = null;
  }

  return {
    // 状态
    cards,
    loading,
    error,
    filter,
    sortOptions,

    // Getters
    filteredCards,
    cardCount,
    stats,
    cardsByStatus,
    cardsByDifficulty,

    // Actions
    fetchCards,
    createCard,
    createFlashCard,
    updateCard,
    deleteCard,
    createFromAnnotation,
    transitionCardStatus,
    updateCardDifficulty,
    addCardTags,
    removeCardTags,
    batchDeleteCards,
    batchMoveCards,
    setFilter,
    setSortOptions,
    clearFilter,
    refresh,
    clearError
  };
});

export default useCardStore;
